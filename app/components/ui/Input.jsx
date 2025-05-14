// frontend/components/ui/Input.jsx
import React from "react";

export default function Input({
  value,
  onChange,
  placeholder,
  disabled,
  ...props
}) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={{ padding: "8px", border: "1px solid #ccc" }} // Basic styles
      {...props}
    />
  );
}
