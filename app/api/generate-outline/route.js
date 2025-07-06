// /api/generate-outline/route.js

import { NextResponse } from "next/server";

const FASTAPI_BACKEND_URL =
  process.env.FASTAPI_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request) {
  try {
    const {
      primary_keyword,
      lsi_keywords,
      intent,
      persona,
      questions,
      faq,
      standard_outline_format,
    } = await request.json();

    // --- START: DATA TRANSFORMATION ---

    // 1. Clean up the LSI keywords into a flat array of non-empty strings.
    // The .flat(Infinity) handles nested arrays, and the .filter cleans it up.
    const cleanedLsiKeywords = (lsi_keywords || [])
      .flat(Infinity)
      .filter((kw) => typeof kw === "string" && kw.trim() !== "");

    // 2. Convert the newline-separated questions string into an array of strings.
    const questionsArray = questions
      ? questions.split("\n").filter((q) => q.trim() !== "")
      : [];

    // 3. Convert the newline-separated FAQ string into an array of strings.
    const faqArray = faq ? faq.split("\n").filter((f) => f.trim() !== "") : [];

    // --- END: DATA TRANSFORMATION ---

    // Construct the payload with the corrected data types for the FastAPI backend.
    const backendPayload = {
      primary_keyword,
      lsi_keywords: cleanedLsiKeywords, // Use the cleaned array
      intent,
      persona,
      questions: questionsArray, // Use the new array
      faq: faqArray, // Use the new array
      standard_outline_format: standard_outline_format,
    };

    console.log("Sending CLEANED payload to FastAPI:", backendPayload);

    const apiResponse = await fetch(
      `${FASTAPI_BACKEND_URL}/generate_article_outline_gemini/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendPayload),
      }
    );

    const data = await apiResponse.json();
    console.log("FastAPI response:", data);

    if (!apiResponse.ok) {
      // The error from FastAPI will now be more informative if something else is wrong.
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
