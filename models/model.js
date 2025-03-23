const mongoose = require("mongoose"); // Add this line
const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    Photo: {
        type: String,
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "USER" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "USER" }],
    otp: { // Add OTP field
        type: String,
        default: null
    },
    otpExpiration: { // Add OTP expiration field
        type: Date,
        default: null
    },
    isVerified: { // Add email verification status
        type: Boolean,
        default: false
    }
});

mongoose.model("USER", userSchema);