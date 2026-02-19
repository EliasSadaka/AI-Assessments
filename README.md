# AI-Assessments

Media tracker assessment workspace.

## Project

- App: [`apps/media-tracker`](apps/media-tracker)
- Stack: Next.js + Supabase + TMDB + optional AI recommendations
- Deployment target: Render.com

## Run locally

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

## Submission checklist

- [ ] Render URL: `https://<your-service>.onrender.com`
- [ ] Supabase auth redirect URLs set for localhost + Render domain
- [ ] TMDB attribution visible in app
