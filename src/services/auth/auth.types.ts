export type UserProfile = "client" | "provider";

export type ProviderApprovalStatus =
  | "PENDENTE"
  | "APROVADO"
  | "REPROVADO"
  | null;

export interface User {
  id: string;
  name: string;
  email: string;
  administrador: boolean;
  prestador: boolean;
  statusAprovacao: ProviderApprovalStatus;
  profiles: UserProfile[];
  activeProfile: UserProfile;
}

export interface AuthCredentials {
  email: string;
  password: string;
}
