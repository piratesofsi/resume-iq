import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.js';
import analysisRoutes from './routes/analysis.js';

dotenv.config();

const app = express();
const uploadsPath = path.resolve(process.cwd(), '../uploads');

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsPath));

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', service: 'ResumeIQ server' });
});

app.use('/api/auth', authRoutes);
app.use('/api', analysisRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` });
});

export default app;
