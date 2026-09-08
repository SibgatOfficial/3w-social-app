const express = require("express");
const Post = require("../models/Post");
const protect = require("../middleware/authMiddleware");
const User = require("../models/User");
const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    const { text, image, poll } = req.body;

    if (!text && !image && !poll) {
      return res.status(400).json({
        message: "Post must contain text, image or a poll",
      });
    }

    // Resolve the author's avatar for the feed
    const author = await User.findOne({ username: req.user.username });

    const post = await Post.create({
      username: req.user.username,
      avatar: author?.avatar || "",
      text: text || "",
      image: image || "",
      poll: poll || undefined,
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

// GET ALL POSTS WITH PAGINATION
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments();

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
});

// GET SINGLE POST (for the detail page)
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ post });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Post not found" });
    }

    console.error(error);
    res.status(500).json({ message: "Server error" });
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

// VOTE ON A POLL
router.post("/:id/vote", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!post.poll || !post.poll.question) {
      return res.status(400).json({ message: "This post has no poll" });
    }

    if (post.poll.endsAt && post.poll.endsAt < new Date()) {
      return res.status(400).json({ message: "Poll has ended" });
    }

    const { optionIndex } = req.body;
    const option = post.poll.options[optionIndex];

    if (!option) {
      return res.status(400).json({ message: "Invalid poll option" });
    }

    const username = req.user.username;

    // One vote per user — remove them from any other option first
    for (const opt of post.poll.options) {
      if (opt.votes.includes(username)) {
        opt.votes = opt.votes.filter((u) => u !== username);
      }
    }

    if (!option.votes.includes(username)) {
      option.votes.push(username);
    }

    await post.save();

    res.json({ post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// REPORT A POST
router.post("/:id/report", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const username = req.user.username;

    if (!post.reports.includes(username)) {
      post.reports.push(username);
      await post.save();
    }

    res.json({ message: "Post reported" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ADD COMMENT
router.post("/:id/comments", protect, async (req, res) => {
  try {
    const { text, replyTo } = req.body;

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

    // Normal comment
    if (!replyTo) {
      post.comments.push({
        username: req.user.username,
        text: text.trim(),
      });
    } else {
      // Reply to an existing comment
      const comment = post.comments.id(replyTo);

      if (!comment) {
        return res.status(404).json({
          message: "Comment not found",
        });
      }

      comment.replies.push({
        username: req.user.username,
        text: text.trim(),
        replyTo: comment.username,
      });
    }

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

router.post("/:username/follow", protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    const targetUser = await User.findOne({
      username: req.params.username,
    });

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (currentUser.username === targetUser.username) {
      return res.status(400).json({
        message: "You cannot follow yourself",
      });
    }

    const alreadyFollowing = currentUser.following.includes(
      targetUser.username,
    );

    if (alreadyFollowing) {
      currentUser.following = currentUser.following.filter(
        (username) => username !== targetUser.username,
      );
    } else {
      currentUser.following.push(targetUser.username);
    }

    await currentUser.save();

    res.json({
      following: !alreadyFollowing,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (post.username !== req.user.username) {
      return res.status(403).json({
        message: "You can only delete your own posts",
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});
module.exports = router;
