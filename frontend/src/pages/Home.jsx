import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Container from "@mui/material/Container";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import InboxIcon from "@mui/icons-material/Inbox";
import API from "../services/api";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import Navbar from "../components/Navbar";

function Home() {
  const token = localStorage.getItem("token");
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const fetchPosts = useCallback(async (nextPage = 1, append = false) => {
    try {
      setLoading(true);
      const response = await API.get(`/posts?page=${nextPage}`);
      const { posts: newPosts, totalPages } = response.data;

      setPosts((prev) => (append ? [...prev, ...newPosts] : newPosts));
      setHasMore(nextPage < totalPages);
      setPage(nextPage);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      const timer = setTimeout(() => fetchPosts(1), 0);
      return () => clearTimeout(timer);
    }
  }, [fetchPosts, token]);

  // Save scroll position before leaving the page
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem("homeScrollPosition", window.scrollY.toString());
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Restore scroll position when coming back from post detail
  useEffect(() => {
    const savedPosition = sessionStorage.getItem("homeScrollPosition");
    if (savedPosition && location.pathname === "/") {
      const scrollY = parseInt(savedPosition, 10);
      // Small delay to ensure content is loaded
      setTimeout(() => {
        window.scrollTo(0, scrollY);
      }, 100);
    }
  }, [location.pathname, posts]);

  // Infinite scroll
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPosts(page + 1, true);
        }
      },
      { rootMargin: "240px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchPosts, hasMore, loading, page]);

  function handlePostUpdate(updatedPost) {
    setPosts((prev) =>
      prev.map((post) => (post._id === updatedPost._id ? updatedPost : post)),
    );
  }

  function handleDelete(postId) {
    setPosts((prev) => prev.filter((post) => post._id !== postId));
  }

  function getSortedPosts() {
    const sorted = [...posts];

    if (activeTab === "liked") {
      return sorted.sort((a, b) => b.likes.length - a.likes.length);
    }

    if (activeTab === "commented") {
      return sorted.sort((a, b) => b.comments.length - a.comments.length);
    }

    return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />

      <Container maxWidth="sm" sx={{ pt: 2, pb: 4 }}>
        <CreatePost onPostCreated={() => fetchPosts(1)} />

        <Tabs
          value={activeTab}
          onChange={(event, value) => setActiveTab(value)}
          sx={{ mb: 1, borderRadius: 3, bgcolor: "rgba(120, 150, 255, 0.06)" }}
        >
          <Tab value="all" label="All Posts" />
          <Tab value="liked" label="Most Liked" />
          <Tab value="commented" label="Most Commented" />
        </Tabs>

        {getSortedPosts().map((post, i) => (
          <Box
            key={post._id}
            className="fade-up"
            style={{ animationDelay: `${Math.min(i * 60, 420)}ms` }}
          >
            <PostCard
              post={post}
              onUpdate={handlePostUpdate}
              onDelete={handleDelete}
            />
          </Box>
        ))}

        {posts.length === 0 && !loading && (
          <Box sx={{ textAlign: "center", py: 8 }} className="pop-in">
            <InboxIcon sx={{ fontSize: 56, color: "text.secondary" }} />
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              No posts yet. Be the first!
            </Typography>
          </Box>
        )}

        {hasMore && <Box ref={loadMoreRef} sx={{ height: 8 }} />}

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={28} />
          </Box>
        )}
      </Container>
    </>
  );
}

export default Home;
