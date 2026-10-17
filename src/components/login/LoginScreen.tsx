import { useState } from "react";
import {
  Alert,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";

import { colors } from "../../theme";
import { useAuth } from "../../contexts/AuthContext";
import Logo from "../../../assets/viau-logo.svg";
import { styles } from "./LoginScreenStyles";

const ICON_SIZE = 22;
const ICON_COLOR = "#475569";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signInWithCredentials } = useAuth();

  async function handleLogin() {
    if (isLoading) return;

    if (!email.trim() || !senha) {
      Alert.alert("Atenção", "Preencha seu e-mail e sua senha.");
      return;
    }

    try {
      setIsLoading(true);

      await signInWithCredentials({
        email: email.trim(),
        password: senha,
      });

      Keyboard.dismiss();
      router.replace("/home");
    } catch (error) {
      Alert.alert(
        "Erro no login",
        error instanceof Error ? error.message : "Não foi possível entrar.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <StatusBar style="dark" />

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Lucide name="arrow-left" size={ICON_SIZE} color={ICON_COLOR} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Logo width={58} height={58} />
            <Text style={styles.logoText}>viau</Text>
          </View>

          <View style={styles.heading}>
            <Text style={styles.title}>Que bom ter{"\n"}você aqui.</Text>

            <Text style={styles.subtitle}>
              Entre para continuar sua jornada.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-mail ou celular</Text>

              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Digite seu e-mail ou celular"
                placeholderTextColor={colors.neutral.carbon}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!isLoading}
                returnKeyType="next"
                accessibilityLabel="E-mail ou celular"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Senha</Text>

              <TextInput
                style={styles.input}
                value={senha}
                onChangeText={setSenha}
                placeholder="Digite sua senha"
                placeholderTextColor={colors.neutral.carbon}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                accessibilityLabel="Senha"
              />
            </View>

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() =>
                Alert.alert("Recuperar senha", "Fluxo a implementar.")
              }
              disabled={isLoading}
            >
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={isLoading ? "Entrando" : "Entrar"}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? "Entrando..." : "Entrar"}
              </Text>

              {!isLoading && (
                <Lucide
                  name="arrow-right"
                  size={ICON_SIZE}
                  color={colors.semantic.actionPrimaryForeground}
                />
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Ainda não tem conta? </Text>

              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Cadastro", "Tela de cadastro a implementar.")
                }
                disabled={isLoading}
              >
                <Text style={styles.registerLink}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
