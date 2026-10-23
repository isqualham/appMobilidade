import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AppState, type AppStateStatus } from "react-native";
import { router, usePathname } from "expo-router";

import type { AuthCredentials, User } from "../services/auth/auth.types";
import {
  clearAuthToken,
  restoreSession,
  signIn,
} from "../services/auth/auth.service";

export type ActiveProfile = "passenger" | "driver";

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  activeProfile: ActiveProfile;
  canUseProviderProfile: boolean;
  setActiveProfile: (profile: ActiveProfile) => void;
  refreshUser: () => Promise<void>;
  signInWithCredentials: (credentials: AuthCredentials) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function hasProviderAccess(user: User | null): boolean {
  return (
    user !== null &&
    user.prestador &&
    user.statusAprovacao === "APROVADO" &&
    user.profiles.includes("provider")
  );
}

function isUnauthorizedError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    status?: number;
    statusCode?: number;
    message?: string;
  };

  return (
    candidate.status === 401 ||
    candidate.statusCode === 401 ||
    candidate.message?.toLowerCase().includes("unauthorized") === true
  );
}

export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeProfile, setActiveProfileState] =
    useState<ActiveProfile>("passenger");

  const canUseProviderProfile = hasProviderAccess(user);

  const resetAuthentication = useCallback(async () => {
    try {
      await clearAuthToken();
    } catch (error) {
      console.error("Erro ao limpar token de autenticação:", error);
    } finally {
      setUser(null);
      setActiveProfileState("passenger");
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const authenticatedUser = await restoreSession();

      setUser(authenticatedUser);

      if (!hasProviderAccess(authenticatedUser)) {
        setActiveProfileState("passenger");
      }
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await resetAuthentication();
        return;
      }

      console.error("Erro ao atualizar sessão:", error);
      throw error;
    }
  }, [resetAuthentication]);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const authenticatedUser = await restoreSession();

        if (isMounted) {
          setUser(authenticatedUser);
          setActiveProfileState("passenger");
        }
      } catch (error) {
        if (isUnauthorizedError(error)) {
          try {
            await clearAuthToken();
          } catch (clearError) {
            console.error("Erro ao limpar sessão inválida:", clearError);
          }
        } else {
          console.error("Erro ao restaurar sessão:", error);
        }

        if (isMounted) {
          setUser(null);
          setActiveProfileState("passenger");
        }
      } finally {
        if (isMounted) setIsLoadingAuth(false);
      }
    }

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let previousState: AppStateStatus = AppState.currentState;

    const subscription = AppState.addEventListener("change", (nextState) => {
      const returningToApp =
        (previousState === "background" || previousState === "inactive") &&
        nextState === "active";

      previousState = nextState;

      if (returningToApp && !isLoadingAuth && user !== null) {
        void refreshUser();
      }
    });

    return () => subscription.remove();
  }, [isLoadingAuth, user, refreshUser]);

  useEffect(() => {
    if (isLoadingAuth) return;

    if (user && !user.telefoneVerificado) {
      if (pathname !== "/autenticacao-telefone") {
        router.replace("/autenticacao-telefone");
      }
      return;
    }

    if (
      user &&
      user.telefoneVerificado &&
      pathname === "/autenticacao-telefone"
    ) {
      router.replace("/home");
    }
  }, [isLoadingAuth, pathname, user]);

  function setActiveProfile(profile: ActiveProfile) {
    if (profile === "driver" && !hasProviderAccess(user)) return;
    setActiveProfileState(profile);
  }

  async function signInWithCredentials(
    credentials: AuthCredentials,
  ): Promise<void> {
    const authenticatedUser = await signIn(credentials);
    setUser(authenticatedUser);
    setActiveProfileState("passenger");
  }

  async function signOut(): Promise<void> {
    await resetAuthentication();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoadingAuth,
        activeProfile,
        canUseProviderProfile,
        setActiveProfile,
        refreshUser,
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
