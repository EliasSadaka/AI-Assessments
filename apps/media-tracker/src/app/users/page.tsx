"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type PublicUser = {
  username: string;
  display_name: string | null;
};

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const params = new URLSearchParams();
    if (query.trim()) params.set("query", query.trim());
    const response = await fetch(`/api/users?${params.toString()}`);
    const data = (await response.json()) as {
      users?: PublicUser[];
      error?: string;
    };
    if (!response.ok) {
      setError(data.error ?? "Could not search users.");
      return;
    }
    setUsers(data.users ?? []);
  };

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Discover users</h1>
        <p className="text-sm text-zinc-300">
          Search public profiles by username.
        </p>
      </div>
      <form onSubmit={onSearch} className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search username..."
          className="w-full max-w-sm rounded px-3 py-2"
        />
        <button className="rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500">
          Search
        </button>
      </form>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <div className="space-y-2">
        {users.map((user) => (
          <Link
            key={user.username}
            href={`/u/${user.username}`}
            className="block rounded border border-zinc-800 bg-zinc-900 p-3 hover:bg-zinc-800"
          >
            <p className="font-medium">@{user.username}</p>
            {user.display_name && (
              <p className="text-sm text-zinc-300">{user.display_name}</p>
            )}
          </Link>
        ))}
        {users.length === 0 && (
          <p className="text-sm text-zinc-400">No users listed yet.</p>
        )}
      </div>
    </section>
  );
}
