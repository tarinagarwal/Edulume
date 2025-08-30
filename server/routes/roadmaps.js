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
    req.user = null;
    next();
  }
};

const router = express.Router();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Enhanced roadmap generation prompt
const ROADMAP_GENERATION_PROMPT = (topic) => `
Create a comprehensive and detailed learning roadmap for "${topic}". The roadmap should be extremely detailed and include:

1. Clear progression from beginner to advanced levels
2. Required skills and technologies with detailed explanations
3. Extensive list of learning resources including:
   - Official documentation
   - Interactive tutorials
   - Video courses
   - Books
   - Practice exercises
4. Best practices and industry standards
5. Common pitfalls and how to avoid them
6. Detailed project ideas with increasing complexity
7. Recommended tools and development environment setup
8. Estimated time frames for each stage
9. Career progression opportunities
10. Industry certifications if applicable

CRITICAL: Your response must be ONLY a valid JSON object. Do not include any explanatory text, markdown formatting, or code blocks. Start your response with { and end with }. The JSON must be properly formatted and parseable.

IMPORTANT FORMATTING RULES:
- Use only regular ASCII characters (no Unicode dashes, smart quotes, etc.)
- Use regular hyphens (-) not em-dashes (—) or en-dashes (–)
- Use regular quotes (") not smart quotes (" ")
- Do not use markdown formatting like **bold** or *italic*
- All property names must be in double quotes
- All string values must be in double quotes

Format:
{
  "title": "Main topic title",
  "description": "Comprehensive overview of the learning path",
  "stages": [
    {
      "level": "Beginner/Intermediate/Advanced",
      "title": "Stage title",
      "description": "Detailed description of this stage",
      "skills": [
        {
          "name": "Skill name",
          "description": "Detailed explanation of the skill",
          "importance": "Why this skill is crucial"
        }
      ],
      "resources": [
        {
          "name": "Resource name",
          "type": "Documentation/Tutorial/Course/Book/Video",
          "url": "URL if applicable",
          "description": "Detailed description of the resource",
          "format": "Text/Video/Interactive",
          "difficulty": "Beginner/Intermediate/Advanced",
          "estimated_time": "Time to complete this resource",
          "prerequisites": ["Required prerequisites"],
          "cost": "Free/Paid/Subscription"
        }
      ],
      "timeframe": "Estimated time to complete this stage",
      "projects": [
        {
          "name": "Project name",
          "description": "Detailed project description",
          "learning_objectives": ["What you'll learn"],
          "features": ["Key features to implement"],
          "skills_practiced": ["Skills you'll practice"],
          "difficulty": "Beginner/Intermediate/Advanced",
          "estimated_time": "Time to complete",
          "resources": ["Helpful resources for this project"],
          "next_steps": ["How to extend this project"]
        }
      ],
      "best_practices": [
        {
          "title": "Best practice name",
          "description": "Detailed explanation",
          "examples": ["Good and bad examples"]
        }
      ],
      "common_pitfalls": [
        {
          "issue": "Pitfall description",
          "solution": "How to avoid or resolve it"
        }
      ]
    }
  ],
  "tools": [
    {
      "name": "Tool name",
      "category": "Category of tool",
      "description": "Detailed description",
      "url": "Official website/docs",
      "setup_guide": "Basic setup instructions",
      "alternatives": ["Alternative tools"],
      "pros": ["Advantages"],
      "cons": ["Disadvantages"]
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "provider": "Certification provider",
      "level": "Beginner/Intermediate/Advanced",
      "description": "What the certification covers",
      "url": "Official certification page",
      "cost": "Certification cost",
      "validity": "How long it's valid",
      "preparation_resources": ["Study resources"]
    }
  ],
  "career_path": {
    "roles": ["Possible job roles"],
    "skills_required": ["Required skills for each role"],
    "progression": ["Career progression steps"],
    "salary_range": "Typical salary range"
  }
}

Make sure all URLs are valid and working. Use only well-known, established resources like:
- Official documentation sites
- MDN Web Docs
- W3Schools
- FreeCodeCamp
- Coursera
- edX
- Udemy
- YouTube channels with millions of subscribers
- GitHub repositories with thousands of stars
- Stack Overflow
- Reddit communities

Ensure the roadmap is comprehensive, practical, and provides real value to learners.
`;

