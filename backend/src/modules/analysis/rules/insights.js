export const generateInsights = ({
  overview,
  commitStats,
  contributorsList,
  readmeExists,
  daysSinceLastCommit
}) => {
  const insights = [];

  // 1. Maintenance & Activity Status
  if (daysSinceLastCommit !== null) {
    if (daysSinceLastCommit <= 14) {
      insights.push({
        text: 'Repository is actively maintained (recent changes made within 2 weeks).',
        type: 'success'
      });
    } else if (daysSinceLastCommit > 90) {
      insights.push({
        text: `Development has slowed down; no recent updates in the last ${Math.round(daysSinceLastCommit / 30)} months.`,
        type: 'warning'
      });
    }
  }

  // 2. Team Structure (Bus Factor)
  const numContributors = contributorsList.contributors.length;
  if (numContributors === 1) {
    insights.push({
      text: 'Single contributor project. Development depends entirely on one author (low bus factor).',
      type: 'warning'
    });
  } else if (numContributors >= 5) {
    insights.push({
      text: `Healthy collaboration with ${numContributors} active contributors driving progress.`,
      type: 'success'
    });
  }

  // 3. Activity Trends (Month-over-Month)
  const thisMonth = commitStats.commitsLast30Days;
  const lastMonth = commitStats.commits30to60DaysAgo;

  if (thisMonth > 0 && lastMonth === 0) {
    insights.push({
      text: 'Commit activity spiked this month after a period of dormancy.',
      type: 'success'
    });
  } else if (thisMonth > lastMonth && lastMonth > 0) {
    const increasePct = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
    insights.push({
      text: `Development velocity increased by ${increasePct}% this month compared to last month.`,
      type: 'success'
    });
  } else if (thisMonth < lastMonth && thisMonth > 0 && lastMonth > 0) {
    const decreasePct = Math.round(((lastMonth - thisMonth) / lastMonth) * 100);
    insights.push({
      text: `Development velocity decreased by ${decreasePct}% this month compared to last month.`,
      type: 'warning'
    });
  }

  // 4. Tech Stack Diversity
  const numLanguages = overview.languages.length;
  if (numLanguages > 3) {
    insights.push({
      text: 'Uses a diverse tech stack spanning multiple programming languages.',
      type: 'info'
    });
  } else if (numLanguages > 0 && overview.languages[0].percentage >= 90) {
    insights.push({
      text: `Codebase is highly specialized, primarily written in ${overview.languages[0].language} (${overview.languages[0].percentage}%).`,
      type: 'info'
    });
  }

  // 5. Learning & Collaboration Value
  const hasReadme = readmeExists;
  const hasLicense = overview.license !== 'No License';
  const hasStars = overview.stars > 100;

  if (hasReadme && hasLicense && overview.hasIssues && hasStars) {
    insights.push({
      text: 'Good candidate for learning and contribution (has docs, open issues, a license, and community validation).',
      type: 'success'
    });
  }

  if (overview.license === 'No License') {
    insights.push({
      text: 'Caution: No open-source license detected. Verify terms before cloning or copying code.',
      type: 'warning'
    });
  }

  // 6. Community Trust
  if (overview.stars >= 5000) {
    insights.push({
      text: `Highly popular repository trusted by a large community (${overview.stars.toLocaleString()} stars).`,
      type: 'success'
    });
  }

  return insights;
};
