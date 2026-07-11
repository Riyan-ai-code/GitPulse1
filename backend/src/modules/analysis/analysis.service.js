import githubClient from '../../shared/client/github.js';
import * as repositoryService from '../repository/repository.service.js';
import * as commitsService from '../commits/commits.service.js';
import * as contributorsService from '../contributors/contributors.service.js';
import { calculateHealthScore } from './rules/healthScore.js';
import { calculateCommitQualityScore } from './rules/commitQuality.js';
import { generateInsights } from './rules/insights.js';
import { logAudit } from '../../shared/db/fileDb.js';
import { getAISuggestions } from './ai.service.js';

export const analyzeRepository = async (owner, repo, { skipHistory = false } = {}) => {
  // 1. Fetch data from other modules concurrently (internal orchestration)
  const [overview, commitStats, contributorsList] = await Promise.all([
    repositoryService.getRepositoryOverview(owner, repo),
    commitsService.getCommitStats(owner, repo),
    contributorsService.getContributorsList(owner, repo)
  ]);

  // 2. Check if README exists (using a HEAD/GET request to the readme endpoint)
  let readmeExists = false;
  try {
    await githubClient.get(`/repos/${owner}/${repo}/readme`);
    readmeExists = true;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      readmeExists = false;
    } else {
      throw error;
    }
  }

  // 3. Calculate days since last commit
  let daysSinceLastCommit = null;
  if (commitStats.lastCommitDate) {
    const lastCommit = new Date(commitStats.lastCommitDate);
    const today = new Date();
    const diffTime = Math.abs(today - lastCommit);
    daysSinceLastCommit = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // 4. Calculate Health Score
  const healthResults = calculateHealthScore({
    readmeExists,
    licenseExists: overview.license !== 'No License',
    hasIssues: overview.hasIssues,
    contributorsCount: contributorsList.contributors.length,
    commitsLast30Days: commitStats.commitsLast30Days,
    daysSinceLastCommit
  });

  // 5. Generate Insights (Try Gemini LLM first, fallback to heuristics)
  let aiInsights = null;
  if (process.env.GEMINI_API_KEY) {
    aiInsights = await getAISuggestions(owner, repo, {
      overview,
      commitStats,
      contributorsList,
      readmeExists,
      daysSinceLastCommit,
      healthScore: healthResults.score
    });
  }

  const insights = aiInsights || generateInsights({
    overview,
    commitStats,
    contributorsList,
    readmeExists,
    daysSinceLastCommit
  });

  // Log successful analysis into local database history (skip for examples & guests)
  if (!skipHistory) {
    await logAudit(
      owner,
      repo,
      healthResults.score,
      overview.stars,
      overview.forks,
      overview.primaryLanguage,
      overview.version
    );
  }

  const commitFrequencyScore = healthResults.breakdown.find(item => item.metric === 'Recent Activity (30 Days)')?.score || 0;
  const recencyScore = healthResults.breakdown.find(item => item.metric === 'Commit Recency')?.score || 0;

  const commitQuality = calculateCommitQualityScore({
    recentCommits: commitStats.recentCommits,
    commitFrequencyScore,
    recencyScore
  });

  return {
    healthScore: healthResults.score,
    healthBreakdown: healthResults.breakdown,
    commitQuality,
    insights,
    aiActive: !!process.env.GEMINI_API_KEY
  };
};
