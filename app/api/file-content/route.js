export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const file_id = searchParams.get("file_id");
  const backendUrl = `http://localhost:8001/api/file-content?file_id=${encodeURIComponent(
    file_id
  )}`;
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
