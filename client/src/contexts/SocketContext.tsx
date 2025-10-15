import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Socket } from "socket.io-client";
import { getAuthToken } from "../utils/auth";
import { loadSocketIO } from "../utils/lazySocket";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context.socket;
};

export const useSocketConnection = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketConnection must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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

    // Lazy load socket.io (Fix #9)
    loadSocketIO().then(({ io }) => {
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
        setIsConnected(true);
      });

      socket.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected from server, reason:", reason);
        setIsConnected(false);
      });

      socket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
        setIsConnected(false);
      });

      // Add debugging for all events
      socket.onAny((eventName, ...args) => {
        if (eventName !== "ping" && eventName !== "pong") {
          console.log(`🔔 Socket event received: ${eventName}`, args);
        }
      });
    });

    return () => {
      if (socketRef.current) {
        console.log("🧹 Cleaning up socket connection");
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, []); // Only run once on mount

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
