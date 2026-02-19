import { NextResponse } from "next/server";
import { getTmdbCredits } from "@/lib/tmdb";
import type { MediaType } from "@/lib/types";

export async function GET(
  _: Request,
  context: { params: Promise<{ type: string; id: string }> },
) {
  const { type, id } = await context.params;
  if (type !== "movie" && type !== "tv") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const tmdbId = Number(id);
  if (Number.isNaN(tmdbId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const creator = await getTmdbCredits(type as MediaType, tmdbId);
    return NextResponse.json({ creator });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch credits",
      },
      { status: 500 },
    );
  }
}
