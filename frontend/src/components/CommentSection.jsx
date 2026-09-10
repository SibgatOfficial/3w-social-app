import { Fragment, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import SendIcon from "@mui/icons-material/Send";
import ReplyIcon from "@mui/icons-material/Reply";
import DeleteIcon from "@mui/icons-material/Delete";
import API from "../services/api";
import { timeAgo } from "../utils/time";
import { gradientFor } from "../utils/avatar";

const SHOW_LIMIT = 10; // top-level comments per page
const REPLY_BATCH = 10; // replies loaded at a time per expanded comment
const MAX_DEPTH = 3;

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

// Recursively count every reply in a reply tree (including all sub-replies)
function countReplies(nodes) {
  return nodes.reduce((sum, node) => sum + 1 + countReplies(node.children || []), 0);
}

function CommentItem({ item, depth, currentUser, onReply, onRequestDelete, expandControl }) {
  const initial = item.username.charAt(0).toUpperCase();
  const avatarUrl = item.avatar || null;
  const isOwner = currentUser?.username === item.username;
  const isReply = depth > 1;

  return (
    <Box
      sx={{
        display: "flex",
        gap: { xs: 1, sm: 1.25 },
        alignItems: "flex-start",
        p: { xs: 0.75, sm: 1.25 },
        borderRadius: { xs: 1.5, sm: 2.5 },
        background: "rgba(120,150,255,0.055)",
        "&:hover": { background: "rgba(120,150,255,0.09)" },
        transition: "background 0.15s ease",
      }}
    >
      <AvatarWithFallback
        src={avatarUrl}
        sx={{
          width: isReply ? { xs: 26, sm: 34 } : { xs: 32, sm: 40 },
          height: isReply ? { xs: 26, sm: 34 } : { xs: 32, sm: 40 },
          fontSize: isReply ? { xs: 10, sm: 12 } : { xs: 13, sm: 15 },
          background: gradientFor(item.username),
          flexShrink: 0,
        }}
      >
        {initial}
      </AvatarWithFallback>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 15 }}>
            {item.name || item.username}
          </Typography>
          {item.name && (
            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 12.5 }}>
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
                sx={{ p: 0.4, color: "text.disabled", "&:hover": { color: "error.main", bgcolor: "rgba(244,67,54,0.08)" } }}
                onClick={() => onRequestDelete(item)}
              >
                <DeleteIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            <IconButton
              size="small"
              title="Reply"
              sx={{ p: 0.4, color: "text.disabled", "&:hover": { color: "primary.main", bgcolor: "rgba(120,150,255,0.1)" } }}
              onClick={onReply}
            >
              <ReplyIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {isReply && item.replyTo && (
          <Typography variant="caption" sx={{ display: "block", mt: 0.2, fontSize: 12.5, color: "text.secondary" }}>
            Replying to{" "}
            <Box component="span" sx={{ color: "primary.main", fontWeight: 600 }}>
              @{item.replyTo}
            </Box>
          </Typography>
        )}

        <Typography
          variant="body2"
          sx={{
            mt: { xs: 0.25, sm: 0.35 },
            fontSize: { xs: 14, sm: 15 },
            lineHeight: 1.6,
            color: "text.primary",
            whiteSpace: "pre-wrap",
          }}
        >
          {renderWithMentions(item.text)}
        </Typography>

        {expandControl && (
          <Box sx={{ mt: 0.5, display: "flex", alignItems: "center" }}>
            {expandControl}
          </Box>
        )}
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
  const [confirmDelete, setConfirmDelete] = useState(null);
  // expand = map commentId -> true/false (replies visible)
  const [expanded, setExpanded] = useState({});
  // replyPage = map commentId -> how many reply roots are shown
  const [replyPage, setReplyPage] = useState({});

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

  // Toggle replies for a comment
  function toggleReplies(commentId) {
    setExpanded((prev) => {
      const next = { ...prev, [commentId]: !prev[commentId] };
      return next;
    });
  }

  // Load another REPLY_BATCH of reply roots for a comment
  function loadMoreReplies(commentId) {
    setReplyPage((prev) => ({ ...prev, [commentId]: (prev[commentId] || 1) + 1 }));
  }

  // Recursively render a reply thread; cap depth at MAX_DEPTH, deeper as siblings.
  const renderThread = (nodes, depth, parentCommentId) =>
    nodes.map((node) => (
      <Fragment key={node._id}>
        <CommentItem
          item={node}
          depth={depth}
          currentUser={currentUser}
          onReply={() => startReply(node, parentCommentId, node._id)}
          onRequestDelete={setConfirmDelete}
        />
        {node.children.length > 0 && depth < MAX_DEPTH && (
          <Box sx={{ pl: { xs: 1.25, sm: 2.5 }, mt: 0.6, borderLeft: "2px solid rgba(120,150,255,0.18)" }}>
            {renderThread(node.children, depth + 1, parentCommentId)}
          </Box>
        )}
        {/* Drop deeper-than-max children flat at the max visible level */}
        {node.children.length > 0 && depth >= MAX_DEPTH && (
          <Box sx={{ mt: 0.6, pl: 2.5, borderLeft: "2px solid rgba(120,150,255,0.18)" }}>
            {renderThread(node.children, MAX_DEPTH, parentCommentId)}
          </Box>
        )}
      </Fragment>
    ));

  return (
    <Paper
      elevation={0}
      sx={{
        mt: { xs: 1.5, sm: 2 },
        p: { xs: 1.25, sm: 3 },
        borderRadius: { xs: 2, sm: 3 },
        background: "rgba(120,150,255,0.04)",
        border: "1px solid rgba(120,150,255,0.12)",
      }}
    >
      {/* Comments Header */}
      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 17, mb: 2 }}>
        Comments {totalCommentCount > 0 && `(${totalCommentCount})`}
      </Typography>

      {post.comments.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center", fontSize: 14 }}>
          No comments yet. Be the first to comment!
        </Typography>
      )}

      {/* Comment List */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1, sm: 1.5 } }}>
        {visibleComments.map((comment) => {
          const tree = buildReplyTree(comment.replies);
          const isOpen = !!expanded[comment._id];
          const perPage = replyPage[comment._id] || 1;
          const visibleRoots = tree.slice(0, perPage * REPLY_BATCH);
          const hiddenRoots = tree.length - visibleRoots.length;

          return (
            <Fragment key={comment._id}>
              <CommentItem
                item={comment}
                depth={1}
                currentUser={currentUser}
                onReply={() => startReply(comment, comment._id, null)}
                onRequestDelete={setConfirmDelete}
                expandControl={
                  tree.length > 0 ? (
                    <Button
                      size="small"
                      sx={{
                        minWidth: 0,
                        px: 0.75,
                        py: 0.25,
                        textTransform: "none",
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: "primary.main",
                        "&:hover": { bgcolor: "rgba(120,150,255,0.1)" },
                      }}
                      onClick={() => toggleReplies(comment._id)}
                    >
                      {isOpen
                        ? `Hide replies (${countReplies(tree)})`
                        : `Show replies (${countReplies(tree)})`}
                    </Button>
                  ) : null
                }
              />

              {isOpen && (
                <Box sx={{ pl: { xs: 1.25, sm: 2.5 }, mt: 0.6, borderLeft: "2px solid rgba(120,150,255,0.18)" }}>
                  {renderThread(visibleRoots, 2, comment._id)}

                  {hiddenRoots > 0 && (
                    <Button
                      size="small"
                      sx={{ ml: 1, mt: 0.5, textTransform: "none", fontSize: 13, fontWeight: 600, color: "primary.main" }}
                      onClick={() => loadMoreReplies(comment._id)}
                    >
                      Show more replies ({hiddenRoots})
                    </Button>
                  )}
                </Box>
              )}
            </Fragment>
          );
        })}
      </Box>

      {/* Show more / less comments */}
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
        sx={{ display: "flex", alignItems: "center", gap: 1.25, mt: 2.5, pt: 2, borderTop: "1px solid rgba(120,150,255,0.1)" }}
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
        <IconButton type="submit" color="primary" title="Send" sx={{ p: 1 }} disabled={sending}>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>
          Delete {confirmDelete && (confirmDelete.username === currentUser?.username ? "your" : "this")} comment?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setConfirmDelete(null)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            sx={{ textTransform: "none" }}
            onClick={() => {
              if (confirmDelete) handleDeleteComment(confirmDelete._id);
              setConfirmDelete(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default CommentSection;
