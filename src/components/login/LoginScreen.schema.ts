import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .email("Digite um endereço de e-mail válido."),

  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
