import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import LogoutIcon from "@mui/icons-material/Logout";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import API from "../services/api";
import { uploadImage } from "../services/upload";

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

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);

  function handleLogout() {
    setMenuOpen(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  async function handleAvatarChange(file) {
    if (!file) return;
    setMenuOpen(false);

    try {
      const avatarUrl = await uploadImage(file);
      const response = await API.put("/auth/avatar", { avatarUrl });

      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate(0); // force re-render to show the new avatar
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "rgba(11, 17, 33, 0.78)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(120, 150, 255, 0.14)",
      }}
    >
      <Toolbar sx={{ px: 2, gap: 1 }}>
        <Typography
          sx={{
            flexGrow: 1,
            fontWeight: 800,
            letterSpacing: -0.5,
            fontSize: 26,
            color: "#f5f7ff",
          }}
        >
          Social
        </Typography>

        <IconButton
          title="Profile"
          onClick={(e) => {
            setMenuAnchor(e.currentTarget);
            setMenuOpen(true);
          }}
        >
          {user?.avatar ? (
            <Avatar src={user.avatar} sx={{ width: 40, height: 40 }} />
          ) : (
            <Avatar
              className="pop-in"
              sx={{
                background: "linear-gradient(135deg, #1685ff, #7c5cff)",
                width: 40,
                height: 40,
              }}
            >
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </Avatar>
          )}
        </IconButton>

        <IconButton title="Logout" onClick={handleLogout}>
          <LogoutIcon />
        </IconButton>
      </Toolbar>

      <Menu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorEl={menuAnchor}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem dense component="label">
          <PhotoCameraIcon fontSize="small" sx={{ mr: 1 }} /> Change photo
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handleAvatarChange(e.target.files[0])}
          />
        </MenuItem>
        <MenuItem dense onClick={handleLogout}>
          <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Logout
        </MenuItem>
      </Menu>
    </AppBar>
  );
}

export default Navbar;