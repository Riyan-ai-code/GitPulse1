import * as repositoryService from './repository.service.js';
import * as fileDb from '../../shared/db/fileDb.js';

export const getOverview = async (req, res, next) => {
  const { owner, repo } = req.query;

  if (!owner || !repo) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Both "owner" and "repo" query parameters are required.'
    });
  }

  const cacheKey = `overview:${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const cachedData = fileDb.getCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const overview = await repositoryService.getRepositoryOverview(owner, repo);
    fileDb.setCache(cacheKey, overview);
    return res.json(overview);
  } catch (error) {
    next(error);
  }
};

export const getPrsIssues = async (req, res, next) => {
  const { owner, repo } = req.query;

  if (!owner || !repo) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Both "owner" and "repo" query parameters are required.'
    });
  }

  const cacheKey = `prs-issues:${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const cachedData = fileDb.getCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const data = await repositoryService.getPrsAndIssuesStats(owner, repo);
    fileDb.setCache(cacheKey, data);
    return res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getHistoryList = (req, res) => {
  const history = fileDb.getHistory();
  return res.json(history);
};

export const deleteHistory = (req, res) => {
  const { owner, repo } = req.query;
  if (!owner || !repo) {
    return res.status(400).json({ error: 'Both "owner" and "repo" query parameters are required.' });
  }
  const deleted = fileDb.deleteHistoryEntry(owner, repo);
  return res.json({ success: true, deleted });
};

export const deleteAnalysis = (req, res) => {
  const { owner, repo } = req.query;
  if (!owner || !repo) {
    return res.status(400).json({ error: 'Both "owner" and "repo" query parameters are required.' });
  }
  const deleted = fileDb.deleteCacheEntries(owner, repo);
  return res.json({ success: true, deleted });
};

export const getComposition = async (req, res, next) => {
  const { owner, repo } = req.query;

  if (!owner || !repo) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Both "owner" and "repo" query parameters are required.'
    });
  }

  const cacheKey = `composition:${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const cachedData = fileDb.getCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const data = await repositoryService.getCodebaseComposition(owner, repo);
    fileDb.setCache(cacheKey, data);
    return res.json(data);
  } catch (error) {
    next(error);
  }
};

