import { NextResponse } from "next/server";

const FASTAPI_BACKEND_URL =
  process.env.FASTAPI_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request) {
  try {
    // const { fileId } = await request.json();
    const {
      missionPlan,
      gapsAndOpportunities,
      lsi_keywords,
      persona,
      outline,
      density,
      section,
    } = await request.json();

    if (
      !missionPlan ||
      !gapsAndOpportunities ||
      !lsi_keywords ||
      !persona ||
      !outline ||
      !density ||
      !section
    ) {
      return NextResponse.json(
        { error: "All inputs are required" },
        { status: 400 }
      );
    }

    const apiResponse = await fetch(
      `${FASTAPI_BACKEND_URL}/generate-article/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          { density: "123" }
          // { file_id: fileId }
        ),
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
