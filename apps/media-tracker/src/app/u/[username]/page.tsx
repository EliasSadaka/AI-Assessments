"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { CollectionStatus, MediaType } from "@/lib/types";

type PublicProfileData = {
  profile: {
    username: string;
    display_name: string | null;
  } | null;
  items: Array<{
    id: string;
    tmdb_id: number;
    media_type: MediaType;
    status: CollectionStatus;
  }>;
  reviews: Array<{
    id: string;
    tmdb_id: number;
    media_type: MediaType;
    review_text: string;
    star_rating: number;
  }>;
};

type TmdbDetailsResponse = {
  details?: {
    title: string;
    posterPath: string | null;
  };
};

type DetailMap = Record<string, { title: string; posterPath: string | null }>;

function mediaKey(mediaType: MediaType, tmdbId: number) {
  return `${mediaType}:${tmdbId}`;
}

function posterUrl(path: string | null) {
  if (!path) {
    return "https://placehold.co/120x180?text=No+Poster";
  }
  return `https://image.tmdb.org/t/p/w342${path}`;
}

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [detailsByKey, setDetailsByKey] = useState<DetailMap>({});
  const [typeFilter, setTypeFilter] = useState<"all" | MediaType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | CollectionStatus>(
    "all",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/users?username=${params.username}`)
      .then((response) => response.json())
      .then((json: PublicProfileData) => setData(json))
      .catch(() => setError("Could not load this profile."));
  }, [params.username]);

  useEffect(() => {
    if (!data) {
      return;
    }

    const uniqueRefs = new Map<string, { mediaType: MediaType; tmdbId: number }>();

    data.items.forEach((item) => {
      uniqueRefs.set(mediaKey(item.media_type, item.tmdb_id), {
        mediaType: item.media_type,
        tmdbId: item.tmdb_id,
      });
    });

    data.reviews.forEach((review) => {
      uniqueRefs.set(mediaKey(review.media_type, review.tmdb_id), {
        mediaType: review.media_type,
        tmdbId: review.tmdb_id,
      });
    });

    let cancelled = false;

    Promise.all(
      Array.from(uniqueRefs.values()).map(async (ref) => {
        const key = mediaKey(ref.mediaType, ref.tmdbId);
        const response = await fetch(
          `/api/tmdb/details/${ref.mediaType}/${ref.tmdbId}`,
        );

        if (!response.ok) {
          return {
            key,
            title: `${ref.mediaType.toUpperCase()} #${ref.tmdbId}`,
            posterPath: null,
          };
        }

        const json = (await response.json()) as TmdbDetailsResponse;
        return {
          key,
          title: json.details?.title ?? `${ref.mediaType.toUpperCase()} #${ref.tmdbId}`,
          posterPath: json.details?.posterPath ?? null,
        };
      }),
    ).then((resolved) => {
      if (cancelled) {
        return;
      }

      const next: DetailMap = {};
      resolved.forEach((entry) => {
        next[entry.key] = { title: entry.title, posterPath: entry.posterPath };
      });

      setDetailsByKey(next);
    });

    return () => {
      cancelled = true;
    };
  }, [data]);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    return data.items.filter((item) => {
      if (typeFilter !== "all" && item.media_type !== typeFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      return true;
    });
  }, [data, statusFilter, typeFilter]);

  if (error) return <p className="text-sm text-rose-400">{error}</p>;
  if (!data) return <p className="text-sm text-zinc-400">Loading profile...</p>;
  if (!data.profile)
    return (
      <p className="text-sm text-zinc-400">Profile not found or private.</p>
    );

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">@{data.profile.username}</h1>
        {data.profile.display_name && (
          <p className="text-zinc-300">{data.profile.display_name}</p>
        )}
      </header>

      <div className="flex flex-wrap gap-2">
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
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Public collection</h2>
        {filteredItems.length === 0 ? (
          <p className="text-sm text-zinc-400">No public items to display.</p>
        ) : (
          <ul className="space-y-2">
            {filteredItems.map((item) => {
              const key = mediaKey(item.media_type, item.tmdb_id);
              const details = detailsByKey[key];

              return (
                <li
                  key={item.id}
                  className="rounded border border-zinc-800 bg-zinc-900 p-3"
                >
                  <div className="flex items-start gap-3">
                    <Image
                      src={posterUrl(details?.posterPath ?? null)}
                      alt={`${details?.title ?? "Media"} poster`}
                      width={60}
                      height={90}
                      className="rounded object-cover"
                    />
                    <div className="space-y-1">
                      <Link
                        href={`/media/${item.media_type}/${item.tmdb_id}`}
                        className="font-medium hover:underline"
                      >
                        {details?.title ?? `${item.media_type.toUpperCase()} #${item.tmdb_id}`}
                      </Link>
                      <p className="text-sm text-zinc-300">
                        {item.status.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Public reviews</h2>
        {data.reviews.length === 0 ? (
          <p className="text-sm text-zinc-400">No public reviews yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.reviews.map((review) => {
              const key = mediaKey(review.media_type, review.tmdb_id);
              const details = detailsByKey[key];

              return (
                <li
                  key={review.id}
                  className="rounded border border-zinc-800 bg-zinc-900 p-3"
                >
                  <div className="flex items-start gap-3">
                    <Image
                      src={posterUrl(details?.posterPath ?? null)}
                      alt={`${details?.title ?? "Media"} poster`}
                      width={60}
                      height={90}
                      className="rounded object-cover"
                    />
                    <div className="space-y-1">
                      <Link
                        href={`/media/${review.media_type}/${review.tmdb_id}`}
                        className="font-medium hover:underline"
                      >
                        {details?.title ?? `${review.media_type.toUpperCase()} #${review.tmdb_id}`}
                      </Link>
                      <p className="text-sm text-zinc-300">
                        {"★".repeat(review.star_rating)}
                      </p>
                      <p className="text-sm">{review.review_text}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </section>
  );
}
