export async function POST(req) {
  try {
    const { intent, content } = await req.json();

    if (!intent || !content) {
      return new Response(
        JSON.stringify({ error: "Intent and content are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Forward the request to the Python backend
    const backendResponse = await fetch("http://127.0.0.1:8000/edit_intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ intent, content }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return new Response(
        JSON.stringify({ error: errorData.message || "Backend error" }),
        {
          status: backendResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await backendResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
