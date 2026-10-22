import { apiRequest } from "../../services/api";
import type { CriarUsuarioDto } from "./cadastroUsuario.dto";

export interface CadastroUsuarioResponse {
  id: string;
  nome: string;
  email: string;
}

export async function criarUsuario(
  dados: CriarUsuarioDto,
): Promise<CadastroUsuarioResponse> {
  return apiRequest<CadastroUsuarioResponse>("/api/usuarios", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}
