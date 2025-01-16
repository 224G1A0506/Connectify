const jwt = require("jsonwebtoken");
const { Jwt_secret } = require("../keys");
const mongoose = require("mongoose");
const USER = mongoose.model("USER");

module.exports = async (req, res, next) => {
    try {
        const { authorization } = req.headers;
        
        if (!authorization) {
            console.log("No authorization header");
            return res.status(401).json({ error: "You must be logged in" });
        }

        // Extract token
        const token = authorization.replace("Bearer ", "");
        if (!token) {
            console.log("No token found");
            return res.status(401).json({ error: "No token found" });
        }

        // Verify token
        const payload = jwt.verify(token, Jwt_secret);
        if (!payload) {
            console.log("Token verification failed");
            return res.status(401).json({ error: "Invalid token" });
        }

        // Find user
        const user = await USER.findById(payload._id);
        if (!user) {
            console.log("User not found");
            return res.status(401).json({ error: "User not found" });
        }

        req.user = user;
        next();
    } catch (err) {
        console.log("Auth error:", err.message);
        return res.status(401).json({ error: "You must be logged in" });
    }
};