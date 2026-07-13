import express from 'express';
import cors from 'cors';
import repositoryRoutes from './modules/repository/repository.routes.js';
import commitsRoutes from './modules/commits/commits.routes.js';
import contributorsRoutes from './modules/contributors/contributors.routes.js';
import analysisRoutes from './modules/analysis/analysis.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import gsocRoutes from './modules/gsoc/gsoc.routes.js';
import errorHandler from './shared/middleware/errorHandler.js';

const app = express();

const frontEndOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: frontEndOrigin,
  credentials: true
}));
app.use(express.json());

// Continuation Local Storage context middleware to isolate request cookies/tokens
import { authLocalStorage } from './shared/context/authContext.js';
app.use((req, res, next) => {
  const rawCookieHeader = req.headers.cookie || '';
  const cookies = Object.fromEntries(
    rawCookieHeader.split('; ').map(c => {
      const parts = c.split('=');
      return [parts[0], parts.slice(1).join('=')];
    })
  );

  let token = cookies.github_access_token || null;

  if (!token && cookies.github_refresh_token) {
    token = cookies.github_refresh_token;
    res.cookie('github_access_token', token, {
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
  }

  authLocalStorage.run(token, () => {
    next();
  });
});

// Main backend health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'GitPulse Backend'
  });
});

// Mount modules (Modular Monolith)
app.use('/api/auth', authRoutes);
app.use('/api/repository', repositoryRoutes);
app.use('/api/commits', commitsRoutes);
app.use('/api/contributors', contributorsRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/gsoc', gsocRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
