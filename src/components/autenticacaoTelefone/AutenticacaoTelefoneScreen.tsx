import { useState } from "react";
import {
  ActivityIndicator,
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

import { confirmarCodigoTelefone } from "./autenticacaoTelefone.service";
import { autenticacaoTelefoneSchema } from "./AutenticacaoTelefoneScreen.schema";
import { styles } from "./AutenticacaoTelefoneScreenStyles";

export function AutenticacaoTelefoneScreen() {
  const [codigo, setCodigo] = useState("");
  const [verificando, setVerificando] = useState(false);

  const resultadoValidacao = autenticacaoTelefoneSchema.safeParse({
    codigo,
  });

  const codigoValido = resultadoValidacao.success;

  async function verificarCodigo() {
    if (verificando) return;

    const resultado = autenticacaoTelefoneSchema.safeParse({
      codigo,
    });

    if (!resultado.success) {
      Alert.alert(
        "Código inválido",
        resultado.error.issues[0]?.message ??
          "Informe um token com 6 a 8 números.",
      );
      return;
    }

    try {
      setVerificando(true);

      await confirmarCodigoTelefone(resultado.data.codigo);

      Keyboard.dismiss();

      Alert.alert("Verificação concluída", "O token foi validado com sucesso.");
    } catch (error) {
      Alert.alert(
        "Não foi possível verificar",
        error instanceof Error
          ? error.message
          : "Confira o token e tente novamente.",
      );
    } finally {
      setVerificando(false);
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
          <Lucide name="arrow-left" size={24} color="#17211D" />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Lucide name="shield-check" size={36} color="#18875A" />
          </View>

          <Text style={styles.title}>Autentique seu{"\n"}telefone.</Text>

          <Text style={styles.subtitle}>
            Digite o token de verificação para confirmar seu telefone.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Token de verificação</Text>

            <TextInput
              style={styles.codeInput}
              value={codigo}
              onChangeText={(value) =>
                setCodigo(value.replace(/\D/g, "").slice(0, 8))
              }
              placeholder="Digite o token"
              placeholderTextColor="#707D76"
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={8}
              editable={!verificando}
              returnKeyType="done"
              onSubmitEditing={verificarCodigo}
              accessibilityLabel="Token de verificação"
            />

            <Text style={styles.helperText}>Informe de 6 a 8 números.</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (verificando || (codigo.length > 0 && !codigoValido)) &&
                styles.disabledButton,
            ]}
            onPress={verificarCodigo}
            disabled={verificando}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Verificar token"
          >
            {verificando ? (
              <ActivityIndicator color="#17211D" />
            ) : (
              <Text style={styles.primaryButtonText}>Verificar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.securityContainer}>
            <Lucide name="lock-keyhole" size={26} color="#18875A" />

            <View style={styles.securityTextContainer}>
              <Text style={styles.securityTitle}>Ambiente protegido</Text>

              <Text style={styles.securitySubtitle}>
                A validade do token é confirmada pelo backend.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
