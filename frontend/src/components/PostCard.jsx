import { useState } from "react";
import API from "../services/api";

function PostCard({ post, onLike, onComment }) {
  const [comment, setComment] = useState("");

  async function handleLike() {
    try {
      const response = await API.post(`/posts/${post._id}/like`);
      onLike(response.data.post);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleComment(e) {
    e.preventDefault();

    if (!comment.trim()) return;

    try {
      const response = await API.post(`/posts/${post._id}/comments`, {
        text: comment,
      });

      onComment(response.data.post);
      setComment("");
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div>
      <h3>{post.username}</h3>

      {post.text && <p>{post.text}</p>}

      {post.image && (
        <img src={post.image} alt="Post" style={{ maxWidth: "400px" }} />
      )}

      <div>
        <button onClick={handleLike}>❤️ {post.likes.length}</button>

        <span> 💬 {post.comments.length}</span>
      </div>

      <form onSubmit={handleComment}>
        <input
          type="text"
          placeholder="Write a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button type="submit">Comment</button>
      </form>

      {post.comments.map((item, index) => (
        <div key={index}>
          <strong>{item.username}</strong>
          <p>{item.text}</p>
        </div>
      ))}
    </div>
  );
}

export default PostCard;
