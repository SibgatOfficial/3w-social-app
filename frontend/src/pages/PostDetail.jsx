import { useEffect, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
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

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const response = await API.get(`/posts/${id}`);
        setPost(response.data.post);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [id]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notFound || !post) {
    return (
      <>
        <Navbar />
        <Container maxWidth="sm" sx={{ py: 4, textAlign: "center" }}>
          <Typography variant="h6">Post not found</Typography>
          <IconButton onClick={() => navigate("/")}>
            <ArrowBackIcon /> Back to feed
          </IconButton>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <Container maxWidth="sm" sx={{ pt: 2, pb: 4 }}>
        <IconButton size="small" className="fluid-press" onClick={() => navigate(-1)}>
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