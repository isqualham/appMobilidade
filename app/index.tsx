import { useEffect } from "react";
import { router } from "expo-router";

import { SplashScreen } from "../src/components/splash/SplashScreen";
import { useAuth } from "../src/contexts/AuthContext";

export default function Splash() {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (isLoadingAuth) {
      return;
    }

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace("/home");
      } else {
        router.replace("/login");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoadingAuth]);

  return <SplashScreen />;
}
