import * as commitsService from './commits.service.js';

export const getCommits = async (req, res, next) => {
  const { owner, repo } = req.query;

  if (!owner || !repo) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Both "owner" and "repo" query parameters are required.'
    });
  }

  try {
    const stats = await commitsService.getCommitStats(owner, repo);
    return res.json(stats);
  } catch (error) {
    next(error);
  }
};
