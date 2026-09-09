const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Post = require("../models/Post");
const jwt = require("jsonwebtoken");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

router.get("/me", protect, (req, res) => {
  res.json({
    message: "You are authenticated",
    user: req.user,
  });
});

// Check username availability
router.get("/check-username/:username", async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username || username.length < 3) {
      return res.json({ available: false, message: "Username must be at least 3 characters" });
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.json({ available: false, message: "Only letters, numbers, and underscores allowed" });
    }
    
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    
    if (existingUser) {
      return res.json({ available: false, message: "Username is already taken" });
    }
    
    res.json({ available: true, message: "Username is available" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ available: false, message: "Server error" });
  }
});

// Update profile
router.put("/profile", protect, async (req, res) => {
  try {
    const { avatarUrl, name } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (avatarUrl !== undefined) {
      user.avatar = avatarUrl;
    }

    if (name !== undefined) {
      user.name = String(name).trim().slice(0, 40);
    }

    await user.save();

    // Update all posts by this user with new name and/or avatar
    const postUpdates = {};
    if (name !== undefined) postUpdates.name = user.name;
    if (avatarUrl !== undefined) postUpdates.avatar = user.avatar;

    if (Object.keys(postUpdates).length > 0) {
      // Update post documents by this user
      await Post.updateMany({ username: user.username }, { $set: postUpdates });

      // Update comments by this user in ALL posts (including other users' posts)
      const allPosts = await Post.find({
        $or: [
          { "comments.username": user.username },
          { "comments.replies.username": user.username },
        ],
      });

      for (const post of allPosts) {
        let modified = false;
        // Update top-level comments
        post.comments.forEach((comment) => {
          if (comment.username === user.username) {
            if (name !== undefined) comment.name = user.name;
            if (avatarUrl !== undefined) comment.avatar = user.avatar;
            modified = true;
          }
          // Update replies
          if (comment.replies && comment.replies.length > 0) {
            comment.replies.forEach((reply) => {
              if (reply.username === user.username) {
                if (name !== undefined) reply.name = user.name;
                if (avatarUrl !== undefined) reply.avatar = user.avatar;
                modified = true;
              }
            });
          }
        });
        if (modified) {
          await post.save();
        }
      }
    }

    res.json({
      message: "Profile updated",
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        name: user.name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// SIGNUP - no email needed
router.post("/signup", async (req, res) => {
  try {
    const { username, password, name, avatar } = req.body;

    // Validate required fields
    if (!username || !password || !name) {
      return res.status(400).json({
        message: "Username, password, and display name are required",
      });
    }

    // Validate username format
    if (username.length < 3) {
      return res.status(400).json({
        message: "Username must be at least 3 characters",
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        message: "Username can only contain letters, numbers, and underscores",
      });
    }

    // Validate display name is different from username
    if (name.trim().toLowerCase() === username.trim().toLowerCase()) {
      return res.status(400).json({
        message: "Display name must be different from username",
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return res.status(400).json({
        message: "Username already taken",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username: username.toLowerCase(),
      email: username.toLowerCase() + "@social.app", // auto-generate email
      password: hashedPassword,
      name: name.trim().slice(0, 40),
      avatar: avatar || "",
    });

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        name: user.name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN with username
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username: username?.toLowerCase() });

    if (!user) {
      return res.status(400).json({
        message: "Invalid username or password",
      });
    }

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid username or password",
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        name: user.name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
