import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import API from "../services/api";

function Signup() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await API.post("/auth/signup", form);
      navigate("/login");
    } catch (error) {
      setMessage(error.response?.data?.message || "Signup failed");
    }
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
        sx={{ p: 4, width: "100%", maxWidth: 400, textAlign: "center", borderRadius: 4 }}
      >
        <Typography className="gradient-text" variant="h4" sx={{ fontWeight: 800 }}>
          Social
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Create your account
        </Typography>

        <TextField
          name="username"
          label="Username"
          fullWidth
          margin="normal"
          value={form.username}
          onChange={handleChange}
          required
        />

        <TextField
          name="email"
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          value={form.email}
          onChange={handleChange}
          required
        />

        <TextField
          name="password"
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={form.password}
          onChange={handleChange}
          required
        />

        {message && <Typography color="error">{message}</Typography>}

        <Button
          className="pill-btn"
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          sx={{ mt: 2 }}
        >
          Create Account
        </Button>

        <Typography variant="body2" sx={{ mt: 3 }}>
          Already have an account? <Link to="/login">Login</Link>
        </Typography>
      </Paper>
    </Box>
  );
}

export default Signup;