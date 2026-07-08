import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const githubClient = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'GitPulse-Light-MVP'
  }
});

// Inject Authorization header if GITHUB_TOKEN environment variable is present
if (process.env.GITHUB_TOKEN) {
  githubClient.defaults.headers.common['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  console.log('[GitHub Client] Authorization token injected successfully.');
} else {
  console.warn('[GitHub Client] No GITHUB_TOKEN environment variable detected. Running unauthenticated (subject to low rate limits).');
}

export default githubClient;
