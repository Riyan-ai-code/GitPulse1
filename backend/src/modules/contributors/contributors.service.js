import githubClient from '../../shared/client/github.js';

// Helper to get total count
const getTotalCommitsCount = async (owner, repo) => {
  try {
    const response = await githubClient.get(`/repos/${owner}/${repo}/commits`, {
      params: { per_page: 1 }
    });
    const linkHeader = response.headers['link'];
    if (!linkHeader) {
      return response.data.length;
    }
    const match = linkHeader.match(/[?&]page=(\d+)>; rel="last"/);
    return match ? parseInt(match[1], 10) : 1;
  } catch (error) {
    if (error.response && error.response.status === 409) {
      return 0;
    }
    throw error;
  }
};

export const getContributorsList = async (owner, repo) => {
  // 1. Fetch top contributors (max 10 for dashboard preview)
  let contributorsData = [];
  try {
    const { data } = await githubClient.get(`/repos/${owner}/${repo}/contributors`, {
      params: { per_page: 10 }
    });
    contributorsData = data;
  } catch (error) {
    // If empty repo, sometimes it returns 204 No Content or error, catch it
    if (error.response && error.response.status === 409) {
      contributorsData = [];
    } else {
      throw error;
    }
  }

  // 2. Fetch total commits of the repo to compute true percentages
  const totalCommits = await getTotalCommitsCount(owner, repo);

  // 3. Map and calculate contribution percentages
  const contributors = contributorsData.map(c => {
    const commits = c.contributions;
    const percentage = totalCommits > 0 ? parseFloat(((commits / totalCommits) * 100).toFixed(1)) : 0;
    return {
      login: c.login,
      avatar_url: c.avatar_url,
      html_url: c.html_url,
      commits,
      percentage
    };
  });

  return {
    totalContributors: contributors.length, // this is out of the top 10 fetched or we can count how many contributors github lists in headers
    contributors
  };
};
