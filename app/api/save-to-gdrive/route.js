import { NextResponse } from "next/server";

const FASTAPI_BACKEND_URL =
  process.env.FASTAPI_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request) {
  try {
    console.log("hello");

    const { test_content_string, row_folder_name } = await request.json();

    console.log("row_folder_name", test_content_string, row_folder_name);

    const backendPayload = {
      test_content_string,
      row_folder_name,
    };

    console.log("backendPayload", backendPayload);

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
      return NextResponse.json(
        { error: data.detail || "Backend error" },
        { status: apiResponse.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in Next.js API route:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
