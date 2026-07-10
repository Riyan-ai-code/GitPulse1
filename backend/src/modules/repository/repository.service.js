import githubClient from '../../shared/client/github.js';

export const getRepositoryOverview = async (owner, repo) => {
  // 1. Fetch main repository metadata
  const { data: repoData } = await githubClient.get(`/repos/${owner}/${repo}`);

  // 2. Fetch language breakdown
  const { data: languageData } = await githubClient.get(`/repos/${owner}/${repo}/languages`);

  // Calculate languages percentage
  const totalBytes = Object.values(languageData).reduce((sum, bytes) => sum + bytes, 0);
  const languages = Object.entries(languageData).map(([name, bytes]) => ({
    language: name,
    bytes,
    percentage: totalBytes > 0 ? parseFloat(((bytes / totalBytes) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.bytes - a.bytes); // Sort descending

  // Get latest release version (if available)
  let version = null;
  try {
    const releaseRes = await githubClient.get(`/repos/${owner}/${repo}/releases/latest`);
    version = releaseRes.data.tag_name;
  } catch (error) {
    version = null; // No releases found
  }

  // Format and return response
  return {
    name: repoData.name,
    owner: {
      login: repoData.owner.login,
      avatar_url: repoData.owner.avatar_url,
      html_url: repoData.owner.html_url
    },
    description: repoData.description || 'No description provided.',
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    watchers: repoData.subscribers_count !== undefined ? repoData.subscribers_count : repoData.watchers_count,
    primaryLanguage: repoData.language || 'Unknown',
    license: repoData.license ? (repoData.license.spdx_id || repoData.license.name) : 'No License',
    size: repoData.size, // Size in KB
    openIssuesCount: repoData.open_issues_count,
    hasIssues: repoData.has_issues,
    createdAt: repoData.created_at,
    updatedAt: repoData.updated_at,
    languages,
    topics: repoData.topics || [],
    version
  };
};

export const getPrsAndIssuesStats = async (owner, repo) => {
  let prs = [];
  try {
    const prRes = await githubClient.get(`/repos/${owner}/${repo}/pulls`, {
      params: { state: 'all', per_page: 50 }
    });
    prs = prRes.data;
  } catch (error) {
    prs = [];
  }

  let issues = [];
  try {
    const issueRes = await githubClient.get(`/repos/${owner}/${repo}/issues`, {
      params: { state: 'all', per_page: 50 }
    });
    issues = issueRes.data.filter(item => !item.pull_request);
  } catch (error) {
    issues = [];
  }

  // PR Calculations
  const totalPrsCount = prs.length;
  const openPrsCount = prs.filter(p => p.state === 'open').length;
  const closedPrs = prs.filter(p => p.state === 'closed');
  const closedPrsCount = closedPrs.length;

  let totalMergeTimeHours = 0;
  let mergedPrsCount = 0;

  closedPrs.forEach(p => {
    if (p.closed_at) {
      const created = new Date(p.created_at);
      const closed = new Date(p.closed_at);
      const diffHours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
      totalMergeTimeHours += diffHours;
      mergedPrsCount++;
    }
  });

  const avgMergeTimeHours = mergedPrsCount > 0 ? parseFloat((totalMergeTimeHours / mergedPrsCount).toFixed(1)) : null;

  // Issues Calculations
  const openIssuesCount = issues.filter(i => i.state === 'open').length;
  const closedIssues = issues.filter(i => i.state === 'closed');
  const closedIssuesCount = closedIssues.length;

  let totalResolutionTimeHours = 0;
  let resolvedIssuesCount = 0;

  closedIssues.forEach(i => {
    if (i.closed_at) {
      const created = new Date(i.created_at);
      const closed = new Date(i.closed_at);
      const diffHours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
      totalResolutionTimeHours += diffHours;
      resolvedIssuesCount++;
    }
  });

  const avgResolutionTimeHours = resolvedIssuesCount > 0 ? parseFloat((totalResolutionTimeHours / resolvedIssuesCount).toFixed(1)) : null;

  // Stale Issues (no updates in 60 days)
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const staleIssues = issues
    .filter(i => i.state === 'open' && new Date(i.updated_at) < sixtyDaysAgo)
    .map(i => ({
      number: i.number,
      title: i.title,
      html_url: i.html_url,
      updatedAt: i.updated_at,
      comments: i.comments
    }));

  return {
    prs: {
      total: totalPrsCount,
      open: openPrsCount,
      closed: closedPrsCount,
      avgMergeTimeHours,
      recent: prs.slice(0, 10).map(p => ({
        number: p.number,
        title: p.title,
        state: p.state,
        html_url: p.html_url,
        createdAt: p.created_at,
        closedAt: p.closed_at,
        user: {
          login: p.user.login,
          avatar_url: p.user.avatar_url
        }
      }))
    },
    issues: {
      total: issues.length,
      open: openIssuesCount,
      closed: closedIssuesCount,
      avgResolutionTimeHours,
      staleCount: staleIssues.length,
      staleList: staleIssues,
      recent: issues.slice(0, 10).map(i => ({
        number: i.number,
        title: i.title,
        state: i.state,
        html_url: i.html_url,
        createdAt: i.created_at,
        closedAt: i.closed_at,
        user: {
          login: i.user.login,
          avatar_url: i.user.avatar_url
        }
      }))
    }
  };
};