// Get all roadmaps with filters and search (with optional auth)
router.get("/", optionalAuth, async (req, res) => {
  try {
    console.log("🗺️ Starting roadmaps request...");

    const {
      search,
      filter = "all", // all, my-roadmaps, bookmarked
      sort = "recent",
      page = 1,
      limit = 12,
    } = req.query;

    const userId = req.user?.id;
    console.log("🗺️ Roadmaps request:", {
      userId: userId || "anonymous",
      filter,
      search: search || "none",
    });

    let where = {};

    // Apply filters
    if (filter === "my-roadmaps" && userId) {
      where.authorId = userId;
    } else if (filter === "bookmarked" && userId) {
      where.bookmarks = {
        some: {
          userId: userId,
        },
      };
    } else {
      // For "all" roadmaps, only show public roadmaps unless it's the author
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

    const [roadmaps, total] = await Promise.all([
      prisma.roadmap.findMany({
        where,
        include: {
          author: {
            select: { username: true },
          },
          bookmarks: userId
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
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.roadmap.count({ where }),
    ]);

    // Transform the response
    const transformedRoadmaps = roadmaps.map((roadmap) => ({
      ...roadmap,
      author_username: roadmap.author.username,
      bookmark_count: roadmap._count.bookmarks,
      is_bookmarked: userId ? roadmap.bookmarks.length > 0 : false,
      created_at: roadmap.createdAt,
      updated_at: roadmap.updatedAt,
    }));

    res.json({
      roadmaps: transformedRoadmaps,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching roadmaps:", error);
    res.status(500).json({ error: "Failed to fetch roadmaps" });
  }
});

// Get single roadmap
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
      include: {
        author: {
          select: { username: true },
        },
        bookmarks: userId
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
          },
        },
      },
    });

    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    // Check if user can access this roadmap
    if (!roadmap.isPublic && roadmap.authorId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update view count
    await prisma.roadmap.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    // Transform the response
    const roadmapDetails = {
      ...roadmap,
      author_username: roadmap.author.username,
      bookmark_count: roadmap._count.bookmarks,
      is_bookmarked: userId ? roadmap.bookmarks.length > 0 : false,
      created_at: roadmap.createdAt,
      updated_at: roadmap.updatedAt,
    };

    res.json({ roadmap: roadmapDetails });
  } catch (error) {
    console.error("Error fetching roadmap:", error);
    res.status(500).json({ error: "Failed to fetch roadmap" });
  }
});

// Generate roadmap using Groq
router.post("/generate", authenticateToken, async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    console.log("🤖 Generating roadmap for topic:", topic);
    console.log("🤖 Using model: openai/gpt-oss-120b with 32k tokens");

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: ROADMAP_GENERATION_PROMPT(topic),
        },
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.7,
      max_tokens: 65536,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated");
    }

    console.log("🤖 Generated roadmap content length:", content.length);

    // Clean and extract JSON from the response
    let cleanedContent = content.trim();

    // Try to extract JSON if it's wrapped in markdown code blocks
    const jsonMatch = cleanedContent.match(
      /```(?:json)?\s*(\{[\s\S]*\})\s*```/
    );
    if (jsonMatch) {
      cleanedContent = jsonMatch[1];
    }

    // Clean up common text formatting issues that break JSON
    cleanedContent = cleanedContent
      // Replace Unicode dashes with regular hyphens
      .replace(/[‑–—]/g, "-")
      // Replace smart quotes with regular quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Remove markdown bold formatting from property names
      .replace(/\*\*([^*]+)\*\*/g, '"$1"')
      // Fix any remaining markdown formatting
      .replace(/\*([^*]+)\*/g, "$1")
      // Remove any other control characters that might break JSON
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

    // Find the first { and last } to extract just the JSON object
    const firstBrace = cleanedContent.indexOf("{");
    const lastBrace = cleanedContent.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedContent = cleanedContent.substring(firstBrace, lastBrace + 1);
    }

    console.log(
      "🧹 Cleaned content preview:",
      cleanedContent.substring(0, 200) + "..."
    );

    // Parse the JSON response
    let roadmap;
    try {
      roadmap = JSON.parse(cleanedContent);
    } catch (parseError) {
      // Try to fix common JSON issues
      console.log("🔧 Attempting to fix JSON issues...");

      let fixedContent = cleanedContent
        // Fix trailing commas
        .replace(/,(\s*[}\]])/g, "$1")
        // Fix unescaped quotes in strings (basic attempt)
        .replace(/([^\\])"([^"]*)"([^,}\]:])/g, '$1\\"$2\\"$3')
        // Remove any trailing commas before closing braces/brackets
        .replace(/,(\s*})/g, "$1")
        .replace(/,(\s*\])/g, "$1");

      try {
        roadmap = JSON.parse(fixedContent);
        console.log("✅ Successfully fixed JSON issues");
      } catch (secondParseError) {
        console.error(
          "Failed to parse JSON even after fixes:",
          secondParseError
        );
        console.error("Original parse error:", parseError);
        console.error("Original content length:", content.length);
        console.error("Cleaned content length:", cleanedContent.length);
        console.error(
          "Content that failed to parse (first 1000 chars):",
          cleanedContent.substring(0, 1000)
        );
        console.error(
          "Content that failed to parse (last 500 chars):",
          cleanedContent.substring(Math.max(0, cleanedContent.length - 500))
        );

        // Try to provide a more helpful error message
        const errorPosition = parseError.message.match(/position (\d+)/);
        if (errorPosition) {
          const pos = parseInt(errorPosition[1]);
          const contextStart = Math.max(0, pos - 50);
          const contextEnd = Math.min(cleanedContent.length, pos + 50);
          console.error(
            "Error context:",
            cleanedContent.substring(contextStart, contextEnd)
          );
        }

        throw new Error(`Invalid JSON response from AI: ${parseError.message}`);
      }
    }

    // Basic validation of the roadmap structure
    if (!roadmap || typeof roadmap !== "object") {
      throw new Error("Generated roadmap is not a valid object");
    }

    if (!roadmap.title || !roadmap.description || !roadmap.stages) {
      console.warn("⚠️ Generated roadmap missing required fields:", {
        hasTitle: !!roadmap.title,
        hasDescription: !!roadmap.description,
        hasStages: !!roadmap.stages,
      });
    }

    console.log("✅ Successfully generated and parsed roadmap");
    res.json(roadmap);
  } catch (error) {
    console.error("Error generating roadmap:", error);
    res.status(500).json({
      error: "Failed to generate roadmap",
      details: error.message,
    });
  }
});

