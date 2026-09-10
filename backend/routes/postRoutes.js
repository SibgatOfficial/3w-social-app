const express = require("express");
const Post = require("../models/Post");
const protect = require("../middleware/authMiddleware");
const User = require("../models/User");
const router = express.Router();

// Search users and posts by query term
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) {
      return res.json({ users: [], posts: [] });
    }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");

    const users = await User.find({
      $or: [{ username: regex }, { name: regex }],
    })
      .limit(8)
      .select("username name avatar");

    const posts = await Post.find({
      $or: [{ text: regex }, { "poll.question": regex }],
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ users, posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { text, image, poll } = req.body;

    if (!text && !image && !poll) {
      return res.status(400).json({
        message: "Post must contain text, image or a poll",
      });
    }

    if (poll) {
      const optionCount = (poll.options || []).filter(
        (o) => o.text && o.text.trim(),
      ).length;

      if (!poll.question || !poll.question.trim()) {
        return res.status(400).json({ message: "Poll needs a question" });
      }

      if (optionCount < 2) {
        return res
          .status(400)
          .json({ message: "Poll needs at least 2 options" });
      }
    }

    const author = await User.findOne({ username: req.user.username });

    const post = await Post.create({
      username: req.user.username,
      name: author?.name || "",
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
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    const userFilter = req.query.user
      ? { username: req.query.user }
      : {};

    const posts = await Post.find(userFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments(userFilter);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

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

router.post("/:id/like", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
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
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/vote", protect, async (req, res) => {
  try {
    const { index } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!post.poll || !post.poll.options[index]) {
      return res.status(400).json({ message: "Invalid vote" });
    }

    const username = req.user.username;

    post.poll.options.forEach((opt, i) => {
      opt.votes = opt.votes.filter((u) => u !== username);
      if (i === index) {
        opt.votes.push(username);
      }
    });

    await post.save();

    res.json({ message: "Vote recorded", post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

const MAX_REPLY_LEVEL = 3;

// Compute the nesting level of a reply inside a comment's flat replies list.
// A direct reply to the comment is level 2; each nested reply increments by 1.
function replyLevel(replies, replyId) {
  const byId = {};
  replies.forEach((r) => {
    byId[r._id.toString()] = r;
  });
  let cur = byId[replyId.toString()];
  if (!cur) return 2;
  let level = 2;
  while (cur.parentId && byId[cur.parentId]) {
    level += 1;
    cur = byId[cur.parentId];
  }
  return level;
}

router.post("/:id/comments", protect, async (req, res) => {
  try {
    const { text, commentId, replyToId, replyTo } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const currentUser = await User.findOne({ username: req.user.username });

    if (commentId) {
      const comment = post.comments.id(commentId);

      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Attach reply, capping nesting at MAX_REPLY_LEVEL (3 levels total).
      let parentId = null;
      if (replyToId) {
        const parentReply = comment.replies.id(replyToId);
        if (!parentReply) {
          return res.status(404).json({ message: "Reply not found" });
        }
        const parentLevel = replyLevel(comment.replies, parentReply._id);
        if (parentLevel < MAX_REPLY_LEVEL) {
          parentId = parentReply._id;
        } else {
          // Already at max depth: show this as a sibling of the parent reply
          parentId = parentReply.parentId;
        }
      }

      comment.replies.push({
        username: req.user.username,
        name: currentUser?.name || "",
        avatar: currentUser?.avatar || "",
        text: text.trim(),
        replyTo:
          replyTo && replyTo !== req.user.username
            ? replyTo
            : comment.username,
        parentId,
      });
    } else {
      post.comments.push({
        username: req.user.username,
        name: currentUser?.name || "",
        avatar: currentUser?.avatar || "",
        text: text.trim(),
      });
    }

    await post.save();

    res.json({ message: "Comment added", post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id/comments/:commentId", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const commentId = req.params.commentId;
    let deletedComment = null;

    // Check top-level comments
    const topLevelIndex = post.comments.findIndex(
      (c) => c._id.toString() === commentId
    );
    if (topLevelIndex !== -1) {
      if (post.comments[topLevelIndex].username !== req.user.username) {
        return res
          .status(403)
          .json({ message: "You can only delete your own comments" });
      }
      deletedComment = post.comments[topLevelIndex];
      post.comments.splice(topLevelIndex, 1);
    } else {
      // Check replies inside each top-level comment
      for (const comment of post.comments) {
        const replyIndex = comment.replies.findIndex(
          (r) => r._id.toString() === commentId
        );
        if (replyIndex !== -1) {
          if (comment.replies[replyIndex].username !== req.user.username) {
            return res
              .status(403)
              .json({ message: "You can only delete your own replies" });
          }
          deletedComment = comment.replies[replyIndex];
          comment.replies.splice(replyIndex, 1);
          break;
        }
      }
    }

    if (!deletedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    await post.save();
    res.json({ message: "Comment deleted", post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:username/follow", protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    const targetUser = await User.findOne({ username: req.params.username });

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentUser.username === targetUser.username) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const alreadyFollowing = currentUser.following.includes(targetUser.username);

    if (alreadyFollowing) {
      currentUser.following = currentUser.following.filter(
        (username) => username !== targetUser.username,
      );
    } else {
      currentUser.following.push(targetUser.username);
    }

    await currentUser.save();

    res.json({ following: !alreadyFollowing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.username !== req.user.username) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
