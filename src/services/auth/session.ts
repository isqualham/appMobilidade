import * as SecureStore from "expo-secure-store";
import { requestJson } from "../http";

const SESSION_KEY = "viau_auth_session";
const LEGACY_TOKEN_KEY = "viau_auth_token";
const STORE_OPTIONS = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export interface TokenPair {
  token: string;
  refreshToken: string;
}

interface AccessToken {
  token: string;
  revision: number;
}

export class SessionExpiredError extends Error {
  readonly status = 401;
  constructor() {
    super("Sua sessão expirou. Entre novamente.");
  }
}

export class SessionChangedError extends Error {
  constructor() {
    super("A sessão foi alterada. Tente novamente.");
  }
}

export function isTokenPair(value: unknown): value is TokenPair {
  if (!value || typeof value !== "object") return false;
  const pair = value as Partial<TokenPair>;
  return (
    typeof pair.token === "string" && pair.token.trim().length > 0 &&
    typeof pair.refreshToken === "string" && pair.refreshToken.trim().length > 0
  );
}

// version changes on login/logout; revision changes on rotation, even if JWTs match.
let version = 0;
let revision = 0;
let tokens: TokenPair | null | undefined;
let storageQueue: Promise<unknown> = Promise.resolve();
let refreshing: { version: number; promise: Promise<AccessToken> } | null = null;
const listeners = new Set<() => void>();

export function getSessionVersion() {
  return version;
}

export function assertSessionVersion(expected: number) {
  if (version !== expected) throw new SessionChangedError();
}

export function onSessionCleared(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = storageQueue.then(operation);
  storageQueue = result.catch(() => undefined);
  return result;
}

function parseStored(raw: string | null): unknown {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function eraseStoredSession() {
  // A tombstone contains no credentials and also makes interrupted cleanup safe.
  try {
    await SecureStore.setItemAsync(SESSION_KEY, "null", STORE_OPTIONS);
  } catch {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }
  await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
}

// Invalidate immediately, before any storage/network await. Old work cannot commit.
export function clearSession(expected = version): Promise<TokenPair | null> {
  if (expected !== version) return Promise.resolve(null);
  const previous = tokens;
  version += 1;
  tokens = null;
  listeners.forEach((listener) => listener());
  return serialize(async () => {
    let stored: unknown = previous;
    try {
      if (stored === undefined) {
        stored = parseStored(await SecureStore.getItemAsync(SESSION_KEY));
      }
    } finally {
      await eraseStoredSession();
    }
    return isTokenPair(stored) ? stored : null;
  });
}

export async function readSession(expected = version): Promise<TokenPair | null> {
  const result = await serialize(async () => {
    assertSessionVersion(expected);
    if (tokens !== undefined) return tokens;
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    assertSessionVersion(expected);
    const stored = parseStored(raw);
    if (isTokenPair(stored) && !("refreshPending" in stored && stored.refreshPending)) {
      tokens = { token: stored.token, refreshToken: stored.refreshToken };
      return tokens;
    }
    // Legacy access-only sessions cannot be renewed. Pending rotations must never replay.
    await eraseStoredSession();
    assertSessionVersion(expected);
    tokens = null;
    return null;
  });
  assertSessionVersion(expected);
  return result;
}

export async function saveSession(pair: TokenPair, expected: number) {
  if (!isTokenPair(pair)) throw new SessionExpiredError();
  await serialize(async () => {
    assertSessionVersion(expected);
    await SecureStore.setItemAsync(
      SESSION_KEY,
      JSON.stringify({ token: pair.token, refreshToken: pair.refreshToken }),
      STORE_OPTIONS,
    );
    assertSessionVersion(expected);
    tokens = { token: pair.token, refreshToken: pair.refreshToken };
    revision += 1;
  });
  assertSessionVersion(expected);
}

function expiresSoon(token: string): boolean {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded: unknown = JSON.parse(
      atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "=")),
    );
    if (!decoded || typeof decoded !== "object" || !("exp" in decoded)) return false;
    // This is only a scheduling hint. The API remains the authorization authority.
    return (
      typeof decoded.exp === "number" && Number.isFinite(decoded.exp) &&
      decoded.exp * 1000 <= Date.now() + 60_000
    );
  } catch {
    // Opaque/undecodable tokens are checked by the server (including its 401 response).
    return false;
  }
}

async function revokeRefreshToken(refreshToken: string) {
  try {
    await requestJson("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // Local logout is unconditional; never log credentials or retry a rotation.
  }
}

export async function logoutSession() {
  const previous = await clearSession();
  if (previous) await revokeRefreshToken(previous.refreshToken);
}

function refreshSession(pair: TokenPair, expected: number): Promise<AccessToken> {
  if (refreshing?.version === expected) return refreshing.promise;
  const promise = (async () => {
    let rotated: TokenPair | null = null;
    try {
      await serialize(async () => {
        assertSessionVersion(expected);
        await SecureStore.setItemAsync(
          SESSION_KEY,
          JSON.stringify({ ...pair, refreshPending: true }),
          STORE_OPTIONS,
        );
        assertSessionVersion(expected);
      });
      const { response, data } = await requestJson("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refreshToken: pair.refreshToken }),
      });
      if (response.ok && isTokenPair(data)) rotated = data;
      assertSessionVersion(expected);
      if (!response.ok || !isTokenPair(data)) throw new SessionExpiredError();
      await saveSession(data, expected);
      return { token: data.token, revision };
    } catch {
      // Also covers logout while the rotated pair was being written to SecureStore.
      if (rotated) void revokeRefreshToken(rotated.refreshToken);
      if (version !== expected) throw new SessionChangedError();
      // Even network/5xx failures are ambiguous: the server may have rotated already.
      await clearSession(expected).catch(() => undefined);
      throw new SessionExpiredError();
    }
  })();
  const flight = { version: expected, promise };
  refreshing = flight;
  void promise.finally(() => {
    if (refreshing === flight) refreshing = null;
  }).catch(() => undefined);
  return promise;
}

export async function getAccessToken(
  expected: number,
  rejected?: AccessToken,
): Promise<AccessToken> {
  assertSessionVersion(expected);
  if (refreshing?.version === expected) return refreshing.promise;
  const pair = await readSession(expected);
  assertSessionVersion(expected);
  if (refreshing?.version === expected) return refreshing.promise;
  if (!pair) throw new SessionExpiredError();
  // A late 401 for the previous JWT reuses the already committed replacement.
  if (expiresSoon(pair.token) || (rejected?.token === pair.token && rejected.revision === revision)) {
    return refreshSession(pair, expected);
  }
  return { token: pair.token, revision };
}

export async function rejectAccessToken(expected: number, rejected: AccessToken) {
  const pair = await readSession(expected);
  if (pair?.token === rejected.token && revision === rejected.revision) await clearSession(expected);
  throw new SessionExpiredError();
}
