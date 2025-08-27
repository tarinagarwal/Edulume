import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import Groq from "groq-sdk";

// Optional authentication middleware - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    if (!token) {
      req.user = null;
      return next();
    }

    const jwt = await import("jsonwebtoken");
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, email: true },
    });

    req.user = user;
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    req.user = null;
    next();
  }
};

const router = express.Router();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Enhanced prompts for course generation
const COURSE_OUTLINE_PROMPT = (topic) => `
Create a comprehensive course outline for "${topic}". This should be a well-structured, progressive learning path that takes students from basic concepts to advanced applications.

Respond with a JSON object ONLY. DO NOT include any other text, explanations, or introductions. Follow this exact structure:

{
  "title": "Course title that clearly describes what students will learn",
  "description": "A comprehensive 2-3 sentence description explaining what this course covers, who it's for, and what students will achieve by the end",
  "chapters": [
    {
      "title": "Chapter title that clearly indicates the learning objective",
      "description": "Brief 1-2 sentence description of what will be covered in this chapter and why it's important",
      "order_index": chapter number (starting from 1)
    }
  ]
}

Requirements for the course outline:
1. Create 8-12 chapters for comprehensive coverage
2. Structure should be logical and progressive (basic → intermediate → advanced)
3. Each chapter should build upon previous knowledge
4. Include both theoretical concepts and practical applications
5. Cover real-world use cases and examples
6. Include best practices and common pitfalls
7. End with advanced topics or specializations
8. Ensure the course is practical and applicable

Make sure the course is comprehensive, engaging, and provides real value to learners.
`;

const CHAPTER_CONTENT_PROMPT = (
  chapterTitle,
  courseTitle,
  chapterDescription
) => `
Generate comprehensive, educational content for the chapter "${chapterTitle}" which is part of the course "${courseTitle}".

Chapter Description: ${chapterDescription}

Create detailed, well-structured content that includes:

## Learning Objectives
- Clear, specific objectives for what students will learn
- Measurable outcomes they should achieve

## Core Concepts
- Detailed explanations of key concepts
- Clear definitions and terminology
- Why these concepts matter

## Detailed Content
- Step-by-step explanations
- Multiple examples and use cases
- Practical applications
- Code examples (if applicable)
- Diagrams or visual descriptions (describe what should be shown)

## Practical Examples
- Real-world scenarios
- Hands-on exercises or projects
- Common use cases and implementations

## Best Practices
- Industry standards and recommendations
- Common mistakes to avoid
- Tips for success

## Key Takeaways
- Summary of the most important points
- What students should remember
- How this connects to the next chapter

## Further Reading
- Suggested resources for deeper learning
- Related topics to explore

Format the content using proper Markdown:
- Use ## for main sections
- Use ### for subsections  
- Use bullet points for lists
- Use code blocks for examples (if applicable)
- Use **bold** and *italic* for emphasis
- Use > for important quotes or notes

The content should be:
- Comprehensive yet easy to understand
- Engaging and practical
- Well-organized with clear structure
- Suitable for learners at the appropriate level
- Rich with examples and real-world applications
- Professional and educational in tone

Aim for substantial content that provides real value and learning.
`;

