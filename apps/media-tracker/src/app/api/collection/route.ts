import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createSchema = z.object({
  tmdb_id: z.number().int(),
  media_type: z.enum(["movie", "tv"]),
  status: z.enum(["wishlist", "currently_watching", "completed"]),
  is_public: z.boolean().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["wishlist", "currently_watching", "completed"]).optional(),
  is_public: z.boolean().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  notes: z.string().nullable().optional(),
  custom_title: z.string().nullable().optional(),
  custom_creator: z.string().nullable().optional(),
  custom_release_date: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const mediaType = searchParams.get("media_type");

  let query = supabase
    .from("collection_items")
    .select("*, item_notes(*), item_overrides(*)")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (mediaType) query = query.eq("media_type", mediaType);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ items: data });
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
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_item_public")
    .eq("user_id", user.id)
    .single();

  const { data, error } = await supabase
    .from("collection_items")
    .insert({
      user_id: user.id,
      ...parsed.data,
      is_public: parsed.data.is_public ?? profile?.default_item_public ?? true,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ item: data });
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const {
    id,
    rating,
    tags,
    notes,
    custom_title,
    custom_creator,
    custom_release_date,
    ...collectionUpdates
  } = parsed.data;

  const { error: collectionError } = await supabase
    .from("collection_items")
    .update(collectionUpdates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (collectionError) {
    return NextResponse.json(
      { error: collectionError.message },
      { status: 400 },
    );
  }

  if (rating !== undefined || tags !== undefined || notes !== undefined) {
    const { error: noteError } = await supabase.from("item_notes").upsert(
      {
        collection_item_id: id,
        rating: rating ?? null,
        tags: tags ?? null,
        notes: notes ?? null,
      },
      { onConflict: "collection_item_id" },
    );

    if (noteError) {
      return NextResponse.json({ error: noteError.message }, { status: 400 });
    }
  }

  if (
    custom_title !== undefined ||
    custom_creator !== undefined ||
    custom_release_date !== undefined
  ) {
    const { error: overrideError } = await supabase
      .from("item_overrides")
      .upsert(
        {
          collection_item_id: id,
          custom_title: custom_title ?? null,
          custom_creator: custom_creator ?? null,
          custom_release_date: custom_release_date ?? null,
        },
        { onConflict: "collection_item_id" },
      );

    if (overrideError) {
      return NextResponse.json(
        { error: overrideError.message },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("collection_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
