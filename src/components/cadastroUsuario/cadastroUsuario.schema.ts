import { z } from "zod";

function validarCPF(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let soma = 0;

  for (let i = 0; i < 9; i++) {
    soma += Number(cpf[i]) * (10 - i);
  }

  let digito = (soma * 10) % 11;
  if (digito === 10) digito = 0;

  if (digito !== Number(cpf[9])) {
    return false;
  }

  soma = 0;

  for (let i = 0; i < 10; i++) {
    soma += Number(cpf[i]) * (11 - i);
  }

  digito = (soma * 10) % 11;
  if (digito === 10) digito = 0;

  return digito === Number(cpf[10]);
}

export const cadastroUsuarioSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo.")
    .refine(
      (nome) => nome.split(/\s+/).filter(Boolean).length >= 2,
      "Informe seu nome e sobrenome.",
    ),

  cpf: z
    .string()
    .transform((valor) => valor.replace(/\D/g, ""))
    .refine(validarCPF, "Informe um CPF válido."),

  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .transform((email) => email.toLowerCase()),

  telefone: z
    .string()
    .transform((valor) => valor.replace(/\D/g, ""))
    .refine(
      (telefone) => telefone.length === 10 || telefone.length === 11,
      "Informe um telefone com DDD válido.",
    ),

  senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),

  aceitouTermos: z
    .boolean()
    .refine((aceitou) => aceitou, "Você precisa aceitar os Termos de Uso."),
});

export type CadastroUsuarioInput = z.input<typeof cadastroUsuarioSchema>;

export type CadastroUsuarioValidado = z.output<typeof cadastroUsuarioSchema>;
