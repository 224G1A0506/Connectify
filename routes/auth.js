const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const USER = mongoose.model("USER");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { Jwt_secret } = require("../keys");
const requireLogin = require("../middlewares/requireLogin");
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Add your email in .env
        pass: process.env.EMAIL_PASS // Add your email password in .env
    }
});

// Function to send OTP email
const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Sign-Up',
        text: `Your OTP for sign-up is: ${otp}`
    };

    await transporter.sendMail(mailOptions);
};

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

// Signup route with OTP
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

      // Generate OTP
      const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false, alphabets: false });

      // Create new user
      const user = new USER({
          name,
          email: email.toLowerCase(),
          userName: userName.toLowerCase(),
          password: hashedPassword,
          otp,
          otpExpiration: Date.now() + 600000 // OTP expires in 10 minutes
      });

      await user.save();

      // Send OTP email
      await sendOTPEmail(email, otp);

      return res.status(201).json({
          success: true,
          message: "OTP sent to your email. Please verify to complete sign-up."
      });

  } catch (error) {
      console.error("Signup error:", error); // Log the full error
      return res.status(500).json({
          success: false,
          error: "An error occurred during signup. Please try again."
      });
  }
});

// OTP Verification Route
router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await USER.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ error: "Invalid OTP." });
        }

        if (Date.now() > user.otpExpiration) {
            return res.status(400).json({ error: "OTP has expired. Please request a new one." });
        }

        // Mark user as verified
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiration = undefined;
        await user.save();

        return res.status(200).json({ message: "Email verified successfully! You can now sign in." });

    } catch (error) {
        console.error("OTP verification error:", error);
        return res.status(500).json({ error: "An error occurred during OTP verification. Please try again." });
    }
});

// Resend OTP Route
router.post("/resend-otp", async (req, res) => {
    try {
        const { email } = req.body;

        const user = await USER.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Generate new OTP
        const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false, alphabets: false });

        // Update user with new OTP and expiration time
        user.otp = otp;
        user.otpExpiration=Date.now() + 600000; // OTP expires in 10 minutes
        await user.save();

        // Send new OTP email
        await sendOTPEmail(email, otp);

        return res.status(200).json({ message: "New OTP sent to your email." });

    } catch (error) {
        console.error("Resend OTP error:", error);
        return res.status(500).json({ error: "An error occurred while resending OTP. Please try again." });
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

        // Check if email is verified
        if (!savedUser.isVerified) {
            return res.status(403).json({
                success: false,
                error: "Please verify your email before signing in."
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

// Get current user
router.get("/currentUser", requireLogin, (req, res) => {
    try {
        res.json(req.user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch user data" });
    }
});

module.exports = router;