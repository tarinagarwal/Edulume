import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { getToken } from "../utils/auth";

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Initialize socket connection
    socketRef.current = io("http://localhost:3001", {
      auth: {
        token,
      },
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return socketRef.current;
};

export default useSocket;
