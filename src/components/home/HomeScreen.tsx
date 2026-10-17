import { useEffect, useRef, useState, type ComponentProps } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";

import { HomeMap, type HomeMapHandle } from "./HomeMap";
import { styles } from "./HomeScreenStyles";

type IconName = ComponentProps<typeof Lucide>["name"];
type ProfileType = "passenger" | "driver";

type MenuItem = {
  label: string;
  icon: IconName;
  route?: "/home" | "/destination";
};

const ICON_SIZE = 23;
const ICON_COLOR = "#475569";
const ACTIVE_ICON_COLOR = "#2563EB";

const MENU_ITEMS: MenuItem[] = [
  { label: "Início", icon: "house", route: "/home" },
  { label: "Histórico de viagens", icon: "history" },
  { label: "Lugares favoritos", icon: "heart" },
  { label: "Configurações", icon: "settings" },
  { label: "Ajuda e suporte", icon: "circle-help" },
];

export function HomeScreen() {
  const homeMapRef = useRef<HomeMapHandle>(null);

  const [menuVisible, setMenuVisible] = useState(false);
  const [activeProfile, setActiveProfile] = useState<ProfileType>("passenger");

  const userName = "Meu perfil";
  const userEmail = "Gerencie sua conta";
  const profilePhoto: string | null = null;
  const driverEnabled = true;

  const params = useLocalSearchParams<{
    originName?: string;
    originLatitude?: string;
    originLongitude?: string;
    destinationName?: string;
    destinationAddress?: string;
    destinationLatitude?: string;
    destinationLongitude?: string;
  }>();

  const originName = params.originName;
  const originLatitude = Number(params.originLatitude);
  const originLongitude = Number(params.originLongitude);

  const hasOrigin =
    typeof originName === "string" &&
    originName.trim().length > 0 &&
    params.originLatitude !== undefined &&
    params.originLongitude !== undefined &&
    Number.isFinite(originLatitude) &&
    Number.isFinite(originLongitude) &&
    originLatitude >= -90 &&
    originLatitude <= 90 &&
    originLongitude >= -180 &&
    originLongitude <= 180;

  const destinationName = params.destinationName;
  const destinationAddress = params.destinationAddress;
  const latitude = Number(params.destinationLatitude);
  const longitude = Number(params.destinationLongitude);

  const hasDestination =
    typeof destinationName === "string" &&
    typeof destinationAddress === "string" &&
    params.destinationLatitude !== undefined &&
    params.destinationLongitude !== undefined &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  useEffect(() => {
    if (!hasOrigin) return;

    homeMapRef.current?.showOrigin({
      name: originName!,
      latitude: originLatitude,
      longitude: originLongitude,
    });
  }, [hasOrigin, originName, originLatitude, originLongitude]);

  useEffect(() => {
    if (!hasDestination) return;

    homeMapRef.current?.showDestination({
      name: destinationName!,
      address: destinationAddress!,
      latitude,
      longitude,
    });
  }, [
    hasDestination,
    destinationName,
    destinationAddress,
    latitude,
    longitude,
  ]);

  function closeMenu() {
    setMenuVisible(false);
  }

  function handleMenuItem(item: MenuItem) {
    closeMenu();

    if (item.route) {
      router.push(item.route);
    }
  }

  function toggleProfile() {
    setActiveProfile((current) =>
      current === "passenger" ? "driver" : "passenger",
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.mapContainer}>
        <HomeMap ref={homeMapRef} />

        <TouchableOpacity
          style={styles.menuButton}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
          activeOpacity={0.7}
          onPress={() => setMenuVisible(true)}
        >
          <Lucide name="menu" size={ICON_SIZE} color={ICON_COLOR} />
        </TouchableOpacity>

        <View style={styles.locationBadge}>
          <View style={styles.locationDot} />
          <Text style={styles.locationText}>
            {hasDestination ? "Destino selecionado" : "Você está aqui"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.mapButton}
          accessibilityRole="button"
          accessibilityLabel="Centralizar mapa"
          activeOpacity={0.7}
          onPress={() => homeMapRef.current?.centerOnUserLocation()}
        >
          <Lucide name="locate" size={ICON_SIZE} color={ICON_COLOR} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.handle} />

        <Text style={styles.greeting}>Olá, tudo bem?</Text>

        <Text style={styles.title}>
          {hasDestination ? "Seu destino" : "Para onde vamos?"}
        </Text>

        <TouchableOpacity
          style={styles.destinationInput}
          accessibilityRole="button"
          accessibilityLabel="Digite seu destino"
          activeOpacity={0.7}
          onPress={() => router.push("/destination")}
        >
          <Lucide name="search" size={ICON_SIZE} color={ICON_COLOR} />

          <View style={styles.destinationTextContainer}>
            <Text style={styles.destinationPlaceholder}>
              {hasDestination ? destinationName : "Digite seu destino"}
            </Text>

            {hasDestination && (
              <Text style={styles.selectedAddress} numberOfLines={2}>
                {destinationAddress}
              </Text>
            )}
          </View>

          <Lucide name="arrow-right" size={20} color={ICON_COLOR} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Seus lugares</Text>

        <View style={styles.placesRow}>
          <TouchableOpacity
            style={styles.placeItem}
            activeOpacity={0.7}
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel="Selecionar endereço de casa"
          >
            <View style={styles.placeIcon}>
              <Lucide name="house" size={ICON_SIZE} color={ICON_COLOR} />
            </View>
            <Text style={styles.placeName}>Casa</Text>
            <Text style={styles.placeAddress}>Adicionar endereço</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.placeItem}
            activeOpacity={0.7}
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel="Selecionar endereço de trabalho"
          >
            <View style={styles.placeIcon}>
              <Lucide
                name="briefcase-business"
                size={ICON_SIZE}
                color={ICON_COLOR}
              />
            </View>
            <Text style={styles.placeName}>Trabalho</Text>
            <Text style={styles.placeAddress}>Adicionar endereço</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={styles.navItem}
          accessibilityRole="button"
          accessibilityLabel="Início"
          onPress={() => router.push("/home")}
        >
          <Lucide name="house" size={ICON_SIZE} color={ACTIVE_ICON_COLOR} />
          <Text style={styles.navTextActive}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          accessibilityRole="button"
          accessibilityLabel="Atividade"
          onPress={() => {}}
        >
          <Lucide name="history" size={ICON_SIZE} color={ICON_COLOR} />
          <Text style={styles.navText}>Atividade</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          accessibilityRole="button"
          accessibilityLabel="Carteira"
          onPress={() => {}}
        >
          <Lucide name="wallet" size={ICON_SIZE} color={ICON_COLOR} />
          <Text style={styles.navText}>Carteira</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
        statusBarTranslucent
        presentationStyle="overFullScreen"
      >
        <View style={drawerStyles.overlay}>
          <TouchableOpacity
            style={drawerStyles.backdrop}
            activeOpacity={1}
            onPress={closeMenu}
            accessibilityRole="button"
            accessibilityLabel="Fechar menu"
          />

          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <TouchableOpacity
                style={styles.drawerCloseButton}
                onPress={closeMenu}
                accessibilityRole="button"
                accessibilityLabel="Fechar menu"
              >
                <Lucide name="x" size={ICON_SIZE} color={ICON_COLOR} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profileHeader}
                activeOpacity={0.75}
                onPress={closeMenu}
                accessibilityRole="button"
                accessibilityLabel="Ver perfil"
              >
                {profilePhoto ? (
                  <Image
                    source={{ uri: profilePhoto }}
                    style={styles.profileAvatar}
                  />
                ) : (
                  <View style={styles.profileAvatarFallback}>
                    <Lucide name="user-round" size={28} color={ICON_COLOR} />
                  </View>
                )}

                <View style={styles.profileTextContainer}>
                  <Text style={styles.profileName}>{userName}</Text>
                  <Text style={styles.profileEmail}>{userEmail}</Text>
                  <Text style={styles.profileLink}>Ver perfil ›</Text>
                </View>

                <Lucide name="chevron-right" size={20} color={ICON_COLOR} />
              </TouchableOpacity>

              <View style={styles.profileRoleBadge}>
                <Text style={styles.profileRoleText}>
                  {activeProfile === "passenger" ? "Cliente" : "Prestador"}
                </Text>
              </View>
            </View>

            {driverEnabled && (
              <View style={styles.profileSwitchSection}>
                <Text style={styles.drawerSectionLabel}>MODO DE USO</Text>

                <TouchableOpacity
                  style={styles.profileSwitchOption}
                  activeOpacity={0.7}
                  onPress={toggleProfile}
                  accessibilityRole="button"
                  accessibilityLabel={
                    activeProfile === "passenger"
                      ? "Trocar para prestador"
                      : "Trocar para cliente"
                  }
                >
                  <Lucide
                    name={
                      activeProfile === "passenger" ? "car-front" : "user-round"
                    }
                    size={20}
                    color={ICON_COLOR}
                  />

                  <Text style={styles.profileSwitchText}>
                    {activeProfile === "passenger"
                      ? "Trocar para prestador"
                      : "Trocar para cliente"}
                  </Text>

                  <Lucide
                    name="arrow-left-right"
                    size={18}
                    color={ICON_COLOR}
                  />
                </TouchableOpacity>
              </View>
            )}

            <ScrollView
              style={styles.drawerMenuScroll}
              contentContainerStyle={styles.drawerMenuContent}
              showsVerticalScrollIndicator={false}
            >
              {MENU_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.drawerMenuItem}
                  activeOpacity={0.7}
                  onPress={() => handleMenuItem(item)}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <Lucide
                    name={item.icon}
                    size={ICON_SIZE}
                    color={ICON_COLOR}
                  />

                  <Text style={styles.drawerMenuText}>{item.label}</Text>

                  <Lucide name="chevron-right" size={18} color={ICON_COLOR} />
                </TouchableOpacity>
              ))}

              <View style={styles.drawerDivider} />

              <TouchableOpacity
                style={styles.drawerMenuItem}
                activeOpacity={0.7}
                onPress={closeMenu}
                accessibilityRole="button"
                accessibilityLabel="Sair da conta"
              >
                <Lucide name="log-out" size={ICON_SIZE} color="#DC2626" />
                <Text style={styles.drawerLogoutText}>Sair da conta</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.drawerFooter}>
              <Text style={styles.drawerBrand}>ViaU</Text>
              <Text style={styles.drawerVersion}>Mobilidade para você</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const drawerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
});
