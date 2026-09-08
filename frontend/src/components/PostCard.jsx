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

  // Live clock — keeps poll countdowns ticking without any interaction
  const [now, setNow] = useState(0);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0); // initial tick (async)
    const timer = setInterval(tick, 30000); // keep countdowns live
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  const isOwnPost = currentUser?.username === post.username;
  const isLiked = post.likes?.includes(currentUser?.username);
  const initial = post.username?.charAt(0).toUpperCase() || "U";
  const longText = (post.text || "").length > MAX_CHARS;
  const shownText = longText && !expanded
    ? `${post.text.slice(0, MAX_CHARS).trimEnd()}…`
    : post.text;

  // ---- Poll helpers ----
  const poll = post.poll;
  const pollEnded =
    !poll?.endsAt || (now > 0 && new Date(poll.endsAt).getTime() <= now);
  const myVote = poll?.options?.findIndex(
    (opt) => opt.votes?.includes(currentUser?.username),
  );
  const totalVotes =
    poll?.options?.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) ||
    0;
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
      const response = await API.post(`/posts/${post._id}/vote`, {
        optionIndex: index,
      });
      onUpdate(response.data.post);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleReport() {
    setMenuOpen(false);
    try {
      await API.post(`/posts/${post._id}/report`);
      setReported(true);
      setTimeout(() => setReported(false), 2600);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDelete() {
    setMenuOpen(false);
    setConfirmDelete(false);
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
    <Card className="hover-lift" variant="outlined" sx={{ mb: 2, borderRadius: 3 }}>
      <CardHeader
        avatar={
          post.avatar ? (
            <Avatar src={post.avatar} sx={{ width: 40, height: 40 }} />
          ) : (
            <Avatar sx={{ background: gradientFor(post.username) }}>{initial}</Avatar>
          )
        }
        title={post.username}
        subheader={`@${post.username} · ${timeAgo(post.createdAt)}`}
        action={
          <IconButton
            title="More"
            onClick={(e) => {
              setMenuAnchor(e.currentTarget);
              setMenuOpen(true);
            }}
          >
            <MoreVertIcon />
          </IconButton>
        }
      />

      <Menu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorEl={menuAnchor}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {isOwnPost && (
          <MenuItem dense onClick={() => setConfirmDelete(true)}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
          </MenuItem>
        )}
        <MenuItem dense onClick={handleReport}>
          <FlagIcon fontSize="small" sx={{ mr: 1 }} /> Report
        </MenuItem>
      </Menu>
      {post.text && (
        <CardContent sx={{ py: 1 }}>
          <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
            {shownText}
          </Typography>

          {longText && (
            <Button
              size="small"
              className="fluid-press"
              sx={{
                p: "2px 8px",
                minWidth: 0,
                fontSize: 12.5,
                fontWeight: 600,
                textTransform: "none",
                color: "primary.main",
              }}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Read less" : "Read more"}
            </Button>
          )}
        </CardContent>
      )}

      {post.image && (
        <Box
          component="img"
          src={post.image}
          alt="Post"
          sx={{
            width: "100%",
            maxHeight: 600,
            objectFit: "contain",
            borderRadius: 3,
            display: "block",
            bgcolor: "#0a0f22",
          }}
        />
      )}

      {poll?.question && (
        <Box
          className="poll-box"
          sx={{
            bgcolor: "rgba(120,150,255,0.07)",
            borderRadius: 2,
            p: 1.5,
            mx: 1.5,
            mt: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PollIcon sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
              {poll.question}
            </Typography>
          </Box>

          {poll.options.map((option, i) => {
            const votes = option.votes?.length || 0;
            const percent = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
            const isMine = i === myVote;
            const interactive = !pollEnded && !voted;

            return (
              <Box
                key={i}
                className="poll-option"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mt: 1,
                  p: 0.75,
                  borderRadius: 2,
                  border: "1px solid rgba(120,150,255,0.2)",
                  cursor: interactive ? "pointer" : "default",
                  "&:hover": interactive
                    ? { bgcolor: "rgba(120,150,255,0.12)", borderColor: "primary.main" }
                    : {},
                  bgcolor: isMine ? "rgba(255,80,120,0.12)" : "transparent",
                }}
                onClick={() => interactive && handleVote(i)}
              >
                <Typography sx={{ minWidth: 28, color: "text.secondary", fontSize: 13.5 }}>
                  {OPTION_LABELS[i]}
                </Typography>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ fontSize: 14, fontWeight: isMine ? 700 : 500 }}>
                      {option.text}
                    </Typography>

                    {pollEnded || voted ? (
                      <Typography sx={{ color: "text.secondary", fontSize: 12.5 }}>
                        {percent}%{isMine ? " · your vote" : ""}
                      </Typography>
                    ) : null}
                  </Box>

                  {(pollEnded || voted) && (
                    <LinearProgress
                      variant="determinate"
                      value={percent}
                      sx={{ height: 8, borderRadius: 4, mt: 0.25 }}
                      color={isMine ? "error" : "primary"}
                    />
                  )}
                </Box>
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
            {pollEnded ? "Poll ended" : `${totalVotes} vote${totalVotes === 1 ? "" : "s"} · ${pollTimeLeft(poll.endsAt)}`}
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
          className="fluid-press"
          sx={{ color: "text.secondary" }}
          onClick={openComments}
          title="Comment"
        >
          <CommentIcon />
          <Typography component="span" sx={{ ml: 0.5 }}>
            {post.comments.length}
          </Typography>
        </IconButton>
      </CardActions>

      {showComments && (
        <CardContent sx={{ pt: 0.5, pb: 1.5 }}>
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
    </Card>
  );
}

export default PostCard;