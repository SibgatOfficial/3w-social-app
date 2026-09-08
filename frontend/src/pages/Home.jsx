import { useCallback, useEffect, useState } from "react";
import API from "../services/api";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";

function Home() {
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
    const timer = setTimeout(() => {
      fetchPosts();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchPosts]);

  function handlePostUpdate(updatedPost) {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === updatedPost._id ? updatedPost : post,
      ),
    );
  }

  return (
    <div>
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
    </div>
  );
}

export default Home;
