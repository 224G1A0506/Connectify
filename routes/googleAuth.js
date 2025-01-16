// routes/googleAuth.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const USER = mongoose.model("USER");
const { OAuth2Client } = require('google-auth-library');
const jwt = require("jsonwebtoken");
const { Jwt_secret } = require("../keys");

// Initialize Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to generate unique username
const generateUniqueUsername = async (baseName) => {
    let userName = baseName;
    let counter = 0;
    let isUnique = false;
    
    while (!isUnique) {
        // Check if username exists
        const existingUser = await USER.findOne({ userName });
        if (!existingUser) {
            isUnique = true;
        } else {
            counter++;
            userName = `${baseName}${counter}`;
        }
    }
    
    return userName;
};

// Google authentication route
router.post("/google-auth", async (req, res) => {
    try {
        // Verify the Google ID token
        const ticket = await client.verifyIdToken({
            idToken: req.body.token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        
        // Extract user information from Google payload
        const { email, name, picture: profilePic } = payload;
        
        // Check if user already exists
        let user = await USER.findOne({ email });
        
        if (!user) {
            // Generate unique username from email
            const baseUserName = email.split('@')[0];
            const userName = await generateUniqueUsername(baseUserName);
            
            // Create new user
            user = new USER({
                name,
                email,
                userName,
                password: require('crypto').randomBytes(32).toString('hex'),
                Photo: profilePic,
            });
            
            await user.save();
        }

        // Generate JWT token
        const token = jwt.sign({ _id: user._id }, Jwt_secret);
        const { _id, userName, Photo } = user;

        res.json({
            token,
            user: { _id, name, email, userName, Photo }
        });

    } catch (error) {
        console.error('Google authentication error:', error);
        res.status(422).json({ error: "Could not authenticate with Google" });
    }
});

module.exports = router;