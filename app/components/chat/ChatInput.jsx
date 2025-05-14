// frontend/components/chat/ChatInput.jsx
"use client"; // This component uses client-side features (useState, useRef, events)

import React, { useState, useRef, useEffect } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function ChatInput({ onSendMessage, disabled }) {
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  // Focus input when enabled
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input);
      setInput(""); // Clear input after sending
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex p-4 border-t">
      {" "}
      {/* Basic styling */}
      <Input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        disabled={disabled}
        className="flex-grow mr-2" // Basic styling
      />
      <Button type="submit" disabled={disabled}>
        Send
      </Button>
    </form>
  );
}
