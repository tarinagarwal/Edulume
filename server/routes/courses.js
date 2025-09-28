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
    console.log("🔍 Starting courses request...");
    console.log("Environment check:", {
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
      NODE_ENV: process.env.NODE_ENV,
    });

    const {
      search,
      filter = "all", // all, my-courses, bookmarked
      sort = "recent",
      page = 1,
      limit = 12,
    } = req.query;

    const userId = req.user?.id;

    // Test database connection
    console.log("🔌 Testing database connection...");
    await prisma.$connect();
    console.log("✅ Database connected successfully");

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
    } else if (filter === "enrolled" && userId) {
      where.enrollments = {
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

    // Apply search - combine with existing filters
    if (search) {
      const searchConditions = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { topic: { contains: search, mode: "insensitive" } },
      ];

      // If we already have filter conditions, combine them with search
      if (where.authorId || where.bookmarks || where.enrollments) {
        // Keep the existing filter and add search as an AND condition
        where.AND = [
          // Existing filter condition
          where.authorId
            ? { authorId: where.authorId }
            : where.bookmarks
            ? { bookmarks: where.bookmarks }
            : where.enrollments
            ? { enrollments: where.enrollments }
            : {},
          // Search condition
          { OR: searchConditions },
        ];
        // Clean up the original filter properties
        delete where.authorId;
        delete where.bookmarks;
        delete where.enrollments;
      } else {
        // For "all" courses with search, combine OR conditions
        where.AND = [
          { OR: where.OR || [{ isPublic: true }] },
          { OR: searchConditions },
        ];
        delete where.OR;
      }
    }

    console.log("📚 Courses request:", {
      userId: userId || "anonymous",
      filter,
      search: search || "none",
      whereClause: JSON.stringify(where, null, 2),
    });

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
          enrollments: userId
            ? {
                where: { userId: userId },
                select: { id: true },
              }
            : {
                select: { id: true },
                take: 0,
              },
          _count: {
            select: {
              bookmarks: true,
              enrollments: true,
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
      enrollment_count: course._count.enrollments,
      is_bookmarked: userId ? course.bookmarks.length > 0 : false,
      is_enrolled: userId ? course.enrollments.length > 0 : false,
      created_at: course.createdAt,
      updated_at: course.updatedAt,
    }));

    // Debug logging
    if (transformedCourses.length > 0) {
      console.log("🔍 Sample course enrollment data:", {
        courseId: transformedCourses[0].id,
        title: transformedCourses[0].title,
        userId: userId,
        rawEnrollments: transformedCourses[0].enrollments?.length || 0,
        isEnrolled: transformedCourses[0].is_enrolled,
        enrollmentCount: transformedCourses[0].enrollment_count,
      });
    }

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

// Get single course with chapters (includes enrollment and progress data)
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
          include: userId
            ? {
                progress: {
                  where: { userId: userId },
                  select: { isCompleted: true, completedAt: true },
                },
              }
            : {},
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
        enrollments: userId
          ? {
              where: { userId: userId },
              select: {
                id: true,
                enrolledAt: true,
                isCompleted: true,
                completedAt: true,
                progressPercentage: true,
                lastAccessedAt: true,
              },
            }
          : {
              select: { id: true },
              take: 0,
            },
        _count: {
          select: {
            bookmarks: true,
            enrollments: true,
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

    // Update last accessed time if user is enrolled
    if (userId && course.enrollments.length > 0) {
      await prisma.courseEnrollment.update({
        where: {
          courseId_userId: {
            courseId: id,
            userId: userId,
          },
        },
        data: { lastAccessedAt: new Date() },
      });
    }

    // Transform chapters to include progress
    const transformedChapters = course.chapters?.map((chapter) => ({
      ...chapter,
      isCompleted:
        (chapter.progress && chapter.progress[0]?.isCompleted) || false,
      completedAt:
        (chapter.progress && chapter.progress[0]?.completedAt) || null,
    }));

    // Transform the response
    const courseDetails = {
      ...course,
      author_username: course.author.username,
      chapter_count: course.chapters.length,
      bookmark_count: course._count.bookmarks,
      enrollment_count: course._count.enrollments,
      is_bookmarked: userId ? course.bookmarks.length > 0 : false,
      is_enrolled: userId ? course.enrollments.length > 0 : false,
      enrollment_data:
        userId && course.enrollments.length > 0 ? course.enrollments[0] : null,
      chapters: transformedChapters,
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
        max_tokens: 32768,
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

// Enroll in a course
router.post("/:id/enroll", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log("📝 Enrollment request:", { courseId: id, userId });

    // Check if course exists and is public
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        chapters: {
          select: { id: true },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (!course.isPublic && course.authorId !== userId) {
      return res
        .status(403)
        .json({ error: "Course is not available for enrollment" });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findFirst({
      where: {
        courseId: id,
        userId: userId,
      },
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: "Already enrolled in this course" });
    }

    // Create enrollment
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        courseId: id,
        userId: userId,
        lastAccessedAt: new Date(),
      },
    });

    console.log("✅ Enrollment created:", enrollment.id);

    res.json({
      message: "Successfully enrolled in course",
      enrollment: {
        id: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        isCompleted: enrollment.isCompleted,
        progressPercentage: enrollment.progressPercentage,
      },
    });
  } catch (error) {
    console.error("❌ Error enrolling in course:", error);
    res.status(500).json({ error: "Failed to enroll in course" });
  }
});

