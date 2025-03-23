const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Jwt_secret } = require('../keys');
const requireLogin = require('../middlewares/requireLogin');
const Message = mongoose.model("Message");
const USER = mongoose.model("USER");

// Track recently processed messages to prevent duplicates
const processedMessages = new Map(); // messageId -> timestamp
const MESSAGE_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Periodically clean up old message references
setInterval(() => {
    const now = Date.now();
    for (const [messageId, timestamp] of processedMessages.entries()) {
        if (now - timestamp > MESSAGE_CACHE_DURATION) {
            processedMessages.delete(messageId);
        }
    }
}, 5 * 60 * 1000); // Run cleanup every 5 minutes

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, Jwt_secret);
        const user = await USER.findById(decoded._id);
        if (!user) {
            return next(new Error('User not found'));
        }

        socket.user = user;
        next();
    } catch (error) {
        next(new Error('Authentication failed'));
    }
};

router.get('/verify-auth', requireLogin, async (req, res) => {
    try {
      const user = req.user;
      res.json({ 
        valid: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profilePic: user.profilePic
        }
      });
    } catch (error) {
      console.error('Auth verification error:', error);
      res.status(401).json({ valid: false, error: 'Authentication failed' });
    }
  });

// Get chat list for current user
router.get('/chats', requireLogin, async (req, res) => {
    try {
        const userId = req.user._id;
        const userObjectId = new mongoose.Types.ObjectId(userId);
        
        const recentChats = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: userObjectId },
                        { receiverId: userObjectId }
                    ]
                }
            },
            {
                $sort: { timestamp: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$senderId', userObjectId] },
                            '$receiverId',
                            '$senderId'
                        ]
                    },
                    lastMessage: { $first: '$message' },
                    timestamp: { $first: '$timestamp' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$isRead', false] },
                                        { $eq: ['$receiverId', userObjectId] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const populatedChats = await Promise.all(recentChats.map(async (chat) => {
            try {
                const userDetails = await USER.findById(chat._id);
                if (!userDetails) return null;
                
                return {
                    ...chat,
                    user: {
                        _id: userDetails._id,
                        name: userDetails.name,
                        email: userDetails.email,
                        profilePic: userDetails.profilePic
                    }
                };
            } catch (err) {
                console.error('Error fetching user details:', err);
                return null;
            }
        }));

        const validChats = populatedChats.filter(chat => chat !== null);
        res.json(validChats);
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/conversation/:userId', requireLogin, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { senderId: req.user._id, receiverId: req.params.userId },
                { senderId: req.params.userId, receiverId: req.user._id }
            ]
        })
        .sort({ timestamp: 1 })
        .populate('senderId', 'name email profilePic')
        .populate('receiverId', 'name email profilePic');

        // Add all fetched messages to the processed map to prevent duplicates
        messages.forEach(msg => {
            processedMessages.set(msg._id.toString(), Date.now());
        });

        await Message.updateMany(
            {
                senderId: req.params.userId,
                receiverId: req.user._id,
                isRead: false
            },
            { $set: { isRead: true } }
        );

        res.json(messages);
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/send', requireLogin, async (req, res) => {
    try {
      const { receiverId, message, fileUrl, fileType, clientMessageId } = req.body;
      
      if (!receiverId) {
        return res.status(400).json({ error: 'Receiver ID is required' });
      }
  
      // Check if we've already processed a message with this client ID
      if (clientMessageId) {
        const existingMessage = await Message.findOne({ clientMessageId });
        if (existingMessage) {
          // Return the existing message instead of creating a new one
          processedMessages.set(existingMessage._id.toString(), Date.now());
          return res.status(200).json(existingMessage);
        }
      }
  
      // Verify receiver exists
      const receiver = await USER.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({ error: 'Receiver not found' });
      }
  
      // Create new message
      const newMessage = new Message({
        senderId: req.user._id,
        receiverId,
        message: message || '', // Ensure message is not undefined
        fileUrl,
        fileType,
        timestamp: new Date(),
        isRead: false,
        clientMessageId // Store clientMessageId to handle retries
      });
      
      await newMessage.save();
      
      // Add to processed messages to prevent duplicates
      processedMessages.set(newMessage._id.toString(), Date.now());
      
      // Emit socket event only once, with message ID for deduplication
      const io = req.app.get('io');
      if (io) {
        const chatRoom = [req.user._id, receiverId].sort().join('-');
        io.to(chatRoom).emit('receive_message', {
          ...newMessage.toObject(),
          _id: newMessage._id.toString(), // Ensure ID is a string
          clientMessageId
        });
      }
      
      res.status(201).json(newMessage);
    } catch (error) {
      console.error('Detailed error:', error); 
      res.status(500).json({ error: 'Failed to send message' });
    }
  });
