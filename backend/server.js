const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const taskRoutes = require('./routes/tasks');
const progressRoutes = require('./routes/progress');
const taskTypesRoutes = require('./routes/taskTypes');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

// CORS Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads as static files
app.use('/uploads', express.static('uploads'));

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-prep-board', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Available collections:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // Try local fallback
    console.log('Trying to connect to local MongoDB...');
    try {
      await mongoose.connect('mongodb://localhost:27017/interview-prep-board', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to local MongoDB');
    } catch (localError) {
      console.error('❌ Local MongoDB also failed:', localError.message);
      console.log('\n⚠️  Please make sure MongoDB is running:');
      console.log('   For Windows: Run "mongod" command or start MongoDB Service');
      console.log('   For Mac: Run "brew services start mongodb-community"');
      console.log('   For Linux: Run "sudo systemctl start mongod"');
      console.log('\n💡 Or install MongoDB: https://www.mongodb.com/try/download/community');
      process.exit(1);
    }
  }
};

// Call the database connection function
connectDB();

// Simple error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Server Error:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/task-types', taskTypesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  let dbMessage = '';
  
  switch(dbStatus) {
    case 0: dbMessage = 'Disconnected'; break;
    case 1: dbMessage = 'Connected'; break;
    case 2: dbMessage = 'Connecting'; break;
    case 3: dbMessage = 'Disconnecting'; break;
    default: dbMessage = 'Unknown';
  }
  
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbMessage,
      readyState: dbStatus,
      connected: dbStatus === 1
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Interview Prep Board API',
    version: '1.0.0',
    documentation: 'API documentation coming soon',
    endpoints: {
      auth: '/api/auth',
      boards: '/api/boards',
      tasks: '/api/tasks',
      progress: '/api/progress',
      health: '/api/health'
    },
    status: {
      server: 'running',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      websocket: 'enabled'
    }
  });
});

// WebSocket connections
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // Handle board joining
  socket.on('joinBoard', (boardId) => {
    if (boardId && typeof boardId === 'string') {
      socket.join(boardId);
      console.log(`📌 Socket ${socket.id} joined board ${boardId}`);
    } else {
      console.warn(`⚠️ Invalid boardId from socket ${socket.id}:`, boardId);
    }
  });

  // Handle task updates
  socket.on('taskUpdate', (data) => {
    if (data && data.boardId) {
      console.log(`🔄 Task update for board ${data.boardId}:`, data.type);
      io.to(data.boardId).emit('taskUpdated', data);
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
  });

  // Handle connection errors
  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  // Send connection confirmation
  socket.emit('connected', { 
    message: 'Connected to server',
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });
});

// Store io instance globally for use in routes
app.set('socketio', io);

// Error handling middleware (must be last before 404)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/boards',
      'POST /api/boards',
      'GET /api/boards/:id',
      'GET /api/tasks/board/:boardId'
    ]
  });
});

const PORT = process.env.PORT || 5000;

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 Interview Prep Board Backend
  =================================
  ✅ Server running on port: ${PORT}
  🌐 Environment: ${process.env.NODE_ENV || 'development'}
  🔗 API URL: http://localhost:${PORT}
  🔗 Frontend URL: http://localhost:5173
  📡 WebSocket: ws://localhost:${PORT}
  🗄️  Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}
  =================================
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Log the error but don't crash
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Log the error but don't crash
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received, starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(async () => {
    console.log('✅ HTTP server closed');
    
    try {
      // Close MongoDB connection (NO CALLBACK - using async/await)
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      
      console.log('👋 Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle process exit
process.on('exit', (code) => {
  console.log(`Process exiting with code: ${code}`);
});

// Export for testing
module.exports = { app, server, io };