import express from "express";
import { dbAll, dbRun, dbGet } from "../db.js";
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
    const result = await dbRun(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type, from_user_id, from_username)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        type,
        title,
        message,
        relatedId,
        relatedType,
        fromUserId,
        fromUsername,
      ]
    );

    // Emit real-time notification if io is available
    if (io) {
      const notification = {
        id: result.id,
        user_id: userId,
        type,
        title,
        message,
        related_id: relatedId,
        related_type: relatedType,
        from_user_id: fromUserId,
        from_username: fromUsername,
        is_read: 0,
        created_at: new Date().toISOString(),
      };
      emitNotification(io, userId, notification);
    }
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

const router = express.Router();

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

    let query = `
      SELECT 
        d.*,
        u.username as author_username,
        COUNT(DISTINCT a.id) as answer_count,
        COUNT(DISTINCT dv.id) as vote_count,
        MAX(CASE WHEN a.is_best_answer = 1 THEN 1 ELSE 0 END) as has_best_answer
      FROM discussions d
      LEFT JOIN users u ON d.author_id = u.id
      LEFT JOIN discussion_answers a ON d.id = a.discussion_id
      LEFT JOIN discussion_votes dv ON d.id = dv.discussion_id
      WHERE 1=1
    `;

    const params = [];

    if (category && category !== "all") {
      query += " AND d.category = ?";
      params.push(category);
    }

    if (tag) {
      query += " AND d.tags LIKE ?";
      params.push(`%${tag}%`);
    }

    if (search) {
      query += " AND (d.title LIKE ? OR d.content LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " GROUP BY d.id";

    // Add sorting
    switch (sort) {
      case "popular":
        query += " ORDER BY vote_count DESC, d.created_at DESC";
        break;
      case "answered":
        query += " ORDER BY answer_count DESC, d.created_at DESC";
        break;
      case "unanswered":
        query += " ORDER BY answer_count ASC, d.created_at DESC";
        break;
      default:
        query += " ORDER BY d.created_at DESC";
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);

    const discussions = await dbAll(query, params);

    // Count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT d.id) as total
      FROM discussions d
      WHERE 1=1
    `;
    const countParams = [];

    if (category && category !== "all") {
      countQuery += " AND d.category = ?";
      countParams.push(category);
    }

    if (tag) {
      countQuery += " AND d.tags LIKE ?";
      countParams.push(`%${tag}%`);
    }

    if (search) {
      countQuery += " AND (d.title LIKE ? OR d.content LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await dbGet(countQuery, countParams);

    res.json({
      discussions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / parseInt(limit)),
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

    const discussionDetails = await dbGet(
      `
      SELECT 
        d.*,
        u.username as author_username,
        COUNT(DISTINCT dv.id) as vote_count,
        COALESCE(SUM(CASE WHEN dv.vote_type = 'up' THEN 1 ELSE 0 END), 0) as upvotes,
        COALESCE(SUM(CASE WHEN dv.vote_type = 'down' THEN 1 ELSE 0 END), 0) as downvotes
      FROM discussions d
      LEFT JOIN users u ON d.author_id = u.id
      LEFT JOIN discussion_votes dv ON d.id = dv.discussion_id
      WHERE d.id = ?
      GROUP BY d.id
    `,
      [parseInt(id)]
    );

    if (!discussionDetails) {
      return res.status(404).json({ error: "Discussion not found" });
    }

    const answers = await dbAll(
      `
      SELECT 
        a.*,
        u.username as author_username,
        COALESCE(COUNT(DISTINCT r.id), 0) as reply_count,
        COALESCE(COUNT(DISTINCT av.id), 0) as vote_count,
        COALESCE(SUM(CASE WHEN av.vote_type = 'up' THEN 1 ELSE 0 END), 0) as upvotes,
        COALESCE(SUM(CASE WHEN av.vote_type = 'down' THEN 1 ELSE 0 END), 0) as downvotes
      FROM discussion_answers a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN discussion_replies r ON a.id = r.answer_id
      LEFT JOIN answer_votes av ON a.id = av.answer_id
      WHERE a.discussion_id = ?
      GROUP BY a.id
      ORDER BY a.is_best_answer DESC, vote_count DESC, a.created_at ASC
    `,
      [parseInt(id)]
    );

    // Get replies for each answer
    for (let ans of answers) {
      const replies = await dbAll(
        `
        SELECT 
          r.*,
          u.username as author_username,
          COALESCE(COUNT(DISTINCT rv.id), 0) as vote_count,
          COALESCE(SUM(CASE WHEN rv.vote_type = 'up' THEN 1 ELSE 0 END), 0) as upvotes,
          COALESCE(SUM(CASE WHEN rv.vote_type = 'down' THEN 1 ELSE 0 END), 0) as downvotes
        FROM discussion_replies r
        LEFT JOIN users u ON r.author_id = u.id
        LEFT JOIN reply_votes rv ON r.id = rv.reply_id
        WHERE r.answer_id = ?
        GROUP BY r.id
        ORDER BY r.created_at ASC
      `,
        [ans.id]
      );
      ans.replies = replies;
    }

    await dbRun("UPDATE discussions SET views = views + 1 WHERE id = ?", [
      parseInt(id),
    ]);

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

    const result = await dbRun(
      `
      INSERT INTO discussions (title, content, category, tags, images, author_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [
        title,
        content,
        category,
        tags && tags.length > 0 ? JSON.stringify(tags) : null,
        images && images.length > 0 ? JSON.stringify(images) : null,
        req.user.id,
      ]
    );

    res.status(201).json({
      id: result.id,
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
    const io = req.app.get("io");

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const discussionExists = await dbGet(
      "SELECT id FROM discussions WHERE id = ?",
      [id]
    );
    if (!discussionExists) {
      return res.status(404).json({ error: "Discussion not found" });
    }

    const result = await dbRun(
      `
      INSERT INTO discussion_answers (discussion_id, content, images, author_id)
      VALUES (?, ?, ?, ?)
    `,
      [
        parseInt(id),
        content,
        images ? JSON.stringify(images) : null,
        req.user.id,
      ]
    );

    // Get the complete answer data for real-time emission
    const newAnswer = await dbGet(
      `
      SELECT 
        a.*,
        u.username as author_username,
        0 as reply_count,
        0 as vote_count,
        0 as upvotes,
        0 as downvotes
      FROM discussion_answers a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `,
      [result.lastInsertRowid || result.insertId]
    );
    newAnswer.replies = [];

    // Emit real-time update
    if (io) {
      emitNewAnswer(io, id, newAnswer);
    }
    const discussionDetails = await dbGet(
      "SELECT author_id, title FROM discussions WHERE id = ?",
      [id]
    );
    if (discussionDetails && discussionDetails.author_id !== req.user.id) {
      await createNotification(
        discussionDetails.author_id,
        "new_answer",
        "New Answer",
        `${req.user.username} answered your question: "${discussionDetails.title}"`,
        parseInt(id),
        "discussion",
        req.user.id,
        req.user.username,
        io
      );
    }

    // Mentions
    const mentions = extractMentions(content);
    for (const username of mentions) {
      const mentionedUser = await dbGet(
        "SELECT id FROM users WHERE username = ?",
        [username]
      );
      if (mentionedUser && mentionedUser.id !== req.user.id) {
        await createNotification(
          mentionedUser.id,
          "mention",
          "You were mentioned",
          `${req.user.username} mentioned you in an answer: "${discussionDetails.title}"`,
          parseInt(id),
          "discussion",
          req.user.id,
          req.user.username,
          io
        );
      }
    }

    res.status(201).json({
      id: result.id,
      message: "Answer added successfully",
    });
  } catch (error) {
    console.error("Error adding answer:", error);
    res.status(500).json({ error: "Failed to add answer" });
  }
});

