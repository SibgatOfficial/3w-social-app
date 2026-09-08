import { useState } from "react";
import API from "../services/api";

function PostCard({ post, onLike, onComment, onDelete }) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user"));

  const isOwnPost = currentUser?.username === post.username;

  const initial = post.username?.charAt(0).toUpperCase() || "U";

  async function handleLike(e) {
    e.stopPropagation();

    try {
      const response = await API.post(`/posts/${post._id}/like`);

      onLike(response.data.post);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleComment(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!comment.trim()) return;

    try {
      const response = await API.post(`/posts/${post._id}/comments`, {
        text: comment,
        replyTo: replyingTo?._id || null,
      });

      onComment(response.data.post);

      setComment("");
      setReplyingTo(null);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleFollow(e) {
    e.stopPropagation();

    try {
      // Keep your existing follow logic here
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDelete(e) {
    e.stopPropagation();

    const confirmed = window.confirm(
      "Are you sure you want to delete this post?",
    );

    if (!confirmed) return;

    try {
      await API.delete(`/posts/${post._id}`);
      onDelete(post._id);
    } catch (error) {
      console.error(error);
    }
  }

  function handleReply(e, commentItem) {
    e.stopPropagation();

    setReplyingTo(commentItem);
    setComment(`@${commentItem.username} `);

    setTimeout(() => {
      document.getElementById(`comment-${post._id}`)?.focus();
    }, 0);
  }

  return (
    <article
      className="post-card"
      onClick={() => setShowComments(!showComments)}
    >
      {/* USER */}
      <div className="post-user">
        <div className="user-avatar">{initial}</div>

        <div className="user-info">
          <div className="username-row">
            <strong>{post.username}</strong>

            <span className="rank-badge">⭐ Member</span>
          </div>

          <span className="handle">@{post.username}</span>

          <span className="post-time">Just now</span>
        </div>

        {!isOwnPost && (
          <button className="follow-btn" onClick={handleFollow}>
            Follow
          </button>
        )}

        {isOwnPost && (
          <button className="delete-btn" onClick={handleDelete}>
            🗑
          </button>
        )}

        <button className="more-btn" onClick={(e) => e.stopPropagation()}>
          •••
        </button>
      </div>

      {/* POST */}
      {post.text && <p className="post-content">{post.text}</p>}

      {post.image && <img className="post-image" src={post.image} alt="Post" />}

      {/* LIKE / COMMENT COUNTS */}
      <div className="post-actions">
        <button onClick={handleLike} className="action-btn">
          <span>♡</span>
          {post.likes.length}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowComments(true);
          }}
          className="action-btn"
        >
          <span>▤</span>
          {post.comments.length}
        </button>

        <button className="action-btn" onClick={(e) => e.stopPropagation()}>
          <span>♧</span>0
        </button>
      </div>

      {/* COMMENTS */}
      {showComments && (
        <div className="comments-section" onClick={(e) => e.stopPropagation()}>
          <h3>Comments</h3>

          {post.comments.length === 0 && (
            <p className="no-comments">No comments yet. Be the first!</p>
          )}

          {post.comments.map((item) => (
            <div className="comment-item" key={item._id}>
              <div className="comment-user">
                <div className="comment-avatar">
                  {item.username.charAt(0).toUpperCase()}
                </div>

                <strong>@{item.username}</strong>
              </div>

              <p>{item.text}</p>

              <button
                className="reply-btn"
                onClick={(e) => handleReply(e, item)}
              >
                Reply
              </button>

              {/* REPLIES */}
              {item.replies?.map((reply) => (
                <div className="reply-item" key={reply._id}>
                  <strong>@{reply.username}</strong>

                  <p>{reply.text}</p>
                </div>
              ))}
            </div>
          ))}

          {/* COMMENT INPUT */}
          <form className="comment-box" onSubmit={handleComment}>
            <span>😊</span>

            <input
              id={`comment-${post._id}`}
              type="text"
              placeholder={
                replyingTo
                  ? `Reply to @${replyingTo.username}...`
                  : "Write a comment..."
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <button type="submit">➤</button>
          </form>

          {replyingTo && (
            <button
              className="cancel-reply"
              onClick={() => {
                setReplyingTo(null);
                setComment("");
              }}
            >
              Cancel reply
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export default PostCard;
