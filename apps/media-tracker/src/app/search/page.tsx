"use client";

import { FormEvent, useMemo, useState } from "react";
import { MediaCard } from "@/components/media-card";
import type { NormalizedMediaItem } from "@/lib/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [type, setType] = useState<"all" | "movie" | "tv">("all");
  const [results, setResults] = useState<NormalizedMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return results.filter((item) => {
      if (type !== "all" && item.mediaType !== type) {
        return false;
      }
      if (year && item.year !== year) {
        return false;
      }
      return true;
    });
  }, [results, type, year]);

  const onSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ query });
    if (year) params.set("year", year);
    if (type !== "all") params.set("type", type);

    const response = await fetch(`/api/tmdb/search?${params.toString()}`);
    const data = (await response.json()) as {
      results?: NormalizedMediaItem[];
      error?: string;
    };
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Search failed");
      return;
    }

    setResults(data.results ?? []);
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Search catalog</h1>
        <p className="text-sm text-zinc-300">
          Find movies and series from TMDB, then add them to your collection.
        </p>
      </div>

      <form
        onSubmit={onSearch}
        className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 md:grid-cols-4"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title..."
          className="rounded px-3 py-2 md:col-span-2"
        />
        <select
          value={type}
          onChange={(event) =>
            setType(event.target.value as "all" | "movie" | "tv")
          }
          className="rounded px-3 py-2"
        >
          <option value="all">All types</option>
          <option value="movie">Movies</option>
          <option value="tv">TV series</option>
        </select>
        <input
          value={year}
          onChange={(event) => setYear(event.target.value)}
          placeholder="Year (optional)"
          className="rounded px-3 py-2"
        />
        <button
          disabled={loading}
          className="rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 md:col-span-4 md:w-fit"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((item) => (
            <MediaCard key={`${item.mediaType}-${item.id}`} item={item} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-400">
          No results yet. Search for something you want to watch.
        </p>
      )}
    </section>
  );
}
