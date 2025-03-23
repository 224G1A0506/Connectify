const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import models in correct order
require('./models/model');  // USER model
require('./models/post');   // Post model
require('./models/message'); 
require('./models/story');  // Story model

// Get model references after all models are registered
const Message = mongoose.model("Message");
const USER = mongoose.model("USER");

// Import configuration
const { mongoUrl } = require('./keys');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from build directory
app.use(express.static(path.join(__dirname, './frontend/build')));

// Make io available in routes
app.set('io', io);

// Import the message module that now exports both router and socket handlers
const messageModule = require('./routes/message');

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/createPost'));
app.use('/api', require('./routes/user'));
app.use('/api', require('./routes/googleAuth')); // Keep this route mounted correctly
app.use('/api/messages', messageModule.router); // Use the router from the message module
app.use('/api', require('./routes/stories'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up the message socket handlers
messageModule.setupSocketHandlers(io);

// Map the old routes to the new API routes for backward compatibility
app.post('/signup', (req, res) => {
  req.url = '/api/auth/signup';
  app._router.handle(req, res);
});

app.post('/signin', (req, res) => {
  req.url = '/api/auth/signin';
  app._router.handle(req, res);
});

// Add backward compatibility route for Google Auth
app.post('/google-auth', (req, res) => {
  req.url = '/api/google-auth';
  app._router.handle(req, res);
});

// Serve index.html for any unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './frontend/build/index.html'), (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Error loading page');
    }
  });
});

// MongoDB Connection with enhanced error handling
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Successfully connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Improved error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// Start server with error handling
const PORT = process.env.PORT || 5000;
server.listen(PORT, (err) => {
  if (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
  console.log(`Server is running on port ${PORT}`);
});

// Global error handlers
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});