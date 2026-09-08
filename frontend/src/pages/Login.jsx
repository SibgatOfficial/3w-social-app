import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await API.post("/auth/login", formData);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      navigate("/");
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f1115",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#181b22",
          padding: "30px",
          borderRadius: "16px",
          border: "1px solid #292d36",
        }}
      >
        <h1 style={{ textAlign: "center" }}>TaskPlanet</h1>

        <p style={{ textAlign: "center" }}>Login to your account</p>

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          style={{ marginTop: "12px" }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            marginTop: "15px",
          }}
        >
          Login
        </button>

        {message && <p style={{ textAlign: "center" }}>{message}</p>}

        <p style={{ textAlign: "center", marginTop: "20px" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "#8b7cf6" }}>
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
