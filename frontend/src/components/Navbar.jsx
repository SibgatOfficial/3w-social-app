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

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function Navbar() {
  const navigate = useNavigate();
  const [userState, setUserState] = useState(getCurrentUser());
  const user = userState;
  const initial = user?.username?.charAt(0).toUpperCase() || "U";

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [uploading, setUploading] = useState(false);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  async function updateProfile(updates) {
    try {
      const res = await API.put("/auth/profile", updates);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUserState(res.data.user);
      return res.data.user;
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: "Failed to update profile", severity: "error" });
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      await updateProfile({ avatarUrl: url });
      setSnackbar({ open: true, message: "Profile photo updated!", severity: "success" });
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: "Failed to upload photo", severity: "error" });
    } finally {
      setUploading(false);
    }
  }

  async function handleNameSave() {
    await updateProfile({ name: nameInput });
    setEditNameOpen(false);
    setSnackbar({ open: true, message: "Name updated!", severity: "success" });
  }

  return (
    <>
      <AppBar position="sticky" color="transparent" elevation={0} sx={{ mb: 2 }}>
        <Toolbar sx={{ justifyContent: "space-between", px: { xs: 1, sm: 2 } }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 800, flexGrow: 1 }} className="gradient-text">
            Social
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {user?.name || user?.username}
              </Typography>
              {user?.name && (
                <Typography variant="caption" sx={{ color: "text.disabled", lineHeight: 1 }}>
                  @{user.username}
                </Typography>
              )}
            </Box>

            <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }} title={user?.username || "Account"}>
              {user?.avatar ? (
                <Avatar src={user.avatar} alt={user.username} sx={{ width: 42, height: 42, fontSize: 16 }} />
              ) : (
                <Avatar sx={{ width: 42, height: 42, fontSize: 16, background: gradientFor(user?.username) }}>
                  {initial}
                </Avatar>
              )}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        onClick={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box sx={{ px: 2, py: 1, display: { sm: "none" } }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {user?.name || user?.username}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            @{user?.username}
          </Typography>
        </Box>
        <Divider sx={{ display: { sm: "none" } }} />

        <MenuItem component="label" htmlFor="avatar-upload" sx={{ gap: 1, cursor: "pointer" }} disabled={uploading}>
          {uploading ? "Uploading..." : "Change photo"}
          <input id="avatar-upload" type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        </MenuItem>

        <MenuItem onClick={() => { setNameInput(user?.name || ""); setEditNameOpen(true); }} sx={{ cursor: "pointer" }}>
          Edit name
        </MenuItem>

        <Divider />
        <MenuItem onClick={handleLogout} sx={{ gap: 1, cursor: "pointer" }}>
          Logout
        </MenuItem>
      </Menu>

      <Dialog open={editNameOpen} onClose={() => setEditNameOpen(false)}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Display Name"
            fullWidth
            variant="outlined"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            inputProps={{ maxLength: 40 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditNameOpen(false)}>Cancel</Button>
          <Button onClick={handleNameSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Navbar;
