import { createContext, useContext, useState, type ReactNode } from "react";

import type { AuthCredentials, User } from "../services/auth/auth.types";
import { signIn } from "../services/auth/auth.service";

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  signInWithCredentials: (credentials: AuthCredentials) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  async function signInWithCredentials(credentials: AuthCredentials) {
    const authenticatedUser = await signIn(credentials);
    setUser(authenticatedUser);
  }

  function signOut() {
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        signInWithCredentials,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return context;
}
