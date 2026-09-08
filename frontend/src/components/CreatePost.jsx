import { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SendIcon from "@mui/icons-material/Send";
import PollIcon from "@mui/icons-material/Poll";
import AddIcon from "@mui/icons-material/Add";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import API from "../services/api";
import { uploadImage } from "../services/upload";

const DURATIONS = [
  { label: "24 hours", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
];

function CreatePost({ onPostCreated }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const [pollMode, setPollMode] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState(24);

  async function handleSubmit() {
    if (pollMode) {
      const cleanOptions = pollOptions.map((o) => o.trim()).filter(Boolean);

      if (!text.trim()) {
        setMessage("Ask a question for your poll.");
        return;
      }

      if (cleanOptions.length < 2) {
        setMessage("Add at least 2 poll options.");
        return;
      }
    } else if (!text.trim() && !image) {
      setMessage("Write something or select an image.");
      return;
    }

    try {
      setUploading(true);
      setMessage("");

      const imageUrl = image ? await uploadImage(image) : "";

      // In poll mode the main text field IS the question (no duplicate caption)
      const poll = pollMode
        ? {
            question: text.trim(),
            options: pollOptions
              .map((o) => o.trim())
              .filter(Boolean)
              .map((o) => ({ text: o })),
            endsAt: new Date(Date.now() + pollDuration * 3600000),
          }
        : null;

      await API.post("/posts", {
        text: pollMode ? "" : text,
        image: imageUrl,
        poll,
      });

      setText("");
      setImage(null);
      setPollMode(false);
      setPollOptions(["", ""]);
      setPollDuration(24);
      onPostCreated();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Failed to create post",
      );
    } finally {
      setUploading(false);
    }
  }

  function setOption(index, value) {
    const next = [...pollOptions];
    next[index] = value;
    setPollOptions(next);
  }

  function togglePoll() {
    setPollMode(!pollMode);
    setMessage(""); // clear any old error when switching modes
  }

  return (
    <Card
      className="hover-lift"
      variant="outlined"
      sx={{ mb: 2, borderRadius: 3 }}
    >
      <CardContent>
        <TextField
          multiline
          minRows={3}
          fullWidth
          placeholder={
            pollMode
              ? "Ask a question... (this becomes your poll question)"
              : "What's on your mind? share something nice"
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "24px" } }}
        />

        {pollMode && (
          <Box
            className="slide-open"
            sx={{
              mt: 1.5,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "rgba(120,150,255,0.07)",
            }}
          >
            {pollOptions.map((option, i) => (
              <TextField
                key={i}
                size="small"
                fullWidth
                sx={{ mt: 1, "& .MuiOutlinedInput-root": { borderRadius: 20 } }}
                value={option}
                onChange={(e) => setOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
              />
            ))}

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
              <Button
                size="small"
                className="fluid-press"
                startIcon={<AddIcon />}
                disabled={pollOptions.length >= 4}
                onClick={() => setPollOptions([...pollOptions, ""])}
              >
                Add option
              </Button>

              {pollOptions.length > 2 && (
                <IconButton
                  size="small"
                  title="Remove option"
                  onClick={() => setPollOptions(pollOptions.slice(0, -1))}
                >
                  <RemoveCircleIcon />
                </IconButton>
              )}
            </Box>

            <TextField
              select
              size="small"
              fullWidth
              label="Poll duration"
              sx={{ mt: 1, "& .MuiOutlinedInput-root": { borderRadius: 20 } }}
              value={pollDuration}
              onChange={(e) => setPollDuration(Number(e.target.value))}
            >
              {DURATIONS.map((d) => (
                <MenuItem key={d.hours} value={d.hours}>
                  {d.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        )}

        {image && (
          <Box
            component="img"
            src={URL.createObjectURL(image)}
            alt="Preview"
            sx={{
              width: "100%",
              maxHeight: 280,
              objectFit: "cover",
              borderRadius: 3,
              mt: 1,
            }}
          />
        )}

        {message && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {message}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, py: 1, justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton
            component="label"
            title="Add image"
            sx={{ color: "primary.main" }}
          >
            <PhotoCameraIcon />
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files[0])}
            />
          </IconButton>

          <IconButton
            className="fluid-press"
            title={pollMode ? "Remove poll" : "Add poll"}
            sx={{ color: pollMode ? "secondary.main" : "text.secondary" }}
            onClick={togglePoll}
          >
            <PollIcon />
          </IconButton>
        </Box>

        <Button
          className="pill-btn"
          variant="contained"
          color="primary"
          startIcon={<SendIcon />}
          disabled={uploading}
          onClick={handleSubmit}
        >
          {uploading ? "Uploading..." : "Post"}
        </Button>
      </CardActions>
    </Card>
  );
}

export default CreatePost;
