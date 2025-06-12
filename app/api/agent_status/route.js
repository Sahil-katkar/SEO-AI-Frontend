import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const primaryKeyword = searchParams.get("PRIMARY_KEYWORD");

    const backendUrl = new URL("http://127.0.0.1:8000/agent_status");
    if (primaryKeyword) {
      backendUrl.searchParams.append("PRIMARY_KEYWORD", primaryKeyword);
    }

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Log raw response text for debugging
    const rawText = await response.text();
    console.log("Raw response from agent_status backend:", rawText);

    // Attempt to parse JSON
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      return NextResponse.json(
        { detail: "Invalid JSON response from backend: " + parseError.message },
        { status: 500 }
      );
    }

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
