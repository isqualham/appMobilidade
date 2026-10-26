import { requestJson } from "./http";
import {
  assertSessionVersion,
  getAccessToken,
  getSessionVersion,
  rejectAccessToken,
} from "./auth/session";

export { API_URL } from "./api.config";

const PUBLIC_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/usuarios",
  "/api/auth/senha/enviar-codigo",
  "/api/auth/senha/redefinir",
  "/api/termos-uso-politica-privacidade",
]);

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function extractErrorMessage(data: unknown): string | null {
  if (typeof data === "string") {
    return data.trim() || null;
  }

  if (typeof data !== "object" || data === null) {
    return null;
  }

  const errorData = data as Record<string, unknown>;

  const possibleMessages = [
    errorData.message,
    errorData.mensagem,
    errorData.erro,
    errorData.error,
    errorData.detail,
  ];

  for (const value of possibleMessages) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (
      typeof value === "object" &&
      value !== null &&
      "message" in value &&
      typeof value.message === "string" &&
      value.message.trim()
    ) {
      return value.message.trim();
    }
  }

  return null;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const normalizedPath = `/${path.replace(/^\/+/, "")}`;
  const protectedRequest = !PUBLIC_PATHS.has(
    normalizedPath.split("?")[0].replace(/\/+$/, ""),
  );
  const version = getSessionVersion();
  let access = protectedRequest ? await getAccessToken(version) : null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (protectedRequest) assertSessionVersion(version);
    const headers = new Headers(options.headers);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    headers.delete("Authorization");
    if (access) headers.set("Authorization", `Bearer ${access.token}`);

    // Network failures propagate immediately, including for POST/PATCH requests.
    const { response, data } = await requestJson(normalizedPath, {
      ...options,
      headers,
    });
    if (protectedRequest) assertSessionVersion(version);
    if (response.status === 401 && access) {
      if (attempt === 0) {
        access = await getAccessToken(version, access);
        continue;
      }
      await rejectAccessToken(version, access);
    }
    if (!response.ok) {
      throw new ApiError(
        extractErrorMessage(data) ?? "Não foi possível realizar a requisição.",
        response.status,
      );
    }
    return data as T;
  }
  throw new Error("Não foi possível autenticar a requisição.");
}