// Vote on discussion
router.post("/:id/vote", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // 'up' or 'down'
    const io = req.app.get("io");

    if (!["up", "down"].includes(voteType)) {
      return res.status(400).json({ error: "Invalid vote type" });
    }

    // Check if user already voted
    const existingVote = await dbGet(
      "SELECT id, vote_type FROM discussion_votes WHERE discussion_id = ? AND user_id = ?",
      [parseInt(id), req.user.id]
    );

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote if same type
        await dbRun("DELETE FROM discussion_votes WHERE id = ?", [
          existingVote.id,
        ]);
      } else {
        // Update vote type
        await dbRun("UPDATE discussion_votes SET vote_type = ? WHERE id = ?", [
          voteType,
          existingVote.id,
        ]);
      }
    } else {
      // Add new vote
      await dbRun(
        "INSERT INTO discussion_votes (discussion_id, user_id, vote_type) VALUES (?, ?, ?)",
        [parseInt(id), req.user.id, voteType]
      );
    }

    // Get updated vote count
    const voteCount = await dbGet(
      "SELECT COUNT(*) as count FROM discussion_votes WHERE discussion_id = ?",
      [parseInt(id)]
    );

    // Emit real-time vote update
    if (io) {
      emitVoteUpdate(io, id, id, "discussion", voteCount.count);
    }

    res.json({ message: "Vote processed successfully" });
  } catch (error) {
    console.error("Error voting on discussion:", error);
    res.status(500).json({ error: "Failed to vote" });
  }
});

