import { useEffect, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import API from "../services/api";
import PostCard from "../components/PostCard";
import Navbar from "../components/Navbar";

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchPost() {
      try {
        const response = await API.get(`/posts/${id}`);
        if (isMounted) {
          setPost(response.data.post);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        if (isMounted) {
          setNotFound(true);
          setError(err.response?.data?.message || err.message || "Failed to load post");
          setLoading(false);
        }
      }
    }
    
    fetchPost();
    
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Refresh post when profile is updated (name or avatar changed)
  useEffect(() => {
    const handleProfileUpdated = () => {
      // Re-fetch the post to get updated user info
      async function refreshPost() {
        try {
          const response = await API.get(`/posts/${id}`);
          setPost(response.data.post);
        } catch (err) {
          console.error("Error refreshing post:", err);
        }
      }
      refreshPost();
    };

    window.addEventListener("profile-updated", handleProfileUpdated);
    return () => window.removeEventListener("profile-updated", handleProfileUpdated);
  }, [id]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  if (notFound || !post) {
    return (
      <>
        <Navbar />
        <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }} className="fade-up">
          <Typography variant="h6" sx={{ mb: 2 }}>
            Post not found
          </Typography>
          
          {error && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Button
            className="pill-btn"
            variant="contained"
            color="primary"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/")}
          >
            Back to feed
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <Container maxWidth="sm" sx={{ pt: 2, pb: 4 }}>
        <IconButton size="small" className="fluid-press" onClick={() => navigate(-1)} sx={{ mb: 1 }}>
          <ArrowBackIcon />
        </IconButton>

        <Box className="fade-up">
          <PostCard
            post={post}
            showComments
            onUpdate={setPost}
            onDelete={() => navigate("/")}
          />
        </Box>
      </Container>
    </>
  );
}

export default PostDetail;
