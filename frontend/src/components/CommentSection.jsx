import { Fragment, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import SendIcon from "@mui/icons-material/Send";
import ReplyIcon from "@mui/icons-material/Reply";
import DeleteIcon from "@mui/icons-material/Delete";
import API from "../services/api";
import { timeAgo } from "../utils/time";
import { gradientFor } from "../utils/avatar";

const SHOW_LIMIT = 10;

function AvatarWithFallback({ src, sx, children, ...props }) {
  const [error, setError] = useState(false);
  return (
    <Avatar
      src={error ? null : src}
      sx={{ ...sx, background: error ? sx?.background : undefined }}
      imgProps={{ onError: () => setError(true) }}
      {...props}
    >
      {children}
    </Avatar>
  );
}

function renderWithMentions(text = "") {
  const parts = text.split(/(@[A-Za-z0-9_]+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <Typography key={i} component="span" sx={{ color: "primary.main", fontWeight: 600 }}>
        {part}
      </Typography>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

// Build a nested tree from the flat replies array (each reply stores parentId)
function buildReplyTree(replies = []) {
  const nodes = {};
  replies.forEach((r) => {
    nodes[r._id] = { ...r, children: [] };
  });
  const roots = [];
  replies.forEach((r) => {
    const parent = r.parentId ? nodes[r.parentId] : null;
    if (parent && r.parentId !== r._id) parent.children.push(nodes[r._id]);
    else roots.push(nodes[r._id]);
  });
  return roots;
}

function CommentItem({ item, isReply, currentUser, onReply, onDeleteComment }) {
  const initial = item.username.charAt(0).toUpperCase();
  const avatarUrl = item.avatar || null;
  const isOwner = currentUser?.username === item.username;

  return (
    <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
      <AvatarWithFallback
        src={avatarUrl}
        sx={{
          width: isReply ? 28 : 36,
          height: isReply ? 28 : 36,
          fontSize: isReply ? 10.5 : 14,
          background: gradientFor(item.username),
          flexShrink: 0,
        }}
      >
        {initial}
      </AvatarWithFallback>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13.5 }}>
            {item.name || item.username}
          </Typography>
          {item.name && (
            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 12 }}>
              @{item.username}
            </Typography>
          )}
          <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 11.5 }}>
            · {timeAgo(item.createdAt)}
          </Typography>

          <Box sx={{ ml: "auto", display: "flex", gap: 0.15, alignItems: "center" }}>
            {isOwner && (
              <IconButton
                size="small"
                title="Delete"
                sx={{ p: 0.4, color: "text.disabled", "&:hover": { color: "error.main" } }}
                onClick={() => onDeleteComment(item._id)}
              >
                <DeleteIcon sx={{ fontSize: 15 }} />
              </IconButton>
            )}
            <IconButton
              size="small"
              title="Reply"
              sx={{ p: 0.4, color: "text.disabled", "&:hover": { color: "primary.main" } }}
              onClick={onReply}
            >
              <ReplyIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Box>
        </Box>

        {isReply && item.replyTo && (
          <Typography variant="caption" sx={{ display: "block", mt: 0.15, fontSize: 12, color: "text.secondary" }}>
            Replying to{" "}
            <Box component="span" sx={{ color: "primary.main", fontWeight: 600 }}>
              @{item.replyTo}
            </Box>
          </Typography>
        )}

        <Typography
          variant="body2"
          sx={{
            mt: isReply ? 0.15 : 0.3,
            fontSize: 14,
            lineHeight: 1.5,
            color: "text.primary",
            whiteSpace: "pre-wrap",
          }}
        >
          {renderWithMentions(item.text)}
        </Typography>
      </Box>
    </Box>
  );
}

