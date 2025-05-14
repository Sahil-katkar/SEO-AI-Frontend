// frontend/hooks/useChat.js
import { useState, useEffect } from "react";
import { sendMessageToBackend } from "../lib/api";
// import { fetchConversationHistory } from '../lib/api'; // If you implement this

/**
 * Custom hook for managing chat state and interactions.
 */
export function useChat() {
  // State to hold messages: [{ id, sender: 'user' | 'ai', content, timestamp }]
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null); // Track the current conversation

  // TODO: Implement initial loading of conversation history if needed
  // useEffect(() => {
  //   async function loadInitialConversation() {
  //     // Check if a conversation ID is in the URL or local storage
  //     // If yes, fetch its history using fetchConversationHistory
  //     // setMessages(history);
  //     // setConversationId(id);
  //   }
  //   loadInitialConversation();
  // }, []); // Run once on mount

  /**
   * Sends a message to the backend and updates the chat state.
   * @param {string} messageText - The user's message.
   */
  const sendMessage = async (messageText) => {
    if (!messageText.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString() + "-user", // Simple temporary ID
      sender: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    // Add user message to the chat immediately
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setLoading(true);

    try {
      // Send message to backend, including conversation ID if it exists
      const response = await sendMessageToBackend(messageText, conversationId);

      // If this was the first message, set the conversation ID from the response
      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      const aiMessage = {
        id: response.message_id || Date.now().toString() + "-ai", // Use ID from backend if provided
        sender: "ai",
        content: response.answer,
        timestamp: new Date().toISOString(), // Use server timestamp if backend provides it
      };

      // Add AI message to the chat
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      // TODO: Display an error message to the user in the UI
      const errorMessage = {
        id: Date.now().toString() + "-error",
        sender: "system", // Or a specific error type
        content: "Error: Failed to get response. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);

      // Optional: remove the loading indicator even on error
      // setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // TODO: Implement a function to start a new conversation
  // const startNewConversation = () => {
  //     setMessages([]);
  //     setConversationId(null);
  //     // Maybe call backend to create a new conversation entry right away
  // };

  return {
    messages,
    loading,
    conversationId,
    sendMessage,
    // startNewConversation, // Expose if implemented
  };
}