// Unenroll from a course
router.delete("/:id/enroll", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log("🗑️ Unenrollment request:", { courseId: id, userId });

    // Find and delete enrollment
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        courseId: id,
        userId: userId,
      },
    });

    if (!enrollment) {
      return res.status(404).json({ error: "Not enrolled in this course" });
    }

    // Delete enrollment and all chapter progress
    await prisma.$transaction([
      prisma.chapterProgress.deleteMany({
        where: {
          userId: userId,
          chapter: {
            courseId: id,
          },
        },
      }),
      prisma.courseEnrollment.delete({
        where: { id: enrollment.id },
      }),
    ]);

    console.log("✅ Unenrollment successful");

    res.json({ message: "Successfully unenrolled from course" });
  } catch (error) {
    console.error("❌ Error unenrolling from course:", error);
    res.status(500).json({ error: "Failed to unenroll from course" });
  }
});

// Mark chapter as completed/uncompleted
router.post(
  "/:courseId/chapters/:chapterId/progress",
  authenticateToken,
  async (req, res) => {
    try {
      const { courseId, chapterId } = req.params;
      const { isCompleted } = req.body;
      const userId = req.user.id;

      console.log("📊 Chapter progress update:", {
        courseId,
        chapterId,
        userId,
        isCompleted,
      });

      // Verify enrollment
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: {
          courseId: courseId,
          userId: userId,
        },
      });

      if (!enrollment) {
        return res
          .status(403)
          .json({ error: "Must be enrolled in course to track progress" });
      }

      // Verify chapter belongs to course
      const chapter = await prisma.courseChapter.findFirst({
        where: {
          id: chapterId,
          courseId: courseId,
        },
      });

      if (!chapter) {
        return res.status(404).json({ error: "Chapter not found" });
      }

      // Update or create chapter progress
      const progress = await prisma.chapterProgress.upsert({
        where: {
          chapterId_userId: {
            chapterId: chapterId,
            userId: userId,
          },
        },
        update: {
          isCompleted: isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
        create: {
          chapterId: chapterId,
          userId: userId,
          isCompleted: isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
      });

      // Calculate overall course progress
      const allChapters = await prisma.courseChapter.findMany({
        where: { courseId: courseId },
        select: { id: true },
      });

      const completedChapters = await prisma.chapterProgress.count({
        where: {
          userId: userId,
          isCompleted: true,
          chapter: {
            courseId: courseId,
          },
        },
      });

      const progressPercentage = Math.round(
        (completedChapters / allChapters.length) * 100
      );

      const isCourseCompleted = progressPercentage === 100;

      // Update course enrollment progress
      await prisma.courseEnrollment.update({
        where: { id: enrollment.id },
        data: {
          progressPercentage: progressPercentage,
          isCompleted: isCourseCompleted,
          completedAt:
            isCourseCompleted && !enrollment.completedAt
              ? new Date()
              : enrollment.completedAt,
          lastAccessedAt: new Date(),
        },
      });

      console.log("✅ Progress updated:", {
        chapterCompleted: isCompleted,
        overallProgress: progressPercentage,
        courseCompleted: isCourseCompleted,
      });

      res.json({
        message: "Progress updated successfully",
        progress: {
          isCompleted: progress.isCompleted,
          completedAt: progress.completedAt,
          progressPercentage: progressPercentage,
          isCourseCompleted: isCourseCompleted,
        },
      });
    } catch (error) {
      console.error("❌ Error updating chapter progress:", error);
      res.status(500).json({ error: "Failed to update progress" });
    }
  }
);

// Get user's enrolled courses
router.get("/user/enrollments", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 12 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    console.log("📚 Fetching user enrollments:", { userId, page, limit });

    const [enrollments, total] = await Promise.all([
      prisma.courseEnrollment.findMany({
        where: { userId: userId },
        include: {
          course: {
            include: {
              author: {
                select: { username: true },
              },
              chapters: {
                select: { id: true },
              },
              _count: {
                select: {
                  enrollments: true,
                },
              },
            },
          },
        },
        orderBy: { lastAccessedAt: "desc" },
        skip,
        take,
      }),
      prisma.courseEnrollment.count({ where: { userId: userId } }),
    ]);

    const transformedEnrollments = enrollments.map((enrollment) => ({
      enrollment_id: enrollment.id,
      enrolled_at: enrollment.enrolledAt,
      progress_percentage: enrollment.progressPercentage,
      is_completed: enrollment.isCompleted,
      completed_at: enrollment.completedAt,
      last_accessed_at: enrollment.lastAccessedAt,
      course: {
        ...enrollment.course,
        author_username: enrollment.course.author.username,
        chapter_count: enrollment.course.chapters.length,
        enrollment_count: enrollment.course._count.enrollments,
        created_at: enrollment.course.createdAt,
        updated_at: enrollment.course.updatedAt,
      },
    }));

    res.json({
      enrollments: transformedEnrollments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching user enrollments:", error);
    res.status(500).json({ error: "Failed to fetch enrollments" });
  }
});

// Get user's tests for a course
router.get("/:courseId/tests", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    console.log("🔍 Fetching user tests:", { courseId, userId });

    // Verify enrollment or course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    // Check if user has access (enrolled or is the author)
    const hasAccess =
      course.authorId === userId ||
      (await prisma.courseEnrollment.findFirst({
        where: { courseId: courseId, userId: userId },
      }));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    // Get user's tests for this course
    const tests = await prisma.courseTest.findMany({
      where: {
        courseId: courseId,
        userId: userId,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("✅ Found tests:", tests.length);

    res.json({
      success: true,
      tests,
    });
  } catch (error) {
    console.error("❌ Error fetching user tests:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tests",
    });
  }
});

