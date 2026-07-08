import * as contributorsService from './contributors.service.js';

export const getContributors = async (req, res, next) => {
  const { owner, repo } = req.query;

  if (!owner || !repo) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Both "owner" and "repo" query parameters are required.'
    });
  }

  try {
    const data = await contributorsService.getContributorsList(owner, repo);
    return res.json(data);
  } catch (error) {
    next(error);
  }
};
