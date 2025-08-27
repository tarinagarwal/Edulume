import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all PDFs (public)
router.get("/", async (req, res) => {
  try {
    const pdfs = await prisma.pdf.findMany({
      include: {
        uploadedBy: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        uploadDate: "desc",
      },
    });

    // Transform the response to match the expected format
    const transformedPdfs = pdfs.map((pdf) => ({
      ...pdf,
      uploader_username: pdf.uploadedBy.username,
      uploaded_by_user_id: pdf.uploadedByUserId,
      upload_date: pdf.uploadDate,
      year_of_study: pdf.yearOfStudy,
      blob_url: pdf.blobUrl,
    }));

    res.json(transformedPdfs);
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

    const pdf = await prisma.pdf.create({
      data: {
        title,
        description,
        semester,
        course: course || null,
        department: department || null,
        yearOfStudy: year_of_study || null,
        blobUrl: blob_url,
        uploadedByUserId: req.user.id,
      },
    });

    if (!pdf) {
      console.error("❌ Failed to create PDF");
      return res.status(500).json({ error: "Failed to store PDF metadata" });
    }

    res.status(201).json({
      id: pdf.id,
      message: "PDF metadata stored successfully",
    });
  } catch (error) {
    console.error("Error storing PDF metadata:", error);
    res.status(500).json({ error: "Failed to store PDF metadata" });
  }
});

export default router;
