import jwt from "jsonwebtoken";
import { dbGet } from "../db.js";

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.headers.cookie
      ?.split(';')
      ?.find(c => c.trim().startsWith('token='))
      ?.split('=')[1];
      
    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await dbGet(
      "SELECT id, username, email FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication error"));
  }
};

export const setupSocketHandlers = (io) => {
  // Authentication middleware
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    console.log(`User ${socket.user.username} connected`);

    // Join user to their personal room for notifications
    socket.join(`user_${socket.user.id}`);

    // Join discussion room
    socket.on("join_discussion", (discussionId) => {
      socket.join(`discussion_${discussionId}`);
      console.log(
        `User ${socket.user.username} joined discussion ${discussionId}`
      );
    });

    // Leave discussion room
    socket.on("leave_discussion", (discussionId) => {
      socket.leave(`discussion_${discussionId}`);
      console.log(
        `User ${socket.user.username} left discussion ${discussionId}`
      );
    });

    // Handle typing indicators
    socket.on("typing_start", ({ discussionId, type }) => {
      socket.to(`discussion_${discussionId}`).emit("user_typing", {
        userId: socket.user.id,
        username: socket.user.username,
        type, // 'answer' or 'reply'
      });
    });

    socket.on("typing_stop", ({ discussionId }) => {
      socket.to(`discussion_${discussionId}`).emit("user_stop_typing", {
        userId: socket.user.id,
      });
    });

    // Handle real-time vote updates
    socket.on(
      "vote_update",
      ({ discussionId, targetId, targetType, voteType }) => {
        socket.to(`discussion_${discussionId}`).emit("vote_updated", {
          targetId,
          targetType, // 'discussion', 'answer', 'reply'
          voteType, // 'up' or 'down'
          userId: socket.user.id,
        });
      }
    );

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User ${socket.user.username} disconnected`);
    });
  });
};

// Helper functions to emit events from routes
export const emitNewAnswer = (io, discussionId, answer) => {
  io.to(`discussion_${discussionId}`).emit("new_answer", answer);
};

export const emitNewReply = (io, discussionId, answerId, reply) => {
  io.to(`discussion_${discussionId}`).emit("new_reply", {
    answerId,
    reply,
  });
};

export const emitBestAnswerMarked = (io, discussionId, answerId) => {
  io.to(`discussion_${discussionId}`).emit("best_answer_marked", {
    answerId,
  });
};

export const emitVoteUpdate = (
  io,
  discussionId,
  targetId,
  targetType,
  voteCount
) => {
  io.to(`discussion_${discussionId}`).emit("vote_count_updated", {
    targetId,
    targetType,
    voteCount,
  });
};

export const emitNotification = (io, userId, notification) => {
  io.to(`user_${userId}`).emit("new_notification", notification);
};
