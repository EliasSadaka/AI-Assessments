import Link from "next/link";
import Image from "next/image";
import type { NormalizedMediaItem } from "@/lib/types";

function posterUrl(path: string | null) {
  if (!path) return "https://placehold.co/300x450?text=No+Poster";
  return `https://image.tmdb.org/t/p/w342${path}`;
}

export function MediaCard({ item }: { item: NormalizedMediaItem }) {
  return (
    <article className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
      <Image
        src={posterUrl(item.posterPath)}
        alt={`${item.title} poster`}
        className="h-72 w-full object-cover"
        width={342}
        height={513}
      />
      <div className="space-y-2 p-3">
        <p className="text-xs uppercase tracking-wide text-zinc-400">
          {item.mediaType}
        </p>
        <h3 className="line-clamp-2 text-base font-semibold">{item.title}</h3>
        <p className="text-sm text-zinc-400">{item.year ?? "Unknown year"}</p>
        <Link
          href={`/media/${item.mediaType}/${item.id}`}
          className="inline-block rounded bg-emerald-600 px-3 py-1 text-sm font-medium hover:bg-emerald-500"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
