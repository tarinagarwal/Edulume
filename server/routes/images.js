import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import fetch from "node-fetch";

const router = express.Router();

// Upload image to ImgBB
router.post("/upload", authenticateToken, async (req, res) => {
  try {
    const { image, name } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    // ImgBB API key (you'll need to set this in environment variables)
    const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

    if (!IMGBB_API_KEY) {
      return res
        .status(500)
        .json({ error: "Image upload service not configured" });
    }

    // Create form data for ImgBB
    const formData = new URLSearchParams();
    formData.append("key", IMGBB_API_KEY);
    formData.append("image", image.split(",")[1]); // Remove data:image/jpeg;base64, prefix
    if (name) {
      formData.append("name", name);
    }

    // Upload to ImgBB
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const result = await response.json();

    if (result.success) {
      res.json({
        url: result.data.url,
        thumbnail: result.data.thumb?.url || result.data.url,
        deleteUrl: result.data.delete_url,
      });
    } else {
      res.status(400).json({ error: result.error?.message || "Upload failed" });
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

export default router;
