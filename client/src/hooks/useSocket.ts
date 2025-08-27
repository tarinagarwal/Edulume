import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { getAuthToken } from "../utils/auth";

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      console.log("❌ No auth token available for socket connection");
      return;
    }

    // Prevent multiple connections
    if (socketRef.current?.connected) {
      console.log("✅ Socket already connected, reusing existing connection");
      return;
    }

    // Disconnect existing socket if any
    if (socketRef.current) {
      console.log("🔄 Disconnecting existing socket before creating new one");
      socketRef.current.disconnect();
    }

    console.log("🚀 Creating new socket connection...");

    // Initialize socket connection
    socketRef.current = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3001",
      {
        auth: {
          token: token,
        },
        extraHeaders: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("✅ Socket connected to server, ID:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected from server");
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    // Add debugging for all events
    socket.onAny((eventName, ...args) => {
      if (eventName !== "ping" && eventName !== "pong") {
        console.log(`🔔 Socket event received: ${eventName}`, args);
      }
    });

    // Track socket state changes
    socket.on("connect", () => {
      console.log("🔗 Socket connected, ready to join rooms");
    });

    socket.on("disconnect", (reason) => {
      console.log("💔 Socket disconnected, reason:", reason);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Remove token dependency to avoid reconnecting on every token change

  return socketRef.current;
};

export default useSocket;
