import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json(); // Read the incoming JSON body

    console.log("Request from frontend:", body);

    const backendResponse = await fetch("http://127.0.0.1:8000/content_edit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body), // Send body as string
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.message || "Backend error" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data); // Success response
  } catch (error) {
    console.error("API Proxy Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
