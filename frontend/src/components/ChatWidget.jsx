import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { initiateSocketConnection, disconnectSocket, getSocket } from "../services/socket";
import api from "../services/api";

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null); // The user we are chatting with
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user) {
      initiateSocketConnection(user.id);
      fetchConversations();
    }
    return () => {
      disconnectSocket();
    };
  }, [user]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("new_message", (msg) => {
      console.log("New message received:", msg);
      // If the message is from the active chat user, append it
      if (activeChat && msg.sender_id === activeChat.id) {
        setMessages((prev) => [...prev, msg]);
      } else {
        // Otherwise refresh conversations to show unread indicator (optional)
        fetchConversations();
      }
    });

    socket.on("message_sent", (msg) => {
       // Confirmation that my message was sent
       if (activeChat && msg.receiver_id === activeChat.id) {
           setMessages((prev) => [...prev, msg]);
       }
    });

    socket.on("notification", (ignoredData) => {
       // Simple alert for MVP or could use a toast library
       // data = { title, message, link, ... }
       // console.log("LIVE NOTIFICATION:", data);
       // For now, just play a sound or console log is safer than blocking alert
       // alert(`From Admin: ${data.title}`);
    });

    return () => {
      socket.off("new_message");
      socket.off("message_sent");
      socket.off("notification");
    };
  }, [activeChat]);
  
  // Scroll to bottom
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await api.get("/api/messages/conversations");
      setConversations(res.data);
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    }
  };

  const fetchMessages = async (otherUserId) => {
    try {
      // Backend expects sender_id/receiver_id logic or a specific endpoint
      // The current backend endpoint is GET /api/messages?other_user_id=...
      const res = await api.get(`/api/messages`, { params: { other_user_id: otherUserId } });
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  const openChat = (targetUser) => {
    setActiveChat(targetUser);
    fetchMessages(targetUser.id);
  };
  
  const backToConversations = () => {
      setActiveChat(null);
      fetchConversations();
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !activeChat) return;

    const socket = getSocket();
    if (socket) {
      socket.emit("send_message", {
        sender_id: user.id,
        receiver_id: activeChat.id,
        content: newMessage,
      });
      setNewMessage("");
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {isOpen && (
        <div className="bg-white dark:bg-gray-800 w-80 h-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md">
            {activeChat ? (
                <div className="flex items-center gap-2">
                    <button onClick={backToConversations} className="text-sm underline opacity-80 hover:opacity-100">Back</button>
                    <span className="font-semibold truncate">{activeChat.full_name}</span>
                </div>
            ) : (
                <h3 className="font-semibold text-lg">Messages</h3>
            )}
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
            {!activeChat ? (
              // Conversation List
              <div className="space-y-2">
                {conversations.length === 0 ? (
                    <p className="text-gray-500 text-center mt-10">No recent conversations.</p>
                ) : (
                    conversations.map((u) => (
                    <div
                        key={u.id}
                        onClick={() => openChat(u)}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full">
                            <User size={20} className="text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-800 dark:text-gray-100">{u.full_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{u.role}</p>
                        </div>
                    </div>
                    ))
                )}
              </div>
            ) : (
              // Messages View
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === user.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] p-3 rounded-lg text-sm ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Footer (Input) - Only if chat active */}
          {activeChat && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
