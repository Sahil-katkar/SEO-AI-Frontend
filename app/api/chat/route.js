import { createServerSupabaseClient } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(request) {
  try {
    // Initialize Supabase client with request cookies
    const supabase = createServerSupabaseClient({ req: request });

    // Log cookies for debugging
    const cookies = request.headers.get("cookie") || "No cookies";
    console.log("Request cookies:", cookies);

    // Get user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log("Auth error:", authError?.message || "No user found");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Please log in" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Authenticated user:", user.id);

    // Parse request body
    let message;
    try {
      const body = await request.json();
      message = body.message;
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Save user message to database
    const { error: userMessageError } = await supabase
      .from("conversations")
      .insert([
        {
          user_id: user.id,
          message,
          role: "user",
        },
      ]);

    if (userMessageError) {
      console.error("Supabase user message error:", userMessageError);
      return new Response(
        JSON.stringify({
          error: `Database error: ${userMessageError.message}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get conversation history for context
    const { data: history, error: historyError } = await supabase
      .from("conversations")
      .select("role, message")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (historyError) {
      console.error("Supabase history error:", historyError);
      return new Response(
        JSON.stringify({ error: `Database error: ${historyError.message}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Format history for Gemini
    const geminiHistory = history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.message }],
    }));

    // Start chat session with history
    const chat = model.startChat({
      history: geminiHistory,
    });

    // Send message to Gemini
    let responseText;
    try {
      const result = await chat.sendMessage(message);
      responseText = result.response.text();
    } catch (geminiError) {
      console.error("Gemini API error:", geminiError);
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${geminiError.message}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Save model response to database
    const { error: modelMessageError } = await supabase
      .from("conversations")
      .insert([
        {
          user_id: user.id,
          message: responseText,
          role: "model",
        },
      ]);

    if (modelMessageError) {
      console.error("Supabase model message error:", modelMessageError);
      return new Response(
        JSON.stringify({
          error: `Database error: ${modelMessageError.message}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return response
    return new Response(JSON.stringify({ response: responseText }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in chat API:", error);
    return new Response(
      JSON.stringify({ error: `Server error: ${error.message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
