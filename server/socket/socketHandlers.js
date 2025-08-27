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
      console.log("❌ Socket auth: No token found in any location");
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
      console.log("❌ Socket auth: User not found for token");
      return next(new Error("User not found"));
    }

    console.log("✅ Socket authenticated:", user.username);
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
    console.log(
      `✅ User ${socket.user.username} connected with socket ID: ${socket.id}`
    );

    // Join user to their personal room for notifications
    socket.join(`user_${socket.user.id}`);

    // Join discussion room
    socket.on("join_discussion", (discussionId) => {
      const roomName = `discussion_${discussionId}`;
      socket.join(roomName);
      console.log(
        `✅ User ${socket.user.username} joined discussion room: ${roomName}`
      );

      // Check room membership immediately after joining
      setTimeout(() => {
        const room = io.sockets.adapter.rooms.get(roomName);
        const clientCount = room ? room.size : 0;
        console.log(`👥 Clients in room ${roomName} after join:`, clientCount);

        // List all rooms this socket is in
        const socketRooms = Array.from(socket.rooms);
        console.log(
          `🏠 Socket ${socket.user.username} is in rooms:`,
          socketRooms
        );
      }, 100);
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

    // Test event handler
    socket.on("test_event", (data) => {
      console.log(`🧪 Test event from ${socket.user.username}:`, data);
      socket.emit("test_event", {
        message: `Hello back from server, ${socket.user.username}!`,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.log(
        `❌ User ${socket.user.username} disconnected. Reason: ${reason}`
      );
      console.log(
        `🏠 Socket ${socket.id} was in rooms:`,
        Array.from(socket.rooms)
      );
    });
  });
};

// Helper functions to emit events from routes
export const emitNewAnswer = (io, discussionId, answer) => {
  const roomName = `discussion_${discussionId}`;
  console.log("📡 Emitting new_answer to room:", roomName);

  // Check how many clients are in the room
  const room = io.sockets.adapter.rooms.get(roomName);
  const clientCount = room ? room.size : 0;
  console.log(`👥 Clients in room ${roomName}:`, clientCount);

  io.to(roomName).emit("new_answer", answer);
};

export const emitNewReply = (io, discussionId, answerId, reply) => {
  const roomName = `discussion_${discussionId}`;
  console.log("📡 Emitting new_reply to room:", roomName, {
    answerId,
    reply,
  });

  // Check how many clients are in the room
  const room = io.sockets.adapter.rooms.get(roomName);
  const clientCount = room ? room.size : 0;
  console.log(`👥 Clients in room ${roomName}:`, clientCount);

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
  io.to(`user_${userId}`).emit("new_notification", notification);
};
