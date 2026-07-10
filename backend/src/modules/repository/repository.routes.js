import express from 'express';
import { getOverview, getPrsIssues, getHistoryList } from './repository.controller.js';

const router = express.Router();

router.get('/', getOverview);
router.get('/prs-issues', getPrsIssues);
router.get('/history', getHistoryList);

export default router;
