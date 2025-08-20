import express from "express";
import { dbAll, dbRun } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all E-books (public)
router.get("/", async (req, res) => {
  try {
    const ebooks = await dbAll(`
      SELECT e.*, u.username as uploader_username 
      FROM ebooks e 
      LEFT JOIN users u ON e.uploaded_by_user_id = u.id 
      ORDER BY e.upload_date DESC
    `);
    res.json(ebooks);
  } catch (error) {
    console.error("Error fetching E-books:", error);
    res.status(500).json({ error: "Failed to fetch E-books" });
  }
});

// Generate upload URL (protected)
router.post("/generate-upload-url", authenticateToken, async (req, res) => {
  try {
    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      return res
        .status(400)
        .json({ error: "Filename and content type are required" });
    }

    if (contentType !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF files are allowed" });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const uniqueFilename = `ebooks/${timestamp}-${filename}`;

    // Generate public URL for R2
    const uploadUrl = `https://pub-${process.env.R2_UPLOAD_URL_ID}.r2.dev/${uniqueFilename}`;
    const pathname = `/${uniqueFilename}`;

    res.json({
      url: uploadUrl,
      pathname: pathname,
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

// Store E-book metadata (protected)
router.post("/store-metadata", authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      semester,
      course,
      department,
      year_of_study,
      blob_url,
    } = req.body;

    if (!title || !description || !semester || !blob_url) {
      return res.status(400).json({
        error: "Title, description, semester, and blob URL are required",
      });
    }

    const result = await dbRun(
      `
      INSERT INTO ebooks (
        title, description, semester, course, department, 
        year_of_study, blob_url, uploaded_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        title,
        description,
        semester,
        course || null,
        department || null,
        year_of_study || null,
        blob_url,
        req.user.id,
      ]
    );

    res.status(201).json({
      id: result.id,
      message: "E-book metadata stored successfully",
    });
  } catch (error) {
    console.error("Error storing E-book metadata:", error);
    res.status(500).json({ error: "Failed to store E-book metadata" });
  }
});

export default router;
