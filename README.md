# AI-Assessments

Media tracker assessment workspace for **BingeBoard**, a Next.js app where users
discover movies/TV with TMDB, manage their collection, write reviews, and share
public activity.

## Project

- App: [`apps/media-tracker`](apps/media-tracker)
- Stack: Next.js + Supabase + TMDB + optional AI recommendations
- Deployment target: Render.com

## What The User Experiences

When a user opens the site, this is the intended product journey:

1. **Landing/Auth**
   - Users can create an account or log in.
   - After signup/login, they can set up profile info (username, display name, visibility).

2. **Search**
   - Users search TMDB titles from the `Search catalog` page.
   - They can filter by media type (movie/TV) and optional year.
   - Each result has details and can be added to their personal collection.

3. **Media Details**
   - Users open a media page with poster, overview, credits, and reviews.
   - They can write/update one review per title.

4. **My Collection**
   - Users manage status (`wishlist`, `currently_watching`, `completed`).
   - They can set ratings, tags, notes, custom metadata, and public/private visibility.
   - Posters are displayed to make collection cards easier to scan.

5. **Social/Public Pages**
   - Users can discover public profiles and view public reviews/collection items,
     controlled by profile and item visibility settings.

6. **AI Picks (Optional)**
   - `Generate 5 picks` works only when `AI_API_KEY` is configured.
   - Without it, the app still works, but AI recommendations return no picks.

## How The Code Is Organized

Primary app code lives in `apps/media-tracker/src`:

- `app/` - Next.js App Router pages and API routes
  - `app/search/page.tsx` - search UI
  - `app/collection/page.tsx` - collection management UI
  - `app/media/[type]/[id]/page.tsx` - media detail page
  - `app/api/*` - server route handlers (`collection`, `profile`, `reviews`, `tmdb`, `ai`)
- `lib/` - shared server/client logic
  - `lib/env.ts` - environment validation
  - `lib/supabase/*` - Supabase clients
  - `lib/tmdb.ts` - TMDB integrations
  - `lib/ai.ts` - recommendation generation + cache/rate limit
- `components/` - reusable UI components (for example `media-card.tsx`)
- `middleware.ts` - auth/session refresh and route protection behavior

## Data And Security Model

Database schema and Row Level Security policies live in:

- `apps/media-tracker/supabase/schema.sql`

Key points:

- Every user can CRUD only their own private data.
- Public reads are allowed only when profile and item/review visibility allow it.
- Policies are enforced in Postgres (Supabase RLS), not only in frontend code.

## Local Setup

1. Go to app folder:
   - `cd apps/media-tracker`
2. Install dependencies:
   - `npm install`
3. Copy env template and configure:
   - `.env.local.example` -> `.env.local`
4. Apply DB schema in Supabase SQL editor:
   - `supabase/schema.sql`
5. Run:
   - `npm run dev`

## Environment Variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TMDB_API_KEY`

Optional:

- `AI_API_KEY`
- `AI_MODEL` (default `gpt-4o-mini`)

## Submission Checklist

- [ ] Render URL: `https://<your-service>.onrender.com`
- [ ] Supabase auth redirect URLs set for localhost + Render domain
- [ ] TMDB attribution visible in app
