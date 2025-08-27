import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  emitNewAnswer,
  emitNewReply,
  emitBestAnswerMarked,
  emitVoteUpdate,
  emitNotification,
} from "../socket/socketHandlers.js";

// Helper function to extract mentions from content
const extractMentions = (content) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  return [...new Set(mentions)]; // Remove duplicates
};

// Helper function to create notifications
const createNotification = async (
  userId,
  type,
  title,
  message,
  relatedId,
  relatedType,
  fromUserId,
  fromUsername,
  io = null
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        relatedId,
        relatedType,
        fromUserId,
        fromUsername,
      },
    });

    // Emit real-time notification if io is available
    if (io) {
      const notificationData = {
        id: notification.id,
        user_id: userId,
        type,
        title,
        message,
        related_id: relatedId,
        related_type: relatedType,
        from_user_id: fromUserId,
        from_username: fromUsername,
        is_read: false,
        created_at: notification.createdAt.toISOString(),
      };
      emitNotification(io, userId, notificationData);
    }
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

const router = express.Router();

// Test route to verify router is working
router.get("/test", (req, res) => {
  res.json({ message: "Discussions router is working!" });
});

// ---------------- Get all discussions with filters ----------------
router.get("/", async (req, res) => {
  try {
    const {
      category,
      tag,
      search,
      sort = "recent",
      page = 1,
      limit = 10,
    } = req.query;

    const where = {};

    if (category && category !== "all") {
      where.category = category;
    }

    if (tag) {
      where.tags = {
        contains: tag,
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    let orderBy = {};
    switch (sort) {
      case "popular":
        orderBy = [{ votes: { _count: "desc" } }, { createdAt: "desc" }];
        break;
      case "answered":
        orderBy = [{ answers: { _count: "desc" } }, { createdAt: "desc" }];
        break;
      case "unanswered":
        orderBy = [{ answers: { _count: "asc" } }, { createdAt: "desc" }];
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [discussions, total] = await Promise.all([
      prisma.discussion.findMany({
        where,
        include: {
          author: {
            select: { username: true },
          },
          answers: {
            select: { id: true, isBestAnswer: true },
          },
          votes: {
            select: { id: true },
          },
        },
        orderBy,
        skip,
        take,
      }),
      prisma.discussion.count({ where }),
    ]);

    // Transform the response to match expected format
    const transformedDiscussions = discussions.map((discussion) => ({
      ...discussion,
      author_username: discussion.author.username,
      author_id: discussion.authorId,
      created_at: discussion.createdAt,
      updated_at: discussion.updatedAt,
      answer_count: discussion.answers.length,
      vote_count: discussion.votes.length,
      has_best_answer: discussion.answers.some((answer) => answer.isBestAnswer)
        ? 1
        : 0,
    }));

    res.json({
      discussions: transformedDiscussions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching discussions:", error);
    res.status(500).json({ error: "Failed to fetch discussions" });
  }
});

// ---------------- Get single discussion with answers ----------------
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const discussion = await prisma.discussion.findUnique({
      where: { id },
      include: {
        author: {
          select: { username: true },
        },
        votes: true,
        answers: {
          include: {
            author: {
              select: { username: true },
            },
            votes: true,
            replies: {
              include: {
                author: {
                  select: { username: true },
                },
                votes: true,
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: [{ isBestAnswer: "desc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!discussion) {
      return res.status(404).json({ error: "Discussion not found" });
    }

    // Update view count
    await prisma.discussion.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    // Transform discussion data
    const discussionDetails = {
      ...discussion,
      author_username: discussion.author.username,
      author_id: discussion.authorId,
      created_at: discussion.createdAt,
      updated_at: discussion.updatedAt,
      vote_count: discussion.votes.length,
      upvotes: discussion.votes.filter((v) => v.voteType === "up").length,
      downvotes: discussion.votes.filter((v) => v.voteType === "down").length,
    };

    // Transform answers data
    const answers = discussion.answers.map((answer) => ({
      ...answer,
      author_username: answer.author.username,
      author_id: answer.authorId,
      discussion_id: answer.discussionId,
      is_best_answer: answer.isBestAnswer,
      created_at: answer.createdAt,
      updated_at: answer.updatedAt,
      reply_count: answer.replies.length,
      vote_count: answer.votes.length,
      upvotes: answer.votes.filter((v) => v.voteType === "up").length,
      downvotes: answer.votes.filter((v) => v.voteType === "down").length,
      replies: answer.replies.map((reply) => ({
        ...reply,
        author_username: reply.author.username,
        author_id: reply.authorId,
        answer_id: reply.answerId,
        created_at: reply.createdAt,
        updated_at: reply.updatedAt,
        vote_count: reply.votes.length,
        upvotes: reply.votes.filter((v) => v.voteType === "up").length,
        downvotes: reply.votes.filter((v) => v.voteType === "down").length,
      })),
    }));

    res.json({ discussion: discussionDetails, answers });
  } catch (error) {
    console.error("Error fetching discussion:", error);
    res.status(500).json({ error: "Failed to fetch discussion" });
  }
});

// ---------------- Create new discussion ----------------
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, content, category, tags, images } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({
        error: "Title, content, and category are required",
      });
    }

    const discussion = await prisma.discussion.create({
      data: {
        title,
        content,
        category,
        tags: tags && tags.length > 0 ? JSON.stringify(tags) : null,
        images: images && images.length > 0 ? JSON.stringify(images) : null,
        authorId: req.user.id,
      },
    });

    res.status(201).json({
      id: discussion.id,
      message: "Discussion created successfully",
    });
  } catch (error) {
    console.error("Error creating discussion:", error);
    res.status(500).json({ error: "Failed to create discussion" });
  }
});

// ---------------- Add answer to discussion ----------------
router.post("/:id/answers", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, images } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const discussion = await prisma.discussion.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!discussion) {
      return res.status(404).json({ error: "Discussion not found" });
    }

    const answer = await prisma.discussionAnswer.create({
      data: {
        content,
        images: images && images.length > 0 ? JSON.stringify(images) : null,
        discussionId: id,
        authorId: req.user.id,
      },
    });

    // Create notification for discussion author (if not self)
    if (discussion.authorId !== req.user.id) {
      await createNotification(
        discussion.authorId,
        "answer",
        "New Answer",
        `${req.user.username} answered your discussion "${discussion.title}"`,
        answer.id,
        "answer",
        req.user.id,
        req.user.username,
        req.io
      );
    }

    // Handle mentions
    const mentions = extractMentions(content);
    for (const mentionedUsername of mentions) {
      const mentionedUser = await prisma.user.findUnique({
        where: { username: mentionedUsername },
      });

      if (mentionedUser && mentionedUser.id !== req.user.id) {
        await createNotification(
          mentionedUser.id,
          "mention",
          "You were mentioned",
          `${req.user.username} mentioned you in an answer`,
          answer.id,
          "answer",
          req.user.id,
          req.user.username,
          req.io
        );
      }
    }

    // Emit real-time event
    if (req.io) {
      console.log("🚀 Emitting new answer event:", id);
      emitNewAnswer(req.io, id, {
        ...answer,
        author_username: req.user.username,
        author_id: req.user.id,
        discussion_id: id,
        is_best_answer: false,
        created_at: answer.createdAt,
        updated_at: answer.updatedAt,
        reply_count: 0,
        vote_count: 0,
        upvotes: 0,
        downvotes: 0,
        replies: [],
      });
    }

    res.status(201).json({
      id: answer.id,
      message: "Answer added successfully",
    });
  } catch (error) {
    console.error("Error adding answer:", error);
    res.status(500).json({ error: "Failed to add answer" });
  }
});

// ---------------- Add reply to answer ----------------
router.post(
  "/answers/:answerId/replies",
  authenticateToken,
  async (req, res) => {
    console.log("🔥 Reply route hit! AnswerId:", req.params.answerId);
    try {
      const { answerId } = req.params;
      const { content, images } = req.body;

      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      const answer = await prisma.discussionAnswer.findUnique({
        where: { id: answerId },
        include: {
          author: true,
          discussion: { include: { author: true } },
        },
      });

      if (!answer) {
        return res.status(404).json({ error: "Answer not found" });
      }

      const reply = await prisma.discussionReply.create({
        data: {
          content,
          images: images && images.length > 0 ? JSON.stringify(images) : null,
          answerId,
          authorId: req.user.id,
        },
      });

      // Create notification for answer author (if not self)
      if (answer.authorId !== req.user.id) {
        await createNotification(
          answer.authorId,
          "reply",
          "New Reply",
          `${req.user.username} replied to your answer`,
          reply.id,
          "reply",
          req.user.id,
          req.user.username,
          req.io
        );
      }

      // Handle mentions
      const mentions = extractMentions(content);
      for (const mentionedUsername of mentions) {
        const mentionedUser = await prisma.user.findUnique({
          where: { username: mentionedUsername },
        });

        if (mentionedUser && mentionedUser.id !== req.user.id) {
          await createNotification(
            mentionedUser.id,
            "mention",
            "You were mentioned",
            `${req.user.username} mentioned you in a reply`,
            reply.id,
            "reply",
            req.user.id,
            req.user.username,
            req.io
          );
        }
      }

      // Emit real-time event
      if (req.io) {
        console.log(
          "🚀 Emitting new reply event:",
          answer.discussionId,
          answerId
        );
        emitNewReply(req.io, answer.discussionId, answerId, {
          ...reply,
          author_username: req.user.username,
          author_id: req.user.id,
          answer_id: answerId,
          created_at: reply.createdAt,
          updated_at: reply.updatedAt,
          vote_count: 0,
          upvotes: 0,
          downvotes: 0,
        });
      }

      res.status(201).json({
        id: reply.id,
        message: "Reply added successfully",
      });
    } catch (error) {
      console.error("Error adding reply:", error);
      res.status(500).json({ error: "Failed to add reply" });
    }
  }
);

// ---------------- Vote on discussion ----------------
router.post("/:id/vote", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // 'up' or 'down'

    if (!voteType || !["up", "down"].includes(voteType)) {
      return res.status(400).json({ error: "Valid vote type is required" });
    }

    const discussion = await prisma.discussion.findUnique({
      where: { id },
    });

    if (!discussion) {
      return res.status(404).json({ error: "Discussion not found" });
    }

    // Check if user already voted
    const existingVote = await prisma.discussionVote.findUnique({
      where: {
        discussionId_userId: {
          discussionId: id,
          userId: req.user.id,
        },
      },
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Remove vote if same type
        await prisma.discussionVote.delete({
          where: { id: existingVote.id },
        });
      } else {
        // Update vote type
        await prisma.discussionVote.update({
          where: { id: existingVote.id },
          data: { voteType },
        });
      }
    } else {
      // Create new vote
      await prisma.discussionVote.create({
        data: {
          discussionId: id,
          userId: req.user.id,
          voteType,
        },
      });
    }

    // Get updated vote counts
    const votes = await prisma.discussionVote.findMany({
      where: { discussionId: id },
    });

    const voteCount = votes.length;
    const upvotes = votes.filter((v) => v.voteType === "up").length;
    const downvotes = votes.filter((v) => v.voteType === "down").length;

    // Emit real-time update
    if (req.io) {
      emitVoteUpdate(req.io, id, id, "discussion", {
        voteCount,
        upvotes,
        downvotes,
      });
    }

    res.json({ voteCount, upvotes, downvotes });
  } catch (error) {
    console.error("Error voting on discussion:", error);
    res.status(500).json({ error: "Failed to vote" });
  }
});

