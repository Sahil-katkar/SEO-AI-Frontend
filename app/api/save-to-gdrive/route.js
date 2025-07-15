import { NextResponse } from "next/server";

const FASTAPI_BACKEND_URL =
  process.env.FASTAPI_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request) {
  try {
    console.log("Request received for /save_to_gdrive/");
    const requestBody = await request.json();
    const test_content_string = String(requestBody.test_content_string);
    const row_folder_name = String(requestBody.row_folder_name);
    const backendPayload = {
      test_content_string: test_content_string,
      row_folder_name: row_folder_name,
    };
    const apiResponse = await fetch(`${FASTAPI_BACKEND_URL}/save_to_gdrive/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendPayload),
    });

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
