import { NextResponse } from "next/server";

const FASTAPI_BACKEND_URL =
  process.env.FASTAPI_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request) {
  try {
    const { urls } = await request.json();

    console.log("urls", urls);

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "competitor_urls must be a non-empty array of strings" },
        { status: 400 }
      );
    }
    const backendPayload = {
      urls,
    };

    console.log("backendPayload", backendPayload);

    const apiResponse = await fetch(
      `${FASTAPI_BACKEND_URL}/get_topic_modeling_keywords/`,
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
