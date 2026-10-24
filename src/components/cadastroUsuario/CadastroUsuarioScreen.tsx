import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
const API_URL = process.env.EXPO_PUBLIC_API_URL;

type DocumentoLegal = {
  id: string;
  versao: string;
  conteudo: string;
  ativo: boolean;
  createdAt: string;
  updatedAt?: string;
};

type DocumentosLegais = {
  termosUso: DocumentoLegal;
  politicaPrivacidade: DocumentoLegal;
};

export function CadastroScreen() {
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [modalTermosVisivel, setModalTermosVisivel] = useState(false);
  const [carregandoDocumentos, setCarregandoDocumentos] = useState(false);
  const [documentos, setDocumentos] = useState<DocumentosLegais | null>(null);
  const [erroDocumentos, setErroDocumentos] = useState("");

  async function abrirDocumentos() {
    setModalTermosVisivel(true);

    if (documentos || carregandoDocumentos) {
      return;
    }

    setCarregandoDocumentos(true);
    setErroDocumentos("");

    try {
      if (!API_URL) {
        throw new Error("A URL do backend não foi configurada.");
      }

      const resposta = await fetch(
        `${API_URL}/api/termos-uso-politica-privacidade`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!resposta.ok) {
        throw new Error("Não foi possível consultar os documentos.");
      }

      const dados: DocumentosLegais = await resposta.json();

      if (!dados.termosUso?.conteudo || !dados.politicaPrivacidade?.conteudo) {
        throw new Error("A API não retornou os dois documentos esperados.");
      }

      setDocumentos(dados);
    } catch (error) {
      setErroDocumentos(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os documentos. Tente novamente.",
      );
    } finally {
      setCarregandoDocumentos(false);
    }
  }

  async function handleCadastro() {
    if (carregando) return;

    if (!aceitouTermos) {
      Alert.alert(
        "Aceite necessário",
        "Leia os Termos de Uso e a Política de Privacidade e aceite os documentos para continuar.",
      );
      return;
    }

    Keyboard.dismiss();

    const digitosTelefone = celular.replace(/\D/g, "");

    const telefoneInternacional =
      digitosTelefone.length >= 12 &&
      digitosTelefone.length <= 13 &&
      digitosTelefone.startsWith("55")
        ? `+${digitosTelefone}`
        : `+55${digitosTelefone}`;

    try {
      setCarregando(true);

      await cadastrarUsuario({
        nome,
        cpf,
        email,
        telefone: telefoneInternacional,
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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
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
          contentContainerStyle={[
            styles.scrollContent,
            { flexGrow: 1, paddingBottom: 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
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
                      name={mostrarSenha ? "eye" : "eye-off"}
                      size={20}
                      color={ICON_COLOR}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.termsContainer}
                onPress={abrirDocumentos}
                disabled={carregando}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Ler termos de uso e política de privacidade"
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

        <Modal
          visible={modalTermosVisivel}
          transparent
          animationType="fade"
          onRequestClose={() => setModalTermosVisivel(false)}
          statusBarTranslucent
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Termos e Privacidade</Text>

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setModalTermosVisivel(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar documentos"
                >
                  <Lucide name="x" size={22} color="#17211D" />
                </TouchableOpacity>
              </View>

              {carregandoDocumentos ? (
                <View style={{ padding: 32, alignItems: "center", gap: 12 }}>
                  <ActivityIndicator size="large" color="#17211D" />
                  <Text style={styles.modalParagraph}>
                    Carregando documentos...
                  </Text>
                </View>
              ) : erroDocumentos ? (
                <View style={{ padding: 22 }}>
                  <Text style={styles.modalParagraph}>{erroDocumentos}</Text>

                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setDocumentos(null);
                      void abrirDocumentos();
                    }}
                  >
                    <Text style={styles.modalButtonText}>Tentar novamente</Text>
                  </TouchableOpacity>
                </View>
              ) : documentos ? (
                <ScrollView
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator
                >
                  <Text style={styles.modalSectionTitle}>
                    1. Termos de Uso — versão {documentos.termosUso.versao}
                  </Text>
                  <Text style={styles.modalParagraph}>
                    {documentos.termosUso.conteudo}
                  </Text>

                  <Text style={styles.modalSectionTitle}>
                    2. Política de Privacidade — versão{" "}
                    {documentos.politicaPrivacidade.versao}
                  </Text>
                  <Text style={styles.modalParagraph}>
                    {documentos.politicaPrivacidade.conteudo}
                  </Text>
                </ScrollView>
              ) : null}

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalButton}
                  disabled={!documentos || carregandoDocumentos}
                  onPress={() => {
                    setAceitouTermos(true);
                    setModalTermosVisivel(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>
                    Aceitar e continuar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalCancelButton, { marginTop: 10 }]}
                  onPress={() => setModalTermosVisivel(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
