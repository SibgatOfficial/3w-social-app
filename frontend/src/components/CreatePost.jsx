import { useState } from "react";
import API from "../services/api";

function CreatePost({ onPostCreated }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    if (!text.trim() && !image.trim()) {
      setMessage("Write something or add an image.");
      return;
    }

    try {
      const response = await API.post("/posts", {
        text,
        image,
      });

      console.log(response.data);

      // Tell Home that a new post was created
      onPostCreated();

      setText("");
      setImage("");
      setMessage("Post created successfully!");
    } catch (error) {
      console.error(error);

      setMessage(error.response?.data?.message || "Failed to create post");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Post</h2>

      <textarea
        placeholder="What's on your mind?"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <input
        type="text"
        placeholder="Image URL (optional)"
        value={image}
        onChange={(e) => setImage(e.target.value)}
      />

      <button type="submit">Post</button>

      {message && <p>{message}</p>}
    </form>
  );
}

export default CreatePost;
