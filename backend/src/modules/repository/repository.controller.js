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
  const cachedData = await fileDb.getCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const overview = await repositoryService.getRepositoryOverview(owner, repo);
    await fileDb.setCache(cacheKey, overview);
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
  const cachedData = await fileDb.getCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const data = await repositoryService.getPrsAndIssuesStats(owner, repo);
    await fileDb.setCache(cacheKey, data);
    return res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getHistoryList = async (req, res, next) => {
  try {
    const history = await fileDb.getHistory();
    return res.json(history);
  } catch (error) {
    next(error);
  }
};

export const deleteHistory = async (req, res, next) => {
  const { owner, repo } = req.query;
  if (!owner || !repo) {
    return res.status(400).json({ error: 'Both "owner" and "repo" query parameters are required.' });
  }
  try {
    const deleted = await fileDb.deleteHistoryEntry(owner, repo);
    return res.json({ success: true, deleted });
  } catch (error) {
    next(error);
  }
};

export const deleteAnalysis = async (req, res, next) => {
  const { owner, repo } = req.query;
  if (!owner || !repo) {
    return res.status(400).json({ error: 'Both "owner" and "repo" query parameters are required.' });
  }
  try {
    const deleted = await fileDb.deleteCacheEntries(owner, repo);
    return res.json({ success: true, deleted });
  } catch (error) {
    next(error);
  }
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
  const cachedData = await fileDb.getCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const data = await repositoryService.getCodebaseComposition(owner, repo);
    await fileDb.setCache(cacheKey, data);
    return res.json(data);
  } catch (error) {
    next(error);
  }
};
