import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
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
import Logo from "../../../assets/viau-logo.svg";
import { styles } from "./CadastroUsuarioScreenStyles";
import { cadastrarUsuario } from "./cadastroUsuario.usecase";

const ICON_SIZE = 22;
const ICON_COLOR = "#475569";

export function CadastroScreen() {
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleCadastro() {
    if (carregando) return;

    Keyboard.dismiss();

    try {
      setCarregando(true);

      await cadastrarUsuario({
        nome,
        cpf,
        email,
        telefone: celular,
        senha,
        aceitouTermos,
      });

      Alert.alert(
        "Cadastro realizado!",
        "Sua conta foi criada. Agora você pode entrar no ViaU.",
        [
          {
            text: "Ir para o login",
            onPress: () => router.replace("/login"),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Não foi possível cadastrar",
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao criar sua conta.",
      );
    } finally {
      setCarregando(false);
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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Logo width={48} height={48} />
              <Text style={styles.logoText}>viau</Text>
            </View>

            <View style={styles.heading}>
              <Text style={styles.title}>Crie sua conta.</Text>
              <Text style={styles.subtitle}>
                Comece sua jornada com o ViaU.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nome completo</Text>
                <TextInput
                  style={styles.input}
                  value={nome}
                  onChangeText={setNome}
                  placeholder="Digite seu nome completo"
                  placeholderTextColor={colors.neutral.carbon}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoComplete="name"
                  returnKeyType="next"
                  editable={!carregando}
                  accessibilityLabel="Nome completo"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Celular</Text>
                <TextInput
                  style={styles.input}
                  value={celular}
                  onChangeText={setCelular}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor={colors.neutral.carbon}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  returnKeyType="next"
                  editable={!carregando}
                  accessibilityLabel="Celular"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Digite seu e-mail"
                  placeholderTextColor={colors.neutral.carbon}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="next"
                  editable={!carregando}
                  accessibilityLabel="E-mail"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>CPF</Text>
                <TextInput
                  style={styles.input}
                  value={cpf}
                  onChangeText={setCpf}
                  placeholder="000.000.000-00"
                  placeholderTextColor={colors.neutral.carbon}
                  keyboardType="numeric"
                  returnKeyType="next"
                  editable={!carregando}
                  accessibilityLabel="CPF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Senha</Text>

                <View
                  style={{ position: "relative", justifyContent: "center" }}
                >
                  <TextInput
                    style={[styles.input, { paddingRight: 48 }]}
                    value={senha}
                    onChangeText={setSenha}
                    placeholder="Crie uma senha com 8 caracteres ou mais"
                    placeholderTextColor={colors.neutral.carbon}
                    secureTextEntry={!mostrarSenha}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="none"
                    importantForAutofill="no"
                    returnKeyType="done"
                    onSubmitEditing={handleCadastro}
                    editable={!carregando}
                    accessibilityLabel="Senha"
                  />

                  <TouchableOpacity
                    onPress={() => setMostrarSenha((anterior) => !anterior)}
                    disabled={carregando}
                    accessibilityRole="button"
                    accessibilityLabel={
                      mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                    }
                    style={{
                      position: "absolute",
                      right: 12,
                      top: 0,
                      bottom: 0,
                      width: 32,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Lucide
                      name={mostrarSenha ? "eye-off" : "eye"}
                      size={20}
                      color={ICON_COLOR}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.termsContainer}
                onPress={() => setAceitouTermos((previous) => !previous)}
                disabled={carregando}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: aceitouTermos }}
              >
                <View
                  style={[
                    styles.checkbox,
                    aceitouTermos && styles.checkboxChecked,
                  ]}
                >
                  {aceitouTermos && (
                    <Lucide name="check" size={16} color="#17211D" />
                  )}
                </View>

                <Text style={styles.termsText}>
                  Li e aceito os{" "}
                  <Text style={styles.termsLink}>Termos de Uso</Text> e a{" "}
                  <Text style={styles.termsLink}>Política de Privacidade</Text>.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.registerButton, carregando && { opacity: 0.7 }]}
                onPress={handleCadastro}
                activeOpacity={0.8}
                disabled={carregando}
                accessibilityRole="button"
                accessibilityLabel="Criar conta"
              >
                {carregando ? (
                  <ActivityIndicator
                    color={colors.semantic.actionPrimaryForeground}
                  />
                ) : (
                  <>
                    <Text style={styles.registerButtonText}>Criar conta</Text>
                    <Lucide
                      name="arrow-right"
                      size={ICON_SIZE}
                      color={colors.semantic.actionPrimaryForeground}
                    />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Já tem uma conta? </Text>
                <TouchableOpacity
                  onPress={() => router.replace("/login")}
                  disabled={carregando}
                >
                  <Text style={styles.loginLink}>Entrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}
