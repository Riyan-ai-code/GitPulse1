import { authLocalStorage } from '../context/authContext.js';

export const requireAuth = (req, res, next) => {
  const token = authLocalStorage.getStore();
  
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Please sign in with GitHub.'
    });
  }
  
  next();
};
