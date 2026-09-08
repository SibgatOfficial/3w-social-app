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

module.exports = router;
