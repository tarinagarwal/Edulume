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
          message: `You must wait ${Math.ceil(remainingHours)} hours before generating a new test`,
          cooldown: {
            isActive: true,
            remainingHours: Math.ceil(remainingHours),
            remainingMinutes: remainingMinutes,
            remainingMs: remainingMs,
            nextAvailableAt: new Date(testCreatedAt.getTime() + (cooldownHours * 60 * 60 * 1000)).toISOString(),
            lastTestDate: latestTest.createdAt,
          },
          tests: existingTests.map(test => ({
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
      const inProgressTest = existingTests.find(test => test.status === "in_progress");
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
          tests: existingTests.map(test => ({
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

    const testPrompt = `As a professional assessment specialist, create a comprehensive certification test for the course "${
      course.title
    }" based on the provided course content.

Course: ${course.title}
Chapter Titles: ${course.chapters.map((ch) => ch.title).join(", ")}
Course Content:
${courseContent}

INSTRUCTIONS:
Create exactly 20 questions with mixed question types. Analyze the course content and automatically determine the optimal distribution of question types based on the subject matter:

- Multiple Choice Questions (MCQ): For concept testing and knowledge verification
- Always provide a vaild json response
- True/False Questions: For fundamental principle validation
- Short Answer Questions: For explanation and understanding assessment
- Coding/Practical Questions: For technical courses requiring implementation skills
- Situational Questions: For real-world application and problem-solving scenarios

Each question must have specific mark weightage (3-10 marks based on complexity). Total marks should be 100.

Respond with a JSON object ONLY in this exact format:
{
  "questions": [
    {
      "type": "mcq|true_false|short_answer|coding|situational",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"], // Only for MCQ and True/False
      "correctAnswer": 0, // Index for MCQ/True-False, null for others
      "keyPoints": ["Key point 1", "Key point 2"], // For evaluation of open-ended questions
      "sampleAnswer": "Sample correct answer", // For short answer/coding/situational
      "explanation": "Explanation of correct answer or evaluation criteria",
      "marks": 5, // Marks for this question
      "difficulty": "easy|medium|hard",
      "topic": "Relevant course topic"
    }
  ]
}

Requirements:
- Exactly 20 questions
- Mix of question types appropriate for the course subject
- Total marks = 100
- Professional assessment quality
- Cover all major course topics
- Progressive difficulty levels
- Valid JSON format with no extra text`;

    console.log("🤖 Calling Groq API for test generation...");

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: testPrompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 32000,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    console.log("🔍 Raw AI response length:", aiResponse.length);

    // Enhanced JSON parsing with multiple fallback strategies
    let testData;
    try {
      // Strategy 1: Direct parse
      testData = JSON.parse(aiResponse);
    } catch (error1) {
      console.log("❌ Direct parse failed, trying cleanup...");
      try {
        // Strategy 2: Handle literal \n characters and other common issues
        let cleanedResponse = aiResponse
          .replace(/\\n/g, " ") // Replace literal \n with space
          .replace(/\\t/g, " ") // Replace literal \t with space
          .replace(/\\r/g, " ") // Replace literal \r with space
          .replace(/\\""?/g, '"') // Fix escaped quotes
          .replace(/"\\/g, '"') // Fix trailing escapes
          .replace(/\\(?!["\\nrtbfu])/g, "") // Remove invalid escapes
          .replace(/\n\s*\n/g, " ") // Replace multiple newlines
          .replace(/[\r\n\t]/g, " ") // Replace actual newlines/tabs
          .replace(/\s+/g, " ") // Normalize whitespace
          .trim();

        // Extract JSON if wrapped in markdown or other text
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[0];
        }

        testData = JSON.parse(cleanedResponse);
      } catch (error2) {
        console.log("❌ Cleanup parse failed, trying aggressive cleanup...");
        try {
          // Strategy 3: Very aggressive cleanup
          let aggressiveClean = aiResponse
            .replace(/.*?\{/s, "{") // Remove everything before first {
            .replace(/\}.*$/s, "}") // Remove everything after last }
            .replace(/\\n/g, " ")
            .replace(/\\t/g, " ")
            .replace(/\\r/g, " ")
            .replace(/[\r\n\t]/g, " ")
            .replace(/\\(?!["\\nrtbfu])/g, "")
            .replace(/\s+/g, " ")
            .replace(/,\s*\}/g, "}")
            .replace(/,\s*\]/g, "]")
            .trim();

          testData = JSON.parse(aggressiveClean);
        } catch (error3) {
          console.error("❌ All parsing strategies failed:", {
            error1: error1.message,
            error2: error2.message,
            error3: error3.message,
          });
          console.log(
            "Original response sample:",
            aiResponse.substring(0, 500)
          );

          // Strategy 4: Fallback to hardcoded questions
          console.log("🔄 Using fallback questions...");
          testData = {
            questions: [
              {
                type: "mcq",
                question: `What is the main topic of the course "${course.title}"?`,
                options: [
                  course.title,
                  "General Programming",
                  "Web Development",
                  "Data Science",
                ],
                correctAnswer: 0,
                keyPoints: ["Course identification", "Topic understanding"],
                sampleAnswer: "",
                explanation: `This course focuses on ${course.title}.`,
                marks: 5,
                difficulty: "easy",
                topic: "Course Overview",
              },
              {
                type: "mcq",
                question:
                  "Which of the following is a key concept covered in this course?",
                options: [
                  "Basic principles",
                  "Advanced techniques",
                  "Best practices",
                  "All of the above",
                ],
                correctAnswer: 3,
                keyPoints: ["Concept identification", "Course content"],
                sampleAnswer: "",
                explanation:
                  "Comprehensive courses typically cover basic principles, advanced techniques, and best practices.",
                marks: 5,
                difficulty: "easy",
                topic: "Course Content",
              },
              {
                type: "true_false",
                question:
                  "This course provides practical knowledge that can be applied in real-world scenarios.",
                options: ["True", "False"],
                correctAnswer: 0,
                keyPoints: ["Practical application", "Real-world relevance"],
                sampleAnswer: "",
                explanation:
                  "Educational courses are designed to provide practical, applicable knowledge.",
                marks: 5,
                difficulty: "easy",
                topic: "Course Application",
              },
              {
                type: "short_answer",
                question:
                  "Describe the main learning objectives of this course.",
                options: [],
                correctAnswer: null,
                keyPoints: [
                  "Learning objectives",
                  "Course goals",
                  "Skill development",
                ],
                sampleAnswer:
                  "The main learning objectives include understanding core concepts, developing practical skills, and applying knowledge in real-world scenarios.",
                explanation:
                  "Students should identify and articulate the primary learning goals and outcomes.",
                marks: 10,
                difficulty: "medium",
                topic: "Learning Objectives",
              },
              {
                type: "situational",
                question:
                  "How would you apply the knowledge from this course to solve a practical problem in your field?",
                options: [],
                correctAnswer: null,
                keyPoints: [
                  "Practical application",
                  "Problem-solving",
                  "Knowledge transfer",
                ],
                sampleAnswer:
                  "I would analyze the problem, identify relevant course concepts, develop a solution strategy, and implement it using best practices learned.",
                explanation:
                  "Students should demonstrate ability to transfer course knowledge to practical situations.",
                marks: 15,
                difficulty: "hard",
                topic: "Practical Application",
              },
              {
                type: "mcq",
                question:
                  "What is an important aspect to consider when working with the concepts from this course?",
                options: [
                  "Speed over accuracy",
                  "Accuracy and understanding",
                  "Shortcuts only",
                  "Ignoring details",
                ],
                correctAnswer: 1,
                keyPoints: ["Understanding", "Application", "Best practices"],
                sampleAnswer: "",
                explanation:
                  "Proper understanding and accuracy are fundamental for successful application of course concepts.",
                marks: 5,
                difficulty: "medium",
                topic: "Course Application",
              },
              {
                type: "true_false",
                question:
                  "Regular practice is essential for mastering course concepts.",
                options: ["True", "False"],
                correctAnswer: 0,
                keyPoints: ["Practice", "Mastery", "Skill development"],
                sampleAnswer: "",
                explanation:
                  "Regular practice reinforces learning and builds competence.",
                marks: 5,
                difficulty: "easy",
                topic: "Learning Strategy",
              },
              {
                type: "coding",
                question:
                  "Write a simple implementation that demonstrates a key concept from this course.",
                options: [],
                correctAnswer: null,
                keyPoints: [
                  "Implementation skills",
                  "Code structure",
                  "Best practices",
                ],
                sampleAnswer:
                  "// Example implementation\nfunction demonstrateConcept() {\n  // Apply course concepts here\n  return 'Course concept applied';\n}",
                explanation:
                  "Students should demonstrate practical implementation skills using course concepts.",
                marks: 15,
                difficulty: "hard",
                topic: "Practical Implementation",
              },
              {
                type: "mcq",
                question:
                  "What is the best approach to learning new concepts in this field?",
                options: [
                  "Memorization only",
                  "Understanding and practice",
                  "Reading once",
                  "Avoiding challenges",
                ],
                correctAnswer: 1,
                keyPoints: ["Learning approach", "Understanding", "Practice"],
                sampleAnswer: "",
                explanation:
                  "Understanding combined with practice creates lasting knowledge.",
                marks: 5,
                difficulty: "medium",
                topic: "Learning Methodology",
              },
              {
                type: "short_answer",
                question:
                  "Explain how you would troubleshoot a common problem in this field.",
                options: [],
                correctAnswer: null,
                keyPoints: [
                  "Problem analysis",
                  "Troubleshooting steps",
                  "Solution implementation",
                ],
                sampleAnswer:
                  "I would first analyze the problem, identify potential causes, apply systematic troubleshooting steps, and implement the most appropriate solution.",
                explanation:
                  "Students should demonstrate systematic problem-solving skills.",
                marks: 10,
                difficulty: "medium",
                topic: "Problem Solving",
              },
              {
                type: "situational",
                question:
                  "You encounter a complex challenge that requires multiple course concepts. How do you approach it?",
                options: [],
                correctAnswer: null,
                keyPoints: [
                  "Complex problem solving",
                  "Concept integration",
                  "Strategic thinking",
                ],
                sampleAnswer:
                  "I would break down the challenge into smaller components, identify relevant course concepts for each part, create an integrated solution plan, and implement it systematically.",
                explanation:
                  "Students should show ability to integrate multiple concepts for complex problem solving.",
                marks: 15,
                difficulty: "hard",
                topic: "Advanced Problem Solving",
              },
              {
                type: "true_false",
                question:
                  "Continuous learning is important for staying current in this field.",
                options: ["True", "False"],
                correctAnswer: 0,
                keyPoints: [
                  "Continuous learning",
                  "Professional development",
                  "Industry trends",
                ],
                sampleAnswer: "",
                explanation:
                  "Fields evolve rapidly, making continuous learning essential for professional success.",
                marks: 5,
                difficulty: "easy",
                topic: "Professional Development",
              },
              {
                type: "mcq",
                question:
                  "Which factor is most important for successful project completion?",
                options: [
                  "Speed alone",
                  "Planning and execution",
                  "Perfect tools",
                  "Individual work only",
                ],
                correctAnswer: 1,
                keyPoints: ["Project management", "Planning", "Execution"],
                sampleAnswer: "",
                explanation:
                  "Proper planning and systematic execution are key to successful project outcomes.",
                marks: 5,
                difficulty: "medium",
                topic: "Project Management",
              },
              {
                type: "coding",
                question:
                  "Create a function that validates input according to course best practices.",
                options: [],
                correctAnswer: null,
                keyPoints: [
                  "Input validation",
                  "Error handling",
                  "Best practices",
                ],
                sampleAnswer:
                  "function validateInput(input) {\n  if (!input || typeof input !== 'string') {\n    throw new Error('Invalid input');\n  }\n  return input.trim();\n}",
                explanation:
                  "Students should implement proper validation with error handling following course principles.",
                marks: 10,
                difficulty: "medium",
                topic: "Input Validation",
              },
              {
                type: "short_answer",
                question:
                  "What are the key considerations when designing a solution architecture?",
                options: [],
                correctAnswer: null,
                keyPoints: [
                  "Scalability",
                  "Maintainability",
                  "Performance",
                  "Security",
                ],
                sampleAnswer:
                  "Key considerations include scalability for future growth, maintainability for long-term support, performance optimization, security requirements, and adherence to established patterns.",
                explanation:
                  "Students should demonstrate understanding of architectural principles and design considerations.",
                marks: 10,
                difficulty: "medium",
                topic: "Solution Architecture",
              },
              {
                type: "mcq",
                question:
                  "What is the most effective way to handle errors in production systems?",
                options: [
                  "Ignore them",
                  "Log and handle gracefully",
                  "Stop the system",
                  "Hide from users",
                ],
                correctAnswer: 1,
                keyPoints: ["Error handling", "Logging", "System reliability"],
                sampleAnswer: "",
                explanation:
                  "Proper logging and graceful error handling maintain system stability and user experience.",
                marks: 5,
                difficulty: "medium",
                topic: "Error Management",
              },
              {
                type: "situational",
                question:
                  "A stakeholder requests a feature that conflicts with best practices. How do you handle this?",
                options: [],
                correctAnswer: null,
                keyPoints: [
                  "Stakeholder communication",
                  "Technical advocacy",
                  "Compromise solutions",
                ],
                sampleAnswer:
                  "I would explain the technical concerns, propose alternative solutions that meet their needs while following best practices, and work collaboratively to find an acceptable compromise.",
                explanation:
                  "Students should demonstrate professional communication and technical leadership skills.",
                marks: 15,
                difficulty: "hard",
                topic: "Stakeholder Management",
              },
              {
                type: "true_false",
                question: "Documentation is optional for small projects.",
                options: ["True", "False"],
                correctAnswer: 1,
                keyPoints: [
                  "Documentation importance",
                  "Project maintenance",
                  "Knowledge sharing",
                ],
                sampleAnswer: "",
                explanation:
                  "Documentation is essential for all projects to ensure maintainability and knowledge transfer.",
                marks: 5,
                difficulty: "easy",
                topic: "Documentation",
              },
              {
                type: "coding",
                question:
                  "Implement a basic optimization technique discussed in the course.",
                options: [],
                correctAnswer: null,
                keyPoints: [
                  "Optimization techniques",
                  "Performance improvement",
                  "Efficient algorithms",
                ],
                sampleAnswer:
                  "// Example: Memoization for performance\nconst cache = {};\nfunction optimizedFunction(input) {\n  if (cache[input]) return cache[input];\n  const result = expensiveOperation(input);\n  cache[input] = result;\n  return result;\n}",
                explanation:
                  "Students should implement optimization techniques that improve performance while maintaining code clarity.",
                marks: 15,
                difficulty: "hard",
                topic: "Performance Optimization",
              },
              {
                type: "short_answer",
                question:
                  "Describe the testing strategy you would implement for a project using course principles.",
                options: [],
                correctAnswer: null,
                keyPoints: [
                  "Testing strategy",
                  "Test coverage",
                  "Quality assurance",
                ],
                sampleAnswer:
                  "I would implement a multi-layered testing approach including unit tests for individual components, integration tests for system interactions, and end-to-end tests for user workflows, ensuring comprehensive coverage and continuous quality validation.",
                explanation:
                  "Students should demonstrate understanding of comprehensive testing methodologies.",
                marks: 10,
                difficulty: "medium",
                topic: "Testing Strategy",
              },
            ],
          };
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
    }

    // Validate each question and ensure proper structure
    let totalMarks = 0;
    for (let i = 0; i < testData.questions.length; i++) {
      const q = testData.questions[i];
      if (!q.question || !q.type || !q.explanation) {
        throw new Error(`Invalid question structure at index ${i}`);
      }

      // Ensure marks field exists
      if (!q.marks) {
        q.marks = Math.floor(100 / testData.questions.length); // Default equal distribution
      }
      totalMarks += q.marks;

      // Validate question type specific fields
      if (
        (q.type === "mcq" || q.type === "true_false") &&
        (!q.options || typeof q.correctAnswer !== "number")
      ) {
        throw new Error(
          `MCQ/True-False question ${i + 1} missing options or correctAnswer`
        );
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
      tests: allTests.map(t => ({
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

export default router;