// Vote on answer
router.post("/answers/:id/vote", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    const io = req.app.get("io");

    if (!["up", "down"].includes(voteType)) {
      return res.status(400).json({ error: "Invalid vote type" });
    }

    const existingVote = await dbGet(
      "SELECT id, vote_type FROM answer_votes WHERE answer_id = ? AND user_id = ?",
      [parseInt(id), req.user.id]
    );

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        await dbRun("DELETE FROM answer_votes WHERE id = ?", [existingVote.id]);
      } else {
        await dbRun("UPDATE answer_votes SET vote_type = ? WHERE id = ?", [
          voteType,
          existingVote.id,
        ]);
      }
    } else {
      await dbRun(
        "INSERT INTO answer_votes (answer_id, user_id, vote_type) VALUES (?, ?, ?)",
        [parseInt(id), req.user.id, voteType]
      );
    }

    // Get discussion ID and vote count
    const answerInfo = await dbGet(
      "SELECT discussion_id FROM discussion_answers WHERE id = ?",
      [parseInt(id)]
    );
    const voteCount = await dbGet(
      "SELECT COUNT(*) as count FROM answer_votes WHERE answer_id = ?",
      [parseInt(id)]
    );

    // Emit real-time vote update
    if (io && answerInfo) {
      emitVoteUpdate(
        io,
        answerInfo.discussion_id,
        id,
        "answer",
        voteCount.count
      );
    }

    res.json({ message: "Vote processed successfully" });
  } catch (error) {
    console.error("Error voting on answer:", error);
    res.status(500).json({ error: "Failed to vote" });
  }
});

// Mark answer as best answer
router.post("/answers/:id/best", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const io = req.app.get("io");

    // Get answer and discussion details
    const answer = await dbGet(
      `
      SELECT a.*, d.author_id as discussion_author_id
      FROM discussion_answers a
      JOIN discussions d ON a.discussion_id = d.id
      WHERE a.id = ?
    `,
      [parseInt(id)]
    );

    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }

    // Check if user is the discussion author
    if (answer.discussion_author_id !== req.user.id) {
      return res.status(403).json({
        error: "Only the discussion author can mark best answer",
      });
    }

    // Remove existing best answer
    await dbRun(
      "UPDATE discussion_answers SET is_best_answer = 0 WHERE discussion_id = ?",
      [answer.discussion_id]
    );

    // Mark this answer as best
    await dbRun(
      "UPDATE discussion_answers SET is_best_answer = 1 WHERE id = ?",
      [parseInt(id)]
    );

    // Emit real-time best answer update
    if (io) {
      emitBestAnswerMarked(io, answer.discussion_id, id);
    }
    // Create notification for answer author
    if (answer.author_id !== req.user.id) {
      const discussion = await dbGet(
        "SELECT title FROM discussions WHERE id = ?",
        [answer.discussion_id]
      );
      await createNotification(
        answer.author_id,
        "best_answer",
        "Best Answer Selected",
        `Your answer was marked as the best answer for: "${discussion.title}"`,
        answer.discussion_id,
        "discussion",
        req.user.id,
        req.user.username,
        io
      );
    }

    res.json({ message: "Answer marked as best answer" });
  } catch (error) {
    console.error("Error marking best answer:", error);
    res.status(500).json({ error: "Failed to mark best answer" });
  }
});

