// routes/stories.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const Story = mongoose.model('Story');
const USER = mongoose.model('USER'); // Change User to USER
const path = require('path'); // Add this import
const upload = require('../middlewares/uploadMiddleware'); 
// Create a new story with file upload
router.post('/create-story', requireLogin, upload.single('media'), async (req, res) => {
    try {
      const { text, textColor, textPosition, mediaType } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No media file provided' });
      }
      
      // Create media URL
      const mediaUrl = `/uploads/${req.file.filename}`;
      
      const newStory = new Story({
        media: mediaUrl,
        mediaType: mediaType || 'image',
        text,
        textColor,
        textPosition,
        postedBy: req.user._id
      });
      
      await newStory.save();
      
      res.status(201).json({
        success: true,
        message: 'Story created successfully',
        story: newStory
      });
    } catch (error) {
      console.error('Error creating story:', error);
      res.status(500).json({ success: false, message: 'Failed to create story', error: error.message });
    }
  });
// Get stories of users being followed and user's own stories
router.get('/stories', requireLogin, async (req, res) => {
  try {
    // Get current user's stories
    const userStories = await Story.find({ postedBy: req.user._id })
      .populate('postedBy', '_id name Photo')
      .sort('-createdAt');

    // Get stories from followed users
    const following = req.user.following;
    
    const followingStories = await USER.find({ _id: { $in: following } })
      .select('_id name Photo')
      .lean();

    // Fetch stories for each followed user
    for (let user of followingStories) {
      const stories = await Story.find({ 
        postedBy: user._id,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      })
      .select('_id media mediaType text textColor textPosition createdAt seenBy')
      .sort('-createdAt');

      user.stories = stories;
    }

    // Only include users who have stories
    const filteredFollowingStories = followingStories.filter(user => user.stories.length > 0);

    res.json({
      success: true,
      userStories,
      followingStories: filteredFollowingStories
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ success: false, message: 'Failed to load stories', error: error.message });
  }
});

// Get stories of a specific user
router.get('/stories/:userId', requireLogin, async (req, res) => {
  try {
    const user = await USER.findById(req.params.userId)
      .select('_id name Photo');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const stories = await Story.find({ 
      postedBy: req.params.userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    })
    .select('_id media mediaType text textColor textPosition createdAt seenBy')
    .sort('-createdAt');

    res.json({ success: true, user, stories });
  } catch (error) {
    console.error('Error fetching user stories:', error);
    res.status(500).json({ success: false, message: 'Failed to load stories', error: error.message });
  }
});

// Get all stories (for story viewing page)
router.get('/all-stories', requireLogin, async (req, res) => {
  try {
    // Get current user's data
    const currentUser = await USER.findById(req.user._id)
      .select('_id name Photo following')
      .lean();
      
    // Get user's own stories
    const userStories = await Story.find({ postedBy: req.user._id })
      .select('_id media mediaType text textColor textPosition createdAt seenBy')
      .sort('-createdAt');
    
    // Create a result array starting with current user
    const result = [{
      _id: currentUser._id,
      name: currentUser.name,
      Photo: currentUser.Photo,
      stories: userStories
    }];
    
    // Get stories from followed users
    const followingUsers = await USER.find({ _id: { $in: currentUser.following } })
      .select('_id name Photo')
      .lean();
      
    // Fetch stories for each followed user
    for (const user of followingUsers) {
      const stories = await Story.find({ 
        postedBy: user._id,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      })
      .select('_id media mediaType text textColor textPosition createdAt seenBy')
      .sort('-createdAt');
      
      if (stories.length > 0) {
        user.stories = stories;
        result.push(user);
      }
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching all stories:', error);
    res.status(500).json({ success: false, message: 'Failed to load stories', error: error.message });
  }
});

// Mark a story as seen
router.put('/story/seen/:storyId', requireLogin, async (req, res) => {
  try {
    const storyId = req.params.storyId;
    const userId = req.user._id;
    
    const story = await Story.findById(storyId);
    
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }
    
    // Check if user has already seen the story
    if (!story.seenBy.includes(userId)) {
      // Add user to seenBy array
      await Story.findByIdAndUpdate(storyId, {
        $addToSet: { seenBy: userId }
      });
    }
    
    res.json({ success: true, message: 'Story marked as seen' });
  } catch (error) {
    console.error('Error marking story as seen:', error);
    res.status(500).json({ success: false, message: 'Failed to mark story as seen', error: error.message });
  }
});

module.exports = router;