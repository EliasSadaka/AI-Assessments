import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  return (
    <section className="grid gap-8 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-8 md:grid-cols-2">
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">
          Your binge companion
        </p>
        <h1 className="text-4xl font-bold leading-tight">
          Track every movie and series in one cozy place.
        </h1>
        <p className="text-zinc-300">
          Search TMDB, save your wishlist, mark titles as currently watching,
          write a quick review, and share your profile with friends.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          {user ? (
            <>
              <Link
                href="/search"
                className="rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500"
              >
                Start searching
              </Link>
              <Link
                href="/collection"
                className="rounded border border-zinc-700 px-4 py-2 hover:bg-zinc-800"
              >
                Open my collection
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/signup"
                className="rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="rounded border border-zinc-700 px-4 py-2 hover:bg-zinc-800"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="text-xl font-semibold">How it works</h2>
        <ul className="space-y-2 text-sm text-zinc-300">
          <li>1. Search any movie or show from TMDB.</li>
          <li>2. Add it to Wishlist, Currently Watching, or Completed.</li>
          <li>3. Leave one 1-5 star review for each title.</li>
          <li>4. Share your profile and read other public reviews.</li>
        </ul>
      </div>
    </section>
  );
}
