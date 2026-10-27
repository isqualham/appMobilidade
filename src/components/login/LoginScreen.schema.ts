import { z } from "zod";

// Códigos nacionais do plano de numeração da Anatel.
const validDDDs = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail ou telefone.")
    .superRefine((value, context) => {
      const invalid = (message: string) => context.addIssue({ code: "custom", message });
      if (!value) return;
      if (value.includes("@") || /[a-z]/i.test(value)) {
        if (!z.string().email().safeParse(value).success) invalid("Digite um endereço de e-mail válido.");
        return;
      }
      if (!/^[\d\s()-]+$/.test(value)) {
        invalid("Digite o telefone com DDD, usando apenas números, espaços, parênteses ou hífen.");
        return;
      }
      const digits = value.replace(/\D/g, "");
      if (digits.length < 10) {
        invalid("Telefone incompleto. Informe o DDD e o número, como (65) 99999-1234.");
      } else if (digits.length > 11) {
        invalid("Use DDD + número, com 10 ou 11 dígitos, sem +55 ou código de operadora.");
      } else if (!validDDDs.has(Number(digits.slice(0, 2)))) {
        invalid("DDD inválido. Informe um DDD brasileiro válido, como 65.");
      } else if (digits.length === 10 && digits[2] === "9") {
        invalid("Celular incompleto. Informe o DDD e os 9 dígitos do celular.");
      } else if (!/^(?:[2-5]\d{7}|9\d{8})$/.test(digits.slice(2))) {
        invalid("Número inválido. Use celular com 9 dígitos iniciado em 9 ou fixo com 8 dígitos iniciado em 2, 3, 4 ou 5.");
      }
    }),

  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
