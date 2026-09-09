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
import API from "../services/api";
import { timeAgo } from "../utils/time";
import { gradientFor } from "../utils/avatar";

// Highlights @mentions in blue with a small gap, so the tag and the
// actual message stay visually apart (Discord-style)
function renderWithMentions(text = "") {
  const parts = text.split(/(@[A-Za-z0-9_]+)/g);

  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <Typography
        key={i}
        component="span"
        sx={{ color: "primary.main", fontWeight: 600, mr: 0.5 }}
      >
        {part}
      </Typography>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

// Shared comment list + reply composer used in the feed and on the detail page
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
    <Box className="slide-open">
      {post.comments.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: "center" }}>
          No comments yet. Be the first!
        </Typography>
      )}

      {post.comments.map((item) => (
        <Box key={item._id} className="comment-item" sx={{ mb: 1.5 }}>
          {/* Comment */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
            <Avatar sx={{ width: 28, height: 28, fontSize: 12.5, background: gradientFor(item.username) }}>
              {item.username.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.3 }}>
                  {item.username}
                </Typography>

                <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 11.5 }}>
                  · {timeAgo(item.createdAt)}
                </Typography>

                <IconButton
                  size="small"
                  className="fluid-press"
                  title="Reply"
                  sx={{
                    ml: "auto",
                    p: "4px",
                    color: "text.secondary",
                    "&:hover": { color: "primary.main" },
                  }}
                  onClick={() => startReply(item)}
                >
                  <ReplyIcon fontSize="small" />
                </IconButton>
              </Box>

              <Typography variant="body2" sx={{ mt: 0.25, fontSize: 14, lineHeight: 1.5, color: "#c9cedf", whiteSpace: "pre-wrap" }}>
                {renderWithMentions(item.text)}
              </Typography>
            </Box>
          </Box>

          {/* Replies nested under their comment (tree) */}
          {item.replies?.length > 0 && (
            <Box
              sx={{
                mt: 1,
                ml: 1.5,
                pl: 2,
                borderLeft: "2px solid rgba(124,140,255,0.22)",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              {item.replies.map((reply) => (
                <Box key={reply._id} className="reply-item" sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: 12.5, background: gradientFor(reply.username) }}>
                    {reply.username.charAt(0).toUpperCase()}
                  </Avatar>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.2 }}>
                        {reply.username}
                      </Typography>

                      <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 11.5 }}>
                        · {timeAgo(reply.createdAt)}
                      </Typography>
                    </Box>

                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: 14, lineHeight: 1.5, color: "#c9cedf", whiteSpace: "pre-wrap" }}>
                      {renderWithMentions(reply.text)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      ))}

      <Divider sx={{ my: 1.25 }} />

      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
        <TextField
          size="small"
          fullWidth
          autoComplete="off"
          placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Add a comment..."}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": { borderRadius: 20 },
            "& fieldset": { borderColor: "rgba(120,150,255,0.25)" },
          }}
        />

        <IconButton type="submit" color="primary" title="Send" className="fluid-press">
          <SendIcon />
        </IconButton>
      </Box>

      {replyingTo && (
        <Button
          size="small"
          color="error"
          className="fluid-press"
          sx={{ mt: 0.5, textTransform: "none" }}
          onClick={() => {
            setReplyingTo(null);
            setComment("");
          }}
        >
          Cancel reply
        </Button>
      )}
    </Box>
  );
}

export default CommentSection;