// models/story.js
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const storySchema = new mongoose.Schema({
  media: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  text: {
    type: String
  },
  textColor: {
    type: String,
    default: '#ffffff'
  },
  textPosition: {
    type: String,
    enum: ['top', 'center', 'bottom'],
    default: 'center'
  },
  postedBy: {
    type: ObjectId,
    ref: 'USER', // Change this from 'User' to 'USER'
    required: true
  },
  seenBy: [{
    type: ObjectId,
    ref: 'USER' // Change this too
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Auto delete after 24 hours (in seconds)
  }
});

mongoose.model('Story', storySchema);