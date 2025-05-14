// frontend/components/chat/ChatMessage.jsx
import React from "react";
import { formatTimestamp } from "../../lib/utils";

export default function ChatMessage({ message }) {
  const isUser = message.sender === "user";
  const isAI = message.sender === "ai";
  const isSystem = message.sender === "system"; // For errors etc.

  // Basic styling classes - replace with Tailwind or your CSS framework
  const messageClasses = `p-2 my-2 rounded ${
    isUser
      ? "bg-blue-200 ml-auto text-right"
      : isAI
      ? "bg-gray-200 mr-auto text-left"
      : "bg-yellow-200 mr-auto text-left text-sm italic"
  }`;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={messageClasses} style={{ maxWidth: "70%" }}>
        {" "}
        {/* Basic max width */}
        <p>{message.content}</p>
        {/* Optional: display timestamp */}
        {message.timestamp && (
          <span className="block text-xs text-gray-500 mt-1">
            {formatTimestamp(message.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}
