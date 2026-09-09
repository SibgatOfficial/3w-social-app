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

// Avatar image component with error handling
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

function CommentItem({ item, isReply, currentUser, onReply, onDeleteComment }) {
  const initial = item.username.charAt(0).toUpperCase();
  const avatarUrl = item.avatar || null;
  const isOwner = currentUser?.username === item.username;

  return (
    <Box
      sx={{
        mb: 1.5,
        p: 1.25,
        borderRadius: 2.25,
        background: isReply ? "rgba(120,150,255,0.035)" : "rgba(120,150,255,0.055)",
        border: isReply ? "1px solid rgba(120,150,255,0.09)" : "1px solid rgba(120,150,255,0.14)",
      }}
    >
      <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
        <AvatarWithFallback
          src={avatarUrl}
          sx={{
            width: isReply ? 30 : 36,
            height: isReply ? 30 : 36,
            fontSize: isReply ? 12 : 14,
            background: gradientFor(item.username),
            flexShrink: 0,
          }}
        >
          {initial}
        </AvatarWithFallback>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="body1" sx={{ fontWeight: 700, fontSize: 14 }}>
              {item.name || item.username}
            </Typography>
            {item.name && (
              <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 12.5 }}>
                @{item.username}
              </Typography>
            )}
            <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 12 }}>
              · {timeAgo(item.createdAt)}
            </Typography>

            <Box sx={{ ml: "auto", display: "flex", gap: 0.25, alignItems: "center" }}>
              {isOwner && (
                <IconButton
                  size="small"
                  title="Delete"
                  sx={{ p: 0.5, color: "text.secondary", "&:hover": { color: "error.main" } }}
                  onClick={() => onDeleteComment(item._id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton
                size="small"
                title="Reply"
                sx={{ p: 0.5, color: "text.secondary", "&:hover": { color: "primary.main" } }}
                onClick={onReply}
              >
                <ReplyIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {isReply && item.replyTo && (
            <Typography variant="body2" sx={{ mt: 0.5, fontSize: 12.5, color: "text.secondary" }}>
              Replying to{" "}
              <Box component="span" sx={{ color: "primary.main", fontWeight: 600 }}>
                @{item.replyTo}
              </Box>
            </Typography>
          )}

          <Typography
            variant="body2"
            sx={{
              mt: isReply ? 0.5 : 1,
              fontSize: 14,
              lineHeight: 1.6,
              color: "text.primary",
              whiteSpace: "pre-wrap",
            }}
          >
            {renderWithMentions(item.text)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function CommentSection({ post, onComment }) {
  const [comment, setComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyToCommentId, setReplyToCommentId] = useState(null);
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
        replyTo: replyingTo ? replyingTo.username : null,
      });
      onComment(response.data.post);
      setComment("");
      setReplyingTo(null);
      setReplyToCommentId(null);
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

  function startReply(item) {
    setReplyingTo(item);
    setReplyToCommentId(item._topCommentId);
    setComment(`@${item.username} `);
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
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {visibleComments.map((item) => (
          <Fragment key={item._id}>
            <CommentItem
              item={item}
              currentUser={currentUser}
              onReply={() => startReply({ ...item, _topCommentId: item._id })}
              onDeleteComment={handleDeleteComment}
            />

            {item.replies?.length > 0 && item.replies.map((reply) => (
              <CommentItem
                key={reply._id}
                item={reply}
                isReply
                currentUser={currentUser}
                onReply={() => startReply({ ...reply, _topCommentId: item._id })}
                onDeleteComment={handleDeleteComment}
              />
            ))}
          </Fragment>
        ))}
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