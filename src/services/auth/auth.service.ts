import * as SecureStore from "expo-secure-store";

import { apiRequest } from "../api";
import type { AuthCredentials, User } from "./auth.types";

interface LoginApiResponse {
  id: string;
  nome: string;
  email: string;
  token: string;
}

const TOKEN_KEY = "viau_auth_token";

export async function signIn(credentials: AuthCredentials): Promise<User> {
  const response = await apiRequest<LoginApiResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: credentials.email.trim(),
      senha: credentials.password,
    }),
  });

  if (!response.id || !response.nome || !response.email || !response.token) {
    throw new Error("A API retornou uma resposta de login inválida.");
  }

  await SecureStore.setItemAsync(TOKEN_KEY, response.token);

  return {
    id: response.id,
    name: response.nome,
    email: response.email,
    profiles: ["client"],
    activeProfile: "client",
  };
}

export async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
