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
    languages
  };
};
