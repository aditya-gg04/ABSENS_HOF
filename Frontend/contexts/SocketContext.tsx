"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { toast } from "sonner";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isLoggedIn } = useSelector((state: RootState) => state.auth);
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    if (!isLoggedIn) {
      // Disconnect socket if user is not logged in
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize socket connection
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

    const socketInstance = io(`${API_URL}`, {
      auth: {
        token: accessToken,
      },
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
    });

    // Handle notifications
    socketInstance.on("notification:new", (notification) => {
      console.log("New notification received:", notification);
      
      // Show toast notification
      toast(notification.title, {
        description: notification.message,
        action: {
          label: "View",
          onClick: () => {
            // Navigate to the appropriate page based on notification type
            if (notification.relatedModel === "MissingPerson") {
              window.location.href = `/missing/${notification.relatedId}`;
            } else if (notification.relatedModel === "SightingReport") {
              window.location.href = `/report/${notification.relatedId}`;
            } else {
              window.location.href = "/alerts";
            }
          },
        },
      });
    });

    socketInstance.on("notification:global", (notification) => {
      console.log("Global notification received:", notification);
      
      // Show toast notification
      toast(notification.title, {
        description: notification.message,
        action: {
          label: "View",
          onClick: () => {
            // Navigate to the appropriate page based on notification type
            if (notification.relatedModel === "MissingPerson") {
              window.location.href = `/missing/${notification.relatedId}`;
            } else if (notification.relatedModel === "SightingReport") {
              window.location.href = `/report/${notification.relatedId}`;
            } else {
              window.location.href = "/alerts";
            }
          },
        },
      });
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [isLoggedIn, API_URL]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
