// /app/api/citable-summary/route.js
// This code is well-written and ready to receive the corrected client-side payload.

import { NextResponse } from "next/server";

const FASTAPI_BACKEND_URL =
  process.env.FASTAPI_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request) {
  try {
    const { mission_plan, initial_draft_index } = await request.json();

    // Basic validation to ensure you received what you expected
    if (!mission_plan || initial_draft_index === undefined) {
      return NextResponse.json(
        {
          error: "Missing mission_plan or initial_draft_index in request body.",
        },
        { status: 400 }
      );
    }

    const backendPayload = {
      mission_plan,
      initial_draft_index,
    };

    console.log("Sending CLEANED payload to FastAPI:", backendPayload);

    const apiResponse = await fetch(
      `${FASTAPI_BACKEND_URL}/generate_citable_sum/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendPayload),
      }
    );

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
