import express from "express";
import { dbAll, dbRun } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all PDFs (public)
router.get("/", async (req, res) => {
  try {
    const pdfs = await dbAll(`
      SELECT p.*, u.username as uploader_username 
      FROM pdfs p 
      LEFT JOIN users u ON p.uploaded_by_user_id = u.id 
      ORDER BY p.upload_date DESC
    `);
    res.json(pdfs);
  } catch (error) {
    console.error("Error fetching PDFs:", error);
    res.status(500).json({ error: "Failed to fetch PDFs" });
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
    const uniqueFilename = `pdfs/${timestamp}-${filename}`;

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

// Store PDF metadata (protected)
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
      INSERT INTO pdfs (
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
      message: "PDF metadata stored successfully",
    });
  } catch (error) {
    console.error("Error storing PDF metadata:", error);
    res.status(500).json({ error: "Failed to store PDF metadata" });
  }
});

export default router;
