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
import { loginSchema } from "./LoginScreen.schema";
import Logo from "../../../assets/viau-logo.svg";
import { styles } from "./LoginScreenStyles";

const ICON_SIZE = 22;
const ICON_COLOR = "#475569";

type LoginErrors = {
  email?: string;
  password?: string;
};

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const { signInWithCredentials } = useAuth();

  function handleEmailChange(value: string) {
    setEmail(value);

    const result = loginSchema.shape.email.safeParse(value);

    setErrors((previous) => ({
      ...previous,
      email: result.success
        ? undefined
        : previous.email
          ? result.error.issues[0]?.message
          : undefined,
    }));
  }

  function handlePasswordChange(value: string) {
    setSenha(value);

    const result = loginSchema.shape.password.safeParse(value);

    setErrors((previous) => ({
      ...previous,
      password: result.success
        ? undefined
        : previous.password
          ? result.error.issues[0]?.message
          : undefined,
    }));
  }

  async function handleLogin() {
    if (isLoading) return;

    const result = loginSchema.safeParse({
      email,
      password: senha,
    });

    if (!result.success) {
      const nextErrors: LoginErrors = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0];

        if ((field === "email" || field === "password") && !nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }

      setErrors(nextErrors);
      return;
    }

    try {
      setIsLoading(true);

      await signInWithCredentials({
        email: result.data.email,
        password: result.data.password,
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
              <Text style={styles.label}>E-mail</Text>

              <TextInput
                style={styles.input}
                value={email}
                onChangeText={handleEmailChange}
                placeholder="Digite seu e-mail"
                placeholderTextColor={colors.neutral.carbon}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!isLoading}
                returnKeyType="next"
                accessibilityLabel="E-mail"
                accessibilityHint="Digite um endereço de e-mail válido"
                accessibilityState={{ disabled: isLoading }}
              />

              {!!errors.email && (
                <Text
                  style={{ color: "#DC2626", fontSize: 12, marginTop: 5 }}
                  accessibilityRole="alert"
                >
                  {errors.email}
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Senha</Text>

              <TextInput
                style={styles.input}
                value={senha}
                onChangeText={handlePasswordChange}
                placeholder="Digite sua senha"
                placeholderTextColor={colors.neutral.carbon}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                accessibilityLabel="Senha"
                accessibilityHint="A senha deve ter pelo menos 8 caracteres"
                accessibilityState={{ disabled: isLoading }}
              />

              {!!errors.password && (
                <Text
                  style={{ color: "#DC2626", fontSize: 12, marginTop: 5 }}
                  accessibilityRole="alert"
                >
                  {errors.password}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => router.push("/autenticacao-telefone")}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Esqueci minha senha"
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
                onPress={() => router.push("/cadastro")}
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
