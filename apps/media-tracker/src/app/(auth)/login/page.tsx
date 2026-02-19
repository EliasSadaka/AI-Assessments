"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ResolveIdentifierResponse = {
  email?: string | null;
  error?: string;
};

type ProfileResponse = {
  profile?: {
    user_id: string;
  } | null;
};

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showVerifyMessage, setShowVerifyMessage] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShowVerifyMessage(params.get("verify") === "1");
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);

    const identifierValue = identifier.trim();
    if (!identifierValue) {
      setPending(false);
      setError("Enter email or username.");
      return;
    }

    const resolveResponse = await fetch("/api/auth/resolve-identifier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: identifierValue }),
    });

    const resolveData =
      (await resolveResponse.json()) as ResolveIdentifierResponse;
    if (!resolveResponse.ok) {
      setPending(false);
      setError(resolveData.error ?? "Could not complete login.");
      return;
    }

    if (!resolveData.email) {
      setPending(false);
      setError("Invalid username/email or password.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: resolveData.email,
      password,
    });

    if (authError) {
      setPending(false);
      setError("Invalid username/email or password.");
      return;
    }

    await fetch("/api/profile/bootstrap", { method: "POST" });

    const profileResponse = await fetch("/api/profile");
    if (!profileResponse.ok) {
      setPending(false);
      setError("Could not load profile after login.");
      return;
    }

    const profileData = (await profileResponse.json()) as ProfileResponse;

    setPending(false);
    if (!profileData.profile) {
      router.push("/onboarding");
      router.refresh();
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
      {showVerifyMessage && (
        <p className="rounded border border-emerald-700 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          We sent you a verification email. Verify your account, then log in.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm">Email or Username</span>
          <input
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
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
