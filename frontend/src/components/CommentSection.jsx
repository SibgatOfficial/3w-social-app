import { useState } from "react";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import SendIcon from "@mui/icons-material/Send";
import ReplyIcon from "@mui/icons-material/Reply";
import CommentIcon from "@mui/icons-material/Comment";
import API from "../services/api";
import { timeAgo } from "../utils/time";
import { gradientFor } from "../utils/avatar";

function renderWithMentions(text = "") {
  const parts = text.split(/(@[A-Za-z0-9_]+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <Typography key={i} component="span" sx={{ color: "primary.main", fontWeight: 600, mr: 0.5 }}>
        {part}
      </Typography>
    ) : (
      <span key={i}>{part}</span>
    ),
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
    <Box
      sx={{
        mt: 2,
        p: 2.5,
        borderRadius: 3,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(120,150,255,0.1)",
      }}
    >
      {/* Comments Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <CommentIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 14 }}>
          Comments {post.comments?.length > 0 && `(${post.comments.length})`}
        </Typography>
      </Box>

      {post.comments.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center", fontSize: 13 }}>
          No comments yet. Be the first to comment!
        </Typography>
      )}

      {/* Comment List */}
      {post.comments.map((item) => (
        <Box key={item._id} sx={{ mb: 2.5, pb: 2.5, borderBottom: item.replies?.length > 0 ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <Avatar
              src={item.avatar}
              sx={{ width: 32, height: 32, fontSize: 13, background: gradientFor(item.username), flexShrink: 0 }}
            >
              {item.username.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13.5 }}>
                  {item.name || item.username}
                </Typography>
                {item.name && (
                  <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 11 }}>
                    @{item.username}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 11 }}>
                  · {timeAgo(item.createdAt)}
                </Typography>
                <IconButton
                  size="small"
                  title="Reply"
                  sx={{ ml: "auto", p: "4px", color: "text.secondary", "&:hover": { color: "primary.main" } }}
                  onClick={() => startReply(item)}
                >
                  <ReplyIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body2" sx={{ mt: 0.5, fontSize: 13.5, lineHeight: 1.6, color: "#c9cedf", whiteSpace: "pre-wrap" }}>
                {renderWithMentions(item.text)}
              </Typography>
            </Box>
          </Box>

          {/* Replies */}
          {item.replies?.length > 0 && (
            <Box sx={{ mt: 1.5, ml: 1, pl: 2.5, borderLeft: "2px solid rgba(124,140,255,0.2)", display: "flex", flexDirection: "column", gap: 1.5 }}>
              {item.replies.map((reply) => (
                <Box key={reply._id} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                  <Avatar
                    src={reply.avatar}
                    sx={{ width: 28, height: 28, fontSize: 12, background: gradientFor(reply.username), flexShrink: 0 }}
                  >
                    {reply.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                        {reply.name || reply.username}
                      </Typography>
                      {reply.name && (
                        <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 10.5 }}>
                          @{reply.username}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 10.5 }}>
                        · {timeAgo(reply.createdAt)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mt: 0.5, fontSize: 13, lineHeight: 1.5, color: "#c9cedf", whiteSpace: "pre-wrap" }}>
                      {renderWithMentions(reply.text)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      ))}

      <Divider sx={{ my: 2 }} />

      {/* Comment Input */}
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <TextField
          size="small"
          fullWidth
          autoComplete="off"
          placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Write a comment..."}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": { borderRadius: 20, fontSize: 13.5 },
            "& fieldset": { borderColor: "rgba(120,150,255,0.2)" },
          }}
        />
        <IconButton type="submit" color="primary" title="Send" sx={{ p: 1 }}>
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>

      {replyingTo && (
        <Button size="small" color="error" sx={{ mt: 1, textTransform: "none", fontSize: 12 }} onClick={() => { setReplyingTo(null); setComment(""); }}>
          Cancel reply
        </Button>
      )}
    </Box>
  );
}

export default CommentSection;
