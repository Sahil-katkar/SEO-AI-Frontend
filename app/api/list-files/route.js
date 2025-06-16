import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const backendUrl = new URL("http://127.0.0.1:8000/gdrive/spreadsheets");

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("list-files status:", response.status);
    console.log(
      "Backend response headers list files:",
      Object.fromEntries(response.headers)
    );

    const rawText = await response.text();

    if (!rawText || rawText.trim() === "") {
      console.error("Empty response from backend");
      return NextResponse.json(
        { detail: "Empty response from backend" },
        { status: 500 }
      );
    }

    const contentType = response.headers.get("Content-Type") || "";

    if (!contentType.includes("application/json")) {
      console.error("Unexpected Content-Type:", contentType);
      return NextResponse.json(
        {
          detail: `Unexpected Content-Type: ${contentType}`,
          rawResponse: rawText,
        },
        { status: 500 }
      );
    }

    const json = JSON.parse(rawText);
    return NextResponse.json(json);
  } catch (error) {
    console.error("Proxy error in /api/view-article:", error.message);
    return NextResponse.json(
      { detail: `Failed to connect to backend: ${error.message}` },
      { status: 500 }
    );
  }
}