// Generate test for a course
router.post("/:courseId/test/generate", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    console.log("🧪 Generating test for course:", { courseId, userId });

    // Verify enrollment or course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          where: { content: { not: null } },
          select: { title: true, content: true },
        },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    // Check if user has access (enrolled or is the author)
    const hasAccess =
      course.authorId === userId ||
      (await prisma.courseEnrollment.findFirst({
        where: { courseId: courseId, userId: userId },
      }));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    if (course.chapters.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Course has no content for test generation",
      });
    }

    // Check if user already has tests for this course and implement 24hr cooldown
    const existingTests = await prisma.courseTest.findMany({
      where: {
        courseId: courseId,
        userId: userId,
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingTests.length > 0) {
      const latestTest = existingTests[0];
      const now = new Date();
      const testCreatedAt = new Date(latestTest.createdAt);
      const timeDifference = now.getTime() - testCreatedAt.getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60);
      const cooldownHours = 24;

      console.log("🕰️ Cooldown check:", {
        latestTestDate: testCreatedAt,
        currentTime: now,
        hoursPassed: hoursDifference.toFixed(2),
        cooldownRequired: cooldownHours,
        canCreateNew: hoursDifference >= cooldownHours,
      });

      // If less than 24 hours have passed since the last test
      if (hoursDifference < cooldownHours) {
        const remainingHours = cooldownHours - hoursDifference;
        const remainingMinutes = Math.ceil(remainingHours * 60);
        const remainingMs = Math.ceil(remainingHours * 60 * 60 * 1000);

        return res.status(429).json({
          success: false,
          error: "Test cooldown active",
          message: `You must wait ${Math.ceil(
            remainingHours
          )} hours before generating a new test`,
          cooldown: {
            isActive: true,
            remainingHours: Math.ceil(remainingHours),
            remainingMinutes: remainingMinutes,
            remainingMs: remainingMs,
            nextAvailableAt: new Date(
              testCreatedAt.getTime() + cooldownHours * 60 * 60 * 1000
            ).toISOString(),
            lastTestDate: latestTest.createdAt,
          },
          tests: existingTests.map((test) => ({
            id: test.id,
            status: test.status,
            score: test.score,
            hasPassed: test.hasPassed,
            marksObtained: test.marksObtained,
            totalMarks: test.totalMarks,
            createdAt: test.createdAt,
            submittedAt: test.submittedAt,
          })),
        });
      }

      // Check if there's an in-progress test
      const inProgressTest = existingTests.find(
        (test) => test.status === "in_progress"
      );
      if (inProgressTest) {
        return res.json({
          success: true,
          message: "You have an in-progress test",
          test: {
            id: inProgressTest.id,
            questions: JSON.parse(inProgressTest.questions),
            testInstructions: JSON.parse(inProgressTest.testInstructions),
            timeLimit: inProgressTest.timeLimit,
            passingScore: inProgressTest.passingScore,
            totalMarks: inProgressTest.totalMarks,
            status: inProgressTest.status,
            createdAt: inProgressTest.createdAt,
          },
          tests: existingTests.map((test) => ({
            id: test.id,
            status: test.status,
            score: test.score,
            hasPassed: test.hasPassed,
            marksObtained: test.marksObtained,
            totalMarks: test.totalMarks,
            createdAt: test.createdAt,
            submittedAt: test.submittedAt,
          })),
        });
      }
    }

    // Combine chapter content for test generation
    const courseContent = course.chapters
      .map((chapter) => `Chapter: ${chapter.title}\n${chapter.content}`)
      .join("\n\n");

    const testPrompt = `CRITICAL: You must respond with VALID JSON ONLY. No markdown, no explanations, no additional text.

You are a professional assessment specialist. Create a comprehensive certification test for the course "${course.title}" based on the provided course content.

Course: ${course.title}
Chapter Titles: ${course.chapters.map((ch) => ch.title).join(", ")}
Course Content:
${courseContent}

Create exactly 20 questions with mixed question types based on the course content:
- Multiple Choice Questions (MCQ): Use EXACT type "mcq"
- True/False Questions: Use EXACT type "true_false" (MUST use underscore, NOT slash or space)
- Short Answer Questions: Use EXACT type "short_answer" (MUST use underscore, NOT space)
- Coding/Practical Questions: Use EXACT type "coding"
- Situational Questions: Use EXACT type "situational"

CRITICAL: Question types must be EXACTLY: mcq, true_false, short_answer, coding, situational

Each question must have specific mark weightage (3-10 marks based on complexity). Total marks should be 100.

FOR MCQ QUESTIONS:
- MUST provide exactly 4 meaningful options that relate to the course content
- correctAnswer MUST be a number (0-3) indicating the index of the correct option
- Options should be course-specific, not generic
- Include plausible distractors based on course material

FOR TRUE_FALSE QUESTIONS:
- MUST provide exactly ["True", "False"] as options
- correctAnswer MUST be 0 (for True) or 1 (for False)
- Question should be a clear statement that can be definitively true or false

RESPOND WITH THIS EXACT JSON FORMAT ONLY:
{
  "questions": [
    {
      "type": "mcq",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "keyPoints": ["Key point 1", "Key point 2"],
      "sampleAnswer": "Sample correct answer",
      "explanation": "Explanation of correct answer",
      "marks": 5,
      "difficulty": "easy",
      "topic": "Relevant course topic"
    }
  ]
}

Requirements:
- Exactly 20 questions
- Total marks = 100
- Valid JSON only - no markdown, no comments, no extra text
- Cover all major course topics
- Mix difficulty levels appropriately
- Ensure all MCQ have 4 meaningful options
- Ensure all true_false have correct True/False options
- correctAnswer must always be a valid number index`;

    console.log("🤖 Calling Groq API for test generation...");
    console.log("📊 Course content length:", courseContent.length);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a professional assessment specialist. You MUST respond with valid JSON only. No markdown formatting, no code blocks, no explanations - just pure JSON.",
        },
        {
          role: "user",
          content: testPrompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3, // Lower temperature for more consistent JSON output
      max_tokens: 32000,
      response_format: { type: "json_object" }, // Request JSON format
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    console.log("🔍 Raw AI response length:", aiResponse.length);
    console.log("🔍 Response preview:", aiResponse.substring(0, 200));

    // Multi-level fallback strategies for robust JSON parsing
    let testData;

    // Strategy 1: Direct parse
    try {
      testData = JSON.parse(aiResponse);
      console.log("✅ Direct JSON parse successful");
    } catch (error1) {
      console.log("❌ Direct parse failed, trying cleanup strategies...");

      // Strategy 2: Remove markdown code blocks and extra formatting
      try {
        let cleanedResponse = aiResponse
          .replace(/```json\s*/gi, "") // Remove ```json
          .replace(/```\s*/g, "") // Remove closing ```
          .replace(/^[^{]*/, "") // Remove everything before first {
          .replace(/[^}]*$/, "") // Remove everything after last }
          .replace(/\\n/g, "\n") // Convert literal newlines
          .replace(/\\t/g, "\t") // Convert literal tabs
          .replace(/\\r/g, "\r") // Convert literal carriage returns
          .replace(/\\(?!["\\nrtbfu])/g, "") // Remove invalid escapes
          .trim();

        testData = JSON.parse(cleanedResponse);
        console.log("✅ Cleanup strategy successful");
      } catch (error2) {
        console.log("❌ Cleanup failed, trying aggressive cleaning...");

        // Strategy 3: Aggressive structural cleaning
        try {
          let structuralClean = aiResponse
            .replace(/.*?\{/s, "{") // Keep from first {
            .replace(/\}[^}]*$/s, "}") // Keep to last }
            .replace(/\\n/g, " ") // Replace literal newlines with space
            .replace(/\\t/g, " ") // Replace literal tabs with space
            .replace(/[\r\n\t]/g, " ") // Replace actual newlines/tabs
            .replace(/\s+/g, " ") // Normalize all whitespace
            .replace(/,\s*([}\]])/g, "$1") // Remove trailing commas
            .trim();

          testData = JSON.parse(structuralClean);
          console.log("✅ Aggressive cleaning successful");
        } catch (error3) {
          console.error("❌ All JSON parsing strategies failed:", {
            error1: error1.message,
            error2: error2.message,
            error3: error3.message,
          });
          console.log(
            "Original response sample:",
            aiResponse.substring(0, 500)
          );

          // Strategy 4: Build comprehensive fallback with exactly 20 questions
          console.log(
            "🔄 Building fallback questions with exactly 20 questions..."
          );

          // Generate course-specific content dynamically
          const courseTopics = course.chapters
            .map((ch) => ch.title)
            .slice(0, 5);
          const fallbackQuestions = [];

          // Create exactly 20 questions with proper distribution
          const questionTemplates = [
            { type: "mcq", marks: 5, difficulty: "easy" },
            { type: "mcq", marks: 5, difficulty: "medium" },
            { type: "mcq", marks: 5, difficulty: "easy" },
            { type: "true_false", marks: 5, difficulty: "easy" },
            { type: "true_false", marks: 5, difficulty: "medium" },
            { type: "short_answer", marks: 10, difficulty: "medium" },
            { type: "short_answer", marks: 10, difficulty: "medium" },
            { type: "coding", marks: 15, difficulty: "hard" },
            { type: "situational", marks: 15, difficulty: "hard" },
            { type: "mcq", marks: 5, difficulty: "medium" },
            { type: "true_false", marks: 5, difficulty: "easy" },
            { type: "short_answer", marks: 10, difficulty: "medium" },
            { type: "coding", marks: 10, difficulty: "hard" },
            { type: "situational", marks: 10, difficulty: "hard" },
            { type: "mcq", marks: 5, difficulty: "medium" },
            { type: "true_false", marks: 5, difficulty: "medium" },
            { type: "short_answer", marks: 5, difficulty: "easy" },
            { type: "coding", marks: 5, difficulty: "medium" },
            { type: "situational", marks: 5, difficulty: "medium" },
            { type: "mcq", marks: 5, difficulty: "easy" },
          ];

          questionTemplates.forEach((template, index) => {
            const topicIndex = index % courseTopics.length;
            const topic = courseTopics[topicIndex] || "General";

            let question;

            switch (template.type) {
              case "mcq":
                question = {
                  type: "mcq",
                  question: `What is a key concept related to ${topic} in "${course.title}"?`,
                  options: [
                    "Fundamental principles and core concepts",
                    "Advanced implementation techniques",
                    "Best practices and methodologies",
                    "All of the above",
                  ],
                  correctAnswer: 3,
                  keyPoints: ["Understanding", topic, "Application"],
                  sampleAnswer: "",
                  explanation: `Comprehensive understanding requires knowledge of principles, techniques, and best practices in ${topic}.`,
                  marks: template.marks,
                  difficulty: template.difficulty,
                  topic: topic,
                };
                break;

              case "true_false":
                question = {
                  type: "true_false",
                  question: `${topic} is an important component of "${course.title}" that requires practical application.`,
                  options: ["True", "False"],
                  correctAnswer: 0,
                  keyPoints: ["Understanding", "Application", topic],
                  sampleAnswer: "",
                  explanation: `${topic} requires both theoretical understanding and practical application for mastery.`,
                  marks: template.marks,
                  difficulty: template.difficulty,
                  topic: topic,
                };
                break;

              case "short_answer":
                question = {
                  type: "short_answer",
                  question: `Explain the importance of ${topic} in the context of "${course.title}" and provide examples.`,
                  options: [],
                  correctAnswer: null,
                  keyPoints: [
                    "Explanation",
                    "Examples",
                    "Understanding",
                    topic,
                  ],
                  sampleAnswer: `${topic} is crucial because it provides foundational knowledge and practical skills. Examples include real-world applications, best practices implementation, and problem-solving approaches.`,
                  explanation:
                    "Students should demonstrate understanding through clear explanations and relevant examples.",
                  marks: template.marks,
                  difficulty: template.difficulty,
                  topic: topic,
                };
                break;

              case "coding":
                question = {
                  type: "coding",
                  question: `Write a code implementation that demonstrates key concepts from ${topic} covered in "${course.title}".`,
                  options: [],
                  correctAnswer: null,
                  keyPoints: [
                    "Implementation",
                    "Best practices",
                    "Code quality",
                    topic,
                  ],
                  sampleAnswer: `// Example implementation for ${topic}
function demonstrate${topic.replace(/\s+/g, "")}() {
  // Implement core concepts here
  const result = applyConcepts();
  return result;
}`,
                  explanation:
                    "Students should demonstrate practical coding skills using course concepts with proper structure and best practices.",
                  marks: template.marks,
                  difficulty: template.difficulty,
                  topic: topic,
                };
                break;

              case "situational":
                question = {
                  type: "situational",
                  question: `You are working on a project that involves ${topic} from "${course.title}". Describe your approach to implementing and troubleshooting challenges.`,
                  options: [],
                  correctAnswer: null,
                  keyPoints: [
                    "Analysis",
                    "Implementation",
                    "Problem-solving",
                    topic,
                  ],
                  sampleAnswer: `I would start by analyzing the requirements related to ${topic}, plan the implementation using course principles, develop a systematic approach, test thoroughly, and address any challenges using established troubleshooting methodologies.`,
                  explanation:
                    "Students should demonstrate ability to apply course knowledge to real-world scenarios and problem-solving.",
                  marks: template.marks,
                  difficulty: template.difficulty,
                  topic: topic,
                };
                break;
            }

            fallbackQuestions.push(question);
          });

          testData = { questions: fallbackQuestions };
          console.log("✅ Generated 20 comprehensive fallback questions");
        }
      }
    }
    // Validate test data structure
    if (!testData.questions || !Array.isArray(testData.questions)) {
      throw new Error("Invalid test data structure: missing questions array");
    }

    if (testData.questions.length !== 20) {
      console.warn(
        `⚠️ Expected 20 questions, got ${testData.questions.length}`
      );

      // If we have less than 20 questions, generate additional ones to make exactly 20
      if (testData.questions.length < 20) {
        console.log(
          "🔄 Generating additional questions to reach exactly 20..."
        );
        const courseTopics = course.chapters.map((ch) => ch.title).slice(0, 5);
        const needed = 20 - testData.questions.length;

        for (let i = 0; i < needed; i++) {
          const topicIndex = i % courseTopics.length;
          const topic = courseTopics[topicIndex] || "General";

          const additionalQuestion = {
            type: i % 2 === 0 ? "mcq" : "short_answer",
            question:
              i % 2 === 0
                ? `What best describes the approach used in ${topic} within "${course.title}"?`
                : `Explain a key principle or technique related to ${topic} from "${course.title}".`,
            options:
              i % 2 === 0
                ? [
                    "Theoretical understanding only",
                    "Practical application focus",
                    "Combination of theory and practice",
                    "Advanced implementation only",
                  ]
                : [],
            correctAnswer: i % 2 === 0 ? 2 : null,
            keyPoints: ["Understanding", topic, "Application"],
            sampleAnswer:
              i % 2 === 0
                ? ""
                : `${topic} involves both theoretical knowledge and practical application, requiring understanding of core principles and their real-world implementation.`,
            explanation:
              i % 2 === 0
                ? `Effective learning combines theoretical understanding with practical application in ${topic}.`
                : "Students should demonstrate clear understanding of the concept with practical examples.",
            marks: 5,
            difficulty: "medium",
            topic: topic,
          };

          testData.questions.push(additionalQuestion);
        }

        console.log(
          `✅ Added ${needed} questions to reach exactly 20 questions`
        );
      }
    }

    // Validate each question and ensure proper structure
    let totalMarks = 0;
    console.log(`🔍 Starting validation of ${testData.questions.length} questions...`);
    
    for (let i = 0; i < testData.questions.length; i++) {
      const q = testData.questions[i];
      console.log(`🔍 Validating question ${i + 1}: type=${q.type}, hasOptions=${!!q.options}, correctAnswer=${q.correctAnswer}`);
      
      if (!q.question || !q.type || !q.explanation) {
        throw new Error(`Invalid question structure at index ${i}: missing question, type, or explanation`);
      }

      // Ensure marks field exists
      if (!q.marks) {
        q.marks = Math.floor(100 / testData.questions.length); // Default equal distribution
      }
      totalMarks += q.marks;

      // Validate question type specific fields
      if (q.type === "mcq" || q.type === "true_false") {
        // Ensure options array exists and has items
        if (!q.options || !Array.isArray(q.options) || q.options.length === 0) {
          console.log(`⚠️ Generating contextual options for question ${i + 1} (${q.type})`);
          
          if (q.type === "mcq") {
            // Generate contextual MCQ options based on question content
            const questionLower = q.question.toLowerCase();
            let contextualOptions = [];
            
            // Extract key topics from course for better options
            const courseTopics = course.chapters.map(ch => ch.title);
            const randomTopic = courseTopics[Math.floor(Math.random() * courseTopics.length)] || "General";
            
            if (questionLower.includes('what') || questionLower.includes('which')) {
              contextualOptions = [
                `Primary concept from ${randomTopic}`,
                `Secondary aspect of the topic`,
                `Advanced implementation technique`,
                `All of the above`
              ];
            } else if (questionLower.includes('how') || questionLower.includes('implement')) {
              contextualOptions = [
                "Step-by-step systematic approach",
                "Direct implementation without planning",
                "Using automated tools only",
                "Combination of manual and automated methods"
              ];
            } else if (questionLower.includes('best') || questionLower.includes('practice')) {
              contextualOptions = [
                "Follow industry standards",
                "Use personal preference",
                "Apply course methodology",
                "Combine multiple approaches"
              ];
            } else {
              // Generic but contextual options
              contextualOptions = [
                `Core principle from ${randomTopic}`,
                "Alternative approach",
                "Best practice method",
                "Comprehensive solution"
              ];
            }
            
            q.options = contextualOptions;
          } else if (q.type === "true_false") {
            q.options = ["True", "False"];
          }
        }
        
        // Ensure correctAnswer is a valid number
        if (typeof q.correctAnswer !== "number" || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
          console.log(`⚠️ Setting intelligent correctAnswer for question ${i + 1} (${q.type})`);
          
          if (q.type === "mcq") {
            // For MCQ, prefer "All of the above" or "Comprehensive solution" if available
            const allOfAboveIndex = q.options.findIndex(opt => 
              opt.toLowerCase().includes('all of the above') || 
              opt.toLowerCase().includes('comprehensive')
            );
            q.correctAnswer = allOfAboveIndex >= 0 ? allOfAboveIndex : 0;
          } else if (q.type === "true_false") {
            // For true/false, analyze question to determine likely answer
            const questionLower = q.question.toLowerCase();
            if (questionLower.includes('important') || 
                questionLower.includes('essential') || 
                questionLower.includes('requires') ||
                questionLower.includes('necessary')) {
              q.correctAnswer = 0; // True
            } else {
              q.correctAnswer = 0; // Default to True for safety
            }
          }
        }
      }

      if (
        ["short_answer", "coding", "situational"].includes(q.type) &&
        !q.keyPoints
      ) {
        q.keyPoints = ["Understanding", "Application", "Analysis"];
      }

      if (!q.difficulty) {
        q.difficulty = "medium";
      }

      if (!q.topic) {
        q.topic = "General";
      }
    }

    console.log("✅ Test data validated successfully");
    console.log(`📊 Total questions: ${testData.questions.length}, Total marks: ${totalMarks}`);
    
    // Log question types summary
    const questionTypes = testData.questions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {});
    console.log(`📊 Question types distribution:`, questionTypes);

    // Create test instructions
    const testInstructions = {
      timeLimit: 180, // 3 hours in minutes
      passingScore: 80, // 80% to pass
      instructions: [
        "This is a comprehensive certification test with 20 questions.",
        "You have exactly 3 hours to complete this test.",
        "The test cannot be paused once started.",
        "Questions include multiple choice, true/false, short answer, coding, and situational types.",
        "Each question has specific marks as indicated.",
        "You need to score at least 80% to pass and receive a certificate.",
        "If you reload the page or close the browser, the test will be automatically submitted.",
        "Make sure you have a stable internet connection.",
        "Read each question carefully before answering.",
      ],
      rules: [
        "No external help or resources allowed",
        "Do not refresh the page during the test",
        "Complete the test in one sitting",
        "Ensure honest attempt for accurate evaluation",
        "Auto-submit feature is active for security",
      ],
      questionTypes: {
        mcq: "Multiple Choice - Select the best answer from given options",
        true_false: "True/False - Determine if the statement is correct",
        short_answer: "Short Answer - Provide concise written responses",
        coding: "Coding/Practical - Demonstrate implementation skills",
        situational: "Situational - Apply knowledge to real-world scenarios",
      },
    };

    // Save test to database with correct schema fields
    const test = await prisma.courseTest.create({
      data: {
        courseId: courseId,
        userId: userId,
        questions: JSON.stringify(testData.questions),
        testInstructions: JSON.stringify(testInstructions),
        timeLimit: 180,
        passingScore: 80,
        totalMarks: testData.questions.reduce(
          (sum, q) => sum + (q.marks || 5),
          0
        ),
        status: "in_progress",
      },
    });

    console.log("✅ Test saved to database:", test.id);

    // Get all tests for this user to include in response
    const allTests = await prisma.courseTest.findMany({
      where: {
        courseId: courseId,
        userId: userId,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      message: "Test generated successfully",
      test: {
        id: test.id,
        questions: testData.questions,
        testInstructions: testInstructions,
        timeLimit: test.timeLimit,
        passingScore: test.passingScore,
        totalMarks: test.totalMarks,
        status: test.status,
        createdAt: test.createdAt,
      },
      tests: allTests.map((t) => ({
        id: t.id,
        status: t.status,
        score: t.score,
        hasPassed: t.hasPassed,
        marksObtained: t.marksObtained,
        totalMarks: t.totalMarks,
        createdAt: t.createdAt,
        submittedAt: t.submittedAt,
      })),
    });
  } catch (error) {
    console.error("❌ Error generating test:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate test",
      details: error.message,
    });
  }
});

