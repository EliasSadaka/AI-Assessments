import { NextResponse } from "next/server";
import {
  generateRecommendations,
  getCachedRecommendations,
  isRateLimited,
  setCachedRecommendations,
} from "@/lib/ai";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRateLimited(user.id)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again soon." },
      { status: 429 },
    );
  }

  const cached = getCachedRecommendations(user.id);
  if (cached) {
    return NextResponse.json({ recommendations: cached, cached: true });
  }

  const { data: collection, error } = await supabase
    .from("collection_items")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const recommendations = await generateRecommendations(collection ?? []);
  setCachedRecommendations(user.id, recommendations);

  return NextResponse.json({ recommendations, cached: false });
}
