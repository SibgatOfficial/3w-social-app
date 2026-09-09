import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import { gradientFor } from "../utils/avatar";
import { uploadImage } from "../services/upload";
import API from "../services/api";

// --------------------------------------------------
// Avatar with fallback
// --------------------------------------------------

function AvatarWithFallback({ src, sx, children, ...props }) {
  const [error, setError] = useState(false);

  return (
    <Avatar
      src={error ? undefined : src}
      sx={sx}
      {...props}
      imgProps={{
        onError: () => setError(true),
      }}
    >
      {error || !src ? children : null}
    </Avatar>
  );
}

// --------------------------------------------------
// Get current user from localStorage
// --------------------------------------------------

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    console.error("Failed to read user:", error);
    return null;
  }
}

// --------------------------------------------------
// Navbar
// --------------------------------------------------

function Navbar() {
  const navigate = useNavigate();

  const [userState, setUserState] = useState(getCurrentUser());

  const user = userState;

  const initial =
    user?.username?.charAt(0)?.toUpperCase() ||
    user?.name?.charAt(0)?.toUpperCase() ||
    "U";

  // --------------------------------------------------
  // Menu state
  // --------------------------------------------------

  const [anchorEl, setAnchorEl] = useState(null);

  const menuOpen = Boolean(anchorEl);

  // --------------------------------------------------
  // Edit name state
  // --------------------------------------------------

  const [editNameOpen, setEditNameOpen] = useState(false);

  const [nameInput, setNameInput] = useState(user?.name || "");

  // --------------------------------------------------
  // Snackbar
  // --------------------------------------------------

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // --------------------------------------------------
  // Upload state
  // --------------------------------------------------

  const [uploading, setUploading] = useState(false);

  // --------------------------------------------------
  // Close menu
  // --------------------------------------------------

  function handleMenuClose() {
    setAnchorEl(null);
  }

  // --------------------------------------------------
  // Get avatar URL
  // --------------------------------------------------

  function getAvatarUrl() {
    if (!user) {
      return null;
    }

    return user.avatar || user.avatarUrl || null;
  }

  const avatarUrl = getAvatarUrl();

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUserState(null);

    navigate("/login");
  }

  // --------------------------------------------------
  // Update profile
  // --------------------------------------------------

  async function updateProfile(updates) {
    try {
      const res = await API.put("/auth/profile", updates);

      const updatedUser = res?.data?.user;

      if (!updatedUser) {
        throw new Error("Server did not return updated user data");
      }

      // Save updated user
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Update Navbar immediately
      setUserState(updatedUser);

      // Dispatch custom event to notify other components (like Home) to refresh
      window.dispatchEvent(new CustomEvent("profile-updated"));

      return updatedUser;
    } catch (error) {
      console.error("Profile update error:", error);

      setSnackbar({
        open: true,
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile",
        severity: "error",
      });

      throw error;
    }
  }

  // --------------------------------------------------
  // Change avatar
  // --------------------------------------------------

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setSnackbar({
        open: true,
        message: "Please select an image file.",
        severity: "error",
      });

      e.target.value = "";
      return;
    }

    // Maximum 5MB
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({
        open: true,
        message: "Image must be less than 5MB.",
        severity: "error",
      });

      e.target.value = "";
      return;
    }

    setUploading(true);

    try {
      // Upload image to Cloudinary
      const url = await uploadImage(file);

      if (!url) {
        throw new Error("Image upload did not return a URL");
      }

      // Save avatar URL to backend
      await updateProfile({
        avatarUrl: url,
      });

      setSnackbar({
        open: true,
        message: "Profile photo updated!",
        severity: "success",
      });

      // Close menu
      handleMenuClose();
    } catch (error) {
      console.error("Avatar upload error:", error);

      setSnackbar({
        open: true,
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to upload photo",
        severity: "error",
      });
    } finally {
      setUploading(false);

      // Allows user to select the same file again
      e.target.value = "";
    }
  }

  // --------------------------------------------------
  // Open edit-name dialog
  // --------------------------------------------------

  function handleEditNameOpen() {
    setNameInput(user?.name || "");

    handleMenuClose();

    setEditNameOpen(true);
  }

  // --------------------------------------------------
  // Close edit-name dialog
  // --------------------------------------------------

  function handleEditNameClose() {
    if (uploading) {
      return;
    }

    setEditNameOpen(false);
  }

  // --------------------------------------------------
  // Save name
  // --------------------------------------------------

  async function handleNameSave() {
    const trimmedName = nameInput.trim();

    // Validate name
    if (!trimmedName) {
      setSnackbar({
        open: true,
        message: "Please enter a display name.",
        severity: "error",
      });

      return;
    }

    if (trimmedName.length < 2) {
      setSnackbar({
        open: true,
        message: "Display name must be at least 2 characters.",
        severity: "error",
      });

      return;
    }

    if (trimmedName.length > 40) {
      setSnackbar({
        open: true,
        message: "Display name must be 40 characters or less.",
        severity: "error",
      });

      return;
    }

    try {
      await updateProfile({
        name: trimmedName,
      });

      setEditNameOpen(false);

      setSnackbar({
        open: true,
        message: "Name updated!",
        severity: "success",
      });
    } catch (error) {
      // updateProfile already displays the error
      console.error("Name update error:", error);
    }
  }

  // --------------------------------------------------
  // Snackbar close
  // --------------------------------------------------

  function handleSnackbarClose(event, reason) {
    if (reason === "clickaway") {
      return;
    }

    setSnackbar((prev) => ({
      ...prev,
      open: false,
    }));
  }

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <>
      {/* ==============================================
          NAVBAR
      ============================================== */}

      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          mb: 2,
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            px: {
              xs: 1,
              sm: 2,
            },
          }}
        >
          {/* ------------------------------------------
              Logo
          ------------------------------------------ */}

          <Typography
            variant="h5"
            component="div"
            sx={{
              fontWeight: 800,
              flexGrow: 1,
            }}
            className="gradient-text"
          >
            Social
          </Typography>

          {/* ------------------------------------------
              User section
          ------------------------------------------ */}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            {/* User name */}
            <Box
              sx={{
                textAlign: "right",
                display: {
                  xs: "none",
                  sm: "block",
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                {user?.name || user?.username || "User"}
              </Typography>

              {user?.username && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.disabled",
                    lineHeight: 1,
                  }}
                >
                  @{user.username}
                </Typography>
              )}
            </Box>

            {/* ----------------------------------------
                Avatar button
            ---------------------------------------- */}

            <IconButton
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                p: 0.5,
              }}
              title={user?.username || "Account"}
              aria-label="Open account menu"
            >
              <AvatarWithFallback
                key={avatarUrl || "no-avatar"}
                src={avatarUrl}
                alt={user?.username || "User"}
                sx={{
                  width: 42,
                  height: 42,
                  fontSize: 16,
                  background: gradientFor(
                    user?.username || user?.name || "user",
                  ),
                }}
              >
                {initial}
              </AvatarWithFallback>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ==============================================
          ACCOUNT MENU
      ============================================== */}

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        transformOrigin={{
          horizontal: "right",
          vertical: "top",
        }}
        anchorOrigin={{
          horizontal: "right",
          vertical: "bottom",
        }}
      >
        {/* ------------------------------------------
            Mobile user information
        ------------------------------------------ */}

        <Box
          sx={{
            px: 2,
            py: 1,
            display: {
              sm: "none",
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
            }}
          >
            {user?.name || user?.username || "User"}
          </Typography>

          {user?.username && (
            <Typography
              variant="caption"
              sx={{
                color: "text.disabled",
              }}
            >
              @{user.username}
            </Typography>
          )}
        </Box>

        <Divider
          sx={{
            display: {
              sm: "none",
            },
          }}
        />

        {/* ------------------------------------------
            Change photo
        ------------------------------------------ */}

        <MenuItem
          component="label"
          htmlFor="avatar-upload"
          sx={{
            gap: 1,
            cursor: uploading ? "default" : "pointer",
          }}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Change photo"}

          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            hidden
            disabled={uploading}
            onChange={handleAvatarChange}
          />
        </MenuItem>

        {/* ------------------------------------------
            Edit name
        ------------------------------------------ */}

        <MenuItem
          onClick={handleEditNameOpen}
          sx={{
            cursor: "pointer",
          }}
        >
          Edit name
        </MenuItem>

        <Divider />

        {/* ------------------------------------------
            Logout
        ------------------------------------------ */}

        <MenuItem
          onClick={handleLogout}
          sx={{
            cursor: "pointer",
          }}
        >
          Logout
        </MenuItem>
      </Menu>

      {/* ==============================================
          EDIT NAME DIALOG
      ============================================== */}

      <Dialog
        open={editNameOpen}
        onClose={handleEditNameClose}
        fullWidth
        maxWidth="xs"
      >
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Display Name"
            fullWidth
            variant="outlined"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            inputProps={{
              maxLength: 40,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleNameSave();
              }
            }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleEditNameClose} disabled={uploading}>
            Cancel
          </Button>

          <Button
            onClick={handleNameSave}
            variant="contained"
            disabled={!nameInput.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ==============================================
          SNACKBAR
      ============================================== */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{
            width: "100%",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Navbar;
