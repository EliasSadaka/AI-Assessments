"use client";

import { FormEvent, useEffect, useState } from "react";

type ProfileResponse = {
  profile?: {
    username: string;
    display_name: string | null;
    profile_public: boolean;
    default_item_public?: boolean;
    default_review_public?: boolean;
  } | null;
  error?: string;
};

export default function SettingsPage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profilePublic, setProfilePublic] = useState(false);
  const [defaultItemPublic, setDefaultItemPublic] = useState(false);
  const [defaultReviewPublic, setDefaultReviewPublic] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((response) => response.json())
      .then((data: ProfileResponse) => {
        if (!data.profile) return;
        setUsername(data.profile.username ?? "");
        setDisplayName(data.profile.display_name ?? "");
        setProfilePublic(Boolean(data.profile.profile_public));
        setDefaultItemPublic(Boolean(data.profile.default_item_public));
        setDefaultReviewPublic(Boolean(data.profile.default_review_public));
      });
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!username.trim()) {
      setMessage("Username is required.");
      return;
    }

    if (!displayName.trim()) {
      setMessage("Display name is required.");
      return;
    }

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        display_name: displayName,
        profile_public: profilePublic,
        default_item_public: defaultItemPublic,
        default_review_public: defaultReviewPublic,
      }),
    });

    const data = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Settings updated." : data.error ?? "Could not update settings.");
  };

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold">Profile & Privacy</h1>
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5"
      >
        <label className="block space-y-1">
          <span className="text-sm">Username</span>
          <input
            required
            minLength={3}
            maxLength={24}
            pattern="[A-Za-z0-9_]+"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded px-3 py-2"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm">Display name</span>
          <input
            required
            minLength={1}
            maxLength={50}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={profilePublic}
            onChange={(event) => setProfilePublic(event.target.checked)}
          />
          Profile is public
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={defaultItemPublic}
            onChange={(event) => setDefaultItemPublic(event.target.checked)}
          />
          New collection items are public by default
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={defaultReviewPublic}
            onChange={(event) => setDefaultReviewPublic(event.target.checked)}
          />
          New reviews are public by default
        </label>
        <button className="rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500">
          Save settings
        </button>
      </form>
      {message && <p className="text-sm text-emerald-300">{message}</p>}
    </section>
  );
}