// Get all courses with filters and search (with optional auth)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const {
      search,
      filter = "all", // all, my-courses, bookmarked
      sort = "recent",
      page = 1,
      limit = 12,
    } = req.query;

    const userId = req.user?.id;
    console.log("📚 Courses request:", {
      userId: userId || "anonymous",
      filter,
      search: search || "none",
    });
    let where = {};

    // Apply filters
    if (filter === "my-courses" && userId) {
      where.authorId = userId;
    } else if (filter === "bookmarked" && userId) {
      where.bookmarks = {
        some: {
          userId: userId,
        },
      };
    } else {
      // For "all" courses, only show public courses unless it's the author
      where.OR = [
        { isPublic: true },
        ...(userId ? [{ authorId: userId }] : []),
      ];
    }

    // Apply search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { topic: { contains: search, mode: "insensitive" } },
      ];
    }

    // Apply sorting
    let orderBy = {};
    switch (sort) {
      case "popular":
        orderBy = [{ views: "desc" }, { createdAt: "desc" }];
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      default: // recent
        orderBy = { createdAt: "desc" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          author: {
            select: { username: true },
          },
          chapters: {
            select: { id: true },
          },
          bookmarks: userId
            ? {
                where: { userId: userId },
                select: { id: true },
              }
            : {
                select: { id: true },
                take: 0, // Don't actually fetch any bookmarks if not authenticated
              },
          _count: {
            select: {
              bookmarks: true,
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.course.count({ where }),
    ]);

    // Transform the response
    const transformedCourses = courses.map((course) => ({
      ...course,
      author_username: course.author.username,
      chapter_count: course.chapters.length,
      bookmark_count: course._count.bookmarks,
      is_bookmarked: userId ? course.bookmarks.length > 0 : false,
      created_at: course.createdAt,
      updated_at: course.updatedAt,
    }));

    res.json({
      courses: transformedCourses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// Get single course with chapters
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        author: {
          select: { username: true },
        },
        chapters: {
          orderBy: { orderIndex: "asc" },
        },
        bookmarks: userId
          ? {
              where: { userId: userId },
              select: { id: true },
            }
          : {
              select: { id: true },
              take: 0, // Don't actually fetch any bookmarks if not authenticated
            },
        _count: {
          select: {
            bookmarks: true,
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Check if user can access this course
    if (!course.isPublic && course.authorId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update view count
    await prisma.course.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    // Transform the response
    const courseDetails = {
      ...course,
      author_username: course.author.username,
      chapter_count: course.chapters.length,
      bookmark_count: course._count.bookmarks,
      is_bookmarked: userId ? course.bookmarks.length > 0 : false,
      created_at: course.createdAt,
      updated_at: course.updatedAt,
    };

    res.json({ course: courseDetails });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

// Generate course outline using Groq
router.post("/generate-outline", authenticateToken, async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    console.log("🤖 Generating course outline for topic:", topic);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: COURSE_OUTLINE_PROMPT(topic),
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated");
    }

    console.log("🤖 Generated outline:", content);

    // Parse the JSON response
    let outline;
    try {
      outline = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError);
      throw new Error("Invalid JSON response from AI");
    }

    res.json(outline);
  } catch (error) {
    console.error("Error generating course outline:", error);
    res.status(500).json({
      error: "Failed to generate course outline",
      details: error.message,
    });
  }
});

// Create course from outline
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, description, topic, chapters, isPublic = true } = req.body;

    if (
      !title ||
      !description ||
      !topic ||
      !chapters ||
      !Array.isArray(chapters)
    ) {
      return res.status(400).json({
        error: "Title, description, topic, and chapters are required",
      });
    }

    console.log("📚 Creating course:", {
      title,
      topic,
      chaptersCount: chapters.length,
    });

    const course = await prisma.course.create({
      data: {
        title,
        description,
        topic,
        authorId: req.user.id,
        isPublic,
        chapters: {
          create: chapters.map((chapter, index) => ({
            title: chapter.title,
            description: chapter.description,
            orderIndex: chapter.order_index || index + 1,
          })),
        },
      },
      include: {
        chapters: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    console.log("✅ Course created successfully:", course.id);

    res.status(201).json({
      id: course.id,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: "Failed to create course" });
  }
});

// Generate chapter content using Groq
router.post(
  "/:courseId/chapters/:chapterId/generate-content",
  authenticateToken,
  async (req, res) => {
    try {
      const { courseId, chapterId } = req.params;

      console.log("🔍 Generate content request:", {
        courseId,
        chapterId,
        userId: req.user?.id,
      });

      // Verify course ownership
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          chapters: {
            where: { id: chapterId },
          },
        },
      });

      console.log("📚 Found course:", course ? course.title : "Not found");

      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      if (course.authorId !== req.user.id) {
        console.log("❌ Access denied - not course owner");
        return res.status(403).json({ error: "Access denied" });
      }

      const chapter = course.chapters[0];
      if (!chapter) {
        console.log("❌ Chapter not found");
        return res.status(404).json({ error: "Chapter not found" });
      }

      console.log("🤖 Generating content for chapter:", chapter.title);

      // Check if Groq API key is available
      if (!process.env.GROQ_API_KEY) {
        console.error("❌ GROQ_API_KEY not found in environment variables");
        return res.status(500).json({ error: "AI service not configured" });
      }

      console.log("🚀 Making Groq API call...");

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: CHAPTER_CONTENT_PROMPT(
              chapter.title,
              course.title,
              chapter.description
            ),
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 4000,
      });

      console.log("📝 Groq API response received");

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        console.error("❌ No content in Groq response");
        throw new Error("No content generated");
      }

      console.log("💾 Saving content to database...");

      // Update chapter with generated content
      const updatedChapter = await prisma.courseChapter.update({
        where: { id: chapterId },
        data: { content },
      });

      console.log("✅ Chapter content generated and saved successfully");

      res.json({
        message: "Chapter content generated successfully",
        content,
        chapter: updatedChapter,
      });
    } catch (error) {
      console.error("❌ Error generating chapter content:", error);
      console.error("Error details:", error.stack);
      res.status(500).json({
        error: "Failed to generate chapter content",
        details: error.message,
      });
    }
  }
);

