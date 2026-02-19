"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import type {
  CollectionStatus,
  MediaType,
  NormalizedMediaItem,
} from "@/lib/types";

type Review = {
  id: string;
  review_text: string;
  star_rating: number;
  username?: string;
};

type CollectionItem = {
  id: string;
  tmdb_id: number;
  media_type: MediaType;
  status: CollectionStatus;
};

function renderStars(rating: number) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < rating ? "text-amber-400" : "text-zinc-600"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function MediaDetailsPage() {
  const params = useParams<{ type: MediaType; id: string }>();
  const [details, setDetails] = useState<NormalizedMediaItem | null>(null);
  const [creator, setCreator] = useState<string | null>(null);
  const [status, setStatus] = useState<CollectionStatus>("wishlist");
  const [reviewText, setReviewText] = useState("");
  const [stars, setStars] = useState(3);
  const [message, setMessage] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [collectionItem, setCollectionItem] = useState<CollectionItem | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [detailsRes, creditsRes, reviewsRes, myReviewRes, collectionRes] =
        await Promise.all([
          fetch(`/api/tmdb/details/${params.type}/${params.id}`),
          fetch(`/api/tmdb/credits/${params.type}/${params.id}`),
          fetch(`/api/reviews?tmdb_id=${params.id}&media_type=${params.type}`),
          fetch(
            `/api/reviews?mine=1&tmdb_id=${params.id}&media_type=${params.type}`,
          ),
          fetch(`/api/collection?media_type=${params.type}`),
        ]);
      const detailsData = (await detailsRes.json()) as {
        details?: NormalizedMediaItem;
      };
      const creditsData = (await creditsRes.json()) as {
        creator?: string | null;
      };
      const reviewsData = (await reviewsRes.json()) as { reviews?: Review[] };
      const myReviewData = (await myReviewRes.json()) as {
        review?: { review_text: string; star_rating: number } | null;
      };
      const collectionData = (await collectionRes.json()) as {
        items?: CollectionItem[];
      };

      const currentTmdbId = Number(params.id);
      const existingItem = (collectionData.items ?? []).find(
        (item) => item.tmdb_id === currentTmdbId && item.media_type === params.type,
      );

      setDetails(detailsData.details ?? null);
      setCreator(creditsData.creator ?? null);
      setReviews(reviewsData.reviews ?? []);
      setCollectionItem(existingItem ?? null);
      if (existingItem) {
        setStatus(existingItem.status);
      }
      if (myReviewData.review) {
        setReviewText(myReviewData.review.review_text);
        setStars(myReviewData.review.star_rating);
      }
    };

    fetchData().catch(() => {
      setMessage("Could not load title details.");
    });
  }, [params.id, params.type]);

  const addToCollection = async () => {
    if (collectionItem) {
      setMessage("Already in your collection.");
      return;
    }

    setPending(true);
    const response = await fetch("/api/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tmdb_id: Number(params.id),
        media_type: params.type,
        status,
      }),
    });
    const data = (await response.json()) as { item?: CollectionItem };
    setPending(false);
    if (!response.ok) {
      setMessage("Could not add to collection.");
      return;
    }

    if (data.item) {
      setCollectionItem(data.item);
      setStatus(data.item.status);
    }
    setMessage("Added to your collection.");
  };

  const saveReview = async () => {
    setPending(true);
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tmdb_id: Number(params.id),
        media_type: params.type,
        review_text: reviewText,
        star_rating: stars,
      }),
    });
    setPending(false);
    if (!response.ok) {
      setMessage("Could not save review.");
      return;
    }
    setMessage("Review saved.");
  };

  if (!details) {
    return <p className="text-sm text-zinc-400">Loading details...</p>;
  }

  return (
    <section className="space-y-8">
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <Image
          src={
            details.posterPath
              ? `https://image.tmdb.org/t/p/w500${details.posterPath}`
              : "https://placehold.co/400x600?text=No+Poster"
          }
          alt={`${details.title} poster`}
          className="rounded-xl border border-zinc-800"
          width={400}
          height={600}
        />
        <div className="space-y-4">
          <p className="text-sm uppercase text-zinc-400">{details.mediaType}</p>
          <h1 className="text-3xl font-semibold">{details.title}</h1>
          <p className="text-zinc-300">
            {details.overview || "No overview available."}
          </p>
          <p className="text-sm text-zinc-400">
            {details.year ?? "Unknown year"} - {details.genres.join(", ") || "No genres"}
          </p>
          <p className="text-sm text-zinc-300">
            Creator/Director: {creator ?? "Not listed"}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as CollectionStatus)
              }
              disabled={Boolean(collectionItem)}
              className="rounded px-3 py-2 disabled:opacity-60"
            >
              <option value="wishlist">Wishlist</option>
              <option value="currently_watching">Currently Watching</option>
              <option value="completed">Completed</option>
            </select>
            <button
              onClick={addToCollection}
              disabled={pending || Boolean(collectionItem)}
              className="rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 disabled:opacity-60"
            >
              {collectionItem ? "✓ Added" : "Add to my collection"}
            </button>
          </div>
          {collectionItem && (
            <p className="text-sm text-emerald-300">
              Already in your collection ({collectionItem.status.replace("_", " ")}).
            </p>
          )}
        </div>
      </div>

      <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="text-xl font-semibold">Your review (one per title)</h2>
        <div className="space-y-1">
          <span className="text-sm">Rating</span>
          <div className="inline-flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStars(value)}
                  className={value <= stars ? "text-amber-400" : "text-zinc-600"}
                  aria-label={`Set rating to ${value} stars`}
                >
                  ★
                </button>
              );
            })}
          </div>
        </div>
        <textarea
          value={reviewText}
          onChange={(event) => setReviewText(event.target.value)}
          placeholder="Write your review..."
          className="min-h-28 w-full rounded px-3 py-2"
        />
        <button
          onClick={saveReview}
          disabled={pending || !reviewText.trim()}
          className="rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 disabled:opacity-60"
        >
          Save review
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Public reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-zinc-400">No public reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-3"
              >
                <p className="text-sm text-zinc-300">
                  {review.username ? `@${review.username}` : "Community review"}
                  <span className="mx-2 text-zinc-500">-</span>
                  {renderStars(review.star_rating)}
                </p>
                <p className="text-sm">{review.review_text}</p>
              </article>
            ))}
          </div>
        )}
      </section>
      {message && <p className="text-sm text-emerald-300">{message}</p>}
    </section>
  );
}
