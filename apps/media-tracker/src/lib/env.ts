import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  TMDB_API_KEY: z.string().min(1),
  AI_API_KEY: z.string().min(1).optional(),
  AI_MODEL: z.string().min(1).default("gpt-4o-mini"),
});

const clientParsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!clientParsed.success) {
  throw new Error("Invalid client environment configuration.");
}

export const clientEnv = clientParsed.data;

let parsedServerEnv: z.infer<typeof serverEnvSchema> | null = null;

export function getServerEnv() {
  if (parsedServerEnv) {
    return parsedServerEnv;
  }

  const parsed = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    TMDB_API_KEY: process.env.TMDB_API_KEY,
    AI_API_KEY: process.env.AI_API_KEY,
    AI_MODEL: process.env.AI_MODEL,
  });

  if (!parsed.success) {
    throw new Error("Invalid server environment configuration.");
  }

  parsedServerEnv = parsed.data;
  return parsedServerEnv;
}
