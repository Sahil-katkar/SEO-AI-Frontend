// frontend/components/ui/Button.jsx
import React from "react";

export default function Button({ children, onClick, disabled, ...props }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 16px",
        cursor: disabled ? "not-allowed" : "pointer",
      }} // Basic styles
      {...props}
    >
      {children}
    </button>
  );
}
