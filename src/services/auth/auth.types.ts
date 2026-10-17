export type UserProfile = "client" | "provider";

export interface User {
  id: string;
  name: string;
  email: string;
  profiles: UserProfile[];
  activeProfile: UserProfile;
}

export interface AuthCredentials {
  email: string;
  password: string;
}