// ---------------- Vote on answer ----------------
router.post("/answers/:answerId/vote", authenticateToken, async (req, res) => {
  try {
    const { answerId } = req.params;
    const { voteType } = req.body;

    if (!voteType || !["up", "down"].includes(voteType)) {
      return res.status(400).json({ error: "Valid vote type is required" });
    }

    const answer = await prisma.discussionAnswer.findUnique({
      where: { id: answerId },
    });

    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }

    // Check if user already voted
    const existingVote = await prisma.answerVote.findUnique({
      where: {
        answerId_userId: {
          answerId,
          userId: req.user.id,
        },
      },
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        await prisma.answerVote.delete({
          where: { id: existingVote.id },
        });
      } else {
        await prisma.answerVote.update({
          where: { id: existingVote.id },
          data: { voteType },
        });
      }
    } else {
      await prisma.answerVote.create({
        data: {
          answerId,
          userId: req.user.id,
          voteType,
        },
      });
    }

    // Get updated vote counts
    const votes = await prisma.answerVote.findMany({
      where: { answerId },
    });

    const voteCount = votes.length;
    const upvotes = votes.filter((v) => v.voteType === "up").length;
    const downvotes = votes.filter((v) => v.voteType === "down").length;

    // Emit real-time update
    if (req.io) {
      emitVoteUpdate(req.io, answer.discussionId, answerId, "answer", {
        voteCount,
        upvotes,
        downvotes,
      });
    }

    res.json({ voteCount, upvotes, downvotes });
  } catch (error) {
    console.error("Error voting on answer:", error);
    res.status(500).json({ error: "Failed to vote" });
  }
});

