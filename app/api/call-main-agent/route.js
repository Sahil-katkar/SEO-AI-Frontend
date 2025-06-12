// app/api/call-main-agent/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const response = await fetch("http://127.0.0.1:8000/call_main_agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { detail: data.detail || "Backend error" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { detail: "Failed to connect to backend: " + error.message },
      { status: 500 }
    );
  }
}
