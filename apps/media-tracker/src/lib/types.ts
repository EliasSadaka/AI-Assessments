export type MediaType = "movie" | "tv";

export type CollectionStatus = "wishlist" | "currently_watching" | "completed";

export type Profile = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  profile_public: boolean;
  created_at: string;
  updated_at: string;
};

export type CollectionItem = {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  status: CollectionStatus;
  is_public: boolean;
  added_at: string;
  updated_at: string;
};

export type ItemNote = {
  id: string;
  collection_item_id: string;
  rating: number | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ItemReview = {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  review_text: string;
  star_rating: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type NormalizedMediaItem = {
  id: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  releaseDate: string | null;
  year: string | null;
  genres: string[];
  posterPath: string | null;
  creator: string | null;
};
