import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all E-books (public)
router.get("/", async (req, res) => {
  try {
    const ebooks = await prisma.ebook.findMany({
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
    const transformedEbooks = ebooks.map((ebook) => ({
      ...ebook,
      uploader_username: ebook.uploadedBy.username,
      uploaded_by_user_id: ebook.uploadedByUserId,
      upload_date: ebook.uploadDate,
      year_of_study: ebook.yearOfStudy,
      blob_url: ebook.blobUrl,
    }));

    res.json(transformedEbooks);
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

    const ebook = await prisma.ebook.create({
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

    if (!ebook) {
      console.error("❌ Failed to create E-book");
      return res.status(500).json({ error: "Failed to store E-book metadata" });
    }

    res.status(201).json({
      id: ebook.id,
      message: "E-book metadata stored successfully",
    });
  } catch (error) {
    console.error("Error storing E-book metadata:", error);
    res.status(500).json({ error: "Failed to store E-book metadata" });
  }
});

export default router;
