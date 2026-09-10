import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CommentIcon from "@mui/icons-material/Comment";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import FlagIcon from "@mui/icons-material/Flag";
import PollIcon from "@mui/icons-material/Poll";
import API from "../services/api";
import CommentSection from "./CommentSection";
import { gradientFor } from "../utils/avatar";
import { timeAgo, pollTimeLeft } from "../utils/time";

const MAX_CHARS = 280;
const OPTION_LABELS = ["A", "B", "C", "D"];

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function PostCard({ post, onUpdate, onDelete, showComments = false }) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [expanded, setExpanded] = useState(false);
  const [likeAnim, setLikeAnim] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reported, setReported] = useState(false);
  const [now, setNow] = useState(0);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 30000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  const isOwnPost = currentUser?.username === post.username;
  // Total comment count including all nested replies / sub-replies
  const totalComments = (post.comments || []).reduce(
    (sum, c) => sum + 1 + (c.replies?.length || 0),
    0,
  );
  const isLiked = post.likes?.includes(currentUser?.username);
  const initial = post.username?.charAt(0).toUpperCase() || "U";
  const longText = (post.text || "").length > MAX_CHARS;
  const shownText =
    longText && !expanded
      ? `${post.text.slice(0, MAX_CHARS).trimEnd()}…`
      : post.text;

  // Avatar URL - use the stored Cloudinary URL directly
  const avatarUrl = post.avatar || null;

  const poll = post.poll;
  const pollEnded =
    !poll?.endsAt || (now > 0 && new Date(poll.endsAt).getTime() <= now);
  const myVote = poll?.options?.findIndex((opt) =>
    opt.votes?.includes(currentUser?.username),
  );
  const totalVotes =
    poll?.options?.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0;
  const voted = myVote !== undefined && myVote !== -1;

  async function handleLike() {
    if (!isLiked) setLikeAnim((n) => n + 1);
    try {
      const response = await API.post(`/posts/${post._id}/like`);
      onUpdate(response.data.post);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleVote(index) {
    try {
      const response = await API.post(`/posts/${post._id}/vote`, { index });
      onUpdate(response.data.post);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDelete() {
    try {
      await API.delete(`/posts/${post._id}`);
      onDelete(post._id);
    } catch (error) {
      console.error(error);
    }
  }

  function openComments() {
    navigate(`/post/${post._id}`);
  }

  return (
    <Card
      className="fade-up"
      sx={{
        mb: showComments ? 1 : 2.5,
        borderRadius: 4,
        overflow: "visible",
        "&:hover": { boxShadow: "0 8px 32px rgba(0,0,0,0.35)" },
      }}
    >
      <CardHeader
        sx={{ pt: 2.5, pb: 1.5, px: 2.5 }}
        avatar={
          <Avatar
            src={avatarError ? null : avatarUrl}
            sx={{
              width: 48,
              height: 48,
              fontSize: 18,
              background: gradientFor(post.username),
              cursor: "pointer",
            }}
            imgProps={{ onError: () => setAvatarError(true) }}
            onClick={() => navigate(`/profile/${post.username}`)}
          >
            {initial}
          </Avatar>
        }
        action={
          <IconButton
            size="small"
            onClick={(e) => {
              setMenuOpen(true);
              setMenuAnchor(e.currentTarget);
            }}
            title="More"
          >
            <MoreVertIcon />
          </IconButton>
        }
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, cursor: "pointer", fontSize: 15 }}
              onClick={() => navigate(`/profile/${post.username}`)}
            >
              {post.name || post.username}
            </Typography>
            {post.name && (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontSize: 13 }}
              >
                @{post.username}
              </Typography>
            )}
          </Box>
        }
        subheader={timeAgo(post.createdAt)}
      />

      <CardContent sx={{ py: 0.5, px: 2.5 }}>
        <Typography
          variant="body1"
          sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 15 }}
        >
          {shownText}
        </Typography>

        {longText && (
          <Button
            size="small"
            onClick={() => setExpanded((v) => !v)}
            sx={{ mt: 0.5, textTransform: "none" }}
          >
            {expanded ? "Show less" : "Read more"}
          </Button>
        )}

        {post.image && (
          <Box
            component="img"
            src={post.image}
            alt="post"
            sx={{
              mt: 1.5,
              width: "100%",
              maxHeight: 420,
              objectFit: "cover",
              borderRadius: 3,
              cursor: "pointer",
            }}
            onClick={() => window.open(post.image, "_blank")}
          />
        )}

        {poll?.question && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 3,
              background: "rgba(120,150,255,0.06)",
              border: "1px solid rgba(120,150,255,0.15)",
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
            >
              <PollIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {poll.question}
              </Typography>
            </Box>
            {poll.options?.map((opt, i) => {
              const percent = totalVotes
                ? Math.round((opt.votes?.length / totalVotes) * 100)
                : 0;
              const isMine = myVote === i;
              return (
                <Box
                  key={i}
                  onClick={() => !pollEnded && !voted && handleVote(i)}
                  sx={{
                    mb: 1,
                    p: 1.25,
                    borderRadius: 2,
                    cursor: pollEnded || voted ? "default" : "pointer",
                    border: isMine ? "1.5px solid" : "1.5px solid transparent",
                    borderColor: isMine ? "primary.main" : "transparent",
                    background: "rgba(255,255,255,0.03)",
                    "&:hover":
                      pollEnded || voted
                        ? {}
                        : { background: "rgba(120,150,255,0.1)" },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {OPTION_LABELS[i]}. {opt.text}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, color: "text.secondary" }}
                    >
                      {percent}%
                    </Typography>
                  </Box>
                  {(pollEnded || voted) && (
                    <LinearProgress
                      variant="determinate"
                      value={percent}
                      sx={{ height: 8, borderRadius: 4, mt: 0.25 }}
                      color={isMine ? "error" : "primary"}
                    />
                  )}
                  {isMine && (
                    <Typography
                      variant="caption"
                      sx={{ color: "primary.main", fontWeight: 600 }}
                    >
                      {pollEnded ? " · your vote" : ""}
                    </Typography>
                  )}
                </Box>
              );
            })}
            <Typography
              variant="caption"
              sx={{
                display: "block",
                textAlign: "right",
                mt: 0.75,
                color: pollEnded ? "text.disabled" : "success.main",
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {pollEnded
                ? "Poll ended"
                : `${totalVotes} vote${totalVotes === 1 ? "" : "s"} · ${pollTimeLeft(poll.endsAt)}`}
            </Typography>
          </Box>
        )}

        {reported && (
          <Typography
            variant="body2"
            sx={{
              color: "success.main",
              textAlign: "center",
              py: 0.5,
              fontSize: 12.5,
            }}
          >
            Thanks for reporting — we'll look into it.
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, py: 1 }}>
        <Box sx={{ position: "relative", display: "inline-flex" }}>
          {isLiked && likeAnim > 0 && (
            <FavoriteIcon
              key={likeAnim}
              className="heart-burst"
              sx={{
                color: "#ff3b5c",
                position: "absolute",
                inset: 0,
                zIndex: 1,
                pointerEvents: "none",
              }}
            />
          )}
          <IconButton
            key={isLiked ? `liked-${likeAnim}` : `plain-${likeAnim}`}
            className={isLiked && likeAnim > 0 ? "heart-pop" : undefined}
            size="small"
            sx={{ color: isLiked ? "#ff3b5c" : "text.secondary" }}
            onClick={handleLike}
            title="Like"
          >
            {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            <Typography component="span" sx={{ ml: 0.5 }}>
              {post.likes.length}
            </Typography>
          </IconButton>
        </Box>
        <IconButton
          size="small"
          sx={{ color: "text.secondary" }}
          onClick={openComments}
          title="Comment"
        >
          <CommentIcon />
          <Typography component="span" sx={{ ml: 0.5 }}>
            {totalComments}
          </Typography>
        </IconButton>
      </CardActions>

      {showComments && (
        <CardContent sx={{ pt: 0, pb: 1 }}>
          <CommentSection post={post} onComment={onUpdate} />
        </CardContent>
      )}

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogContent>Delete this post?</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      >
        {isOwnPost ? (
          <MenuItem
            onClick={() => {
              setMenuOpen(false);
              setConfirmDelete(true);
            }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete post
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              setMenuOpen(false);
              setReported(true);

              setTimeout(() => {
                setReported(false);
              }, 500);
            }}
          >
            <FlagIcon fontSize="small" sx={{ mr: 1 }} />
            Report post
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
}

export default PostCard;
