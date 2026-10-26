import { useEffect, useState } from "react";
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

import { useAuth } from "../../contexts/AuthContext";
import {
  enviarCodigoTelefone,
  verificarCodigoTelefone,
} from "../../services/auth/auth.service";
import { styles } from "./AutenticacaoTelefoneScreenStyles";

export function AutenticacaoTelefoneScreen() {
  const { refreshUser } = useAuth();

  const [codigo, setCodigo] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    async function enviarCodigoInicial() {
      try {
        setEnviando(true);
        await enviarCodigoTelefone();
      } catch (error) {
        Alert.alert(
          "Não foi possível enviar o código",
          error instanceof Error
            ? error.message
            : "Tente novamente em instantes.",
        );
      } finally {
        setEnviando(false);
      }
    }

    void enviarCodigoInicial();
  }, []);

  async function reenviarCodigo() {
    if (enviando || verificando) return;

    try {
      setEnviando(true);
      await enviarCodigoTelefone();

      Alert.alert(
        "Código enviado",
        "Confira as mensagens SMS do telefone cadastrado.",
      );
    } catch (error) {
      Alert.alert(
        "Erro ao enviar",
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o código.",
      );
    } finally {
      setEnviando(false);
    }
  }

  async function verificarCodigo() {
    if (verificando || enviando) return;

    const codigoLimpo = codigo.trim();

    if (!/^\d{6,8}$/.test(codigoLimpo)) {
      Alert.alert(
        "Código inválido",
        "Digite o código de verificação com 6 a 8 números.",
      );
      return;
    }

    try {
      setVerificando(true);

      await verificarCodigoTelefone(codigoLimpo);

      // Atualiza os dados do usuário com as informações do backend.
      await refreshUser();

      Keyboard.dismiss();

      Alert.alert(
        "Telefone verificado",
        "Seu telefone foi confirmado com sucesso.",
        [
          {
            text: "Continuar",
            onPress: () => router.replace("/home"),
          },
        ],
        { cancelable: false },
      );
    } catch (error) {
      Alert.alert(
        "Não foi possível verificar",
        error instanceof Error
          ? error.message
          : "Confira o código e tente novamente.",
      );
    } finally {
      setVerificando(false);
    }
  }

  const ocupado = verificando || enviando;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <StatusBar style="dark" />

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          disabled={ocupado}
        >
          <Lucide name="arrow-left" size={24} color="#17211D" />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Lucide name="shield-check" size={36} color="#18875A" />
          </View>

          <Text style={styles.title}>Autentique seu{"\n"}telefone.</Text>

          <Text style={styles.subtitle}>
            Digite o código enviado por SMS para confirmar seu telefone.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Código de verificação</Text>

            <TextInput
              style={styles.codeInput}
              value={codigo}
              onChangeText={(value) =>
                setCodigo(value.replace(/\D/g, "").slice(0, 8))
              }
              placeholder="Digite o código"
              placeholderTextColor="#707D76"
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={8}
              editable={!ocupado}
              returnKeyType="done"
              onSubmitEditing={verificarCodigo}
              accessibilityLabel="Código de verificação"
            />

            <Text style={styles.helperText}>Informe de 6 a 8 números.</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (ocupado || (codigo.length > 0 && !/^\d{6,8}$/.test(codigo))) &&
                styles.disabledButton,
            ]}
            onPress={verificarCodigo}
            disabled={ocupado}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Verificar código"
          >
            {verificando ? (
              <ActivityIndicator color="#17211D" />
            ) : (
              <Text style={styles.primaryButtonText}>Verificar telefone</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={reenviarCodigo}
            disabled={ocupado}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Reenviar código SMS"
            style={{ marginTop: 18, alignItems: "center" }}
          >
            {enviando ? (
              <ActivityIndicator color="#18875A" />
            ) : (
              <Text style={styles.helperText}>
                Não recebeu? Reenviar código
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.securityContainer}>
            <Lucide name="lock-keyhole" size={26} color="#18875A" />

            <View style={styles.securityTextContainer}>
              <Text style={styles.securityTitle}>Ambiente protegido</Text>

              <Text style={styles.securitySubtitle}>
                A validade do código é confirmada pelo backend.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
