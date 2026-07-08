import express from 'express';
import { getOverview } from './repository.controller.js';

const router = express.Router();

router.get('/', getOverview);

export default router;
