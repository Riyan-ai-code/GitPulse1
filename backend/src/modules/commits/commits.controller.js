import * as commitsService from './commits.service.js';
import * as fileDb from '../../shared/db/fileDb.js';

export const getCommits = async (req, res, next) => {
  const { owner, repo } = req.query;

  if (!owner || !repo) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Both "owner" and "repo" query parameters are required.'
    });
  }

  const cacheKey = `commits:${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const cachedData = await fileDb.getCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const stats = await commitsService.getCommitStats(owner, repo);
    await fileDb.setCache(cacheKey, stats);
    return res.json(stats);
  } catch (error) {
    next(error);
  }
};
