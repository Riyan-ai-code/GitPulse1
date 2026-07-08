import githubClient from '../../shared/client/github.js';
import * as repositoryService from '../repository/repository.service.js';
import * as commitsService from '../commits/commits.service.js';
import * as contributorsService from '../contributors/contributors.service.js';
import { calculateHealthScore } from './rules/healthScore.js';
import { generateInsights } from './rules/insights.js';

export const analyzeRepository = async (owner, repo) => {
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

  // 5. Generate Insights
  const insights = generateInsights({
    overview,
    commitStats,
    contributorsList,
    readmeExists,
    daysSinceLastCommit
  });

  return {
    healthScore: healthResults.score,
    healthBreakdown: healthResults.breakdown,
    insights
  };
};
