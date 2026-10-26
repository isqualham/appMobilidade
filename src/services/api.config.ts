const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");

if (!apiUrl) {
  throw new Error("A variável EXPO_PUBLIC_API_URL não está configurada no arquivo .env.");
}

export const API_URL = apiUrl;
