import { NextResponse } from "next/server";

const FASTAPI_BACKEND_URL =
  process.env.FASTAPI_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request) {
  try {
    // 1. Destructure all the fields from the incoming request body
    const {
      business_goal,
      target_audience,
      primary_keyword,
      user_intent,
      pillar,
      cluster,
      Must_Answer_Questions,
      FAQs,
      lsi_terms,
      ai_overview,
      author_persona,
      article_outcome,
      outline,
    } = await request.json();

    // Log the entire received payload for easier debugging
    console.log("Received request body content_brief:", {
      business_goal,
      target_audience,
      primary_keyword,
      user_intent,
      pillar,
      cluster,
      Must_Answer_Questions,
      FAQs,
      lsi_terms,
      ai_overview,
      author_persona,
      article_outcome,
      outline,
    });

    // 2. Validate that essential fields are present
    if (!primary_keyword) {
      return NextResponse.json(
        { error: "fileId and primary_keyword are required" },
        { status: 400 }
      );
    }

    // 3. Construct the payload for the FastAPI backend.
    //    - Note the conversion of `fileId` (camelCase) to `file_id` (snake_case),
    //      a common practice when calling Python backends.
    //    - The other keys are passed as-is since they already match a common snake_case format.
    const backendPayload = {
      business_goal,
      target_audience,
      primary_keyword,
      user_intent,
      pillar,
      cluster,
      Must_Answer_Questions,
      FAQs,
      lsi_terms,
      ai_overview,
      author_persona,
      article_outcome,
      outline,
    };

    // 4. Forward the complete payload to your FastAPI backend
    const apiResponse = await fetch(`${FASTAPI_BACKEND_URL}/content_brief/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendPayload),
    });

    const data = await apiResponse.json();
    console.log("FastAPI response:", data);

    // Handle potential errors from the backend
    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: data.detail || "Backend error" },
        { status: apiResponse.status }
      );
    }

    // Return the successful response from the backend
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in Next.js API route:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
