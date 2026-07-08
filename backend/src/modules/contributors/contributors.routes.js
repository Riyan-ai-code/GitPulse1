import express from 'express';
import { getContributors } from './contributors.controller.js';

const router = express.Router();

router.get('/', getContributors);

export default router;
