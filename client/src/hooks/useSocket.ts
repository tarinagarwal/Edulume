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
      console.log("✅ Socket connected to server");
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected from server");
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
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
