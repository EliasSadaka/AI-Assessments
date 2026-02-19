import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isValidUsername(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_]{3,24}$/.test(value);
}

function isValidDisplayName(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 50;
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 400 });
  }

  if (existing) {
    return NextResponse.json({ created: false, ok: true });
  }

  const metadata = user.user_metadata ?? {};
  const rawUsername = metadata.username;
  const rawDisplayName = metadata.display_name;

  if (!isValidUsername(rawUsername) || !isValidDisplayName(rawDisplayName)) {
    return NextResponse.json({ created: false, ok: true });
  }

  const { error } = await supabase.from("profiles").insert({
    user_id: user.id,
    username: rawUsername.toLowerCase(),
    display_name: rawDisplayName.trim(),
    profile_public: true,
    default_item_public: true,
    default_review_public: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ created: true, ok: true });
}