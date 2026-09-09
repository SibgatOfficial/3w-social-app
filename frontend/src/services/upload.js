const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Uploads an image to Cloudinary and returns its public URL
export async function uploadImage(file) {
  // Validate Cloudinary configuration
  if (!CLOUD_NAME || CLOUD_NAME === "your_cloud_name") {
    throw new Error("Cloudinary cloud name is not configured. Please check your .env file.");
  }
  if (!UPLOAD_PRESET || UPLOAD_PRESET === "your_upload_preset") {
    throw new Error("Cloudinary upload preset is not configured. Please check your .env file.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Image upload failed");
  }

  // Return the secure URL from Cloudinary
  return data.secure_url;
}