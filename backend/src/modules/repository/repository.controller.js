import * as repositoryService from './repository.service.js';

export const getOverview = async (req, res, next) => {
  const { owner, repo } = req.query;

  if (!owner || !repo) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Both "owner" and "repo" query parameters are required.'
    });
  }

  try {
    const overview = await repositoryService.getRepositoryOverview(owner, repo);
    return res.json(overview);
  } catch (error) {
    next(error);
  }
};
