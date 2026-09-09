import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

import API from "../services/api";
import { uploadImage } from "../services/upload";

// Generate a consistent gradient based on username/name
function gradientFor(seed) {
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  ];

  const index =
    seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    gradients.length;

  return gradients[index];
}

function Signup() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    avatar: "",
  });

  const [message, setMessage] = useState("");

  // Username availability state
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [usernameMessage, setUsernameMessage] = useState("");
  const [checkedUsername, setCheckedUsername] = useState("");

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const debounceRef = useRef(null);

  /*
   * Check username availability.
   *
   * Important:
   * State updates are performed inside the delayed callback,
   * instead of synchronously inside the effect. This avoids
   * the React set-state-in-effect warning.
   */
  useEffect(() => {
    const username = form.username.trim();

    // Cancel previous timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    // Don't check short usernames
    if (username.length < 3) {
      return undefined;
    }

    // Don't call API for invalid usernames
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return undefined;
    }

    debounceRef.current = setTimeout(async () => {
      setUsernameStatus("checking");
      setUsernameMessage("Checking availability...");

      try {
        const response = await API.get(
          `/auth/check-username/${encodeURIComponent(username)}`,
        );

        // Make sure this result belongs to the current username
        if (username !== form.username.trim()) {
          return;
        }

        setCheckedUsername(username);

        if (response.data.available) {
          setUsernameStatus("available");
          setUsernameMessage(response.data.message || "Username is available");
        } else {
          setUsernameStatus("taken");
          setUsernameMessage(
            response.data.message || "Username is already taken",
          );
        }
      } catch (error) {
        console.error("Username check error:", error);

        if (username !== form.username.trim()) {
          return;
        }

        setCheckedUsername(username);
        setUsernameStatus(null);
        setUsernameMessage("");
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [form.username]);

  /*
   * Handle input changes
   */
  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear general error when user starts typing
    if (message) {
      setMessage("");
    }
  }

  /*
   * Handle profile image selection and upload
   */
  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");

      // Allow selecting the same file again
      e.target.value = "";
      return;
    }

    // Validate file size - maximum 5MB
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size must be less than 5MB.");

      e.target.value = "";
      return;
    }

    // Show preview immediately
    const reader = new FileReader();

    reader.onload = (event) => {
      setAvatarPreview(event.target?.result || null);
    };

    reader.readAsDataURL(file);

    setUploading(true);
    setMessage("");

    try {
      // Upload to Cloudinary
      const url = await uploadImage(file);

      setForm((prev) => ({
        ...prev,
        avatar: url,
      }));

      setMessage("");
    } catch (error) {
      console.error("Upload error:", error);

      setMessage(error?.message || "Failed to upload image. Please try again.");

      setAvatarPreview(null);
    } finally {
      setUploading(false);

      // Allow selecting the same file again
      e.target.value = "";
    }
  }

  /*
   * Handle signup
   */
  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");

    const name = form.name.trim();
    const username = form.username.trim();
    const password = form.password;

    // Display name validation

    if (!name) {
      setMessage("Please enter your display name");
      return;
    }

    if (name.length < 2) {
      setMessage("Display name must be at least 2 characters");
      return;
    }

    // Username validation

    if (!username) {
      setMessage("Please enter a username");
      return;
    }

    if (username.length < 3) {
      setMessage("Username must be at least 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setMessage("Username can only contain letters, numbers, and underscores");
      return;
    }

    // Display name and username shouldn't be identical
    if (name.toLowerCase() === username.toLowerCase()) {
      setMessage("Display name must be different from username");
      return;
    }

    // Password validation

    if (!password) {
      setMessage("Please enter a password");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }

    // Username availability

    if (usernameStatus === "checking" && checkedUsername === username) {
      setMessage("Please wait for username availability check");
      return;
    }

    if (usernameStatus === "taken" && checkedUsername === username) {
      setMessage("Username is already taken. Please choose another.");
      return;
    }

    // Don't submit while uploading

    if (uploading) {
      setMessage("Please wait for the profile photo to finish uploading.");
      return;
    }

    // Signup API request

    try {
      await API.post("/auth/signup", {
        ...form,
        name,
        username: username.toLowerCase(),
      });

      // Signup successful
      navigate("/login");
    } catch (error) {
      console.error("Signup error:", error);

      setMessage(
        error?.response?.data?.message || "Signup failed. Please try again.",
      );
    }
  }

  /*
   * Avatar display
   */
  const displayAvatar = avatarPreview || form.avatar;

  const avatarSeed = form.username.trim() || form.name.trim() || "user";

  const showGradientBackground = !displayAvatar;

  /*
   * Derived username UI state.
   *
   * This avoids calling setState synchronously inside useEffect.
   */
  const username = form.username.trim();

  const usernameIsTooShort = username.length > 0 && username.length < 3;

  const usernameIsInvalid =
    username.length >= 3 && !/^[a-zA-Z0-9_]+$/.test(username);

  const currentUsernameWasChecked =
    checkedUsername === username && username.length >= 3;

  let displayedUsernameStatus = null;
  let displayedUsernameMessage = "";

  if (usernameIsInvalid) {
    displayedUsernameStatus = "taken";
    displayedUsernameMessage = "Only letters, numbers, and underscores allowed";
  } else if (usernameIsTooShort) {
    displayedUsernameStatus = null;
    displayedUsernameMessage = "";
  } else if (currentUsernameWasChecked) {
    displayedUsernameStatus = usernameStatus;
    displayedUsernameMessage = usernameMessage;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper
        className="glass fade-up"
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 420,
          textAlign: "center",
          borderRadius: 4,
        }}
      >
        {/* -------------------------
            Logo / Heading
        ------------------------- */}

        <Typography
          className="gradient-text"
          variant="h4"
          sx={{
            fontWeight: 800,
          }}
        >
          Social
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.5,
            mb: 2,
          }}
        >
          Create your account
        </Typography>

        {/* Profile Photo */}

        <Box
          sx={{
            position: "relative",
            display: "inline-block",
            mb: 2,
          }}
        >
          <Avatar
            src={displayAvatar || undefined}
            sx={{
              width: 80,
              height: 80,
              fontSize: 32,
              cursor: "pointer",
              border: "3px solid",
              borderColor: "primary.main",

              background: showGradientBackground
                ? gradientFor(avatarSeed)
                : undefined,
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {form.username?.charAt(0)?.toUpperCase() ||
              form.name?.charAt(0)?.toUpperCase() ||
              "U"}
          </Avatar>

          {/* Camera button */}
          <IconButton
            type="button"
            size="small"
            aria-label="Upload profile photo"
            sx={{
              position: "absolute",
              bottom: -5,
              right: -5,
              bgcolor: "primary.main",
              color: "white",

              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <PhotoCameraIcon fontSize="small" />
          </IconButton>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />
        </Box>

        {/* Upload status */}
        {uploading && (
          <Typography
            variant="caption"
            color="primary"
            sx={{
              display: "block",
              mb: 1,
            }}
          >
            Uploading photo...
          </Typography>
        )}

        {/* Display Name */}

        <TextField
          name="name"
          label="Display Name"
          fullWidth
          margin="normal"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="e.g. John Doe"
          helperText="This is your public display name"
        />

        {/* Username */}

        <TextField
          name="username"
          label="Username"
          fullWidth
          margin="normal"
          value={form.username}
          onChange={handleChange}
          required
          placeholder="Choose a unique username"
          InputProps={{
            endAdornment: (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {/* Checking */}
                {displayedUsernameStatus === "checking" && (
                  <CircularProgress size={20} />
                )}

                {/* Available */}
                {displayedUsernameStatus === "available" && (
                  <CheckCircleIcon color="success" />
                )}

                {/* Taken / Invalid */}
                {displayedUsernameStatus === "taken" && (
                  <CancelIcon color="error" />
                )}
              </Box>
            ),
          }}
        />

        {/* Username status message */}
        {displayedUsernameMessage && (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "left",
              mt: -0.5,
              mb: 1,
            }}
            color={
              displayedUsernameStatus === "available"
                ? "success.main"
                : displayedUsernameStatus === "taken"
                  ? "error.main"
                  : "text.secondary"
            }
          >
            {displayedUsernameMessage}
          </Typography>
        )}

        {/* Password */}

        <TextField
          name="password"
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={form.password}
          onChange={handleChange}
          required
          placeholder="At least 6 characters"
        />

        {/* Error message */}

        {message && (
          <Typography
            color="error"
            sx={{
              mt: 1,
            }}
          >
            {message}
          </Typography>
        )}

        {/* Create Account */}

        <Button
          className="pill-btn"
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={uploading}
          sx={{
            mt: 2,
          }}
        >
          {uploading ? "Uploading..." : "Create Account"}
        </Button>

        {/* Login link */}

        <Typography
          variant="body2"
          sx={{
            mt: 3,
          }}
        >
          Already have an account? <Link to="/login">Login</Link>
        </Typography>
      </Paper>
    </Box>
  );
}

export default Signup;
