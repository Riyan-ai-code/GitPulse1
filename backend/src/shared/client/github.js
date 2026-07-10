import axios from 'axios';
import dotenv from 'dotenv';
import { authLocalStorage } from '../context/authContext.js';

dotenv.config();

const githubClient = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'GitPulse-Light-MVP'
  }
});

// Request interceptor to dynamically inject the user's OAuth token if present
githubClient.interceptors.request.use((config) => {
  const userToken = authLocalStorage.getStore();
  if (userToken) {
    config.headers['Authorization'] = `Bearer ${userToken}`;
  } else if (process.env.GITHUB_TOKEN) {
    config.headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  } else {
    delete config.headers['Authorization'];
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default githubClient;
