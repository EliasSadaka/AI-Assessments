import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim().toLowerCase();
  const username = searchParams.get("username")?.trim().toLowerCase();

  if (username) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url, profile_public")
      .eq("username", username)
      .eq("profile_public", true)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 },
      );
    }

    if (!profile) {
      return NextResponse.json({ profile: null, items: [], reviews: [] });
    }

    const { data: items, error: itemsError } = await supabase
      .from("collection_items")
      .select("*")
      .eq("user_id", profile.user_id)
      .eq("is_public", true)
      .order("added_at", { ascending: false });
    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }

    const { data: reviews, error: reviewsError } = await supabase
      .from("item_reviews")
      .select("*")
      .eq("user_id", profile.user_id)
      .eq("is_public", true)
      .order("updated_at", { ascending: false });
    if (reviewsError) {
      return NextResponse.json(
        { error: reviewsError.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ profile, items, reviews });
  }

  let usersQuery = supabase
    .from("profiles")
    .select("username, display_name")
    .eq("profile_public", true)
    .order("username");
  if (query) {
    usersQuery = usersQuery.ilike("username", `%${query}%`);
  }

  const { data, error } = await usersQuery.limit(25);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ users: data });
}
