import express from "express";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { authenticateToken } from "../middleware/auth.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const router = express.Router();

// Debug: Log environment variables (remove after testing)
console.log("Environment check:");
console.log("R2_ACCOUNT_ID:", process.env.R2_ACCOUNT_ID ? "SET" : "NOT SET");
console.log(
  "R2_ACCESS_KEY_ID:",
  process.env.R2_ACCESS_KEY_ID ? "SET" : "NOT SET"
);
console.log(
  "R2_SECRET_ACCESS_KEY:",
  process.env.R2_SECRET_ACCESS_KEY ? "SET" : "NOT SET"
);

// Configure S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = "alienvault-storage";

// Direct file upload endpoint
router.post("/", authenticateToken, async (req, res) => {
  try {
    const filename = req.headers["x-filename"];
    const contentType = req.headers["content-type"];

    if (!filename || !contentType) {
      return res
        .status(400)
        .json({ error: "Filename and content type are required" });
    }

    if (contentType !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF files are allowed" });
    }

    // Read the request body into a buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${filename}`;

    // Upload to Cloudflare R2
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFilename,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3Client.send(uploadCommand);

    // Generate public URL
    const publicUrl = `https://pub-${process.env.R2_UPLOAD_URL_ID}.r2.dev/${uniqueFilename}`;

    res.json({
      url: publicUrl,
      pathname: `/${uniqueFilename}`,
    });
  } catch (error) {
    console.error("Error uploading file to R2:", error);
    console.error("Error details:", error.message);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

export default router;
