
import express from 'express';
import cors from 'cors';

import syncRoutes from './routes/syncRoutes.js';
import handoverRoutes from './routes/handoverRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import userRoutes from './routes/userRoutes.js';
import holidayRoutes from './routes/holidayRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import authRoutes from './routes/authRoutes.js';

import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://smart-leave-pro-kowsalyaparthipanm-1133.vercel.app'
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/handovers', handoverRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sync', syncRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
