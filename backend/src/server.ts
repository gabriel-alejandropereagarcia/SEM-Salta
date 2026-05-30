import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { APP_CONFIG } from './config';
import whatsappRoutes from './routes/whatsapp.routes';
import mpRoutes from './routes/mp.routes';
import apiRoutes from './routes/api.routes';
import testRoutes from './routes/test.routes';

const app = express();

app.use(helmet());
app.use(cors({
  origin: APP_CONFIG.frontendUrl,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));
app.use(express.json());

app.use('/webhook/whatsapp', whatsappRoutes);
app.use('/api/mp', mpRoutes);
app.use('/api', apiRoutes);
app.use('/api/test', testRoutes);

app.get('/', (_req, res) => {
  res.json({
    name: 'SEM Salta API',
    version: '1.0.0',
    status: 'running',
  });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(APP_CONFIG.port, () => {
  console.log(`🚗 SEM Salta Backend running on port ${APP_CONFIG.port}`);
  console.log(`📍 Environment: ${APP_CONFIG.nodeEnv}`);
});

export default app;