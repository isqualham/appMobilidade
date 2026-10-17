import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import Logo from "../../../assets/viau-logo.svg";
import { styles } from "./SplashScreenStyles";

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo width={100} height={100} />
          <Text style={styles.logo}>ViaU</Text>
        </View>

        <Text style={styles.tagline}>Movimento que conecta</Text>
      </View>

      <Text style={styles.location}>CÁCERES - MATO GROSSO</Text>
    </View>
  );
}
