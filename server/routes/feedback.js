import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const adminEmails =
      process.env.ADMIN_EMAILS?.split(",").map((email) => email.trim()) || [];

    console.log("🔍 Admin check - Admin emails:", adminEmails);
    console.log("🔍 Admin check - User email:", req.user?.email);

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // req.user is already the full user object from auth middleware
    if (!adminEmails.includes(req.user.email)) {
      console.log("❌ User email not in admin list");
      return res.status(403).json({ error: "Admin access required" });
    }

    console.log("✅ User is admin");
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Feature Suggestions Routes

// Create feature suggestion
router.post("/feature-suggestions", async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res
        .status(400)
        .json({ error: "Title, description, and category are required" });
    }

    let userData = {};

    // If user is authenticated, get their info
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const jwt = await import("jsonwebtoken");
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });

        if (user) {
          userData = {
            userId: user.id,
            userName: user.username,
            userEmail: user.email,
          };
        }
      } catch (error) {
        // If token is invalid, continue as anonymous
        console.log("Invalid token, creating anonymous suggestion");
      }
    }

    const suggestion = await prisma.featureSuggestion.create({
      data: {
        title,
        description,
        category,
        ...userData,
      },
    });

    res.status(201).json({
      message: "Feature suggestion submitted successfully",
      suggestion: {
        id: suggestion.id,
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.category,
        status: suggestion.status,
        createdAt: suggestion.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating feature suggestion:", error);
    res.status(500).json({ error: "Failed to submit feature suggestion" });
  }
});

// Get all feature suggestions (admin only)
router.get(
  "/feature-suggestions",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { status, category, page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (status) where.status = status;
      if (category) where.category = category;

      const [suggestions, total] = await Promise.all([
        prisma.featureSuggestion.findMany({
          where,
          include: {
            user: {
              select: {
                username: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: parseInt(limit),
        }),
        prisma.featureSuggestion.count({ where }),
      ]);

      res.json({
        suggestions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching feature suggestions:", error);
      res.status(500).json({ error: "Failed to fetch feature suggestions" });
    }
  }
);

// Update feature suggestion status (admin only)
router.put(
  "/feature-suggestions/:id",
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, priority, adminNotes } = req.body;

      const updateData = {};
      if (status) updateData.status = status;
      if (priority) updateData.priority = priority;
      if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

      const suggestion = await prisma.featureSuggestion.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              username: true,
              email: true,
            },
          },
        },
      });

      res.json({
        message: "Feature suggestion updated successfully",
        suggestion,
      });
    } catch (error) {
      console.error("Error updating feature suggestion:", error);
      res.status(500).json({ error: "Failed to update feature suggestion" });
    }
  }
);

// Bug Reports Routes

// Create bug report
router.post("/bug-reports", async (req, res) => {
  try {
    const {
      title,
      description,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      severity,
      browserInfo,
      deviceInfo,
    } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required" });
    }

    let userData = {};

    // If user is authenticated, get their info
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const jwt = await import("jsonwebtoken");
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });

        if (user) {
          userData = {
            userId: user.id,
            userName: user.username,
            userEmail: user.email,
          };
        }
      } catch (error) {
        // If token is invalid, continue as anonymous
        console.log("Invalid token, creating anonymous bug report");
      }
    }

    const bugReport = await prisma.bugReport.create({
      data: {
        title,
        description,
        stepsToReproduce,
        expectedBehavior,
        actualBehavior,
        severity: severity || "medium",
        browserInfo,
        deviceInfo,
        ...userData,
      },
    });

    res.status(201).json({
      message: "Bug report submitted successfully",
      bugReport: {
        id: bugReport.id,
        title: bugReport.title,
        description: bugReport.description,
        severity: bugReport.severity,
        status: bugReport.status,
        createdAt: bugReport.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating bug report:", error);
    res.status(500).json({ error: "Failed to submit bug report" });
  }
});

// Get all bug reports (admin only)
router.get("/bug-reports", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status, severity, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const [bugReports, total] = await Promise.all([
      prisma.bugReport.findMany({
        where,
        include: {
          user: {
            select: {
              username: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.bugReport.count({ where }),
    ]);

    res.json({
      bugReports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching bug reports:", error);
    res.status(500).json({ error: "Failed to fetch bug reports" });
  }
});

// Update bug report status (admin only)
router.put("/bug-reports/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, severity, adminNotes } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (severity) updateData.severity = severity;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const bugReport = await prisma.bugReport.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: "Bug report updated successfully",
      bugReport,
    });
  } catch (error) {
    console.error("Error updating bug report:", error);
    res.status(500).json({ error: "Failed to update bug report" });
  }
});

// Admin dashboard stats
router.get("/admin/stats", authenticateToken, isAdmin, async (req, res) => {
  try {
    const [
      totalFeatureSuggestions,
      pendingFeatureSuggestions,
      totalBugReports,
      openBugReports,
      criticalBugs,
      recentSuggestions,
      recentBugReports,
    ] = await Promise.all([
      prisma.featureSuggestion.count(),
      prisma.featureSuggestion.count({ where: { status: "pending" } }),
      prisma.bugReport.count(),
      prisma.bugReport.count({ where: { status: "open" } }),
      prisma.bugReport.count({ where: { severity: "critical" } }),
      prisma.featureSuggestion.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { username: true },
          },
        },
      }),
      prisma.bugReport.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { username: true },
          },
        },
      }),
    ]);

    res.json({
      stats: {
        featureSuggestions: {
          total: totalFeatureSuggestions,
          pending: pendingFeatureSuggestions,
        },
        bugReports: {
          total: totalBugReports,
          open: openBugReports,
          critical: criticalBugs,
        },
      },
      recent: {
        featureSuggestions: recentSuggestions,
        bugReports: recentBugReports,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

export default router;
