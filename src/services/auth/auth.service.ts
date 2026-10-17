import type { AuthCredentials, User } from "./auth.types";

const testUser: User = {
  id: "1",
  name: "Usuário de Teste",
  email: "teste@viau.app",
  profiles: ["client", "provider"],
  activeProfile: "client",
};

export async function signIn(credentials: AuthCredentials): Promise<User> {
  const validEmail = "teste";
  const validPassword = "123";

  if (
    credentials.email.trim().toLowerCase() !== validEmail ||
    credentials.password !== validPassword
  ) {
    throw new Error("E-mail ou senha inválidos.");
  }

  return testUser;
}
