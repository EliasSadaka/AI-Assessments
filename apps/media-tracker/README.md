# BingeBoard (media-tracker)

TVTime-like app for movies and series using TMDB + Supabase.

## Features

- Auth with Supabase (signup/login/logout)
- TMDB search + details + credits
- Personal collection with statuses: wishlist, currently watching, completed
- One review per user per title with 1-5 stars
- Public profile sharing and username discovery
- AI feature: "What should I watch next?" recommendations

## Stack

- Next.js (App Router, TypeScript)
- Supabase (Auth, Postgres, RLS)
- TMDB API
- Optional AI provider via OpenAI-compatible endpoint

## Local setup

1. Install dependencies:
   - `npm install`
2. Copy env file:
   - `cp .env.local.example .env.local`
3. Fill required env vars in `.env.local`
4. Apply DB schema in Supabase SQL editor:
   - `supabase/schema.sql`
5. Start dev server:
   - `npm run dev`

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TMDB_API_KEY` (server-side only)
- `AI_API_KEY` (optional for recommendations)
- `AI_MODEL` (default: `gpt-4o-mini`)

## Commands

- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run format`
- `npm run format:check`

## Privacy model

- Users can only CRUD their own collection, notes, overrides, and reviews.
- Public reads are allowed only for public profiles + public items/reviews.
- Enforced in `supabase/schema.sql` with RLS policies.

## TMDB attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
