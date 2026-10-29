import { cancelPassengerSearch, getActivePassengerRide } from "../../services/corrida/passageiro.service";
import { assertSessionVersion, getSessionVersion } from "../../services/auth/session";
import { useRef, type ComponentProps } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";

import { useAuth, type ActiveProfile } from "../../contexts/AuthContext";
import { drawerStyles } from "./SideMenu.styles";

type IconName = ComponentProps<typeof Lucide>["name"];

type MenuItem = {
  label: string;
  icon: IconName;
  route?: "/home" | "/destination";
};

type SideMenuProps = {
  visible: boolean;
  onClose: () => void;
};

const ICON_SIZE = 23;
const ICON_COLOR = "#475569";
const DISABLED_COLOR = "#CBD5E1";

const MENU_ITEMS: MenuItem[] = [
  { label: "Início", icon: "house", route: "/home" },
  { label: "Histórico de viagens", icon: "history" },
  { label: "Lugares favoritos", icon: "heart" },
  { label: "Configurações", icon: "settings" },
  { label: "Ajuda e suporte", icon: "circle-help" },
];

export function SideMenu({ visible, onClose }: SideMenuProps) {
  const {
    activeProfile,
    setActiveProfile,
    canUseProviderProfile,
    user,
    signOut,
  } = useAuth();

  const userName = user?.name ?? "Meu perfil";
  const userEmail = user?.email ?? "Entre na sua conta";
  const profilePhoto: string | null = null;

  function handleMenuItem(item: MenuItem) {
    onClose();

    if (item.route) {
      router.push(item.route);
    }
  }

  function toggleProfile() {
    const nextProfile: ActiveProfile =
      activeProfile === "passenger" ? "driver" : "passenger";

    if (nextProfile === "driver" && !canUseProviderProfile) {
      return;
    }

    setActiveProfile(nextProfile);
    onClose();
  }

  const logoutBusy = useRef(false);

  async function finishSignOut() {
    onClose();

    try {
      await signOut();
    } catch {
      Alert.alert("Logout não confirmado", "Não foi possível confirmar a saída na API. Sua disponibilidade pode continuar Online. Verifique a conexão e tente novamente.", [
        { text: "Fechar", style: "cancel" },
        { text: "Tentar novamente", onPress: () => void handleSignOut() },
      ]);
    }
  }

  async function handleSignOut() {
    if (logoutBusy.current) return;
    logoutBusy.current = true;
    const version = getSessionVersion();
    try {
      const active = await getActivePassengerRide();
      assertSessionVersion(version);
      if (active?.status !== "SOLICITADA") {
        await finishSignOut(); logoutBusy.current = false; return;
      }
      let choiceTaken = false;
      const leave = async (cancel: boolean) => {
        if (choiceTaken) return;
        choiceTaken = true;
        try {
          assertSessionVersion(version);
          if (cancel) {
            const result = await cancelPassengerSearch(active.id);
            assertSessionVersion(version);
            if (!result.cancelled || result.active) {
              Alert.alert("Corrida atualizada", "O status mudou ou ainda existe corrida ativa. Confira a Home antes de sair.");
              return;
            }
          }
          await finishSignOut();
        } catch {
          Alert.alert("Saída interrompida", "Não foi possível confirmar o cancelamento. Confira a corrida na Home e tente novamente.");
        } finally { logoutBusy.current = false; }
      };
      Alert.alert("Busca em andamento", "Deseja cancelar a busca antes de sair? Sair sem cancelar mantém a corrida ativa.", [
        { text: "Continuar no app", style: "cancel", onPress: () => { logoutBusy.current = false; } },
        { text: "Sair sem cancelar", onPress: () => void leave(false) },
        { text: "Cancelar busca e sair", style: "destructive", onPress: () => void leave(true) },
      ], { cancelable: false });
    } catch {
      logoutBusy.current = false;
      Alert.alert("Não foi possível consultar a corrida", "Confira a conexão e tente sair novamente. Nenhuma corrida foi cancelada.");
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={drawerStyles.overlay}>
        <TouchableOpacity
          style={drawerStyles.backdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar menu"
        />

        <View style={drawerStyles.drawer}>
          <View style={drawerStyles.drawerHeader}>
            <TouchableOpacity
              style={drawerStyles.drawerCloseButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar menu"
            >
              <Lucide name="x" size={ICON_SIZE} color={ICON_COLOR} />
            </TouchableOpacity>

            <TouchableOpacity
              style={drawerStyles.profileHeader}
              activeOpacity={0.75}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Ver perfil"
            >
              {profilePhoto ? (
                <Image
                  source={{ uri: profilePhoto }}
                  style={drawerStyles.profileAvatar}
                />
              ) : (
                <View style={drawerStyles.profileAvatarFallback}>
                  <Lucide name="user-round" size={28} color={ICON_COLOR} />
                </View>
              )}

              <View style={drawerStyles.profileTextContainer}>
                <Text style={drawerStyles.profileName}>{userName}</Text>
                <Text style={drawerStyles.profileEmail}>{userEmail}</Text>
                <Text style={drawerStyles.profileLink}>Ver perfil ›</Text>
              </View>

              <Lucide name="chevron-right" size={20} color={ICON_COLOR} />
            </TouchableOpacity>

            <View style={drawerStyles.profileRoleBadge}>
              <Text style={drawerStyles.profileRoleText}>
                {activeProfile === "passenger" ? "Cliente" : "Prestador"}
              </Text>
            </View>
          </View>

          <View style={drawerStyles.profileSwitchSection}>
            <Text style={drawerStyles.drawerSectionLabel}>MODO DE USO</Text>

            <TouchableOpacity
              style={[
                drawerStyles.profileSwitchOption,
                !canUseProviderProfile && { opacity: 0.45 },
              ]}
              activeOpacity={canUseProviderProfile ? 0.7 : 1}
              disabled={!canUseProviderProfile}
              onPress={toggleProfile}
              accessibilityRole="button"
              accessibilityLabel={
                canUseProviderProfile
                  ? activeProfile === "passenger"
                    ? "Trocar para prestador"
                    : "Trocar para cliente"
                  : "Troca para prestador indisponível: cadastro não aprovado"
              }
              accessibilityState={{ disabled: !canUseProviderProfile }}
            >
              <Lucide
                name={
                  activeProfile === "passenger" ? "car-front" : "user-round"
                }
                size={20}
                color={canUseProviderProfile ? ICON_COLOR : DISABLED_COLOR}
              />

              <Text
                style={[
                  drawerStyles.profileSwitchText,
                  !canUseProviderProfile && { color: DISABLED_COLOR },
                ]}
              >
                {activeProfile === "passenger"
                  ? canUseProviderProfile
                    ? "Trocar para prestador"
                    : "Prestador não disponível"
                  : "Trocar para cliente"}
              </Text>

              <Lucide
                name="arrow-left-right"
                size={18}
                color={canUseProviderProfile ? ICON_COLOR : DISABLED_COLOR}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={drawerStyles.drawerMenuScroll}
            contentContainerStyle={drawerStyles.drawerMenuContent}
            showsVerticalScrollIndicator={false}
          >
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={drawerStyles.drawerMenuItem}
                activeOpacity={0.7}
                onPress={() => handleMenuItem(item)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <Lucide name={item.icon} size={ICON_SIZE} color={ICON_COLOR} />
                <Text style={drawerStyles.drawerMenuText}>{item.label}</Text>
                <Lucide name="chevron-right" size={18} color={ICON_COLOR} />
              </TouchableOpacity>
            ))}

            <View style={drawerStyles.drawerDivider} />

            <TouchableOpacity
              style={drawerStyles.drawerMenuItem}
              activeOpacity={0.7}
              onPress={handleSignOut}
              accessibilityRole="button"
              accessibilityLabel="Sair da conta"
            >
              <Lucide name="log-out" size={ICON_SIZE} color="#DC2626" />
              <Text style={drawerStyles.drawerLogoutText}>Sair da conta</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={drawerStyles.drawerFooter}>
            <Text style={drawerStyles.drawerBrand}>ViaU</Text>
            <Text style={drawerStyles.drawerVersion}>Mobilidade para você</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
