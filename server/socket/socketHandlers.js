import jwt from "jsonwebtoken";
import prisma from "../db.js";

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    // Try to get token from auth header first (for token-based auth)
    let token = socket.handshake.auth?.token;

    // Fallback to cookie-based auth if no token in auth
    if (!token) {
      token = socket.handshake.headers.cookie
        ?.split(";")
        ?.find((c) => c.trim().startsWith("token="))
        ?.split("=")[1];
    }

    // Try Authorization header as well
    if (!token) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

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
    // Join user to their personal room for notifications
    const userRoom = `user_${socket.user.id}`;
    socket.join(userRoom);

    // Join discussion room
    socket.on("join_discussion", (discussionId) => {
      const roomName = `discussion_${discussionId}`;
      socket.join(roomName);
    });

    // Leave discussion room
    socket.on("leave_discussion", (discussionId) => {
      socket.leave(`discussion_${discussionId}`);
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

    // Test event handler
    socket.on("test_event", (data) => {
      socket.emit("test_event", {
        message: `Hello back from server, ${socket.user.username}!`,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      // Silent disconnect
    });
  });
};

// Helper functions to emit events from routes
export const emitNewAnswer = (io, discussionId, answer) => {
  const roomName = `discussion_${discussionId}`;
  io.to(roomName).emit("new_answer", answer);
};

export const emitNewReply = (io, discussionId, answerId, reply) => {
  const roomName = `discussion_${discussionId}`;
  io.to(roomName).emit("new_reply", {
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
  const userRoom = `user_${userId}`;
  io.to(userRoom).emit("new_notification", notification);
};
