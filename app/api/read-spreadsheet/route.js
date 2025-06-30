// import { NextResponse } from "next/server";

// export async function POST(request) {
//   try {
//     const body = await request.json();
//     console.log("body", body);

//     const backendUrl = new URL("http://127.0.0.1:8000/read-spreadsheet/");
//     const response = await fetch(backendUrl, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//       },
//       body: JSON.stringify(body),
//     });

//     const data = await response.json();
//     console.log("data", data);

//     // const rawText = await response.text();
//     // if (!rawText || rawText.trim() === "") {
//     //   console.error("Empty response from backend");
//     //   return NextResponse.json(
//     //     { detail: "Empty response from backend" },
//     //     { status: 500 }
//     //   );
//     // }

//     // const contentType = response.headers.get("Content-Type") || "";

//     // if (!contentType.includes("application/json")) {
//     //   console.error("Unexpected Content-Type:", contentType);
//     //   return NextResponse.json(
//     //     {
//     //       detail: `Unexpected Content-Type: ${contentType}`,
//     //       rawResponse: rawText,
//     //     },
//     //     { status: 500 }
//     //   );
//     // }

//     return NextResponse.json(data);
//   } catch (error) {
//     console.error("Error in /read-spreadsheet:", error.message);
//     return NextResponse.json(
//       { detail: `Failed to connect to backend: ${error.message}` },
//       { status: 500 }
//     );
//   }
// }

// src/app/api/process-file/route.js

import { NextResponse } from "next/server";

// Get the backend URL from environment variables for security and flexibility
const FASTAPI_BACKEND_URL =
  process.env.FASTAPI_BACKEND_URL || "http://127.0.0.1:8000";

/**
 * Handles POST requests to process a file.
 * @param {Request} request - The incoming request object from the client.
 * @returns {Promise<NextResponse>} A promise that resolves to the response.
 */

export async function POST(request) {
  try {
    const { fileId } = await request.json(); // ✅ Correct: reads from frontend
    console.log("Received fileId:", fileId);

    if (!fileId) {
      return NextResponse.json(
        { error: "fileId is required" },
        { status: 400 }
      );
    }

    const apiResponse = await fetch(`${FASTAPI_BACKEND_URL}/files/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file_id: fileId }), // ✅ match FastAPI schema
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
