import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const upsertSchema = z.object({
  tmdb_id: z.number().int(),
  media_type: z.enum(["movie", "tv"]),
  review_text: z.string().min(1).max(2000),
  star_rating: z.number().int().min(1).max(5),
  is_public: z.boolean().optional(),
});

type PublicReviewRow = {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: "movie" | "tv";
  review_text: string;
  star_rating: number;
  updated_at: string;
};

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

  const admin = createSupabaseAdminClient();
  const { data: reviewRows, error: reviewsError } = await admin
    .from("item_reviews")
    .select("id,user_id,tmdb_id,media_type,review_text,star_rating,updated_at")
    .eq("tmdb_id", Number(tmdbId))
    .eq("media_type", mediaType)
    .eq("is_public", true)
    .order("updated_at", { ascending: false });

  if (reviewsError) {
    return NextResponse.json({ error: reviewsError.message }, { status: 400 });
  }

  const reviews = (reviewRows ?? []) as PublicReviewRow[];
  if (reviews.length === 0) {
    return NextResponse.json({ reviews: [] });
  }

  const userIds = Array.from(new Set(reviews.map((review) => review.user_id)));
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("user_id,username,profile_public")
    .in("user_id", userIds)
    .eq("profile_public", true);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 400 });
  }

  const publicProfileByUserId = new Map(
    (profiles ?? []).map((profile) => [profile.user_id, profile.username]),
  );

  const serialized = reviews
    .filter((review) => publicProfileByUserId.has(review.user_id))
    .map((review) => ({
      id: review.id,
      tmdb_id: review.tmdb_id,
      media_type: review.media_type,
      review_text: review.review_text,
      star_rating: review.star_rating,
      updated_at: review.updated_at,
      username: publicProfileByUserId.get(review.user_id),
    }));

  return NextResponse.json({ reviews: serialized });
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
        is_public: payload.is_public ?? profile?.default_review_public ?? true,
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