// ---------------- Vote on reply ----------------
router.post("/replies/:replyId/vote", authenticateToken, async (req, res) => {
  try {
    const { replyId } = req.params;
    const { voteType } = req.body;

    if (!voteType || !["up", "down"].includes(voteType)) {
      return res.status(400).json({ error: "Valid vote type is required" });
    }

    const reply = await prisma.discussionReply.findUnique({
      where: { id: replyId },
      include: { answer: true },
    });

    if (!reply) {
      return res.status(404).json({ error: "Reply not found" });
    }

    // Check if user already voted
    const existingVote = await prisma.replyVote.findUnique({
      where: {
        replyId_userId: {
          replyId,
          userId: req.user.id,
        },
      },
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        await prisma.replyVote.delete({
          where: { id: existingVote.id },
        });
      } else {
        await prisma.replyVote.update({
          where: { id: existingVote.id },
          data: { voteType },
        });
      }
    } else {
      await prisma.replyVote.create({
        data: {
          replyId,
          userId: req.user.id,
          voteType,
        },
      });
    }

    // Get updated vote counts
    const votes = await prisma.replyVote.findMany({
      where: { replyId },
    });

    const voteCount = votes.length;
    const upvotes = votes.filter((v) => v.voteType === "up").length;
    const downvotes = votes.filter((v) => v.voteType === "down").length;

    // Emit real-time update
    if (req.io) {
      emitVoteUpdate(req.io, reply.answer.discussionId, replyId, "reply", {
        voteCount,
        upvotes,
        downvotes,
      });
    }

    res.json({ voteCount, upvotes, downvotes });
  } catch (error) {
    console.error("Error voting on reply:", error);
    res.status(500).json({ error: "Failed to vote" });
  }
});

