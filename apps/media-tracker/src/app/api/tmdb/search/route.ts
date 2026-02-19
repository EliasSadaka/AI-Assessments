import { NextResponse } from "next/server";
import { searchTmdb } from "@/lib/tmdb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const type = searchParams.get("type");
  const year = searchParams.get("year");

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const items = await searchTmdb(query);
    const filtered = items.filter((item) => {
      if (
        type &&
        (type === "movie" || type === "tv") &&
        item.mediaType !== type
      ) {
        return false;
      }
      if (year && item.year !== year) {
        return false;
      }
      return true;
    });

    return NextResponse.json({ results: filtered });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 },
    );
  }
}
