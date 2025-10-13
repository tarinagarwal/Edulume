import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// Python backend URL from environment
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://localhost:8000";

// Create a new PDF chat session
router.post("/sessions", authenticateToken, async (req, res) => {
  try {
    const { sessionId, pdfUrl, pdfName, cloudinaryPublicId } = req.body;
    const userId = req.user.id;

    const session = await prisma.pdfChatSession.create({
      data: {
        userId,
        sessionId,
        pdfUrl,
        pdfName,
        cloudinaryPublicId: cloudinaryPublicId || null,
      },
    });

    res.json(session);
  } catch (error) {
    console.error("Error creating PDF chat session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Save a chat message
router.post("/messages", authenticateToken, async (req, res) => {
  try {
    const { sessionId, message, response } = req.body;

    // Find the session
    const session = await prisma.pdfChatSession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Verify the session belongs to the user
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const chatMessage = await prisma.pdfChatMessage.create({
      data: {
        sessionId: session.id,
        message,
        response,
      },
    });

    res.json(chatMessage);
  } catch (error) {
    console.error("Error saving chat message:", error);
    res.status(500).json({ error: "Failed to save message" });
  }
});

// End a session and cleanup
router.post("/sessions/:sessionId/end", authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Find the session
    const session = await prisma.pdfChatSession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Verify the session belongs to the user
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update session as ended
    await prisma.pdfChatSession.update({
      where: { sessionId },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });

    // Call Python backend to cleanup embeddings and Cloudinary
    try {
      const params = new URLSearchParams({ session_id: sessionId });
      if (session.cloudinaryPublicId) {
        params.append("cloudinary_public_id", session.cloudinaryPublicId);
      }

      const cleanupResponse = await fetch(
        `${PYTHON_API_URL}/cleanup-session?${params.toString()}`,
        {
          method: "POST",
        }
      );

      if (!cleanupResponse.ok) {
        const errorData = await cleanupResponse.json().catch(() => ({}));
        console.error("Failed to cleanup in Python backend:", errorData);
      } else {
        const cleanupData = await cleanupResponse.json();
        console.log("Cleanup successful:", cleanupData);
      }
    } catch (cleanupError) {
      console.error("Error calling Python cleanup:", cleanupError);
    }

    res.json({ message: "Session ended successfully" });
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ error: "Failed to end session" });
  }
});

// Get chat history for user
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await prisma.pdfChatSession.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(sessions);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// Delete a session and its messages
router.delete("/sessions/:sessionId", authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Find the session
    const session = await prisma.pdfChatSession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Verify the session belongs to the user
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Delete the session (messages will be deleted due to cascade)
    await prisma.pdfChatSession.delete({
      where: { sessionId },
    });

    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

export default router;
