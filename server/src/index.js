import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import pollRoutes from './routes/pollRoutes.js';
import { initializeSocketHandlers } from './socket/handlers.js';

const app = express();
const server = http.createServer(app);

// Configure CORS
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174", "https://live-polling-system-ten.vercel.app/"],
  methods: ["GET", "POST"],
  credentials: true
};

app.use(cors(corsOptions));

// Create Socket.IO server with CORS
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Middleware
app.use(express.json());

// Routes
app.use('/api/poll', pollRoutes);

// Initialize Socket.IO handlers
initializeSocketHandlers(io);

// Error handling for server
server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error('Port 3001 is already in use. Please try a different port or kill the process using this port.');
    process.exit(1);
  }
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Socket.IO server initialized');
  console.log('CORS enabled for:', corsOptions.origin);
  console.log('Available transports:', io.engine.transports);
}); 