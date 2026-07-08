import * as analysisService from './analysis.service.js';

export const getAnalysis = async (req, res, next) => {
  const { owner, repo } = req.query;

  if (!owner || !repo) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Both "owner" and "repo" query parameters are required.'
    });
  }

  try {
    const analysis = await analysisService.analyzeRepository(owner, repo);
    return res.json(analysis);
  } catch (error) {
    next(error);
  }
};
