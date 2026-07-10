import { RepositoryOverview, CommitStats, ContributorsList, RepositoryAnalysis } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = 'An error occurred while fetching repository data.';
    try {
      const errBody = await response.json();
      errorMessage = errBody.message || errBody.error || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

export const fetchRepositoryOverview = async (owner: string, repo: string): Promise<RepositoryOverview> => {
  const response = await fetch(`${API_BASE_URL}/repository?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`, {
    credentials: 'include'
  });
  return handleResponse(response);
};

export const fetchCommitStats = async (owner: string, repo: string): Promise<CommitStats> => {
  const response = await fetch(`${API_BASE_URL}/commits?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`, {
    credentials: 'include'
  });
  return handleResponse(response);
};

export const fetchContributors = async (owner: string, repo: string): Promise<ContributorsList> => {
  const response = await fetch(`${API_BASE_URL}/contributors?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`, {
    credentials: 'include'
  });
  return handleResponse(response);
};

export const fetchAnalysis = async (owner: string, repo: string, skipHistory: boolean = false): Promise<RepositoryAnalysis> => {
  const response = await fetch(`${API_BASE_URL}/analysis?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&skipHistory=${skipHistory}`, {
    credentials: 'include'
  });
  return handleResponse(response);
};

export const fetchPrsAndIssues = async (owner: string, repo: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/repository/prs-issues?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`, {
    credentials: 'include'
  });
  return handleResponse(response);
};

// URL parser to extract owner and repo from various github URL formats or raw strings
export const parseGitHubUrl = (input: string): { owner: string; repo: string } | null => {
  let cleanInput = input.trim();
  if (!cleanInput) return null;

  // 1. Remove hash fragments
  cleanInput = cleanInput.split('#')[0];

  // 2. Remove query parameters
  cleanInput = cleanInput.split('?')[0];

  // 3. Remove .git suffix if present
  if (cleanInput.endsWith('.git')) {
    cleanInput = cleanInput.slice(0, -4);
  }

  // 4. Remove protocol and host if present
  cleanInput = cleanInput.replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, '');

  // 5. Remove leading/trailing slashes
  cleanInput = cleanInput.replace(/^\/+|\/+$/g, '');

  // 6. Split by slash and return owner and repo (first two parts)
  const parts = cleanInput.split('/');
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return {
      owner: parts[0].trim(),
      repo: parts[1].trim()
    };
  }

  return null;
};