// Submit test answers
router.post("/:courseId/test/submit", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { testId, answers } = req.body;
    const userId = req.user.id;

    console.log("📝 Test submission:", {
      courseId,
      testId,
      userId,
      answersCount: answers?.length,
    });

    if (!testId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: "Test ID and answers are required",
      });
    }

    // Get the test
    const test = await prisma.courseTest.findFirst({
      where: {
        id: testId,
        courseId: courseId,
        userId: userId, // Security: only user's own test
      },
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        error: "Test not found",
      });
    }

    if (test.status === "completed") {
      return res.status(400).json({
        success: false,
        error: "Test already completed",
      });
    }

    // Parse questions from the test
    let questions;
    try {
      questions = JSON.parse(test.questions);
    } catch (error) {
      console.error("Error parsing test questions:", error);
      return res.status(500).json({
        success: false,
        error: "Invalid test data",
      });
    }

    // Update test with answers and set to processing status
    const updatedTest = await prisma.courseTest.update({
      where: { id: testId },
      data: {
        answers: JSON.stringify(answers),
        status: "processing",
        submittedAt: new Date(),
      },
    });

    console.log("✅ Test answers saved, starting evaluation...");

    // Start evaluation in background
    evaluateTestInBackground(testId, questions, answers).catch((error) => {
      console.error("❌ Background evaluation failed:", error);
    });

    res.json({
      success: true,
      message: "Test submitted successfully",
      test: {
        id: updatedTest.id,
        status: updatedTest.status,
        submittedAt: updatedTest.submittedAt,
      },
    });
  } catch (error) {
    console.error("❌ Error submitting test:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit test",
    });
  }
});

