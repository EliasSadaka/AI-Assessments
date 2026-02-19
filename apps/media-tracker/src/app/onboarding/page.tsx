"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      setPending(false);
      setError("Please log in before finishing profile setup.");
      router.push("/login");
      return;
    }

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        display_name: displayName || undefined,
        profile_public: isPublic,
      }),
    });

    const data = (await response.json()) as { error?: string };
    setPending(false);

    if (!response.ok) {
      setError(data.error ?? "Could not save profile.");
      return;
    }

    router.push("/search");
    router.refresh();
  };

  return (
    <section className="mx-auto max-w-lg space-y-5 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h1 className="text-2xl font-semibold">Set up your profile</h1>
      <p className="text-sm text-zinc-300">
        Choose a username so others can discover your public collection.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm">Username</span>
          <input
            required
            minLength={3}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded px-3 py-2"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm">Display name</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
          />
          Make my profile public
        </label>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          disabled={pending}
          className="rounded bg-emerald-600 px-4 py-2 font-medium disabled:opacity-60"
        >
          {pending ? "Saving..." : "Continue"}
        </button>
      </form>
    </section>
  );
}
