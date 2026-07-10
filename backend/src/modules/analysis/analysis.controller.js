import * as analysisService from './analysis.service.js';
import * as fileDb from '../../shared/db/fileDb.js';

export const getAnalysis = async (req, res, next) => {
  const { owner, repo } = req.query;

  if (!owner || !repo) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Both "owner" and "repo" query parameters are required.'
    });
  }

  const cacheKey = `analysis:${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const cachedData = fileDb.getCache(cacheKey);
  if (cachedData) {
    return res.json(cachedData);
  }

  try {
    const analysis = await analysisService.analyzeRepository(owner, repo);
    fileDb.setCache(cacheKey, analysis);
    return res.json(analysis);
  } catch (error) {
    next(error);
  }
};
