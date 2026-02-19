"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setPending(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push("/search");
    router.refresh();
  };

  return (
    <section className="mx-auto max-w-md space-y-5 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="text-sm text-zinc-300">
        Pick up where you left off and keep your binge streak going.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded px-3 py-2"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          disabled={pending}
          className="w-full rounded bg-emerald-600 px-4 py-2 font-medium disabled:opacity-60"
        >
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="text-sm text-zinc-300">
        New here?{" "}
        <Link href="/signup" className="text-emerald-300 hover:underline">
          Create an account
        </Link>
      </p>
    </section>
  );
}
