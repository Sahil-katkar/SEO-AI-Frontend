import { NextResponse } from "next/server";

// Ensure the URL is read from environment variables
const FASTAPI_BACKEND_URL =
  process.env.FASTAPI_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request) {
  try {
    const { mission_plan_context, competitive_analysis_report } =
      await request.json();

    // IMPROVEMENT: Directly use the destructured variables. No need for a new object.
    const payload = {
      mission_plan_context,
      competitive_analysis_report,
    };

    console.log("Sending payload to FastAPI:", payload);

    // FIX: The URL had a double slash "//" and was missing the specific endpoint path.
    // Replace "generate_value_add" with your actual FastAPI endpoint.
    const apiResponse = await fetch(`${FASTAPI_BACKEND_URL}/comp_analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // We need to parse the JSON body to check for custom error messages, even if the request failed.
    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error("Error from FastAPI backend:", data);
      // The error from FastAPI might be in `data.detail` (common for validation errors).
      return NextResponse.json(
        { error: data.detail || data.error || "Backend error" },
        { status: apiResponse.status }
      );
    }

    console.log("FastAPI response:", data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    // This will catch network errors (e.g., FastAPI server is down) or JSON parsing errors.
    console.error("Error in Next.js API route:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
