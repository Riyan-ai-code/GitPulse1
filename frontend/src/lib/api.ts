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
  const response = await fetch(`${API_BASE_URL}/repository?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`);
  return handleResponse(response);
};

export const fetchCommitStats = async (owner: string, repo: string): Promise<CommitStats> => {
  const response = await fetch(`${API_BASE_URL}/commits?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`);
  return handleResponse(response);
};

export const fetchContributors = async (owner: string, repo: string): Promise<ContributorsList> => {
  const response = await fetch(`${API_BASE_URL}/contributors?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`);
  return handleResponse(response);
};

export const fetchAnalysis = async (owner: string, repo: string): Promise<RepositoryAnalysis> => {
  const response = await fetch(`${API_BASE_URL}/analysis?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`);
  return handleResponse(response);
};

// URL parser to extract owner and repo from various github URL formats or raw strings
export const parseGitHubUrl = (input: string): { owner: string; repo: string } | null => {
  const cleanInput = input.trim();
  if (!cleanInput) return null;

  // Pattern matches:
  // - https://github.com/owner/repo
  // - github.com/owner/repo
  // - owner/repo
  const githubUrlRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-._]+)\/([a-zA-Z0-9-._]+)(?:\.git)?(?:\/.*)?$/;
  const match = cleanInput.match(githubUrlRegex);

  if (match) {
    return {
      owner: match[1],
      repo: match[2].replace(/\/$/, '') // strip trailing slash if any
    };
  }

  // Fallback check for raw "owner/repo" format
  const rawParts = cleanInput.split('/');
  if (rawParts.length === 2 && rawParts[0] && rawParts[1]) {
    return {
      owner: rawParts[0].trim(),
      repo: rawParts[1].trim()
    };
  }

  return null;
};
