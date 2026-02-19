import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const upsertSchema = z.object({
  tmdb_id: z.number().int(),
  media_type: z.enum(["movie", "tv"]),
  review_text: z.string().min(1).max(2000),
  star_rating: z.number().int().min(1).max(5),
  is_public: z.boolean().optional(),
});

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const tmdbId = searchParams.get("tmdb_id");
  const mediaType = searchParams.get("media_type");
  const mine = searchParams.get("mine");

  if (!tmdbId || (mediaType !== "movie" && mediaType !== "tv")) {
    return NextResponse.json(
      { error: "Invalid query params" },
      { status: 400 },
    );
  }

  if (mine === "1") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("item_reviews")
      .select("*")
      .eq("user_id", user.id)
      .eq("tmdb_id", Number(tmdbId))
      .eq("media_type", mediaType)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ review: data });
  }

  const { data, error } = await supabase
    .from("public_reviews")
    .select("*")
    .eq("tmdb_id", Number(tmdbId))
    .eq("media_type", mediaType)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ reviews: data });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = upsertSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_review_public")
    .eq("user_id", user.id)
    .single();

  const payload = parsed.data;
  const { data, error } = await supabase
    .from("item_reviews")
    .upsert(
      {
        user_id: user.id,
        tmdb_id: payload.tmdb_id,
        media_type: payload.media_type,
        review_text: payload.review_text,
        star_rating: payload.star_rating,
        is_public: payload.is_public ?? profile?.default_review_public ?? false,
      },
      { onConflict: "user_id,tmdb_id,media_type" },
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ review: data });
}
