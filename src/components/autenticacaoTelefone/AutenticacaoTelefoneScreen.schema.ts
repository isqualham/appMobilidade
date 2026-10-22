import { z } from "zod";

export const autenticacaoTelefoneSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(6, "O token deve ter no mínimo 6 dígitos.")
    .max(8, "O token deve ter no máximo 8 dígitos.")
    .regex(/^\d+$/, "O token deve conter apenas números."),
});
