import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    console.log("body", body);

    const backendUrl = new URL("http://127.0.0.1:8000/read-spreadsheet/");
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("data", data);

    // const rawText = await response.text();
    // if (!rawText || rawText.trim() === "") {
    //   console.error("Empty response from backend");
    //   return NextResponse.json(
    //     { detail: "Empty response from backend" },
    //     { status: 500 }
    //   );
    // }

    // const contentType = response.headers.get("Content-Type") || "";

    // if (!contentType.includes("application/json")) {
    //   console.error("Unexpected Content-Type:", contentType);
    //   return NextResponse.json(
    //     {
    //       detail: `Unexpected Content-Type: ${contentType}`,
    //       rawResponse: rawText,
    //     },
    //     { status: 500 }
    //   );
    // }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /read-spreadsheet:", error.message);
    return NextResponse.json(
      { detail: `Failed to connect to backend: ${error.message}` },
      { status: 500 }
    );
  }
}
