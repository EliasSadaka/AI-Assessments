"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CollectionStatus, MediaType } from "@/lib/types";
import type { Recommendation } from "@/lib/ai";

type CollectionRecord = {
  id: string;
  tmdb_id: number;
  media_type: MediaType;
  status: CollectionStatus;
  is_public: boolean;
  item_notes?: Array<{
    rating: number | null;
    tags: string[] | null;
    notes: string | null;
  }>;
  item_overrides?: Array<{
    custom_title: string | null;
    custom_creator: string | null;
    custom_release_date: string | null;
  }>;
};

type DisplayMap = Record<
  string,
  { title: string; posterPath: string | null; year: string | null }
>;

function posterUrl(path: string | null) {
  if (!path) {
    return "https://placehold.co/300x450?text=No+Poster";
  }
  return `https://image.tmdb.org/t/p/w342${path}`;
}

export default function CollectionPage() {
  const [items, setItems] = useState<CollectionRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | CollectionStatus>(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState<"all" | MediaType>("all");
  const [titles, setTitles] = useState<DisplayMap>({});
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const loadCollection = async () => {
    const response = await fetch("/api/collection");
    const data = (await response.json()) as { items?: CollectionRecord[] };
    const records = data.items ?? [];
    setItems(records);

    const resolvedTitles: DisplayMap = {};
    await Promise.all(
      records.slice(0, 30).map(async (item) => {
        const detailsRes = await fetch(
          `/api/tmdb/details/${item.media_type}/${item.tmdb_id}`,
        );
        const details = (await detailsRes.json()) as {
          details?: { title: string; posterPath: string | null; year: string | null };
        };
        resolvedTitles[`${item.media_type}-${item.tmdb_id}`] = {
          title: details.details?.title ?? `TMDB #${item.tmdb_id}`,
          posterPath: details.details?.posterPath ?? null,
          year: details.details?.year ?? null,
        };
      }),
    );
    setTitles(resolvedTitles);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadCollection();
      } catch {
        setMessage("Could not load your collection.");
      }
    };
    void run();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (typeFilter !== "all" && item.media_type !== typeFilter) return false;
      return true;
    });
  }, [items, statusFilter, typeFilter]);

  const updateItem = async (id: string, payload: Record<string, unknown>) => {
    await fetch("/api/collection", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });
    await loadCollection();
  };

  const removeItem = async (id: string) => {
    await fetch(`/api/collection?id=${id}`, { method: "DELETE" });
    await loadCollection();
  };

  const fetchRecommendations = async () => {
    const response = await fetch("/api/ai/watch-next");
    const data = (await response.json()) as {
      recommendations?: Recommendation[];
      error?: string;
    };
    if (!response.ok) {
      setMessage(data.error ?? "Could not generate recommendations.");
      return;
    }
    setRecommendations(data.recommendations ?? []);
  };

  const addRecommendationToCurrent = async (recommendation: Recommendation) => {
    await fetch("/api/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tmdb_id: recommendation.tmdb_id,
        media_type: recommendation.media_type,
        status: "currently_watching",
      }),
    });
    await loadCollection();
    setMessage("Recommendation added to Currently Watching.");
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">My Collection</h1>
        <p className="text-sm text-zinc-300">
          Manage statuses, notes, tags, ratings, and visibility.
        </p>
      </header>

      <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="text-lg font-semibold">What should I watch next?</h2>
        <button
          onClick={fetchRecommendations}
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500"
        >
          Generate 5 picks
        </button>
        {recommendations.length > 0 && (
          <ul className="space-y-2 text-sm">
            {recommendations.map((entry, index) => (
              <li
                key={`${entry.media_type}-${entry.tmdb_id}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-800 p-2"
              >
                <span>
                  {entry.media_type.toUpperCase()} #{entry.tmdb_id} -{" "}
                  {entry.reason}
                </span>
                <button
                  onClick={() => addRecommendationToCurrent(entry)}
                  className="rounded border border-zinc-700 px-2 py-1 hover:bg-zinc-800"
                >
                  Add to Currently Watching
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as "all" | CollectionStatus)
          }
          className="rounded px-3 py-2"
        >
          <option value="all">All statuses</option>
          <option value="wishlist">Wishlist</option>
          <option value="currently_watching">Currently Watching</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value as "all" | MediaType)
          }
          className="rounded px-3 py-2"
        >
          <option value="all">All types</option>
          <option value="movie">Movies</option>
          <option value="tv">TV series</option>
        </select>
      </div>

      <div className="space-y-3">
        {filteredItems.map((item) => {
          const key = `${item.media_type}-${item.tmdb_id}`;
          const display = titles[key];
          const note = item.item_notes?.[0];
          const override = item.item_overrides?.[0];
          return (
            <article
              key={item.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 transition hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href={`/media/${item.media_type}/${item.tmdb_id}`}
                  className="shrink-0"
                >
                  <Image
                    src={posterUrl(display?.posterPath ?? null)}
                    alt={`${display?.title ?? `TMDB #${item.tmdb_id}`} poster`}
                    width={96}
                    height={144}
                    className="h-36 w-24 rounded-md border border-zinc-800 object-cover"
                  />
                </Link>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase text-zinc-400">
                        {item.media_type}
                        {display?.year ? ` - ${display.year}` : ""}
                      </p>
                      <Link
                        href={`/media/${item.media_type}/${item.tmdb_id}`}
                        className="font-semibold hover:underline"
                      >
                        {display?.title ?? `TMDB #${item.tmdb_id}`}
                      </Link>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="rounded border border-rose-500 px-3 py-1 text-sm text-rose-300 hover:bg-rose-950/40"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <select
                      value={item.status}
                      onChange={(event) =>
                        updateItem(item.id, { status: event.target.value })
                      }
                      className="rounded px-2 py-1 text-sm"
                    >
                      <option value="wishlist">Wishlist</option>
                      <option value="currently_watching">Currently Watching</option>
                      <option value="completed">Completed</option>
                    </select>
                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={item.is_public}
                        onChange={(event) =>
                          updateItem(item.id, { is_public: event.target.checked })
                        }
                      />
                      Public
                    </label>
                  </div>

                  <div className="grid gap-2 md:grid-cols-3">
                    <input
                      type="number"
                      defaultValue={note?.rating ?? ""}
                      min={1}
                      max={5}
                      placeholder="Rating 1-5"
                      onBlur={(event) =>
                        updateItem(item.id, {
                          rating: event.target.value
                            ? Number(event.target.value)
                            : null,
                        })
                      }
                      className="rounded px-3 py-2 text-sm"
                    />
                    <input
                      defaultValue={note?.tags?.join(", ") ?? ""}
                      placeholder="Tags comma separated"
                      onBlur={(event) =>
                        updateItem(item.id, {
                          tags: event.target.value
                            ? event.target.value
                                .split(",")
                                .map((value) => value.trim())
                                .filter(Boolean)
                            : [],
                        })
                      }
                      className="rounded px-3 py-2 text-sm"
                    />
                    <input
                      defaultValue={note?.notes ?? ""}
                      placeholder="Quick notes"
                      onBlur={(event) =>
                        updateItem(item.id, { notes: event.target.value || null })
                      }
                      className="rounded px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="grid gap-2 md:grid-cols-3">
                    <input
                      defaultValue={override?.custom_title ?? ""}
                      placeholder="Custom title (optional)"
                      onBlur={(event) =>
                        updateItem(item.id, {
                          custom_title: event.target.value || null,
                        })
                      }
                      className="rounded px-3 py-2 text-sm"
                    />
                    <input
                      defaultValue={override?.custom_creator ?? ""}
                      placeholder="Custom creator (optional)"
                      onBlur={(event) =>
                        updateItem(item.id, {
                          custom_creator: event.target.value || null,
                        })
                      }
                      className="rounded px-3 py-2 text-sm"
                    />
                    <input
                      defaultValue={override?.custom_release_date ?? ""}
                      placeholder="Custom release date (YYYY-MM-DD)"
                      onBlur={(event) =>
                        updateItem(item.id, {
                          custom_release_date: event.target.value || null,
                        })
                      }
                      className="rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        {filteredItems.length === 0 && (
          <p className="text-sm text-zinc-400">
            No items match your filters yet.
          </p>
        )}
      </div>
      {message && <p className="text-sm text-emerald-300">{message}</p>}
    </section>
  );
}
