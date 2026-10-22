import { apiRequest } from "../../services/api";

type ConfirmarCodigoResponse = {
  message?: string;
  verificado?: boolean;
};

export async function confirmarCodigoTelefone(
  codigo: string,
): Promise<ConfirmarCodigoResponse> {
  return apiRequest<ConfirmarCodigoResponse>("/api/auth/codigo/verificar", {
    method: "POST",
    body: JSON.stringify({ codigo }),
  });
}