router.get('/search/users', requireLogin, async (req, res) => {
    try {
        const searchQuery = req.query.q;
        
        if (!searchQuery) {
            return res.json([]);
        }

        const users = await USER.find({
            $and: [
                { _id: { $ne: req.user._id } },
                {
                    $or: [
                        { name: { $regex: searchQuery, $options: 'i' } },
                        { username: { $regex: searchQuery, $options: 'i' } },
                        { email: { $regex: searchQuery, $options: 'i' } }
                    ]
                }
            ]
        })
        .select('name username email profilePic')
        .limit(10);

        res.json(users);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Update the conversation/create route in message.js
router.post('/conversation/create', requireLogin, async (req, res) => {
    try {
        const { receiverId } = req.body;
        
        if (!receiverId) {
            return res.status(400).json({ error: 'Receiver ID is required' });
        }

        // Verify receiver exists
        const receiver = await USER.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ error: 'Receiver not found' });
        }

        // Check if conversation already exists
        const existingConversation = await Message.findOne({
            $or: [
                { senderId: req.user._id, receiverId: receiverId },
                { senderId: receiverId, receiverId: req.user._id }
            ]
        });

        if (existingConversation) {
            return res.json({
                success: true,
                conversationId: receiverId, // Use receiverId as conversationId
                message: 'Conversation already exists'
            });
        }

        // Create initial message with a unique clientMessageId
        const clientMessageId = `init_${req.user._id}_${receiverId}_${Date.now()}`;
        const newMessage = new Message({
            senderId: req.user._id,
            receiverId: receiverId,
            message: '', // Empty initial message is allowed since we updated the schema
            timestamp: new Date(),
            isRead: false,
            clientMessageId
        });
        
        await newMessage.save();
        
        // Add to processed messages
        processedMessages.set(newMessage._id.toString(), Date.now());

        // Emit socket event for real-time updates with deduplication info
        const io = req.app.get('io');
        if (io) {
            const chatRoom = [req.user._id, receiverId].sort().join('-');
            io.to(chatRoom).emit('conversation_created', {
                senderId: req.user._id,
                receiverId: receiverId,
                messageId: newMessage._id.toString(),
                clientMessageId
            });
        }
        
        res.status(201).json({
            success: true,
            conversationId: receiverId, // Use receiverId as conversationId
            message: 'Conversation created successfully'
        });
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});

// Socket setup function
const setupSocketHandlers = (io) => {
    io.use(authenticateSocket);
    
    io.on('connection', (socket) => {
      console.log('User connected:', socket.user._id);
      
      socket.on('join_chat', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.user._id} joined room ${roomId}`);
      });
      
      socket.on('send_message', async (messageData) => {
        const { _id, clientMessageId } = messageData;
        
        // Check if we've already processed this message to prevent duplicates
        if (_id && processedMessages.has(_id.toString())) {
          console.log('Ignoring duplicate socket message:', _id);
          return;
        }
        
        // Process the message normally if it's new
        if (_id) {
          processedMessages.set(_id.toString(), Date.now());
          
          // Create the room ID consistently
          const chatRoom = [messageData.senderId, messageData.receiverId].sort().join('-');
          
          // Broadcast to everyone in the room except sender
          socket.to(chatRoom).emit('receive_message', messageData);
        }
      });
      socket.on('typing_indicator', (data) => {
        const roomId = [data.senderId, data.receiverId].sort().join('-');
        socket.to(roomId).emit('typing_indicator', {
          userId: socket.user._id,
          typing: data.typing
        });
      });
      
      socket.on('mark_messages_read', async (data) => {
        try {
          // Update messages in database
          await Message.updateMany(
            {
              senderId: data.senderId,
              receiverId: data.receiverId,
              isRead: false
            },
            { $set: { isRead: true } }
          );
          
          // Create the room ID consistently
          const roomId = [data.senderId, data.receiverId].sort().join('-');
          
          // Broadcast read receipt to everyone in room
          io.to(roomId).emit('messages_marked_read', data);
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      });
      
      socket.on('user_online', (userId) => {
        // Broadcast user online status
        socket.broadcast.emit('user_status_change', {
          userId,
          status: 'online'
        });
      });
      
      socket.on('disconnect', () => {
        // Broadcast user offline status
        socket.broadcast.emit('user_status_change', {
          userId: socket.user._id,
          status: 'offline'
        });
        console.log('User disconnected:', socket.user._id);
      });
    });
  };

// Add this to your backend routes (message.js)
router.get('/verify-auth', requireLogin, (req, res) => {
    res.json({ valid: true });
});

// Export both the router and socket setup function
module.exports = {
    router,
    setupSocketHandlers
};