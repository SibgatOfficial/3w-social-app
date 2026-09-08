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

  const fetchPosts = useCallback(async () => {
    try {
      const response = await API.get("/posts");
      setPosts(response.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
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

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="home-page">
      <Navbar />

      <main className="feed">
        <h1>Social Feed</h1>

        <CreatePost onPostCreated={fetchPosts} />

        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onLike={handlePostUpdate}
            onComment={handlePostUpdate}
          />
        ))}
      </main>

      <BottomNav />
    </div>
  );
}

export default Home;
