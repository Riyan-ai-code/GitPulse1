import express from 'express';
import { getOverview, getPrsIssues, getHistoryList, deleteHistory, deleteAnalysis } from './repository.controller.js';
import { requireAuth } from '../../shared/middleware/requireAuth.js';

const router = express.Router();

router.get('/', getOverview);
router.get('/prs-issues', getPrsIssues);
router.get('/history', requireAuth, getHistoryList);
router.delete('/history', requireAuth, deleteHistory);
router.delete('/analysis', requireAuth, deleteAnalysis);

export default router;
