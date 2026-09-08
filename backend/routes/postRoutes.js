const express = require("express");
const Post = require("../models/Post");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    const { text, image } = req.body;

    if (!text && !image) {
      return res.status(400).json({
        message: "Post must contain text or image",
      });
    }

    const post = await Post.create({
      username: req.user.username,
      text: text || "",
      image: image || "",
    });

    res.status(201).json({
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});
// LIKE / UNLIKE POST
router.post("/:id/like", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const username = req.user.username;

    const alreadyLiked = post.likes.includes(username);

    if (alreadyLiked) {
      post.likes = post.likes.filter((user) => user !== username);
    } else {
      post.likes.push(username);
    }

    await post.save();

    res.json({
      message: alreadyLiked ? "Post unliked" : "Post liked",
      post,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
});

// ADD COMMENT
router.post("/:id/comments", protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Comment cannot be empty",
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    post.comments.push({
      username: req.user.username,
      text: text.trim(),
    });

    await post.save();

    res.json({
      message: "Comment added",
      post,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
});
module.exports = router;
