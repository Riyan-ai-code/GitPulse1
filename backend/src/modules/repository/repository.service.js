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

const getCountFromAPI = async (url, params = {}) => {
  try {
    const response = await githubClient.get(url, {
      params: { ...params, per_page: 1 }
    });
    const linkHeader = response.headers['link'];
    if (!linkHeader) {
      return response.data.length;
    }
    const match = linkHeader.match(/[?&]page=(\d+)>; rel="last"/);
    return match ? parseInt(match[1], 10) : 1;
  } catch (error) {
    return 0;
  }
};

export const getPrsAndIssuesStats = async (owner, repo) => {
  // 1. Fetch exact total/open counts using pagination link header
  const totalPrsCount = await getCountFromAPI(`/repos/${owner}/${repo}/pulls`, { state: 'all' });
  const openPrsCount = await getCountFromAPI(`/repos/${owner}/${repo}/pulls`, { state: 'open' });
  const closedPrsCount = totalPrsCount - openPrsCount;

  const totalIssuesAndPrs = await getCountFromAPI(`/repos/${owner}/${repo}/issues`, { state: 'all' });
  const openIssuesAndPrs = await getCountFromAPI(`/repos/${owner}/${repo}/issues`, { state: 'open' });

  const totalIssuesCount = Math.max(0, totalIssuesAndPrs - totalPrsCount);
  const openIssuesCount = Math.max(0, openIssuesAndPrs - openPrsCount);
  const closedIssuesCount = Math.max(0, totalIssuesCount - openIssuesCount);

  // 2. Fetch the 100 most recent closed PRs to calculate representative merge time
  let closedPrsData = [];
  try {
    const prRes = await githubClient.get(`/repos/${owner}/${repo}/pulls`, {
      params: { state: 'closed', per_page: 100 }
    });
    closedPrsData = prRes.data || [];
  } catch (error) {
    closedPrsData = [];
  }

  let totalMergeTimeHours = 0;
  let mergedPrsCount = 0;
  closedPrsData.forEach(p => {
    if (p.closed_at) {
      const created = new Date(p.created_at);
      const closed = new Date(p.closed_at);
      const diffHours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
      totalMergeTimeHours += diffHours;
      mergedPrsCount++;
    }
  });
  const avgMergeTimeHours = mergedPrsCount > 0 ? parseFloat((totalMergeTimeHours / mergedPrsCount).toFixed(1)) : null;

  // 3. Fetch the 100 most recent closed Issues to calculate representative resolution time
  let closedIssuesData = [];
  try {
    const issueRes = await githubClient.get(`/repos/${owner}/${repo}/issues`, {
      params: { state: 'closed', per_page: 100 }
    });
    closedIssuesData = (issueRes.data || []).filter(item => !item.pull_request);
  } catch (error) {
    closedIssuesData = [];
  }

  let totalResolutionTimeHours = 0;
  let resolvedIssuesCount = 0;
  closedIssuesData.forEach(i => {
    if (i.closed_at) {
      const created = new Date(i.created_at);
      const closed = new Date(i.closed_at);
      const diffHours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
      totalResolutionTimeHours += diffHours;
      resolvedIssuesCount++;
    }
  });
  const avgResolutionTimeHours = resolvedIssuesCount > 0 ? parseFloat((totalResolutionTimeHours / resolvedIssuesCount).toFixed(1)) : null;

  // 4. Fetch the 50 oldest open issues to check for stale items (no updates in 60 days)
  let oldestOpenIssues = [];
  try {
    const staleRes = await githubClient.get(`/repos/${owner}/${repo}/issues`, {
      params: { state: 'open', sort: 'updated', direction: 'asc', per_page: 50 }
    });
    oldestOpenIssues = (staleRes.data || []).filter(item => !item.pull_request);
  } catch (error) {
    oldestOpenIssues = [];
  }

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const staleList = oldestOpenIssues
    .filter(i => new Date(i.updated_at) < sixtyDaysAgo)
    .map(i => ({
      number: i.number,
      title: i.title,
      html_url: i.html_url,
      updatedAt: i.updated_at,
      comments: i.comments
    }));
  const staleCount = staleList.length;

  // 5. Fetch the 10 most recent PRs and Issues to display on lists
  let recentPrs = [];
  try {
    const recentPrRes = await githubClient.get(`/repos/${owner}/${repo}/pulls`, {
      params: { state: 'all', per_page: 10 }
    });
    recentPrs = recentPrRes.data || [];
  } catch (error) {
    recentPrs = [];
  }

  let recentIssues = [];
  try {
    const recentIssueRes = await githubClient.get(`/repos/${owner}/${repo}/issues`, {
      params: { state: 'all', per_page: 20 }
    });
    recentIssues = (recentIssueRes.data || []).filter(item => !item.pull_request).slice(0, 10);
  } catch (error) {
    recentIssues = [];
  }

  return {
    prs: {
      total: totalPrsCount,
      open: openPrsCount,
      closed: closedPrsCount,
      avgMergeTimeHours,
      recent: recentPrs.map(p => ({
        number: p.number,
        title: p.title,
        state: p.state,
        html_url: p.html_url,
        createdAt: p.created_at,
        closedAt: p.closed_at,
        user: {
          login: p.user?.login || 'unknown',
          avatar_url: p.user?.avatar_url || null
        }
      }))
    },
    issues: {
      total: totalIssuesCount,
      open: openIssuesCount,
      closed: closedIssuesCount,
      avgResolutionTimeHours,
      staleCount,
      staleList,
      recent: recentIssues.map(i => ({
        number: i.number,
        title: i.title,
        state: i.state,
        html_url: i.html_url,
        createdAt: i.created_at,
        closedAt: i.closed_at,
        user: {
          login: i.user?.login || 'unknown',
          avatar_url: i.user?.avatar_url || null
        }
      }))
    }
  };
};

