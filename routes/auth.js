const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const USER = mongoose.model("USER");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { Jwt_secret } = require("../keys");
const requireLogin = require("../middlewares/requireLogin");

// Input validation helper
const validateInput = (input) => {
  const errors = {};
  
  // Email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!input.email || !emailRegex.test(input.email)) {
    errors.email = "Please provide a valid email address";
  }

  // Name validation
  if (!input.name || input.name.length < 2 || input.name.length > 50) {
    errors.name = "Name must be between 2 and 50 characters";
  }

  // Username validation
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!input.userName || !usernameRegex.test(input.userName) || 
      input.userName.length < 3 || input.userName.length > 30) {
    errors.userName = "Username must be 3-30 characters and can only contain letters, numbers, and underscores";
  }

  // Password validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
  if (!input.password || !passwordRegex.test(input.password)) {
    errors.password = "Password must include uppercase, lowercase, number, special character, and be at least 8 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Signup route
router.post("/signup", async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const { name, userName, email, password } = req.body;

    // Validate input
    const validation = validateInput({ name, userName, email, password });
    if (!validation.isValid) {
      return res.status(422).json({ 
        success: false,
        errors: validation.errors
      });
    }

    // Check for existing user
    const existingUser = await USER.findOne({ 
      $or: [
        { email: email.toLowerCase() }, 
        { userName: userName.toLowerCase() }
      ] 
    });

    if (existingUser) {
      const field = existingUser.email.toLowerCase() === email.toLowerCase() ? 'email' : 'userName';
      return res.status(422).json({
        success: false,
        error: `This ${field} is already registered`,
        field: field
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = new USER({
      name,
      email: email.toLowerCase(),
      userName: userName.toLowerCase(),
      password: hashedPassword
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: "Registration successful! You can now sign in."
    });

  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      error: "An error occurred during signup. Please try again."
    });
  }
});

// Signin route
router.post("/signin", async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({
        success: false,
        error: "Please provide both email and password"
      });
    }

    const savedUser = await USER.findOne({ email: email.toLowerCase() });

    if (!savedUser) {
      return res.status(422).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    const match = await bcrypt.compare(password, savedUser.password);

    if (match) {
      const token = jwt.sign({ _id: savedUser.id }, Jwt_secret);
      const { _id, name, email, userName } = savedUser;

      return res.json({
        success: true,
        token,
        user: { _id, name, email, userName }
      });
    } else {
      return res.status(422).json({
        success: false,
        error: "Invalid email or password"
      });
    }

  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({
      success: false,
      error: "An error occurred during signin. Please try again."
    });
  }
});

module.exports = router;