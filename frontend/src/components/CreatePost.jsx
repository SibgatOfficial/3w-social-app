import { useState } from "react";
import API from "../services/api";

function CreatePost({ onPostCreated }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!text.trim() && !image) {
      setMessage("Write something or select an image.");
      return;
    }

    try {
      setUploading(true);
      setMessage("");

      let imageUrl = "";

      if (image) {
        const formData = new FormData();

        formData.append("file", image);
        formData.append(
          "upload_preset",
          import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
        );

        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          },
        );

        const cloudinaryData = await cloudinaryResponse.json();

        if (!cloudinaryResponse.ok) {
          throw new Error(
            cloudinaryData.error?.message || "Image upload failed",
          );
        }

        imageUrl = cloudinaryData.secure_url;
      }

      await API.post("/posts", {
        text,
        image: imageUrl,
      });

      setText("");
      setImage(null);
      setMessage("");

      onPostCreated();
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Failed to create post",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="create-card">
      <div className="create-header">
        <h2>Create Post</h2>
      </div>

      <textarea
        placeholder="What's on your mind? 😊"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {image && (
        <div className="selected-image">
          <img src={URL.createObjectURL(image)} alt="Preview" />
        </div>
      )}

      <div className="create-bottom">
        <label className="icon-button">
          📷
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setImage(e.target.files[0])}
          />
        </label>

        <button className="icon-button">😊</button>

        <button className="icon-button">☰</button>

        <button
          className="post-button"
          onClick={handleSubmit}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "➤ Post"}
        </button>
      </div>

      {message && <p className="error-message">{message}</p>}
    </section>
  );
}

export default CreatePost;
