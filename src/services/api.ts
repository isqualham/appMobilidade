const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");

if (!API_URL) {
  throw new Error(
    "A variável EXPO_PUBLIC_API_URL não está configurada no arquivo .env.",
  );
}

export { API_URL };

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
  const response = await fetch(
    `${API_URL}${path.startsWith("/") ? path : `/${path}`}`,
    {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    },
  );

  const responseText = await response.text();

  let data: unknown = null;

  if (responseText.trim()) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
  }

  if (!response.ok) {
    const message = extractErrorMessage(data);

    throw new Error(message ?? "Não foi possível realizar a requisição.");
  }

  return data as T;
}
