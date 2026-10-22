import type { CadastroUsuarioValidado } from "./cadastroUsuario.schema";

export interface CriarUsuarioDto {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  senha: string;
  aceitouTermos: boolean;
}

export function criarUsuarioDto(
  dados: CadastroUsuarioValidado,
): CriarUsuarioDto {
  return {
    nome: dados.nome,
    cpf: dados.cpf,
    email: dados.email,
    telefone: dados.telefone,
    senha: dados.senha,
    aceitouTermos: dados.aceitouTermos,
  };
}
