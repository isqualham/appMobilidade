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

const dddsValidos = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35,
  37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64,
  65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88,
  89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

function normalizarTelefone(valor: string): string {
  let digitos = valor.replace(/\D/g, "");

  // Se já veio com o código do Brasil, remove-o temporariamente
  // para validar o número nacional.
  if (
    digitos.startsWith("55") &&
    (digitos.length === 12 || digitos.length === 13)
  ) {
    digitos = digitos.slice(2);
  }

  return digitos;
}

function validarTelefone(telefone: string): boolean {
  if (telefone.length !== 10 && telefone.length !== 11) {
    return false;
  }

  const ddd = Number(telefone.slice(0, 2));

  if (!dddsValidos.has(ddd)) {
    return false;
  }

  const numero = telefone.slice(2);

  if (numero.length === 9) {
    return numero.startsWith("9");
  }

  return numero.length === 8 && /^[2-5]/.test(numero);
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
    .transform(normalizarTelefone)
    .refine(
      validarTelefone,
      "Informe um telefone válido com DDD. Exemplo: (65) 99911-7323.",
    )
    // Mantém o padrão internacional esperado pelo backend.
    .transform((telefone) => `+55${telefone}`),

  senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),

  aceitouTermos: z
    .boolean()
    .refine((aceitou) => aceitou, "Você precisa aceitar os Termos de Uso."),
});

export type CadastroUsuarioInput = z.input<typeof cadastroUsuarioSchema>;

export type CadastroUsuarioValidado = z.output<typeof cadastroUsuarioSchema>;