// Toggle course bookmark
router.post("/:id/bookmark", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log("🔖 Bookmark toggle request:", { courseId: id, userId });

    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      console.log("❌ Course not found:", id);
      return res.status(404).json({ error: "Course not found" });
    }

    // Check if already bookmarked
    const existingBookmark = await prisma.courseBookmark.findFirst({
      where: {
        courseId: id,
        userId: userId,
      },
    });

    console.log(
      "🔍 Existing bookmark:",
      existingBookmark ? "Found" : "Not found"
    );

    if (existingBookmark) {
      // Remove bookmark
      await prisma.courseBookmark.delete({
        where: { id: existingBookmark.id },
      });
      console.log("✅ Bookmark removed");
      res.json({ message: "Course unbookmarked", bookmarked: false });
    } else {
      // Add bookmark
      const newBookmark = await prisma.courseBookmark.create({
        data: {
          courseId: id,
          userId: userId,
        },
      });
      console.log("✅ Bookmark added:", newBookmark.id);
      res.json({ message: "Course bookmarked", bookmarked: true });
    }
  } catch (error) {
    console.error("❌ Error toggling bookmark:", error);
    console.error("Error details:", error.stack);
    res
      .status(500)
      .json({ error: "Failed to toggle bookmark", details: error.message });
  }
});

// Update course
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, topic, isPublic } = req.body;

    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (course.authorId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(topic && { topic }),
        ...(typeof isPublic === "boolean" && { isPublic }),
      },
    });

    res.json({
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ error: "Failed to update course" });
  }
});

// Delete course
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (course.authorId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.course.delete({
      where: { id },
    });

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
});

// Debug endpoint to check authentication
router.get("/debug-auth", authenticateToken, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
    message: "Authentication working",
  });
});

// Test endpoint for Groq API
router.get("/test-groq", authenticateToken, async (req, res) => {
  try {
    console.log("🧪 Testing Groq API...");

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY not configured" });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: "Say hello in a friendly way.",
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 100,
    });

    const content = completion.choices[0]?.message?.content;

    res.json({
      success: true,
      message: "Groq API is working",
      response: content,
    });
  } catch (error) {
    console.error("❌ Groq API test failed:", error);
    res.status(500).json({
      error: "Groq API test failed",
      details: error.message,
    });
  }
});

export default router;
