const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Jwt_secret } = require('../keys');
const requireLogin = require('../middlewares/requireLogin');
const Message = mongoose.model("Message");
const USER = mongoose.model("USER");

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
        const { receiverId, message, fileUrl, fileType } = req.body;
        
        if (!receiverId) {
            return res.status(400).json({ error: 'Receiver ID is required' });
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
            message: message || '',
            fileUrl,
            fileType,
            timestamp: new Date(),
            isRead: false
        });
        
        await newMessage.save();
        
        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            const chatRoom = [req.user._id, receiverId].sort().join('-');
            io.to(chatRoom).emit('receive_message', newMessage);
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

        // Create initial message
        const newMessage = new Message({
            senderId: req.user._id,
            receiverId: receiverId,
            message: '', // Empty initial message is allowed since we updated the schema
            timestamp: new Date(),
            isRead: false
        });
        
        await newMessage.save();

        // Emit socket event for real-time updates
        const io = req.app.get('io');
        if (io) {
            const chatRoom = [req.user._id, receiverId].sort().join('-');
            io.to(chatRoom).emit('conversation_created', {
                senderId: req.user._id,
                receiverId: receiverId
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

// Add this to your backend routes (message.js)
router.get('/verify-auth', requireLogin, (req, res) => {
    res.json({ valid: true });
  });

// Export both the router and socket setup function
module.exports = router;