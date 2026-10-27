import { useEffect, useRef, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";

import { useAuth } from "../../contexts/AuthContext";
import { HomeMap, type HomeMapHandle } from "./HomeMap";
import { styles } from "./HomeScreenStyles";
import { HomeBottomNavigation } from "./HomeBottomNavigation";
import { DriverHome } from "./DriverHome";
import { SideMenu } from "../../components/navigation/SideMenu";

const ICON_SIZE = 23;
const ICON_COLOR = "#475569";

export function HomeScreen() {
  const homeMapRef = useRef<HomeMapHandle>(null);

  const [menuVisible, setMenuVisible] = useState(false);

  const { activeProfile, user } = useAuth();
  const isDriver = activeProfile === "driver";

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
    if (isDriver || !hasOrigin) return;

    homeMapRef.current?.showOrigin({
      name: originName!,
      latitude: originLatitude,
      longitude: originLongitude,
    });
  }, [isDriver, hasOrigin, originName, originLatitude, originLongitude]);

  useEffect(() => {
    if (isDriver || !hasDestination) return;

    homeMapRef.current?.showDestination({
      name: destinationName!,
      address: destinationAddress!,
      latitude,
      longitude,
    });
  }, [
    isDriver,
    hasDestination,
    destinationName,
    destinationAddress,
    latitude,
    longitude,
  ]);

  function handleNavigation(label: string) {
    switch (label) {
      case "Início":
        // Já estamos na tela inicial; não empilha outra rota.
        break;

      case "Atividade":
      case "Carteira":
        Alert.alert(
          "Em desenvolvimento",
          "Esta funcionalidade será implementada em uma próxima etapa.",
        );
        break;
    }
  }

  const navigationItems = [
    { label: "Início", icon: "house" as const },
    { label: "Atividade", icon: "history" as const },
    { label: "Carteira", icon: "wallet" as const },
  ];

  if (isDriver) {
    return (
      <View style={styles.container}>
        <DriverHome
          key={`${user?.id}-${user?.prestador}-${user?.statusAprovacao}-${user?.telefoneVerificado}`}
          onOpenMenu={() => setMenuVisible(true)}
        />
        <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
      </View>
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
            onPress={() =>
              Alert.alert("Casa", "O endereço favorito será implementado.")
            }
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
            onPress={() =>
              Alert.alert(
                "Trabalho",
                "O endereço favorito será implementado.",
              )
            }
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

      <HomeBottomNavigation items={navigationItems} activeLabel="Início" onSelect={handleNavigation} />

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}
