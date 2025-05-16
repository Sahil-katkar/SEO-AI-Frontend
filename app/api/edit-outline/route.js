import { NextResponse } from "next/server";

const PYTHON_API_EDIT_OUTLINE_URL = `http://127.0.0.1:8000/edit-outline/`;

export async function POST(request) {
  console.log(`Next.js API: Received GET request at /edit-outline`);
  console.log(
    `Next.js API: Forwarding request to Python backend at ${PYTHON_API_EDIT_OUTLINE_URL}`
  );

  const body = await request.json();
  // console.log("body", body);

  let pythonResponse;
  try {
    pythonResponse = await fetch(`${PYTHON_API_EDIT_OUTLINE_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(body),
    });

    const data = await pythonResponse.json();
    // console.log("data",data);
    
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
    const errorMessage = `Error communicating with the backend API at ${PYTHON_API_EDIT_OUTLINE_URL}. Please ensure the api_server.py process is running and accessible.`;
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
