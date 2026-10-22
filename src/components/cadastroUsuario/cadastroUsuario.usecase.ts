import {
  cadastroUsuarioSchema,
  type CadastroUsuarioInput,
} from "./cadastroUsuario.schema";

import { criarUsuarioDto } from "./cadastroUsuario.dto";

import {
  criarUsuario,
  type CadastroUsuarioResponse,
} from "./cadastroUsuario.service";

export async function cadastrarUsuario(
  dados: CadastroUsuarioInput,
): Promise<CadastroUsuarioResponse> {
  const resultado = cadastroUsuarioSchema.safeParse(dados);

  if (!resultado.success) {
    throw new Error(
      resultado.error.issues[0]?.message ?? "Confira os dados informados.",
    );
  }

  const dto = criarUsuarioDto(resultado.data);

  return criarUsuario(dto);
}
