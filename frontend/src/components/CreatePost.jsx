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

      // Upload image to Cloudinary
      if (image) {
        const formData = new FormData();

        formData.append("file", image);
        formData.append(
          "upload_preset",
          import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
        );

        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${
            import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
          }/image/upload`,
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

      // Create post in our backend
      await API.post("/posts", {
        text,
        image: imageUrl,
      });

      setText("");
      setImage(null);
      setMessage("Post created successfully!");

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
    <form onSubmit={handleSubmit}>
      <h2>Create Post</h2>

      <textarea
        placeholder="What's on your mind?"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
      />

      <button type="submit" disabled={uploading}>
        {uploading ? "Uploading..." : "Post"}
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}

export default CreatePost;
