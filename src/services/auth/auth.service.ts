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
    typeof response.prestador !== "boolean"
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
      typeof response.prestador !== "boolean"
    ) {
      throw new Error("A API retornou dados de usuário inválidos.");
    }

    return mapApiUser(response);
  } catch (error) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    throw error;
  }
}

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
