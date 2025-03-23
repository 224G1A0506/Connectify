const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const POST = mongoose.model("POST");
const USER = mongoose.model("USER");
const requireLogin = require("../middlewares/requireLogin");

router.get("/search", requireLogin, async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: "Search query is required" });
    }

    try {
        const users = await USER.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } }
            ]
        }).select("_id name email Photo");

        res.status(200).json(users);
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});
// Fixed route - removed duplicate /api prefix
router.get("/user/:id", async (req, res) => {
    try {
        // Add validation for the ID
        if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        
        const user = await USER.findOne({ _id: req.params.id }).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        const posts = await POST.find({ postedBy: req.params.id })
            .populate("postedBy", "_id");
        
        // Make sure the response structure matches what the frontend expects
        res.status(200).json({ user, post: posts });
    } catch (err) {
        console.error("Error fetching user profile:", err);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
});

// to follow user
router.put("/follow", requireLogin, async (req, res) => {
    try {
        const followedUser = await USER.findByIdAndUpdate(req.body.followId, 
            { $push: { followers: req.user._id } },
            { new: true }
        );

        const result = await USER.findByIdAndUpdate(req.user._id,
            { $push: { following: req.body.followId } },
            { new: true }
        );

        res.json(result);
    } catch (err) {
        res.status(422).json({ error: err.message });
    }
});

// to unfollow user
router.put("/unfollow", requireLogin, async (req, res) => {
    try {
        // Use followId or unfollowId based on what your frontend sends
        const userId = req.body.unfollowId || req.body.followId;
        
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const unfollowedUser = await USER.findByIdAndUpdate(userId,
            { $pull: { followers: req.user._id } },
            { new: true }
        );

        if (!unfollowedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const result = await USER.findByIdAndUpdate(req.user._id,
            { $pull: { following: userId } },
            { new: true }
        );

        res.json({ user: result, unfollowUser: unfollowedUser });
    } catch (err) {
        res.status(422).json({ error: err.message });
    }
});

// to upload profile pic
router.put("/uploadProfilePic", requireLogin, async (req, res) => {
    try {
        const result = await USER.findByIdAndUpdate(req.user._id,
            { $set: { Photo: req.body.pic } },
            { new: true }
        );
        res.json(result);
    } catch (err) {
        res.status(422).json({ error: err.message });
    }
});

// to remove profile pic
router.put("/removeProfilePic", requireLogin, async (req, res) => {
    try {
        const result = await USER.findByIdAndUpdate(
            req.user._id,
            { $set: { Photo: "" } },
            { new: true }
        );
        res.json(result);
    } catch (err) {
        res.status(422).json({ error: "Could not remove profile picture" });
    }
});

module.exports = router;