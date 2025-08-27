import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// ---------------- Get user notifications ----------------
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.notification.count({
        where: { userId: req.user.id },
      }),
    ]);

    // Transform to match expected format
    const transformedNotifications = notifications.map((notification) => ({
      ...notification,
      user_id: notification.userId,
      related_id: notification.relatedId,
      related_type: notification.relatedType,
      from_user_id: notification.fromUserId,
      from_username: notification.fromUsername,
      is_read: notification.isRead,
      created_at: notification.createdAt,
    }));

    res.json({
      notifications: transformedNotifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// ---------------- Mark notification as read ----------------
router.put("/:id/read", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// ---------------- Mark all notifications as read ----------------
router.put("/read-all", authenticateToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

// ---------------- Get unread notification count ----------------
router.get("/unread-count", authenticateToken, async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user.id,
        isRead: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ error: "Failed to get unread count" });
  }
});

export default router;
