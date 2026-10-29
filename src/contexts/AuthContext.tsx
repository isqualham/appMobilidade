import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Alert, AppState } from "react-native";
import { router, usePathname } from "expo-router";

import type { AuthCredentials, User } from "../services/auth/auth.types";
import {
  restoreSession,
  signIn,
} from "../services/auth/auth.service";
import {
  SESSION_REPLACED_MESSAGE,
  assertSessionVersion,
  getSessionVersion,
  logoutSession,
  onSessionCleared,
  SessionChangedError,
} from "../services/auth/session";

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

function showConnectionError(): void {
  Alert.alert(
    "Não foi possível conectar",
    "Não conseguimos validar sua sessão. Verifique sua conexão com a internet e tente novamente.",
    [{ text: "OK" }],
  );
}

export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeProfile, setActiveProfileState] =
    useState<ActiveProfile>("passenger");

  const canUseProviderProfile = hasProviderAccess(user);

  const resetAuthentication = useCallback(() => {
    setUser(null);
    setActiveProfileState("passenger");
  }, []);

  useEffect(() => onSessionCleared(reason => {
    resetAuthentication();
    if (reason === "replaced") Alert.alert("Sessão encerrada", SESSION_REPLACED_MESSAGE);
  }), [resetAuthentication]);

  const refreshUser = useCallback(async () => {
    const version = getSessionVersion();
    try {
      const authenticatedUser = await restoreSession();
      assertSessionVersion(version);

      setUser(authenticatedUser);

      if (!hasProviderAccess(authenticatedUser)) {
        setActiveProfileState("passenger");
      }
    } catch (error) {
      if (error instanceof SessionChangedError || version !== getSessionVersion()) {
        return;
      }
      if (isUnauthorizedError(error)) {
        resetAuthentication();
        return;
      }

      // Falhas de conexão não devem apagar um token potencialmente válido.
      throw error;
    }
  }, [resetAuthentication]);

  useEffect(() => {
    let isMounted = true;
    const version = getSessionVersion();

    async function loadSession() {
      try {
        const authenticatedUser = await restoreSession();

        if (isMounted && version === getSessionVersion()) {
          setUser(authenticatedUser);
          setActiveProfileState("passenger");
        }
      } catch (error) {
        if (error instanceof SessionChangedError || version !== getSessionVersion()) {
          return;
        }
        if (isUnauthorizedError(error)) {
          // The session service already invalidated credentials before notifying us.
          if (isMounted) {
            setUser(null);
            setActiveProfileState("passenger");
          }
        } else {
          // Não apaga o token por falhas temporárias de rede ou servidor.
          if (isMounted) {
            setUser(null);
            setActiveProfileState("passenger");
            showConnectionError();
          }
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

  useEffect(() => {
    let previousState: typeof AppState.currentState = AppState.currentState;

    const subscription = AppState.addEventListener("change", (nextState) => {
      const returningToApp =
        (previousState === "background" || previousState === "inactive") &&
        nextState === "active";

      previousState = nextState;

      if (returningToApp && !isLoadingAuth) {
        void refreshUser().catch(() => {
          // Preserve a potentially valid session on an ordinary /me network failure.
        });
      }
    });

    return () => subscription.remove();
  }, [isLoadingAuth, refreshUser]);

  useEffect(() => {
    if (isLoadingAuth) return;

    if (!user) {
      const publicRoutes = ["/login", "/cadastro", "/recuperar-senha", "/"];

      if (!publicRoutes.includes(pathname)) {
        router.replace("/login");
      }

      return;
    }

    if (!user.telefoneVerificado) {
      if (pathname !== "/autenticacao-telefone") {
        router.replace("/autenticacao-telefone");
      }

      return;
    }

    if (pathname === "/autenticacao-telefone") {
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
    const pendingLogin = signIn(credentials);
    const version = getSessionVersion();
    const authenticatedUser = await pendingLogin;
    assertSessionVersion(version);

    setUser(authenticatedUser);
    setActiveProfileState("passenger");
  }

  async function signOut(): Promise<void> {
    if (user?.prestador) {
      const version = getSessionVersion();
      await logoutSession(true);
      if (getSessionVersion() === version + 1) {
        resetAuthentication();
        router.replace("/login");
      }
      return;
    }
    const pendingLogout = logoutSession();
    resetAuthentication();
    router.replace("/login");
    await pendingLogout;
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
