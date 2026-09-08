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
    <article className="post-card">
      <div className="post-header">
        <div className="avatar">{post.username.charAt(0).toUpperCase()}</div>

        <div>
          <strong>{post.username}</strong>
          <small>Just now</small>
        </div>
      </div>

      {post.text && <p className="post-text">{post.text}</p>}

      {post.image && <img className="post-image" src={post.image} alt="Post" />}

      <div className="post-actions">
        <button onClick={handleLike}>❤️ {post.likes.length}</button>

        <span>💬 {post.comments.length}</span>
      </div>

      <form className="comment-form" onSubmit={handleComment}>
        <input
          type="text"
          placeholder="Write a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button type="submit">Send</button>
      </form>

      <div className="comments">
        {post.comments.map((item, index) => (
          <div className="comment" key={index}>
            <strong>{item.username}</strong>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export default PostCard;
