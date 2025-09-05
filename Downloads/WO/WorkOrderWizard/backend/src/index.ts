import express, { Request, Response } from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import cors from 'cors';

// Import routes
import workOrderRoutes from './routes/workOrders';
import userRoutes from './routes/users';
import authRoutes from './routes/auth';
import notificationRoutes from './routes/notifications';

// Import WebSocket service
import WebSocketService from './services/websocket';

dotenv.config();

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3001;

// Initialize WebSocket service
const wsService = new WebSocketService(server);

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'WorkOrderWizard Backend is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

server.listen(port, () => {
  console.log(`🚀 WorkOrderWizard Backend is running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}`);
  console.log(`🔧 API endpoints: http://localhost:${port}/api`);
});
