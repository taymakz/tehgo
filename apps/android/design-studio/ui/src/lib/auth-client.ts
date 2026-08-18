// Shared browser-side auth probe utilities used by the admin, panel, and website
// apps. Only call from "use client" components — these functions rely on browser
// fetch.
//
// Sessions are opaque server-side tokens now: the cookie carries no decodable
// expiry, so the client can only know whether a session cookie is *present*. The
// server slides/rotates the session automatically on every authenticated request,
// so the client never needs to proactively refresh — a 401 means the session is
// genuinely gone and the caller should redirect to login.

export type AuthProbeResponse = {
  session: { present: boolean }
}

export const AUTH_COOKIE_NAMES = ["sid", "mfa_challenge"] as const

const AUTH_PATH_PREFIXES = ["/auth", "/offline"] as const

// ── Probe cache (one copy per browser bundle, isolated per app) ───────────────

let probePromise: Promise<AuthProbeResponse | null> | null = null
let probeExpiry = 0
const PROBE_TTL = 5_000

export function sanitizeBackUrl(raw?: string | null): string | null {
  if (!raw) return null
  if (!raw.startsWith("/") || raw.startsWith("//")) return null
  const lower = raw.toLowerCase()
  if (AUTH_PATH_PREFIXES.some((prefix) => lower.startsWith(prefix))) return null
  return raw
}

function readSessionProbe(): Promise<AuthProbeResponse | null> {
  return fetch("/api/auth/session", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  })
    .then((res) => (res.ok ? (res.json() as Promise<AuthProbeResponse>) : null))
    .catch(() => null)
}

export async function getAuthProbe(): Promise<AuthProbeResponse | null> {
  const now = Date.now()
  if (probePromise && now < probeExpiry) return probePromise
  probeExpiry = now + PROBE_TTL
  probePromise = readSessionProbe()
  return probePromise
}

export function resetAuthProbe(): void {
  probePromise = null
  probeExpiry = 0
}

// Presence-only: with opaque tokens the client cannot verify validity locally.
// "Has a session cookie" is the best optimistic signal for bootstrap; the first
// authenticated request confirms it for real (and 401s if not).
export async function hasAuthCookies(): Promise<boolean> {
  const probe = await getAuthProbe()
  return Boolean(probe?.session.present)
}

export async function clearAuthCookies(): Promise<void> {
  await fetch("/api/auth/session", {
    method: "DELETE",
    credentials: "include",
  })
  resetAuthProbe()
}
