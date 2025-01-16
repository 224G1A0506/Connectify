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
require('./models/message'); // Message model

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

// Socket.IO connection handling
const onlineUsers = new Map();

io.on('connection', async (socket) => {
  console.log('User connected:', socket.id);

  // User comes online
  socket.on('user_online', async (userId) => {
    try {
      // Verify user exists before marking them online
      const user = await USER.findById(userId);
      if (user) {
        onlineUsers.set(userId, socket.id);
        io.emit('user_status_change', {
          userId: userId,
          status: 'online'
        });
      }
    } catch (error) {
      console.error('Error in user_online:', error);
    }
  });

  // Join private chat room
  socket.on('join_chat', (chatRoom) => {
    socket.join(chatRoom);
    console.log(`User ${socket.id} joined room: ${chatRoom}`);
  });

  // Handle new messages
  socket.on('send_message', async (messageData) => {
    try {
      const { senderId, receiverId, message } = messageData;
      
      // Verify both users exist
      const [sender, receiver] = await Promise.all([
        USER.findById(senderId),
        USER.findById(receiverId)
      ]);

      if (!sender || !receiver) {
        throw new Error('Invalid sender or receiver');
      }

      // Save message to database
      const newMessage = new Message({
        senderId,
        receiverId,
        message,
        timestamp: new Date()
      });
      await newMessage.save();
      
      // Create unique room name and emit message
      const chatRoom = [senderId, receiverId].sort().join('-');
      io.to(chatRoom).emit('receive_message', newMessage);

      // Send notification to receiver if they're online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_message_notification', {
          senderId,
          senderName: sender.name,
          message: message.substring(0, 30) + (message.length > 30 ? '...' : '')
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle typing status
  socket.on('typing_start', ({ senderId, receiverId }) => {
    const chatRoom = [senderId, receiverId].sort().join('-');
    socket.to(chatRoom).emit('typing_indicator', { userId: senderId, typing: true });
  });

  socket.on('typing_stop', ({ senderId, receiverId }) => {
    const chatRoom = [senderId, receiverId].sort().join('-');
    socket.to(chatRoom).emit('typing_indicator', { userId: senderId, typing: false });
  });

  // Handle read receipts
  socket.on('mark_messages_read', async ({ senderId, receiverId }) => {
    try {
      const updateResult = await Message.updateMany(
        { senderId, receiverId, isRead: false },
        { $set: { isRead: true } }
      );
      
      if (updateResult.modifiedCount > 0) {
        const chatRoom = [senderId, receiverId].sort().join('-');
        io.to(chatRoom).emit('messages_marked_read', { senderId, receiverId });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      socket.emit('message_error', { error: 'Failed to mark messages as read' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit('user_status_change', {
          userId: userId,
          status: 'offline'
        });
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// API Routes

app.use(require('./routes/auth'));
app.use(require('./routes/createPost'));
app.use(require('./routes/user'));
app.use(require('./routes/googleAuth'));
app.use('/api/messages', require('./routes/message'));



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