// app/api/docs/create/route.js
// This file handles POST requests from your frontend to /api/docs/create

import { NextResponse } from "next/server";

const FASTAPI_CLIENT_URL = process.env.FASTAPI_CLIENT_URL;

if (!FASTAPI_CLIENT_URL) {
  console.error("FASTAPI_CLIENT_URL environment variable not set!");
}

export async function POST(request) {
  if (!FASTAPI_CLIENT_URL) {
    return NextResponse.json(
      {
        error:
          "Server configuration error: Backend URL for FastAPI client not set.",
      },
      { status: 500 }
    );
  }

  const backendCreateDocUrl = `${FASTAPI_CLIENT_URL}/api/docs/create`;
  console.log(
    `Next.js API (/api/docs/create): Forwarding POST request to ${backendCreateDocUrl}`
  );

  let requestBody;
  try {
    requestBody = await request.json();
    console.log(
      "Next.js API (/api/docs/create): Parsed request body:",
      requestBody
    );

    // Basic validation for the expected body structure for Doc creation
    if (
      !requestBody ||
      typeof requestBody.title !== "string" ||
      (requestBody.initial_content !== undefined &&
        typeof requestBody.initial_content !== "string")
    ) {
      console.error(
        "Next.js API (/api/docs/create): Invalid request body format."
      );
      return NextResponse.json(
        {
          error:
            "Invalid request body format. Required: { title: string, initial_content?: string }",
        },
        { status: 400 }
      );
    }
    if (!requestBody.title.trim()) {
      console.error("Next.js API (/api/docs/create): Title cannot be empty.");
      return NextResponse.json(
        { error: "Title cannot be empty." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(
      "Next.js API (/api/docs/create): Error parsing request body JSON:",
      error
    );
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  let responseText; // Variable to hold the raw text response from the backend

  try {
    const response = await fetch(backendCreateDocUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    console.log(
      `Next.js API (/api/docs/create): Received response status from backend: ${response.status}`
    );

    try {
      responseText = await response.text();
      console.log(
        "Next.js API Debug (/api/docs/create): Raw backend response text:",
        responseText
      );
    } catch (textError) {
      console.error(
        "Next.js API Debug (/api/docs/create): Failed to read response text:",
        textError
      );
      responseText = "";
    }

    let data;
    try {
      data = JSON.parse(responseText);
      console.log(
        "Next.js API Debug (/api/docs/create): Successfully parsed JSON data:",
        data
      );
    } catch (parseError) {
      console.error(
        "Next.js API Debug (/api/docs/create): Failed to parse JSON from response text.",
        parseError
      );
      return NextResponse.json(
        {
          error: `Failed to parse JSON response from backend: ${parseError.message}`,
          rawResponse: responseText,
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error(
        "Next.js API (/api/docs/create): Backend returned error status but JSON parsed:",
        response.status,
        data
      );
      return NextResponse.json(data, { status: response.status });
    }

    console.log(
      `Next.js API (/api/docs/create): Successfully processed doc creation request.`
    );
    return NextResponse.json(data, { status: 201 }); // Use 201 Created on success
  } catch (error) {
    console.error(
      `Next.js API (/api/docs/create): Network error during fetch to backend:`,
      error
    );
    return NextResponse.json(
      {
        error: `Network error contacting backend for doc creation: ${error.message}`,
      },
      { status: 500 }
    );
  }
}
