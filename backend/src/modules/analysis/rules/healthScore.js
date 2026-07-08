export const calculateHealthScore = ({
  readmeExists,
  licenseExists,
  hasIssues,
  contributorsCount,
  commitsLast30Days,
  daysSinceLastCommit
}) => {
  let score = 0;
  const breakdown = [];

  // 1. README Exists (15 pts)
  const readmeScore = readmeExists ? 15 : 0;
  score += readmeScore;
  breakdown.push({
    metric: 'README File Present',
    passed: readmeExists,
    score: readmeScore,
    maxScore: 15,
    description: readmeExists ? 'Project contains documentation.' : 'Missing documentation README.'
  });

  // 2. License Exists (5 pts)
  const licenseScore = licenseExists ? 5 : 0;
  score += licenseScore;
  breakdown.push({
    metric: 'Open Source License',
    passed: licenseExists,
    score: licenseScore,
    maxScore: 5,
    description: licenseExists ? 'License file detected.' : 'No open-source license found.'
  });

  // 3. Issues Enabled (10 pts)
  const issuesScore = hasIssues ? 10 : 0;
  score += issuesScore;
  breakdown.push({
    metric: 'Issues Enabled',
    passed: hasIssues,
    score: issuesScore,
    maxScore: 10,
    description: hasIssues ? 'GitHub issues are enabled for feedback.' : 'Issues are disabled.'
  });

  // 4. Contributors Count (20 pts)
  let contributorScore = 0;
  if (contributorsCount >= 10) contributorScore = 20;
  else if (contributorsCount >= 5) contributorScore = 15;
  else if (contributorsCount >= 2) contributorScore = 10;
  else if (contributorsCount === 1) contributorScore = 5;

  score += contributorScore;
  breakdown.push({
    metric: 'Contributor Base',
    passed: contributorsCount > 1,
    score: contributorScore,
    maxScore: 20,
    description: contributorsCount === 1 
      ? 'Single contributor project (low bus factor).' 
      : `${contributorsCount} active contributors found.`
  });

  // 5. Recent Commits (last 30 days) (25 pts)
  let commitFrequencyScore = 0;
  if (commitsLast30Days >= 30) commitFrequencyScore = 25;
  else if (commitsLast30Days >= 10) commitFrequencyScore = 20;
  else if (commitsLast30Days >= 5) commitFrequencyScore = 15;
  else if (commitsLast30Days >= 1) commitFrequencyScore = 10;

  score += commitFrequencyScore;
  breakdown.push({
    metric: 'Recent Activity (30 Days)',
    passed: commitsLast30Days >= 5,
    score: commitFrequencyScore,
    maxScore: 25,
    description: commitsLast30Days === 0 
      ? 'No commits in the last 30 days.' 
      : `${commitsLast30Days} commits in the last 30 days.`
  });

  // 6. Last Commit Recency (25 pts)
  let recencyScore = 0;
  let recencyPassed = false;
  let recencyDesc = 'No commits found in the repository.';

  if (daysSinceLastCommit !== null) {
    if (daysSinceLastCommit <= 7) {
      recencyScore = 25;
      recencyPassed = true;
      recencyDesc = `Last commit was ${daysSinceLastCommit} days ago (very active).`;
    } else if (daysSinceLastCommit <= 30) {
      recencyScore = 20;
      recencyPassed = true;
      recencyDesc = `Last commit was ${daysSinceLastCommit} days ago (active).`;
    } else if (daysSinceLastCommit <= 90) {
      recencyScore = 15;
      recencyPassed = false;
      recencyDesc = `Last commit was ${daysSinceLastCommit} days ago (stale).`;
    } else if (daysSinceLastCommit <= 180) {
      recencyScore = 10;
      recencyPassed = false;
      recencyDesc = `Last commit was ${daysSinceLastCommit} days ago (highly inactive).`;
    } else {
      recencyScore = 0;
      recencyPassed = false;
      recencyDesc = `Last commit was over 6 months ago (${daysSinceLastCommit} days ago).`;
    }
  }

  score += recencyScore;
  breakdown.push({
    metric: 'Commit Recency',
    passed: recencyPassed,
    score: recencyScore,
    maxScore: 25,
    description: recencyDesc
  });

  return {
    score,
    breakdown
  };
};
