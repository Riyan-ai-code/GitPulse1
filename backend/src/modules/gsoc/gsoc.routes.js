import express from 'express';
import { getGsocOrganizations } from './gsoc.controller.js';

const router = express.Router();

router.get('/', getGsocOrganizations);

export default router;