// Add reply to answer
router.post("/answers/:id/replies", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, images } = req.body;
    const io = req.app.get("io");

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    // Check if answer exists
    const answer = await dbGet(
      "SELECT a.*, d.title as discussion_title FROM discussion_answers a JOIN discussions d ON a.discussion_id = d.id WHERE a.id = ?",
      [id]
    );
    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }

    const result = await dbRun(
      `
      INSERT INTO discussion_replies (answer_id, content, images, author_id)
      VALUES (?, ?, ?, ?)
    `,
      [
        parseInt(id),
        content,
        images ? JSON.stringify(images) : null,
        req.user.id,
      ]
    );

    // Get the complete reply data for real-time emission
    const newReply = await dbGet(
      `
      SELECT 
        r.*,
        u.username as author_username,
        0 as vote_count,
        0 as upvotes,
        0 as downvotes
      FROM discussion_replies r
      LEFT JOIN users u ON r.author_id = u.id
      WHERE r.id = ?
    `,
      [result.lastInsertRowid || result.insertId]
    );

    // Emit real-time update
    if (io) {
      emitNewReply(io, answer.discussion_id, id, newReply);
    }
    // Create notification for answer author
    if (answer.author_id !== req.user.id) {
      await createNotification(
        answer.author_id,
        "reply",
        "New Reply",
        `${req.user.username} replied to your answer in: "${answer.discussion_title}"`,
        answer.discussion_id,
        "discussion",
        req.user.id,
        req.user.username,
        io
      );
    }

    // Handle mentions in content
    const mentions = extractMentions(content);
    for (const username of mentions) {
      const mentionedUser = await dbGet(
        "SELECT id FROM users WHERE username = ?",
        [username]
      );
      if (mentionedUser && mentionedUser.id !== req.user.id) {
        await createNotification(
          mentionedUser.id,
          "mention",
          "You were mentioned",
          `${req.user.username} mentioned you in a reply: "${answer.discussion_title}"`,
          answer.discussion_id,
          "discussion",
          req.user.id,
          req.user.username,
          io
        );
      }
    }

    res.status(201).json({
      id: result.id,
      message: "Reply added successfully",
    });
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({ error: "Failed to add reply" });
  }
});

// Vote on reply
router.post("/replies/:id/vote", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    const io = req.app.get("io");

    if (!["up", "down"].includes(voteType)) {
      return res.status(400).json({ error: "Invalid vote type" });
    }

    const existingVote = await dbGet(
      "SELECT id, vote_type FROM reply_votes WHERE reply_id = ? AND user_id = ?",
      [parseInt(id), req.user.id]
    );

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        await dbRun("DELETE FROM reply_votes WHERE id = ?", [existingVote.id]);
      } else {
        await dbRun("UPDATE reply_votes SET vote_type = ? WHERE id = ?", [
          voteType,
          existingVote.id,
        ]);
      }
    } else {
      await dbRun(
        "INSERT INTO reply_votes (reply_id, user_id, vote_type) VALUES (?, ?, ?)",
        [parseInt(id), req.user.id, voteType]
      );
    }

    // Get discussion ID and vote count
    const replyInfo = await dbGet(
      `SELECT a.discussion_id 
       FROM discussion_replies r 
       JOIN discussion_answers a ON r.answer_id = a.id 
       WHERE r.id = ?`,
      [parseInt(id)]
    );
    const voteCount = await dbGet(
      "SELECT COUNT(*) as count FROM reply_votes WHERE reply_id = ?",
      [parseInt(id)]
    );

    // Emit real-time vote update
    if (io && replyInfo) {
      emitVoteUpdate(io, replyInfo.discussion_id, id, "reply", voteCount.count);
    }

    res.json({ message: "Vote processed successfully" });
  } catch (error) {
    console.error("Error voting on reply:", error);
    res.status(500).json({ error: "Failed to vote" });
  }
});

// Get user notifications
router.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const notifications = await dbAll(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );

    const unreadCount = await dbGet(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0",
      [req.user.id]
    );

    res.json({
      notifications,
      unreadCount: unreadCount.count,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.put("/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await dbRun(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [parseInt(id), req.user.id]
    );

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
router.put("/notifications/read-all", authenticateToken, async (req, res) => {
  try {
    await dbRun("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [
      req.user.id,
    ]);

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

// Search users for mentions
router.get("/users/search", authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const users = await dbAll(
      "SELECT username FROM users WHERE username LIKE ? LIMIT 10",
      [`%${q}%`]
    );

    res.json(users.map((user) => user.username));
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
});

// Get popular tags
router.get("/tags/popular", async (req, res) => {
  try {
    const tags = await dbAll(`
      SELECT 
        tag,
        COUNT(*) as count
      FROM (
        SELECT 
          TRIM(json_each.value, '"') as tag
        FROM discussions, json_each(discussions.tags)
        WHERE discussions.tags IS NOT NULL
      ) tag_list
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 20
    `);

    res.json(tags);
  } catch (error) {
    console.error("Error fetching popular tags:", error);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

export default router;
