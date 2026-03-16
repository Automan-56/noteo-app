import { createClient } from "@supabase/supabase-js";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

const FALLBACK_SUPABASE_URL = "https://example.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "missing-supabase-anon-key";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim() || FALLBACK_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || FALLBACK_SUPABASE_ANON_KEY;

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error(
    "Variables Supabase manquantes: VITE_SUPABASE_URL et/ou VITE_SUPABASE_ANON_KEY.",
  );
}

type RuntimeFetch = typeof fetch;

const nativeFetch: RuntimeFetch = (input, init) => globalThis.fetch(input, init);

let activeFetch: RuntimeFetch = nativeFetch;
let tauriFetchReady = false;
let tauriFetchInitPromise: Promise<void> | null = null;

const supabaseFetchProxy: RuntimeFetch = (input, init) => activeFetch(input, init);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: supabaseFetchProxy,
  },
});

export async function initSupabaseFetch(): Promise<void> {
  if (tauriFetchReady) {
    return;
  }

  if (tauriFetchInitPromise) {
    return tauriFetchInitPromise;
  }

  tauriFetchInitPromise = (async () => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.__TAURI_INTERNALS__ === undefined) {
      return;
    }

    try {
      const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http");

      activeFetch = (input, init) => tauriFetch(input, init);
      tauriFetchReady = true;
    } catch (error) {
      activeFetch = nativeFetch;
      console.warn(
        "Impossible d'initialiser la fetch Tauri pour Supabase. La fetch native reste active.",
        error,
      );
    }
  })().finally(() => {
    tauriFetchInitPromise = null;
  });

  return tauriFetchInitPromise;
}

export type { Session, User } from "@supabase/supabase-js";
