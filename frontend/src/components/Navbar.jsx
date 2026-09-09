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
import { gradientFor } from "../utils/avatar";
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
  const user = getCurrentUser();
  const initial = user?.username?.charAt(0).toUpperCase() || "U";

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  async function updateProfile(updates) {
    try {
      const res = await API.put("/auth/profile", updates);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch (error) {
      console.error(error);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // reuse Cloudinary upload
      const { uploadImage } = await import("../services/upload");
      const url = await uploadImage(file);
      await updateProfile({ avatarUrl: url });
    } catch (error) {
      console.error(error);
    }
  }

  const [editNameOpen, setEditNameOpen] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || "");

  async function handleNameSave() {
    await updateProfile({ name: nameInput });
    setEditNameOpen(false);
  }

  return (
    <>
      <AppBar position="sticky" color="transparent" elevation={0} sx={{ mb: 2 }}>
        <Toolbar sx={{ justifyContent: "space-between", px: { xs: 1, sm: 2 } }}>
          <Typography
            variant="h5"
            component="div"
            sx={{
              fontWeight: 800,
              flexGrow: 1,
              className: "gradient-text",
            }}
          >
            Social
          </Typography>

          <IconButton
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ p: 0.5 }}
            title={user?.username || "Account"}
          >
            {user?.avatar ? (
              <Avatar
                src={user.avatar}
                alt={user.username}
                sx={{ width: 42, height: 42, fontSize: 16 }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 42,
                  height: 42,
                  fontSize: 16,
                  background: gradientFor(user?.username),
                }}
              >
                {initial}
              </Avatar>
            )}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Profile dropdown — only avatar menu (change photo, edit name, logout) */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        onClick={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        MenuListProps={{ "aria-labelledby": "profile-menu" }}
      >
        <MenuItem
          component="label"
          htmlFor="avatar-upload"
          sx={{ gap: 1, cursor: "pointer" }}
        >
          Change photo
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarChange}
          />
        </MenuItem>

        <MenuItem
          onClick={() => setEditNameOpen(true)}
          sx={{ cursor: "pointer" }}
        >
          Edit name
        </MenuItem>

        <Divider />
        <MenuItem onClick={handleLogout} sx={{ gap: 1, cursor: "pointer" }}>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}

export default Navbar;
