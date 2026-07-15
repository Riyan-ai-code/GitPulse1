import * as analysisService from './analysis.service.js';
import * as fileDb from '../../shared/db/fileDb.js';

export const getAnalysis = async (req, res, next) => {
  const { owner, repo, skipHistory, force } = req.query;

  if (!owner || !repo) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Both "owner" and "repo" query parameters are required.'
    });
  }

  const cacheKey = `analysis:${owner.toLowerCase()}/${repo.toLowerCase()}`;

  // Skip cache when force=true to always return fresh data
  if (force !== 'true') {
    const cachedData = await fileDb.getCache(cacheKey);
    if (cachedData && cachedData.stars !== undefined && cachedData.forks !== undefined && cachedData.primaryLanguage !== undefined) {
      if (skipHistory !== 'true') {
        await fileDb.logAudit(
          owner,
          repo,
          cachedData.healthScore,
          cachedData.stars,
          cachedData.forks,
          cachedData.primaryLanguage,
          cachedData.version
        );
      }
      return res.json(cachedData);
    }
  }

  try {
    const analysis = await analysisService.analyzeRepository(owner, repo, {
      skipHistory: skipHistory === 'true'
    });
    await fileDb.setCache(cacheKey, analysis);
    return res.json(analysis);
  } catch (error) {
    next(error);
  }
};
