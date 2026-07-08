import githubClient from '../../shared/client/github.js';

// Helper to count items from GitHub paginated API using link header
const getCountFromAPI = async (url, params = {}) => {
  try {
    const response = await githubClient.get(url, {
      params: { ...params, per_page: 1 }
    });
    const linkHeader = response.headers['link'];
    if (!linkHeader) {
      return response.data.length; // 0 or 1 item
    }
    // Search for the last page number in the link header
    const match = linkHeader.match(/[?&]page=(\d+)>; rel="last"/);
    return match ? parseInt(match[1], 10) : 1;
  } catch (error) {
    // Empty repositories return a 409 Conflict on /commits
    if (error.response && error.response.status === 409) {
      return 0;
    }
    throw error;
  }
};

export const getCommitStats = async (owner, repo) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const sixtyDaysAgoISO = sixtyDaysAgo.toISOString();

  // 1. Get Total Commits
  const totalCommits = await getCountFromAPI(`/repos/${owner}/${repo}/commits`);

  // 2. Get Commits in last 30 days
  const commitsLast30Days = await getCountFromAPI(`/repos/${owner}/${repo}/commits`, {
    since: thirtyDaysAgoISO
  });

  // 3. Get Commits in previous 30 days (for trend calculations in analysis module)
  const commits30to60DaysAgo = await getCountFromAPI(`/repos/${owner}/${repo}/commits`, {
    since: sixtyDaysAgoISO,
    until: thirtyDaysAgoISO
  });

  // 4. Fetch recent commits (max 100) to build list and activity graph
  let recentCommits = [];
  let lastCommitDate = null;
  try {
    const { data } = await githubClient.get(`/repos/${owner}/${repo}/commits`, {
      params: { per_page: 100 }
    });
    recentCommits = data;
    if (data.length > 0) {
      lastCommitDate = data[0].commit.committer.date;
    }
  } catch (error) {
    if (error.response && error.response.status === 409) {
      // Empty repo
      recentCommits = [];
    } else {
      throw error;
    }
  }

  // 5. Build recent commits list (formatted for frontend display)
  const formattedCommits = recentCommits.slice(0, 15).map(c => ({
    sha: c.sha,
    author: {
      name: c.commit.author.name,
      login: c.author?.login || null,
      avatar_url: c.author?.avatar_url || null
    },
    message: c.commit.message,
    date: c.commit.author.date,
    html_url: c.html_url
  }));

  // 6. Build commit activity graph (commits per day for the last 30 days)
  const activityMap = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    activityMap[dateStr] = 0;
  }

  // Group fetched commits by date
  recentCommits.forEach(c => {
    const commitDate = c.commit.author.date.split('T')[0];
    if (activityMap[commitDate] !== undefined) {
      activityMap[commitDate]++;
    }
  });

  const activityGraph = Object.entries(activityMap).map(([date, count]) => ({
    date,
    commits: count
  }));

  return {
    totalCommits,
    lastCommitDate,
    commitsLast30Days,
    commits30to60DaysAgo,
    recentCommits: formattedCommits,
    activityGraph
  };
};