// Validate test access - check if user can access test page
router.get(
  "/:courseId/test/:testId/validate",
  authenticateToken,
  async (req, res) => {
    try {
      const { courseId, testId } = req.params;
      const userId = req.user.id;

      console.log("🔐 Validating test access:", { courseId, testId, userId });

      // Check if test exists and belongs to user
      const test = await prisma.courseTest.findFirst({
        where: {
          id: testId,
          courseId: courseId,
          userId: userId,
        },
      });

      if (!test) {
        return res.status(404).json({
          success: false,
          error: "Test not found or access denied",
        });
      }

      // Check test status - only allow access to in_progress tests
      if (test.status !== "in_progress") {
        return res.status(403).json({
          success: false,
          error: `Test access denied. Status: ${test.status}`,
          status: test.status,
        });
      }

      // Check if test has been submitted (has answers)
      if (test.answers) {
        return res.status(403).json({
          success: false,
          error: "Test has already been submitted",
          status: test.status,
        });
      }

      // Validate enrollment or course ownership
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return res.status(404).json({
          success: false,
          error: "Course not found",
        });
      }

      const hasAccess =
        course.authorId === userId ||
        (await prisma.courseEnrollment.findFirst({
          where: { courseId: courseId, userId: userId },
        }));

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: "Course access denied",
        });
      }

      res.json({
        success: true,
        message: "Test access validated",
        testId: test.id,
        status: test.status,
      });
    } catch (error) {
      console.error("❌ Error validating test access:", error);
      res.status(500).json({
        success: false,
        error: "Failed to validate test access",
      });
    }
  }
);

