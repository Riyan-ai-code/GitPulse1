import express from 'express';
import { getCommits } from './commits.controller.js';

const router = express.Router();

router.get('/', getCommits);

export default router;
