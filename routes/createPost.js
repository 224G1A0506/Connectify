const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const requireLogin = require("../middlewares/requireLogin");
const POST = mongoose.model("POST");

// Route to fetch all posts
router.get("/allposts", requireLogin, async (req, res) => {
    try {
        const posts = await POST.find()
            .populate("postedBy", "_id name Photo")
            .populate("comments.postedBy", "_id name")
            .sort("-createdAt");
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch posts" });
    }
});

// Route to create a post
router.post("/createPost", requireLogin, async (req, res) => {
    const { body, pic } = req.body;
    if (!body || !pic) {
        return res.status(422).json({ error: "Please add all the fields" });
    }
    try {
        const post = new POST({
            body,
            photo: pic,
            postedBy: req.user,
        });
        const result = await post.save();
        res.json({ post: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create post" });
    }
});

// Route to fetch user's posts
router.get("/myposts", requireLogin, async (req, res) => {
    try {
        const myposts = await POST.find({ postedBy: req.user._id })
            .populate("postedBy", "_id name")
            .populate("comments.postedBy", "_id name")
            .sort("-createdAt");
        res.json(myposts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch your posts" });
    }
});

// Like route
router.put("/like", requireLogin, async (req, res) => {
    try {
        const result = await POST.findByIdAndUpdate(
            req.body.postId,
            { $push: { likes: req.user._id } },
            { new: true }
        ).populate("postedBy", "_id name Photo");
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(422).json({ error: err.message });
    }
});

// Unlike route
router.put("/unlike", requireLogin, async (req, res) => {
    try {
        const result = await POST.findByIdAndUpdate(
            req.body.postId,
            { $pull: { likes: req.user._id } },
            { new: true }
        ).populate("postedBy", "_id name Photo");
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(422).json({ error: err.message });
    }
});

// Comment route
router.put("/comment", requireLogin, async (req, res) => {
    const comment = {
        comment: req.body.text,
        postedBy: req.user._id,
    };
    try {
        const result = await POST.findByIdAndUpdate(
            req.body.postId,
            { $push: { comments: comment } },
            { new: true }
        )
            .populate("comments.postedBy", "_id name")
            .populate("postedBy", "_id name Photo");
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(422).json({ error: "Failed to add comment" });
    }
});

// Route to delete a post
router.delete("/deletePost/:postId", requireLogin, async (req, res) => {
    try {
        const post = await POST.findOne({ _id: req.params.postId })
            .populate("postedBy", "_id");
        
        if (!post) {
            return res.status(422).json({ error: "Post not found" });
        }
        
        if (post.postedBy._id.toString() === req.user._id.toString()) {
            await POST.deleteOne({ _id: req.params.postId });
            res.json({ message: "Successfully deleted" });
        } else {
            res.status(403).json({ error: "Unauthorized action" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete post" });
    }
});

// Route to show posts of followed users
router.get("/myfollwingpost", requireLogin, async (req, res) => {
    try {
        const posts = await POST.find({ postedBy: { $in: req.user.following } })
            .populate("postedBy", "_id name")
            .populate("comments.postedBy", "_id name");
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch posts" });
    }
});

module.exports = router;