export const getCodebaseComposition = async (owner, repo) => {
  // 1. Fetch repo details to get default branch
  const { data: repoData } = await githubClient.get(`/repos/${owner}/${repo}`);
  const defaultBranch = repoData.default_branch || 'main';

  // 2. Fetch recursive git tree
  let treeData = [];
  try {
    const { data: treeRes } = await githubClient.get(`/repos/${owner}/${repo}/git/trees/${defaultBranch}`, {
      params: { recursive: 1 }
    });
    treeData = treeRes.tree || [];
  } catch (error) {
    if (error.response && error.response.status === 409) {
      return { name: repo, type: 'directory', size: 0, children: [] };
    }
    throw error;
  }

  // 3. Build tree structure
  const root = { name: repoData.name, type: 'directory', size: 0, children: [] };

  const insertPath = (pathParts, size, type) => {
    let current = root;
    current.size += size;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLast = i === pathParts.length - 1;
      
      let child = current.children.find(c => c.name === part);
      if (!child) {
        child = {
          name: part,
          type: isLast && type === 'blob' ? 'file' : 'directory',
          size: 0,
          children: isLast && type === 'blob' ? undefined : []
        };
        current.children.push(child);
      }
      child.size += size;
      current = child;
    }
  };

  treeData.forEach(item => {
    if (item.path.startsWith('.git/')) return;
    const parts = item.path.split('/');
    const size = item.size || 0;
    insertPath(parts, size, item.type);
  });

  const pruneTree = (node, currentDepth = 0, maxDepth = 3) => {
    if (!node.children) return;

    if (currentDepth >= maxDepth) {
      node.children = undefined;
      return;
    }

    node.children.sort((a, b) => b.size - a.size);

    if (node.children.length > 100) {
      const topChildren = node.children.slice(0, 95);
      const others = node.children.slice(95);
      const othersSize = others.reduce((sum, c) => sum + c.size, 0);

      node.children = topChildren;
      if (othersSize > 0) {
        node.children.push({
          name: '[others]',
          type: 'directory',
          size: othersSize,
          children: []
        });
      }
    }

    node.children.forEach(child => pruneTree(child, currentDepth + 1, maxDepth));
  };

  pruneTree(root, 0, 8);

  return root;
};

