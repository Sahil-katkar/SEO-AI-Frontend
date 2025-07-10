import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request, { params }) {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { row_id } = await params;

  const { data, error } = await supabase
    .from("analysis")
    .select("comp_analysis")
    .eq("row_id", row_id)
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
