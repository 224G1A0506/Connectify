const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'USER',
        required: true 
    },
    receiverId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'USER',
        required: true 
    },
    message: { 
        type: String, 
        required: false,  // Changed from true to false
        default: ''
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    },
    isRead: { 
        type: Boolean, 
        default: false 
    }
});

mongoose.model("Message", messageSchema);