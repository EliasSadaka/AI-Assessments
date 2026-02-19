import { getServerEnv } from "@/lib/env";
import type { MediaType, NormalizedMediaItem } from "@/lib/types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

type TmdbSearchResult = {
  id: number;
  media_type?: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  genre_ids?: number[];
};

type TmdbGenreList = {
  genres: Array<{ id: number; name: string }>;
};

const genreCache: Record<MediaType, Map<number, string>> = {
  movie: new Map(),
  tv: new Map(),
};

async function tmdbFetch<T>(path: string, revalidate = 300): Promise<T> {
  const { TMDB_API_KEY } = getServerEnv();
  const response = await fetch(`${TMDB_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${TMDB_API_KEY}`,
      "Content-Type": "application/json",
    },
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

async function ensureGenres(mediaType: MediaType) {
  if (genreCache[mediaType].size > 0) {
    return;
  }

  const result = await tmdbFetch<TmdbGenreList>(`/genre/${mediaType}/list`);
  result.genres.forEach((genre) =>
    genreCache[mediaType].set(genre.id, genre.name),
  );
}

function yearFromDate(date: string | undefined) {
  if (!date) {
    return null;
  }
  return date.slice(0, 4);
}

function mapSearchItem(
  item: TmdbSearchResult,
  mediaType: MediaType,
): NormalizedMediaItem {
  const releaseDate =
    mediaType === "movie"
      ? (item.release_date ?? null)
      : (item.first_air_date ?? null);
  const title =
    mediaType === "movie"
      ? (item.title ?? "Untitled")
      : (item.name ?? "Untitled");

  return {
    id: item.id,
    mediaType,
    title,
    overview: item.overview ?? "",
    releaseDate,
    year: yearFromDate(releaseDate ?? undefined),
    genres: (item.genre_ids ?? [])
      .map((genreId) => genreCache[mediaType].get(genreId))
      .filter(Boolean) as string[],
    posterPath: item.poster_path ?? null,
    creator: null,
  };
}

export async function searchTmdb(
  query: string,
): Promise<NormalizedMediaItem[]> {
  const encoded = encodeURIComponent(query.trim());
  if (!encoded) {
    return [];
  }

  const [movieGenres, tvGenres] = await Promise.all([
    ensureGenres("movie"),
    ensureGenres("tv"),
  ]);
  void movieGenres;
  void tvGenres;

  const [movies, shows] = await Promise.all([
    tmdbFetch<{ results: TmdbSearchResult[] }>(
      `/search/movie?query=${encoded}`,
    ),
    tmdbFetch<{ results: TmdbSearchResult[] }>(`/search/tv?query=${encoded}`),
  ]);

  return [
    ...movies.results.map((item) => mapSearchItem(item, "movie")),
    ...shows.results.map((item) => mapSearchItem(item, "tv")),
  ];
}

export async function getTmdbDetails(
  type: MediaType,
  id: number,
): Promise<NormalizedMediaItem> {
  const item = await tmdbFetch<{
    id: number;
    title?: string;
    name?: string;
    overview?: string;
    release_date?: string;
    first_air_date?: string;
    genres?: Array<{ id: number; name: string }>;
    poster_path?: string | null;
  }>(`/${type}/${id}`);

  const releaseDate =
    type === "movie"
      ? (item.release_date ?? null)
      : (item.first_air_date ?? null);

  return {
    id: item.id,
    mediaType: type,
    title:
      type === "movie" ? (item.title ?? "Untitled") : (item.name ?? "Untitled"),
    overview: item.overview ?? "",
    releaseDate,
    year: yearFromDate(releaseDate ?? undefined),
    genres: item.genres?.map((genre) => genre.name) ?? [],
    posterPath: item.poster_path ?? null,
    creator: null,
  };
}

export async function getTmdbCredits(type: MediaType, id: number) {
  if (type === "movie") {
    const result = await tmdbFetch<{
      crew: Array<{ job: string; name: string }>;
    }>(`/movie/${id}/credits`);

    const director = result.crew.find((person) => person.job === "Director");
    return director?.name ?? null;
  }

  const result = await tmdbFetch<{
    created_by?: Array<{ name: string }>;
  }>(`/tv/${id}`);

  if (!result.created_by || result.created_by.length === 0) {
    return null;
  }

  return result.created_by.map((creator) => creator.name).join(", ");
}
