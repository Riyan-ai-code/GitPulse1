import express from 'express';
import {
  redirectToGithub,
  githubCallback,
  getAuthenticatedUser,
  logout
} from './auth.controller.js';

const router = express.Router();

router.get('/github', redirectToGithub);
router.get('/github/callback', githubCallback);
router.get('/user', getAuthenticatedUser);
router.post('/logout', logout);

export default router;