// Check test status
router.get(
  "/:courseId/test/:testId/status",
  authenticateToken,
  async (req, res) => {
    try {
      const { courseId, testId } = req.params;
      const userId = req.user.id;

      const test = await prisma.courseTest.findFirst({
        where: {
          id: testId,
          courseId: courseId,
          userId: userId, // Security: only user's own test
        },
      });

      if (!test) {
        return res.status(404).json({
          success: false,
          error: "Test not found",
        });
      }

      res.json({
        success: true,
        status: test.status,
        score: test.score,
        hasPassed: test.hasPassed,
        marksObtained: test.marksObtained,
        totalMarks: test.totalMarks,
        submittedAt: test.submittedAt,
        updatedAt: test.updatedAt,
        evaluationResults: test.evaluationResults, // Include evaluation results
      });
    } catch (error) {
      console.error("❌ Error checking test status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to check test status",
      });
    }
  }
);

// Background evaluation function
async function evaluateTestInBackground(testId, questions, answers) {
  try {
    console.log("🔄 Starting background evaluation for test:", testId);
    console.log("📊 Questions count:", questions.length);
    console.log("📊 Answers count:", answers.length);
    console.log("📊 Sample question:", questions[0]);
    console.log("📊 Sample answer:", answers[0]);

    // Calculate score
    let correctAnswers = 0;
    let totalMarks = 0;
    let marksObtained = 0;
    let breakdown = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const userAnswer = answers[i];
      const questionMarks = question.marks || 5; // Use 'marks' field, default to 5
      totalMarks += questionMarks;

      let isCorrect = false;
      let correctAnswer = null;

      // Handle different question types
      if (question.type === "mcq" || question.type === "true_false") {
        // For MCQ/True-False, correctAnswer is an index
        if (question.options && typeof question.correctAnswer === "number") {
          correctAnswer = question.options[question.correctAnswer];
          isCorrect = userAnswer === correctAnswer;
        }
      } else if (
        ["short_answer", "coding", "situational"].includes(question.type)
      ) {
        // For open-ended questions, use AI evaluation
        correctAnswer = question.sampleAnswer || "Sample answer not available";

        if (userAnswer && userAnswer.trim().length > 0) {
          try {
            // Use Groq AI to evaluate the answer
            const evaluationPrompt = `
Evaluate this answer for the given question. Provide a score from 0 to ${questionMarks}.

Question: ${question.question}

Expected Answer/Key Points: ${JSON.stringify(
              question.keyPoints || ["Understanding", "Application", "Analysis"]
            )}

Sample Answer: ${question.sampleAnswer || "Not provided"}

Student Answer: ${userAnswer}

Evaluation Criteria:
- Accuracy and correctness
- Completeness of answer
- Demonstration of understanding
- Practical application (if applicable)

Provide ONLY a JSON response in this exact format:
{
  "score": <number between 0 and ${questionMarks}>,
  "feedback": "<brief explanation of the score>",
  "isCorrect": <true if score >= ${Math.ceil(questionMarks * 0.6)}>
}`;

            const completion = await groq.chat.completions.create({
              messages: [
                {
                  role: "user",
                  content: evaluationPrompt,
                },
              ],
              model: "llama-3.3-70b-versatile",
              temperature: 0.3,
              max_tokens: 500,
            });

            const aiResponse = completion.choices[0]?.message?.content;
            if (aiResponse) {
              try {
                const evaluation = JSON.parse(aiResponse);
                const aiScore = Math.min(
                  Math.max(evaluation.score || 0, 0),
                  questionMarks
                );
                isCorrect =
                  evaluation.isCorrect ||
                  aiScore >= Math.ceil(questionMarks * 0.6);
                marksObtained += aiScore;

                breakdown.push({
                  questionIndex: i,
                  questionType: question.type,
                  question: question.question,
                  userAnswer: userAnswer,
                  correctAnswer: correctAnswer,
                  isCorrect: isCorrect,
                  points: aiScore,
                  maxPoints: questionMarks,
                  aiEvaluation: {
                    score: aiScore,
                    feedback: evaluation.feedback || "AI evaluation completed",
                    maxScore: questionMarks,
                  },
                });

                if (isCorrect) {
                  correctAnswers++;
                }
                continue; // Skip the regular breakdown.push() below
              } catch (parseError) {
                console.error("Error parsing AI evaluation:", parseError);
                // Fall back to basic evaluation
                isCorrect = userAnswer.trim().length > 10;
              }
            }
          } catch (aiError) {
            console.error("Error with AI evaluation:", aiError);
            // Fall back to basic evaluation
            isCorrect = userAnswer.trim().length > 10;
          }
        }
      }

      // For MCQ and true_false that didn't get handled above, or fallback for AI evaluation
      if (isCorrect) {
        correctAnswers++;
        // For AI-evaluated questions, marksObtained is already added above
        if (
          !(
            ["short_answer", "coding", "situational"].includes(question.type) &&
            userAnswer &&
            userAnswer.trim().length > 0
          )
        ) {
          marksObtained += questionMarks;
        }
      }

      breakdown.push({
        questionIndex: i,
        questionType: question.type,
        question: question.question,
        userAnswer: userAnswer || "No answer provided",
        correctAnswer: correctAnswer,
        isCorrect: isCorrect,
        points: isCorrect ? questionMarks : 0,
        maxPoints: questionMarks,
      });
    }

    const score =
      questions.length > 0
        ? Math.round((correctAnswers / questions.length) * 100)
        : 0;
    const hasPassed = score >= 80; // 80% passing threshold

    // Create evaluation results
    const evaluationResults = {
      correctAnswers,
      totalQuestions: questions.length,
      score,
      hasPassed,
      marksObtained,
      totalMarks,
      evaluatedAt: new Date().toISOString(),
      breakdown: breakdown,
    };

    console.log("📊 Evaluation results:", {
      testId,
      correctAnswers,
      totalQuestions: questions.length,
      score,
      hasPassed,
      marksObtained,
      totalMarks,
    });

    // Update test with results
    await prisma.courseTest.update({
      where: { id: testId },
      data: {
        score: score,
        hasPassed: hasPassed,
        marksObtained: marksObtained,
        totalMarks: totalMarks, // Also update totalMarks in case it wasn't set correctly
        evaluationResults: JSON.stringify(evaluationResults),
        status: "completed",
      },
    });

    console.log("✅ Test evaluated:", {
      score,
      hasPassed,
      marksObtained,
      totalMarks,
    });
  } catch (error) {
    console.error("❌ Error in background evaluation:", error);

    // Update test with error status
    try {
      await prisma.courseTest.update({
        where: { id: testId },
        data: {
          status: "evaluation_failed",
        },
      });
    } catch (updateError) {
      console.error(
        "❌ Error updating test status to evaluation_failed:",
        updateError
      );
    }
  }
}

