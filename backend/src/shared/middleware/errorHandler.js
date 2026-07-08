// Global error handling middleware for modular monolith
const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler] Caught exception:', err.message);

  // Handle Axios/GitHub API specific errors
  if (err.isAxiosError && err.response) {
    const status = err.response.status;
    const message = err.response.data?.message || 'GitHub API error';

    if (status === 404) {
      return res.status(404).json({
        error: 'Repository Not Found',
        message: 'The requested repository could not be found. Please check the owner and repository name.',
      });
    }

    if (status === 403 && message.includes('rate limit')) {
      return res.status(403).json({
        error: 'GitHub Rate Limit Exceeded',
        message: 'GitHub API rate limit exceeded. Please provide a GITHUB_TOKEN in your environment or try again later.',
      });
    }

    if (status === 401) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'The GITHUB_TOKEN provided is invalid or expired.',
      });
    }

    return res.status(status).json({
      error: 'GitHub Integration Error',
      message: `GitHub API returned status ${status}: ${message}`,
    });
  }

  // Handle standard generic errors
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred on the server.',
  });
};

export default errorHandler;
