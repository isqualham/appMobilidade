import { apiRequest } from "../api";
import type { AuthCredentials, User } from "./auth.types";
import {
  assertSessionVersion,
  clearSession,
  getAccessToken,
  getSessionVersion,
  isTokenPair,
  readSession,
  saveSession,
} from "./session";

interface AuthApiUser {
  id: string;
  nome: string;
  email: string;
  administrador: boolean;
  prestador: boolean;
  statusAprovacao: "PENDENTE" | "APROVADO" | "REPROVADO" | null;
  telefoneVerificado: boolean;
}

interface LoginApiResponse extends AuthApiUser {
  token: string;
  refreshToken: string;
}

const CURRENT_USER_ROUTE = "/api/auth/me";

function mapApiUser(response: AuthApiUser): User {
  const providerApproved =
    response.prestador === true && response.statusAprovacao === "APROVADO";

  return {
    id: response.id,
    name: response.nome,
    email: response.email,
    administrador: response.administrador,
    prestador: response.prestador,
    statusAprovacao: response.statusAprovacao,
    telefoneVerificado: response.telefoneVerificado,
    profiles: providerApproved ? ["client", "provider"] : ["client"],
    activeProfile: "client",
  };
}

export async function signIn(credentials: AuthCredentials): Promise<User> {
  // A new login owns a new generation, even if an older refresh is still pending.
  const cleanup = clearSession();
  const version = getSessionVersion();
  await cleanup;
  assertSessionVersion(version);
  const response = await apiRequest<LoginApiResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: credentials.email.trim(),
      senha: credentials.password,
    }),
  });
  assertSessionVersion(version);

  if (
    !response ||
    !response.id ||
    !response.nome ||
    !response.email ||
    !isTokenPair(response) ||
    typeof response.administrador !== "boolean" ||
    typeof response.prestador !== "boolean" ||
    typeof response.telefoneVerificado !== "boolean"
  ) {
    throw new Error("A API retornou uma resposta de login inválida.");
  }

  try {
    await saveSession(response, version);
  } catch (error) {
    await clearSession(version);
    throw error;
  }

  return mapApiUser(response);
}

export async function restoreSession(): Promise<User | null> {
  const version = getSessionVersion();
  const tokens = await readSession(version);

  if (!tokens) {
    return null;
  }

  const response = await apiRequest<AuthApiUser>(CURRENT_USER_ROUTE);
  assertSessionVersion(version);

  if (
    !response ||
    !response.id ||
    !response.nome ||
    !response.email ||
    typeof response.administrador !== "boolean" ||
    typeof response.prestador !== "boolean" ||
    typeof response.telefoneVerificado !== "boolean"
  ) {
    throw new Error("A API retornou dados de usuário inválidos.");
  }

  return mapApiUser(response);
}

export async function getAuthToken(): Promise<string | null> {
  const version = getSessionVersion();
  if (!(await readSession(version))) return null;
  return (await getAccessToken(version)).token;
}

export async function clearAuthToken(): Promise<void> {
  await clearSession();
}

export async function enviarCodigoTelefone(): Promise<void> {
  await apiRequest("/api/auth/codigo/enviar", {
    method: "POST",
  });
}

export async function verificarCodigoTelefone(codigo: string): Promise<void> {
  const codigoLimpo = codigo.trim();

  if (!/^\d{6,8}$/.test(codigoLimpo)) {
    throw new Error("Digite o código de verificação de 6 a 8  dígitos.");
  }

  await apiRequest("/api/auth/codigo/verificar", {
    method: "POST",
    body: JSON.stringify({ codigo: codigoLimpo }),
  });
}