// Download certificate for completed test
router.get(
  "/:courseId/test/:testId/certificate",
  authenticateToken,
  async (req, res) => {
    try {
      const { courseId, testId } = req.params;
      const userId = req.user.id;

      console.log("🏆 Certificate download request:", {
        courseId,
        testId,
        userId,
      });

      // Get the test with validation
      const test = await prisma.courseTest.findFirst({
        where: {
          id: testId,
          courseId: courseId,
          userId: userId, // Security: only user's own test
        },
        include: {
          course: {
            select: {
              title: true,
              author: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
      });

      if (!test) {
        return res.status(404).json({
          success: false,
          error: "Test not found or access denied",
        });
      }

      // Validate test is completed and passed
      if (test.status !== "completed") {
        return res.status(400).json({
          success: false,
          error: "Test must be completed to download certificate",
        });
      }

      if (!test.hasPassed) {
        return res.status(400).json({
          success: false,
          error: "Test must be passed to download certificate",
        });
      }

      // Get user information
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          username: true,
          email: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Prepare certificate data
      const certificateData = {
        studentName: user.username,
        courseName: test.course.title,
        instructorName: test.course.author.username,
        completionDate: new Date(test.submittedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        certificateId: test.id,
        score: test.score || 0,
        totalMarks: test.totalMarks || 100,
        marksObtained: test.marksObtained || 0,
      };

      console.log("✅ Certificate data prepared:", {
        studentName: certificateData.studentName,
        courseName: certificateData.courseName,
        score: certificateData.score,
        certificateId: certificateData.certificateId,
      });

      res.json({
        success: true,
        message: "Certificate data retrieved successfully",
        certificateData,
      });
    } catch (error) {
      console.error("❌ Error retrieving certificate data:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve certificate data",
      });
    }
  }
);

// Certificate verification endpoint (public access)
router.get("/verify-certificate/:certificateId", async (req, res) => {
  try {
    const { certificateId } = req.params;

    console.log("🔍 Certificate verification request:", {
      certificateId,
    });

    // Get the test with certificate validation
    const test = await prisma.courseTest.findFirst({
      where: {
        id: certificateId,
        status: "completed",
        hasPassed: true,
      },
      include: {
        course: {
          select: {
            title: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!test) {
      return res.json({
        success: true,
        isValid: false,
        error: "Certificate not found or invalid",
      });
    }

    // Prepare certificate verification data
    const certificateDetails = {
      studentName: test.user.username,
      courseName: test.course.title,
      instructorName: test.course.author.username,
      completionDate: new Date(test.submittedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      certificateId: test.id,
      score: test.score || 0,
      totalMarks: test.totalMarks || 100,
      marksObtained: test.marksObtained || 0,
      issueDate: new Date(test.submittedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };

    console.log("✅ Certificate verification successful:", {
      certificateId,
      studentName: certificateDetails.studentName,
      courseName: certificateDetails.courseName,
    });

    res.json({
      success: true,
      isValid: true,
      certificateDetails,
    });
  } catch (error) {
    console.error("❌ Error verifying certificate:", error);
    res.status(500).json({
      success: false,
      isValid: false,
      error: "Failed to verify certificate",
    });
  }
});

export default router;
