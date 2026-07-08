import express from 'express';
import cors from 'cors';
import repositoryRoutes from './modules/repository/repository.routes.js';
import commitsRoutes from './modules/commits/commits.routes.js';
import contributorsRoutes from './modules/contributors/contributors.routes.js';
import analysisRoutes from './modules/analysis/analysis.routes.js';
import errorHandler from './shared/middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

// Main backend health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'GitPulse Backend'
  });
});

// Mount modules (Modular Monolith)
app.use('/api/repository', repositoryRoutes);
app.use('/api/commits', commitsRoutes);
app.use('/api/contributors', contributorsRoutes);
app.use('/api/analysis', analysisRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
