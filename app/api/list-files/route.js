import { NextResponse } from "next/server";

const PYTHON_API_BASE_URL =
  process.env.PYTHON_API_BASE_URL || "http://localhost:8001";
const PYTHON_API_LIST_FILES_URL = `${PYTHON_API_BASE_URL}/api/list-files`;

export async function GET(request) {
  console.log(`Next.js API: Received GET request at /api/list-files`);
  console.log(
    `Next.js API: Forwarding request to Python backend at ${PYTHON_API_LIST_FILES_URL}`
  );

  let pythonResponse;
  try {
    pythonResponse = await fetch(PYTHON_API_LIST_FILES_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await pythonResponse.json();

    if (!pythonResponse.ok) {
      console.error(
        `Next.js API: Python backend returned non-OK status ${pythonResponse.status}. Error data:`,
        data
      );
      return NextResponse.json(data, { status: pythonResponse.status });
    }
    console.log(`Next.js API: Received OK response from Python backend.`);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Next.js API: Error during fetch to Python backend:", error);
    const errorMessage = `Error communicating with the backend API at ${PYTHON_API_LIST_FILES_URL}. Please ensure the api_server.py process is running and accessible.`;
    return NextResponse.json(
      {
        detail:
          errorMessage +
          (error.message ? ` Underlying error: ${error.message}` : ""),
      },
      { status: 500 }
    );
  }
}
