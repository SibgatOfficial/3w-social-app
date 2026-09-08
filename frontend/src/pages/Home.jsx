import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API from "../services/api";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";

function Home() {
  const token = localStorage.getItem("token");

  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  const fetchPosts = useCallback(async () => {
    try {
      const response = await API.get("/posts");
      setPosts(response.data.posts || response.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (token) {
      const timer = setTimeout(() => {
        fetchPosts();
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [fetchPosts, token]);

  function handlePostUpdate(updatedPost) {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === updatedPost._id ? updatedPost : post,
      ),
    );
  }
  function handleDelete(postId) {
    setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
  }

  function getSortedPosts() {
    const sortedPosts = [...posts];

    if (activeTab === "liked") {
      return sortedPosts.sort((a, b) => b.likes.length - a.likes.length);
    }

    if (activeTab === "commented") {
      return sortedPosts.sort((a, b) => b.comments.length - a.comments.length);
    }

    return sortedPosts.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const displayedPosts = getSortedPosts();

  return (
    <div className="home-page">
      <Navbar />

      <main className="feed">
        <div className="search-box">
          <span>⌕</span>

          <input type="text" placeholder="Search promotions, users, posts..." />

          <button>⌕</button>
        </div>

        <CreatePost onPostCreated={fetchPosts} />

        <div className="feed-tabs">
          <button
            className={activeTab === "all" ? "selected" : ""}
            onClick={() => setActiveTab("all")}
          >
            All Posts
          </button>

          <button
            className={activeTab === "liked" ? "selected" : ""}
            onClick={() => setActiveTab("liked")}
          >
            Most Liked
          </button>

          <button
            className={activeTab === "commented" ? "selected" : ""}
            onClick={() => setActiveTab("commented")}
          >
            Most Commented
          </button>
        </div>

        {displayedPosts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onLike={handlePostUpdate}
            onComment={handlePostUpdate}
            onDelete={handleDelete}
          />
        ))}
      </main>

      <BottomNav />
    </div>
  );
}

export default Home;
