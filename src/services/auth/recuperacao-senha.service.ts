import { apiRequest } from "../api";

export async function enviarCodigoRecuperacao(
  telefone: string,
): Promise<void> {
  await apiRequest("/api/auth/senha/enviar-codigo", {
    method: "POST",
    body: JSON.stringify({ telefone }),
  });
}

export async function redefinirSenha(
  telefone: string,
  codigo: string,
  novaSenha: string,
  confirmarSenha: string,
): Promise<void> {
  await apiRequest("/api/auth/senha/redefinir", {
    method: "POST",
    body: JSON.stringify({
      telefone,
      codigo,
      novaSenha,
      confirmarSenha,
    }),
  });
}
