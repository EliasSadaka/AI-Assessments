"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleCredentialsNext = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setStep(2);
  };

  const handleCreateAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedDisplayName = displayName.trim();

    if (!USERNAME_PATTERN.test(normalizedUsername) || normalizedUsername.length < 3 || normalizedUsername.length > 24) {
      setError("Username must be 3-24 chars and only letters, numbers, or underscore.");
      return;
    }

    if (!normalizedDisplayName) {
      setError("Display name is required.");
      return;
    }

    setPending(true);
    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: normalizedUsername,
          display_name: normalizedDisplayName,
        },
      },
    });
    setPending(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push("/login?verify=1");
    router.refresh();
  };

  return (
    <section className="mx-auto max-w-md space-y-5 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="text-sm text-zinc-300">
        Step {step} of 2: {step === 1 ? "set your email and password." : "choose your username and display name."}
      </p>

      {step === 1 ? (
        <form onSubmit={handleCredentialsNext} className="space-y-4">
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
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded px-3 py-2"
            />
          </label>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button className="w-full rounded bg-emerald-600 px-4 py-2 font-medium disabled:opacity-60">
            Continue
          </button>
        </form>
      ) : (
        <form onSubmit={handleCreateAccount} className="space-y-4">
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
          <p className="text-xs text-zinc-400">
            After this step, we will send a verification email. Verify your email, then log in.
          </p>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded border border-zinc-700 px-4 py-2"
            >
              Back
            </button>
            <button
              disabled={pending}
              className="flex-1 rounded bg-emerald-600 px-4 py-2 font-medium disabled:opacity-60"
            >
              {pending ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>
      )}

      <p className="text-sm text-zinc-300">
        Already have an account?{" "}
        <Link href="/login" className="text-emerald-300 hover:underline">
          Log in
        </Link>
      </p>
    </section>
  );
}