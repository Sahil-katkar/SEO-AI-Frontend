import React from "react";

const statusMap = {
    approved: {
        text: "Approved",
        bg: "bg-green-200",
        textColor: "text-green-900",
        border: "border-green-400",
        icon: "👍",
    },
    "not approved": {
        text: "Not Approved",
        bg: "bg-red-100",
        textColor: "text-red-800",
        border: "border-red-300",
        icon: "❌",
    },
};

export default function StatusHeading({ status }) {
    // Ensure status is a string before calling toLowerCase
    const normalizedStatus = typeof status === "string" ? status.toLowerCase() : "";
    const s = statusMap[normalizedStatus] || statusMap["not approved"];
    return (
        <div
            className={`flex items-center justify-center gap-3 px-6 py-4 mb-6 rounded-lg border text-l font-semibold shadow-sm ${s.bg} ${s.textColor} ${s.border}`}
            style={{ fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif" }}
        >
            <span className="">{s.icon}</span>
            <span>
                LSI keywords: <span className="capitalize">{s.text}</span>
            </span>
        </div>
    );
}
