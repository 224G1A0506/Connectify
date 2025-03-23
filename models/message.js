const mongoose = require('mongoose'); // Add this line

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'USER', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'USER', required: true },
  message: { type: String, default: '' }, // Ensure default is an empty string
  fileUrl: { type: String },
  fileType: { type: String },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  clientMessageId: { type: String } // Add this field for deduplication
});

module.exports = mongoose.model("Message", messageSchema); // Export the model