import { useState } from "react";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import SendIcon from "@mui/icons-material/Send";
import ReplyIcon from "@mui/icons-material/Reply";
import API from "../services/api";
import { timeAgo } from "../utils/time";
import { gradientFor } from "../utils/avatar";

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

function CommentItem({ item, onReply, depth = 0 }) {
  const initial = item.username.charAt(0).toUpperCase();
  // Use the stored avatar URL directly (Cloudinary URL)
  const avatarUrl = item.avatar || null;

  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <AvatarWithFallback
        src={avatarUrl}
        sx={{
          width: depth === 0 ? 36 : 30,
          height: depth === 0 ? 36 : 30,
          fontSize: depth === 0 ? 14 : 12,
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
            <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 13 }}>
              @{item.username}
            </Typography>
          )}
          <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 12 }}>
            · {timeAgo(item.createdAt)}
          </Typography>
          {depth === 0 && (
            <IconButton
              size="small"
              title="Reply"
              sx={{ ml: "auto", p: "4px", color: "text.secondary", "&:hover": { color: "primary.main" } }}
              onClick={() => onReply(item)}
            >
              <ReplyIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
        <Typography variant="body2" sx={{ mt: 0.5, fontSize: 14, lineHeight: 1.6, color: "text.primary", whiteSpace: "pre-wrap" }}>
          {renderWithMentions(item.text)}
        </Typography>

        {/* Nested Replies */}
        {item.replies?.length > 0 && (
          <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {item.replies.map((reply) => (
              <CommentItem key={reply._id} item={reply} onReply={onReply} depth={depth + 1} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function CommentSection({ post, onComment }) {
  const [comment, setComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const response = await API.post(`/posts/${post._id}/comments`, {
        text: comment,
        replyTo: replyingTo?._id || null,
      });
      onComment(response.data.post);
      setComment("");
      setReplyingTo(null);
    } catch (error) {
      console.error(error);
    }
  }

  function startReply(item) {
    setReplyingTo(item);
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
        Comments {post.comments?.length > 0 && `(${post.comments.length})`}
      </Typography>

      {post.comments.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center", fontSize: 14 }}>
          No comments yet. Be the first to comment!
        </Typography>
      )}

      {/* Comment List */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {post.comments.map((item) => (
          <CommentItem key={item._id} item={item} onReply={startReply} depth={0} />
        ))}
      </Box>

      {/* Comment Input */}
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 3, pt: 2, borderTop: "1px solid rgba(120,150,255,0.1)" }}>
        <TextField
          size="small"
          fullWidth
          autoComplete="off"
          placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Write a comment..."}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": { borderRadius: 20, fontSize: 14 },
            "& fieldset": { borderColor: "rgba(120,150,255,0.2)" },
          }}
        />
        <IconButton type="submit" color="primary" title="Send" sx={{ p: 1 }}>
          <SendIcon />
        </IconButton>
      </Box>

      {replyingTo && (
        <Button size="small" color="error" sx={{ mt: 1, textTransform: "none", fontSize: 12 }} onClick={() => { setReplyingTo(null); setComment(""); }}>
          Cancel reply
        </Button>
      )}
    </Paper>
  );
}

export default CommentSection;
