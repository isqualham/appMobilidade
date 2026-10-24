import { useState } from "react";
import {
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
import {
  enviarCodigoRecuperacao,
  redefinirSenha,
} from "../../services/auth/recuperacao-senha.service";
import { styles } from "./RecuperarSenhaScreenStyles";

const ICON_SIZE = 22;
const ICON_COLOR = "#475569";

export function RecuperarSenhaScreen() {
  const [telefone, setTelefone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [etapaCodigo, setEtapaCodigo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const telefoneLimpo = telefone.replace(/\D/g, "");
  const telefoneCompleto = `+55${telefoneLimpo}`;
  const codigoLimpo = codigo.replace(/\D/g, "");

  async function handleEnviarCodigo() {
    if (isLoading) return;

    if (!/^[1-9]{2}9\d{8}$/.test(telefoneLimpo)) {
      Alert.alert(
        "Telefone inválido",
        "Informe um celular com DDD e 9 dígitos, incluindo o código de área.",
      );
      return;
    }

    try {
      setIsLoading(true);
      await enviarCodigoRecuperacao(telefoneCompleto);
      setEtapaCodigo(true);

      Alert.alert(
        "Código enviado",
        "Confira o SMS enviado para o celular informado.",
      );
    } catch (error) {
      Alert.alert(
        "Não foi possível enviar",
        error instanceof Error ? error.message : "Tente novamente mais tarde.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRedefinirSenha() {
    if (isLoading) return;

    if (!/^\d{6,8}$/.test(codigoLimpo)) {
      Alert.alert("Código inválido", "Digite o código recebido por SMS.");
      return;
    }

    if (novaSenha.length < 8) {
      Alert.alert(
        "Senha inválida",
        "Sua nova senha deve ter pelo menos 8 caracteres.",
      );
      return;
    }

    if (novaSenha !== confirmarSenha) {
      Alert.alert("Senhas diferentes", "As senhas informadas não coincidem.");
      return;
    }

    try {
      setIsLoading(true);

      await redefinirSenha(
        telefoneCompleto,
        codigoLimpo,
        novaSenha,
        confirmarSenha,
      );

      Alert.alert(
        "Senha alterada",
        "Sua senha foi redefinida. Entre com a nova senha.",
        [
          {
            text: "Ir para o login",
            onPress: () => router.replace("/login"),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Não foi possível redefinir",
        error instanceof Error ? error.message : "Tente novamente mais tarde.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleTelefoneChange(value: string) {
    const numeros = value.replace(/\D/g, "").slice(0, 11);

    let formatado = numeros;

    if (numeros.length > 2) {
      formatado = `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    if (numeros.length > 7) {
      formatado = `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }

    setTelefone(formatado);
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <StatusBar style="dark" />

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (etapaCodigo) {
              setEtapaCodigo(false);
            } else {
              router.back();
            }
          }}
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
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>viau</Text>
          </View>

          <View style={styles.heading}>
            <Text style={styles.title}>
              {etapaCodigo
                ? "Crie uma nova senha."
                : "Vamos recuperar seu acesso."}
            </Text>

            <Text style={styles.subtitle}>
              {etapaCodigo
                ? "Informe o código recebido por SMS e escolha sua nova senha."
                : "Informe seu celular cadastrado para receber um código por SMS."}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Celular com DDD</Text>

              <TextInput
                style={styles.input}
                value={telefone}
                onChangeText={handleTelefoneChange}
                placeholder="(DD) 9XXXX-XXXX"
                placeholderTextColor={colors.neutral.carbon}
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={!isLoading && !etapaCodigo}
                maxLength={15}
                accessibilityLabel="Celular com DDD"
              />
            </View>

            {!etapaCodigo ? (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleEnviarCodigo}
                disabled={isLoading}
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? "Enviando código..." : "Enviar código por SMS"}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Código recebido por SMS</Text>

                  <TextInput
                    style={styles.input}
                    value={codigo}
                    onChangeText={(value) =>
                      setCodigo(value.replace(/\D/g, "").slice(0, 8))
                    }
                    placeholder="Digite o código"
                    placeholderTextColor={colors.neutral.carbon}
                    keyboardType="number-pad"
                    maxLength={8}
                    editable={!isLoading}
                    accessibilityLabel="Código de recuperação"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nova senha</Text>

                  <TextInput
                    style={styles.input}
                    value={novaSenha}
                    onChangeText={setNovaSenha}
                    placeholder="Mínimo de 8 caracteres"
                    placeholderTextColor={colors.neutral.carbon}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    editable={!isLoading}
                    accessibilityLabel="Nova senha"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirmar nova senha</Text>

                  <TextInput
                    style={styles.input}
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                    placeholder="Digite a senha novamente"
                    placeholderTextColor={colors.neutral.carbon}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    editable={!isLoading}
                    returnKeyType="done"
                    onSubmitEditing={handleRedefinirSenha}
                    accessibilityLabel="Confirmar nova senha"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    isLoading && styles.buttonDisabled,
                  ]}
                  onPress={handleRedefinirSenha}
                  disabled={isLoading}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? "Redefinindo senha..." : "Redefinir senha"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleEnviarCodigo}
                  disabled={isLoading}
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryButtonText}>
                    Reenviar código
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}
