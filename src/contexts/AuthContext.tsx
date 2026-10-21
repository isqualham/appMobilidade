import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { AuthCredentials, User } from "../services/auth/auth.types";
import {
  clearAuthToken,
  restoreSession,
  signIn,
} from "../services/auth/auth.service";

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  signInWithCredentials: (credentials: AuthCredentials) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const authenticatedUser = await restoreSession();

        if (isMounted) {
          setUser(authenticatedUser);
        }
      } catch (error) {
        console.error("Erro ao restaurar sessão:", error);

        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingAuth(false);
        }
      }
    }

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function signInWithCredentials(
    credentials: AuthCredentials,
  ): Promise<void> {
    const authenticatedUser = await signIn(credentials);
    setUser(authenticatedUser);
  }

  async function signOut(): Promise<void> {
    await clearAuthToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoadingAuth,
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
