// frontend/components/chat/ChatWindow.jsx
"use client"; // This component uses client-side features (useRef, useEffect)

import React, { useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";

export default function ChatWindow({ messages }) {
  const messagesEndRef = useRef(null); // Ref for the bottom of the chat window

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className="flex flex-col flex-grow overflow-y-auto p-4"
      style={{ maxHeight: "calc(100vh - 150px)" }}
    >
      {" "}
      {/* Basic height/styling */}
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {/* Invisible element to scroll to */}
      <div ref={messagesEndRef} />
    </div>
  );
}
