import { io } from "socket.io-client";

// Singleton socket instance
let socket;

export const initiateSocketConnection = (userId) => {
  // Use the same base URL logic as api.js
  const URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  
  // Only connect if not already connected
  if (socket && socket.connected) return;
  
  socket = io(URL, {
    query: { user_id: userId },
    transports: ["websocket", "polling"],
  });

  console.log(`Connecting to socket at ${URL}...`);

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};

export const getSocket = () => {
  return socket;
};
