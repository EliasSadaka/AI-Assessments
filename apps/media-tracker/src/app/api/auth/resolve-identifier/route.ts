import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  identifier: z.string().trim().min(1),
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const normalized = parsed.data.identifier.toLowerCase();
  if (emailPattern.test(normalized)) {
    return NextResponse.json({ email: normalized });
  }

  const admin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("user_id")
    .eq("username", normalized)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: "Could not resolve login." }, { status: 400 });
  }

  if (!profile) {
    return NextResponse.json({ email: null });
  }

  const { data: userData, error: userError } =
    await admin.auth.admin.getUserById(profile.user_id);

  if (userError) {
    return NextResponse.json({ error: "Could not resolve login." }, { status: 400 });
  }

  return NextResponse.json({ email: userData.user?.email?.toLowerCase() ?? null });
}