// ---------------- Mark best answer ----------------
router.post("/answers/:answerId/best", authenticateToken, async (req, res) => {
  try {
    const { answerId } = req.params;

    const answer = await prisma.discussionAnswer.findUnique({
      where: { id: answerId },
      include: {
        discussion: true,
        author: true,
      },
    });

    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }

    // Only discussion author can mark best answer
    if (answer.discussion.authorId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Only discussion author can mark best answer" });
    }

    // Remove best answer from other answers in this discussion
    await prisma.discussionAnswer.updateMany({
      where: { discussionId: answer.discussionId },
      data: { isBestAnswer: false },
    });

    // Mark this answer as best
    await prisma.discussionAnswer.update({
      where: { id: answerId },
      data: { isBestAnswer: true },
    });

    // Create notification for answer author (if not self)
    if (answer.authorId !== req.user.id) {
      await createNotification(
        answer.authorId,
        "best_answer",
        "Best Answer",
        `Your answer was marked as the best answer by ${req.user.username}`,
        answerId,
        "answer",
        req.user.id,
        req.user.username,
        req.io
      );
    }

    // Emit real-time event
    if (req.io) {
      emitBestAnswerMarked(req.io, answer.discussionId, answerId);
    }

    res.json({ message: "Answer marked as best" });
  } catch (error) {
    console.error("Error marking best answer:", error);
    res.status(500).json({ error: "Failed to mark best answer" });
  }
});

// ---------------- Get user notifications ----------------
router.get("/notifications", authenticateToken, async (req, res) => {
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
router.put("/notifications/:id/read", authenticateToken, async (req, res) => {
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

export default router;
