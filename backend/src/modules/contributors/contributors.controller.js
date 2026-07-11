import * as contributorsService from './contributors.service.js';
import * as fileDb from '../../shared/db/fileDb.js';

export const getContributors = async (req, res, next) => {
  const { owner, repo } = req.query;

  if (!owner || !repo) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Both "owner" and "repo" query parameters are required.'
    });
  }

  const cacheKey = `contributors:${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const cachedData = await fileDb.getCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const data = await contributorsService.getContributorsList(owner, repo);
    await fileDb.setCache(cacheKey, data);
    return res.json(data);
  } catch (error) {
    next(error);
  }
};
