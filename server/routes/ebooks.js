import express from "express";
import prisma from "../db.js";
import { authenticateToken, isAdmin } from "../middleware/auth.js";
import { getCache, setCache, deleteCachePattern } from "../utils/redis.js";

const router = express.Router();

// Get all E-books with pagination and filtering (public)
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = "",
      semester = "",
      course = "",
      department = "",
      year_of_study = "",
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Create cache key based on query parameters
    const cacheKey = `ebooks:${JSON.stringify({
      page: pageNum,
      limit: limitNum,
      search,
      semester,
      course,
      department,
      year_of_study,
      sortBy,
      sortOrder,
    })}`;

    // Try to get from cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log("✅ E-books: Serving from cache");
      return res.json(cachedData);
    }

    // Build where clause for filtering
    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { course: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ];
    }

    if (semester) {
      where.semester = semester;
    }

    if (course) {
      where.course = course;
    }

    if (department) {
      where.department = department;
    }

    if (year_of_study) {
      where.yearOfStudy = year_of_study;
    }

    // Build orderBy clause
    let orderBy = {};
    switch (sortBy) {
      case "title":
        orderBy = { title: sortOrder };
        break;
      case "semester":
        orderBy = { semester: sortOrder };
        break;
      case "date":
      default:
        orderBy = { uploadDate: sortOrder };
        break;
    }

    // Fetch E-books with pagination
    const [ebooks, totalCount] = await Promise.all([
      prisma.ebook.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              username: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.ebook.count({ where }),
    ]);

    // Transform the response to match the expected format
    const transformedEbooks = ebooks.map((ebook) => ({
      ...ebook,
      uploader_username: ebook.uploadedBy.username,
      uploaded_by_user_id: ebook.uploadedByUserId,
      upload_date: ebook.uploadDate,
      year_of_study: ebook.yearOfStudy,
      blob_url: ebook.blobUrl,
    }));

    // Get unique filter values for dropdowns
    const [courses, departments] = await Promise.all([
      prisma.ebook.findMany({
        where: { course: { not: null } },
        select: { course: true },
        distinct: ["course"],
      }),
      prisma.ebook.findMany({
        where: { department: { not: null } },
        select: { department: true },
        distinct: ["department"],
      }),
    ]);

    const response = {
      ebooks: transformedEbooks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        hasMore: pageNum * limitNum < totalCount,
      },
      filters: {
        availableCourses: courses
          .map((c) => c.course)
          .filter(Boolean)
          .sort(),
        availableDepartments: departments
          .map((d) => d.department)
          .filter(Boolean)
          .sort(),
      },
    };

    // Cache the response for 5 minutes
    await setCache(cacheKey, response, 300);

    res.json(response);
  } catch (error) {
    console.error("Error fetching E-books:", error);
    res.status(500).json({ error: "Failed to fetch E-books" });
  }
});

// Generate upload URL (admin only)
router.post(
  "/generate-upload-url",
  authenticateToken,
  isAdmin,
  async (req, res) => {
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
  }
);

// Store E-book metadata (admin only)
router.post("/store-metadata", authenticateToken, isAdmin, async (req, res) => {
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

    // Invalidate all E-book caches
    await deleteCachePattern("ebooks:*");

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