function CommentSection({ post, onComment }) {
  const [comment, setComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  const [replyToId, setReplyToId] = useState(null);
  const [sending, setSending] = useState(false);
  const [showAll, setShowAll] = useState(false);

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }

  const currentUser = getCurrentUser();

  const totalCommentCount = (post.comments || []).reduce(
    (sum, c) => sum + 1 + (c.replies?.length || 0),
    0,
  );

  const hasMore = post.comments.length > SHOW_LIMIT;
  const visibleComments = showAll ? post.comments : post.comments.slice(0, SHOW_LIMIT);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!comment.trim() || sending) return;
    try {
      setSending(true);
      const response = await API.post(`/posts/${post._id}/comments`, {
        text: comment,
        commentId: replyingTo ? replyToCommentId : null,
        replyToId: replyingTo ? replyToId : null,
        replyTo: replyingTo ? replyingTo.username : null,
      });
      onComment(response.data.post);
      setComment("");
      setReplyingTo(null);
      setReplyToCommentId(null);
      setReplyToId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      const response = await API.delete(`/posts/${post._id}/comments/${commentId}`);
      onComment(response.data.post);
    } catch (error) {
      console.error(error);
    }
  }

  function startReply(item, parentCommentId, parentReplyId) {
    setReplyingTo(item);
    setReplyToCommentId(parentCommentId);
    setReplyToId(parentReplyId || null);
    setComment(`@${item.username} `);
  }

  // Recursively render a reply thread with a left connector line for nesting
  function renderThread(nodes, depth, parentCommentId) {
    return nodes.map((node) => (
      <Fragment key={node._id}>
        <CommentItem
          item={node}
          isReply
          currentUser={currentUser}
          onReply={() => startReply(node, parentCommentId, node._id)}
          onDeleteComment={handleDeleteComment}
        />
        {node.children.length > 0 && (
          <Box sx={{ pl: 3, mt: 0.5, borderLeft: "2px solid rgba(120,150,255,0.18)" }}>
            {renderThread(node.children, depth + 1, parentCommentId)}
          </Box>
        )}
      </Fragment>
    ));
  }

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2,
        p: 3,
        borderRadius: 3,
        background: "rgba(120,150,255,0.04)",
        border: "1px solid rgba(120,150,255,0.12)",
      }}
    >
      {/* Comments Header */}
      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>
        Comments {totalCommentCount > 0 && `(${totalCommentCount})`}
      </Typography>

      {post.comments.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center", fontSize: 14 }}>
          No comments yet. Be the first to comment!
        </Typography>
      )}

      {/* Comment List */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
        {visibleComments.map((comment) => {
          const tree = buildReplyTree(comment.replies);
          return (
            <Fragment key={comment._id}>
              <CommentItem
                item={comment}
                currentUser={currentUser}
                onReply={() => startReply(comment, comment._id, null)}
                onDeleteComment={handleDeleteComment}
              />
              {tree.length > 0 && (
                <Box sx={{ pl: 3, mt: 0.5, borderLeft: "2px solid rgba(120,150,255,0.18)" }}>
                  {renderThread(tree, 1, comment._id)}
                </Box>
              )}
            </Fragment>
          );
        })}
      </Box>

      {/* Show more / less */}
      {hasMore && (
        <Button
          size="small"
          color="primary"
          sx={{ mt: 1.5, textTransform: "none", fontSize: 13 }}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll
            ? "Show less comments"
            : `Show more comments (${post.comments.length - SHOW_LIMIT} more)`}
        </Button>
      )}

      {/* Comment Input */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mt: 3,
          pt: 2,
          borderTop: "1px solid rgba(120,150,255,0.1)",
        }}
      >
        <TextField
          size="small"
          fullWidth
          autoComplete="off"
          disabled={sending}
          placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Write a comment..."}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": { borderRadius: 20, fontSize: 14 },
            "& fieldset": { borderColor: "rgba(120,150,255,0.2)" },
          }}
        />
        <IconButton
          type="submit"
          color="primary"
          title="Send"
          sx={{ p: 1 }}
          disabled={sending}
        >
          <SendIcon />
        </IconButton>
      </Box>

      {replyingTo && (
        <Button
          size="small"
          color="error"
          sx={{ mt: 1, textTransform: "none", fontSize: 12 }}
          onClick={() => {
            setReplyingTo(null);
            setReplyToCommentId(null);
            setReplyToId(null);
            setComment("");
          }}
        >
          Cancel reply
        </Button>
      )}
    </Paper>
  );
}

export default CommentSection;
