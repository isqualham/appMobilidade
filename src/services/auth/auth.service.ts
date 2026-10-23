import * as SecureStore from "expo-secure-store";

import { apiRequest } from "../api";
import type { AuthCredentials, User } from "./auth.types";

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
}

const TOKEN_KEY = "viau_auth_token";
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
  const response = await apiRequest<LoginApiResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: credentials.email.trim(),
      senha: credentials.password,
    }),
  });

  if (
    !response.id ||
    !response.nome ||
    !response.email ||
    !response.token ||
    typeof response.administrador !== "boolean" ||
    typeof response.prestador !== "boolean" ||
    typeof response.telefoneVerificado !== "boolean"
  ) {
    throw new Error("A API retornou uma resposta de login inválida.");
  }

  await SecureStore.setItemAsync(TOKEN_KEY, response.token);

  return mapApiUser(response);
}

export async function restoreSession(): Promise<User | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  if (!token) {
    return null;
  }

  try {
    const response = await apiRequest<AuthApiUser>(CURRENT_USER_ROUTE);

    if (
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
  } catch (error) {
    const status =
      error && typeof error === "object" && "status" in error
        ? (error as { status?: number }).status
        : undefined;

    if (status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }

    throw error;
  }
}

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
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
