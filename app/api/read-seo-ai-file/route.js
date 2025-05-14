export async function GET() {
  // Change this URL if your FastAPI server is running elsewhere
  const backendUrl = "http://localhost:8001/api/read-seo-ai-file";
  try {
    const res = await fetch(backendUrl, { method: "GET" });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Failed to connect to backend",
        detail: err.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