// Create roadmap from generated content
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, description, topic, content, isPublic = true } = req.body;

    if (!title || !description || !topic || !content) {
      return res.status(400).json({
        error: "Title, description, topic, and content are required",
      });
    }

    console.log("🗺️ Creating roadmap:", {
      title,
      topic,
    });

    const roadmap = await prisma.roadmap.create({
      data: {
        title,
        description,
        topic,
        content: JSON.stringify(content),
        authorId: req.user.id,
        isPublic,
      },
    });

    console.log("✅ Roadmap created successfully:", roadmap.id);

    res.status(201).json({
      id: roadmap.id,
      message: "Roadmap created successfully",
      roadmap,
    });
  } catch (error) {
    console.error("Error creating roadmap:", error);
    res.status(500).json({ error: "Failed to create roadmap" });
  }
});

// Toggle roadmap bookmark
router.post("/:id/bookmark", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log("🔖 Bookmark toggle request:", { roadmapId: id, userId });

    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
    });

    if (!roadmap) {
      console.log("❌ Roadmap not found:", id);
      return res.status(404).json({ error: "Roadmap not found" });
    }

    // Check if already bookmarked
    const existingBookmark = await prisma.roadmapBookmark.findFirst({
      where: {
        roadmapId: id,
        userId: userId,
      },
    });

    console.log(
      "🔍 Existing bookmark:",
      existingBookmark ? "Found" : "Not found"
    );

    if (existingBookmark) {
      // Remove bookmark
      await prisma.roadmapBookmark.delete({
        where: { id: existingBookmark.id },
      });
      console.log("✅ Bookmark removed");
      res.json({ message: "Roadmap unbookmarked", bookmarked: false });
    } else {
      // Add bookmark
      const newBookmark = await prisma.roadmapBookmark.create({
        data: {
          roadmapId: id,
          userId: userId,
        },
      });
      console.log("✅ Bookmark added:", newBookmark.id);
      res.json({ message: "Roadmap bookmarked", bookmarked: true });
    }
  } catch (error) {
    console.error("❌ Error toggling bookmark:", error);
    res.status(500).json({ error: "Failed to toggle bookmark" });
  }
});

// Update roadmap
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, topic, isPublic } = req.body;

    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
    });

    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    if (roadmap.authorId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updatedRoadmap = await prisma.roadmap.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(topic && { topic }),
        ...(typeof isPublic === "boolean" && { isPublic }),
      },
    });

    res.json({
      message: "Roadmap updated successfully",
      roadmap: updatedRoadmap,
    });
  } catch (error) {
    console.error("Error updating roadmap:", error);
    res.status(500).json({ error: "Failed to update roadmap" });
  }
});

// Delete roadmap
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
    });

    if (!roadmap) {
      return res.status(404).json({ error: "Roadmap not found" });
    }

    if (roadmap.authorId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.roadmap.delete({
      where: { id },
    });

    res.json({ message: "Roadmap deleted successfully" });
  } catch (error) {
    console.error("Error deleting roadmap:", error);
    res.status(500).json({ error: "Failed to delete roadmap" });
  }
});

export default router;
