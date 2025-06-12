// File: /app/api/view-article/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const backendUrl = new URL("http://127.0.0.1:8000/get_doc_data");

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json", // Explicitly request JSON
      },
    });

    // Log response details
    console.log("Backend response status:", response.status);
    console.log(
      "Backend response headers:",
      Object.fromEntries(response.headers)
    );

    const rawText = await response.text();
    console.log("Raw response from get_doc_data backend:", rawText);
    console.log("Raw response length:", rawText.length);
    console.log("Raw response first 100 chars:", rawText.slice(0, 100));

    // Check if response is empty
    if (!rawText || rawText.trim() === "") {
      console.error("Empty response from backend");
      return NextResponse.json(
        { detail: "Empty response from backend" },
        { status: 500 }
      );
    }

    // Check Content-Type header
    const contentType = response.headers.get("Content-Type");
    if (!contentType?.includes("application/json")) {
      console.error("Unexpected Content-Type:", contentType);
      return NextResponse.json(
        {
          detail: `Unexpected Content-Type: ${contentType || "unknown"}`,
          rawResponse: rawText,
        },
        { status: 500 }
      );
    }

    // Remove BOM and trim whitespace
    const cleanedText = rawText.replace(/^\ufeff/, "").trim();

    // Attempt to parse JSON
    let data;
    try {
      data = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      console.error("Raw response causing parse error:", rawText);
      return NextResponse.json(
        {
          detail: `Invalid JSON response from backend: ${parseError.message}`,
          rawResponse: rawText,
        },
        { status: 500 }
      );
    }

    // Validate response structure
    if (!Array.isArray(data)) {
      console.error("Unexpected response format: not an array", data);
      return NextResponse.json(
        { detail: "Unexpected response format: expected an array" },
        { status: 500 }
      );
    }

    // Clean up content fields and validate structure
    const cleanedData = data.map((item, index) => {
      if (!item.id || !item.name || !item.mimeType || !item.status) {
        console.warn(`Invalid item at index ${index}:`, item);
      }
      return {
        ...item,
        content: item.content ? item.content.replace(/^\ufeff/, "") : "",
      };
    });

    // Check if response is OK
    if (!response.ok) {
      return NextResponse.json(
        { detail: data.detail || `Backend error: ${response.statusText}` },
        { status: response.status }
      );
    }

    return NextResponse.json(cleanedData);
  } catch (error) {
    console.error("Proxy error in /api/view-article:", error.message);
    return NextResponse.json(
      { detail: `Failed to connect to backend: ${error.message}` },
      { status: 500 }
    );
  }
}
