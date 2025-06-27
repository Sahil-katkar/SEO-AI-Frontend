import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const file_id = searchParams.get("file_id");
    const folder_name = searchParams.get("folder_name");

    const backendUrl = new URL("http://127.0.0.1:8000/fetch_google_sheets/");
    if (file_id) backendUrl.searchParams.set("file_id", file_id);
    if (folder_name) backendUrl.searchParams.set("folder_name", folder_name);

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("list-files status:", response.status);

    const rawText = await response.text();

    if (!rawText.trim()) {
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
    console.error("Proxy error in /api/list-files:", error.message);
    return NextResponse.json(
      { detail: `Failed to connect to backend: ${error.message}` },
      { status: 500 }
    );
  }
}
