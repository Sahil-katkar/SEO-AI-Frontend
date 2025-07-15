import { NextResponse } from "next/server";

const FASTAPI_BACKEND_URL =
  process.env.FASTAPI_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request) {
  try {
    console.log("Request received for /save_to_gdrive/");
    const requestBody = await request.json();
    const article_content = String(requestBody.article_content);
    const folder_name = String(requestBody.folder_name);
    const backendPayload = {
      article_content: article_content,
      folder_name: folder_name,
    };

    console.log("backendPayload server", backendPayload);

    const apiResponse = await fetch(
      `${FASTAPI_BACKEND_URL}/create_google_doc/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendPayload),
      }
    );

    const data = await apiResponse.json();
    console.log("FastAPI response:", data);

    if (!apiResponse.ok) {
      // If FastAPI returns an error, it usually sends a JSON object with a 'detail' field.
      return NextResponse.json(
        { error: data.detail || "Backend error at save-to-gdrive" },
        { status: apiResponse.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in Next.js API route:", error);
    let errorMessage = "An internal server error occurred.";
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      errorMessage = "Invalid JSON in request body.";
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
