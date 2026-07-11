export const calculateCommitQualityScore = ({
  recentCommits = [],
  commitFrequencyScore = 0,
  recencyScore = 0
}) => {
  const totalCommitsCount = recentCommits.length;
  
  let conventionalPercent = 72; // default fallback
  let goodLengthPercent = 82;   // default fallback
  let imperativePercent = 80;   // default fallback

  if (totalCommitsCount > 0) {
    // 1. Conventional format check
    const conventionalCount = recentCommits.filter((c) =>
      /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci)(\([a-z0-9_-]+\))?:/i.test(c.message.trim())
    ).length;
    conventionalPercent = Math.round((conventionalCount / totalCommitsCount) * 100);

    // 2. Length check (8 to 72 characters)
    const goodLengthCount = recentCommits.filter(
      (c) => c.message.length >= 8 && c.message.length <= 74
    ).length;
    goodLengthPercent = Math.round((goodLengthCount / totalCommitsCount) * 100);

    // 3. Imperative mood
    const imperativeCount = recentCommits.filter((c) =>
      /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci)?(\([a-z0-9_-]+\))?:?\s*(add|fix|handle|update|remove|delete|change|implement|make|refactor|set|get|create|run|setup|test|build|ci|docs|improve|cleanup)/i.test(c.message.trim())
    ).length;
    imperativePercent = Math.round((imperativeCount / totalCommitsCount) * 100);
  }

  // 4. Activity percentage (normalized, maximum of 25 commits is considered 100% active)
  const activityPercent = Math.round((commitFrequencyScore / 25) * 100);

  // 5. Recency percentage (normalized, 0 days since last commit is 100%, decaying over 30 days)
  const recencyPercent = Math.round((recencyScore / 25) * 100);

  const score = Math.round((conventionalPercent + goodLengthPercent + imperativePercent + activityPercent + recencyPercent) / 5);

  return {
    score,
    conventionalPercent,
    goodLengthPercent,
    imperativePercent,
    activityPercent,
    recencyPercent
  };
};
