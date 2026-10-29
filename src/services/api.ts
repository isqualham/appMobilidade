import { offerDiagnostic } from "./offerDiagnostics";
import { requestJson } from "./http";
import {
  isSessionReplacedResponse,
  rejectReplacedSession,
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
  const basePath = normalizedPath.split("?")[0];
  const endpoint = basePath === "/api/corrida/disponiveis" ? "offers" as const
    : normalizedPath === "/api/corrida/ativa?papel=prestador" ? "active_driver_ride" as const
      : basePath === "/api/categorias-veiculo" ? "categories" as const
        : basePath === "/api/prestadores/disponibilidade" ? "availability" as const : undefined;
  // Caminhos conhecidos apenas: não registrar host, cursor, IDs ou query arbitrária.
  const diagnosticPath = endpoint === "offers" ? "/api/corrida/disponiveis?limite=50" + (normalizedPath.includes("&cursor=") ? "&cursor=[omitido]" : "")
    : endpoint === "active_driver_ride" ? "/api/corrida/ativa?papel=prestador"
      : endpoint === "categories" ? "/api/categorias-veiculo" : "/api/prestadores/disponibilidade";
  let access: Awaited<ReturnType<typeof getAccessToken>> | null;
  try {
    access = protectedRequest ? await getAccessToken(version) : null;
  } catch (error) {
    if (endpoint) offerDiagnostic({ stage: "auth", endpoint, reason: "session_unavailable", authenticated: false });
    throw error;
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (protectedRequest) assertSessionVersion(version);
    const headers = new Headers(options.headers);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    headers.delete("Authorization");
    if (access) headers.set("Authorization", `Bearer ${access.token}`);

    if (endpoint) offerDiagnostic({ stage: "http", endpoint, path: diagnosticPath, reason: "request", attempt: attempt + 1, authenticated: Boolean(access) });
    // Network failures propagate immediately, including for POST/PATCH requests.
    const { response, data } = await requestJson(normalizedPath, {
      ...options,
      headers,
    }).catch(error => {
      if (endpoint) offerDiagnostic({ stage: "http", endpoint, reason: "network_or_abort", authenticated: Boolean(access) });
      throw error;
    });
    if (endpoint) offerDiagnostic({ stage: "http", endpoint, path: diagnosticPath, attempt: attempt + 1, status: response.status, authenticated: Boolean(access) });
    if (protectedRequest) assertSessionVersion(version);
    if (protectedRequest && isSessionReplacedResponse(response.status, data)) await rejectReplacedSession(version);
    if (response.status === 401 && access) {
      if (attempt === 0) {
        if (endpoint) offerDiagnostic({ stage: "auth", endpoint, reason: "refreshing" });
        try { access = await getAccessToken(version, access); }
        catch (error) {
          if (endpoint) offerDiagnostic({ stage: "auth", endpoint, reason: "refresh_failed" });
          throw error;
        }
        continue;
      }
      if (endpoint) offerDiagnostic({ stage: "auth", endpoint, reason: "rejected" });
      await rejectAccessToken(version, access);
    }
    if (!response.ok) {
      // O bloqueio de login é uma recusa definitiva, sem refresh ou efeitos remotos.
      if (basePath === "/api/auth/login" && response.status === 409 &&
        data && typeof data === "object" && "codigo" in data &&
        data.codigo === "SESSAO_ATIVA_EXISTENTE" && "erro" in data &&
        typeof data.erro === "string" && data.erro.trim()) {
        throw new ApiError(data.erro, response.status);
      }
      throw new ApiError(
        extractErrorMessage(data) ?? "Não foi possível realizar a requisição.",
        response.status,
      );
    }
    return data as T;
  }
  throw new Error("Não foi possível autenticar a requisição.");
}
