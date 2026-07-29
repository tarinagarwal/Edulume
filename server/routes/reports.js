import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// ---------------- Create new report ----------------
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { contentType, contentId, reason } = req.body;

    // Type validation for required fields
    if (!contentType || typeof contentType !== "string" || !["discussion", "answer", "reply"].includes(contentType)) {
      return res.status(400).json({ error: "Invalid content type" });
    }

    if (!contentId || typeof contentId !== "string") {
      return res.status(400).json({ error: "Invalid content ID" });
    }

    if (!reason || typeof reason !== "string") {
      return res.status(400).json({ error: "Reason is required" });
    }

    // Verify content exists before reporting
    let targetContent;
    switch (contentType) {
      case "discussion":
        targetContent = await prisma.discussion.findUnique({ where: { id: contentId } });
        break;
      case "answer":
        targetContent = await prisma.discussionAnswer.findUnique({ where: { id: contentId } });
        break;
      case "reply":
        targetContent = await prisma.discussionReply.findUnique({ where: { id: contentId } });
        break;
    }

    if (!targetContent) {
      return res.status(404).json({ error: "\u0043\u006fntent not found" });
    }

    const report = await prisma.report.create({
      data: {
        contentType,
        contentId,
        reason,
        userId: req.user.id,
      },
    });

    res.status(201).json({
      id: report.id,
      message: "Report submitted successfully",
    });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

export default router;
