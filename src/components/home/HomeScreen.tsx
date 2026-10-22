import { useEffect, useRef, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";

import { useAuth } from "../../contexts/AuthContext";
import { HomeMap, type HomeMapHandle } from "./HomeMap";
import { styles } from "./HomeScreenStyles";
import { SideMenu } from "../../components/navigation/SideMenu";

const ICON_SIZE = 23;
const ICON_COLOR = "#475569";
const ACTIVE_ICON_COLOR = "#17211D";
const LIME_COLOR = "#C7F43D";

export function HomeScreen() {
  const homeMapRef = useRef<HomeMapHandle>(null);
  const previousProfileRef = useRef<"passenger" | "driver" | null>(null);

  const [menuVisible, setMenuVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [hasSimulatedRequest, setHasSimulatedRequest] = useState(false);

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

  // Limpa a rota quando o perfil muda para Prestador.
  // Não navega novamente para /home, evitando atualizações repetidas.
  useEffect(() => {
    const currentProfile = isDriver ? "driver" : "passenger";
    const previousProfile = previousProfileRef.current;

    previousProfileRef.current = currentProfile;

    if (currentProfile !== "driver" || previousProfile === "driver") {
      return;
    }

    homeMapRef.current?.clearRoute();
  }, [isDriver]);

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
      case "Serviços":
      case "Ganhos":
        Alert.alert(
          "Em desenvolvimento",
          "Esta funcionalidade será implementada em uma próxima etapa.",
        );
        break;
    }
  }

  function handleSimulateRequest() {
    if (!isOnline) {
      Alert.alert(
        "Você está offline",
        "Fique online para simular uma nova solicitação.",
      );
      return;
    }

    setHasSimulatedRequest(true);

    Alert.alert(
      "Solicitação simulada",
      "A simulação foi registrada nesta tela. Nenhuma corrida real foi criada.",
    );
  }

  const navigationItems = isDriver
    ? [
        { label: "Início", icon: "house" as const },
        { label: "Serviços", icon: "history" as const },
        { label: "Ganhos", icon: "wallet" as const },
      ]
    : [
        { label: "Início", icon: "house" as const },
        { label: "Atividade", icon: "history" as const },
        { label: "Carteira", icon: "wallet" as const },
      ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View
        style={[styles.mapContainer, isDriver && styles.driverMapContainer]}
      >
        {/* O mapa recebe o perfil e o status online do prestador. */}
        <HomeMap ref={homeMapRef} isDriver={isDriver} isOnline={isOnline} />

        <TouchableOpacity
          style={styles.menuButton}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
          activeOpacity={0.7}
          onPress={() => setMenuVisible(true)}
        >
          <Lucide name="menu" size={ICON_SIZE} color={ICON_COLOR} />
        </TouchableOpacity>

        {isDriver ? (
          <>
            <View style={styles.driverStatusBadge}>
              <View
                style={[
                  styles.driverStatusDot,
                  !isOnline && styles.driverStatusDotOffline,
                ]}
              />
              <View style={styles.driverStatusTextContainer}>
                <Text style={styles.driverStatusTitle}>
                  {isOnline ? "AGUARDANDO" : "VOCÊ ESTÁ OFFLINE"}
                </Text>
                <Text style={styles.driverStatusSubtitle}>
                  {isOnline
                    ? "Buscando solicitações próximas"
                    : "Ative para receber solicitações"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.notificationButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Notificações"
              onPress={() =>
                Alert.alert(
                  "Notificações",
                  "As notificações serão implementadas posteriormente.",
                )
              }
            >
              <Lucide name="bell" size={ICON_SIZE} color={ICON_COLOR} />
            </TouchableOpacity>

            <Text style={styles.driverMapLocation}>CENTRO</Text>
          </>
        ) : (
          <>
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
          </>
        )}
      </View>

      <View style={[styles.bottomSheet, isDriver && styles.driverBottomSheet]}>
        <View style={styles.handle} />

        {isDriver ? (
          <>
            <View style={styles.driverGreetingRow}>
              <View style={styles.driverGreetingContainer}>
                <Text style={styles.driverGreeting}>
                  BOM DIA, {user?.name?.trim().toUpperCase() || "PRESTADOR"}
                </Text>

                <Text style={styles.driverTitle}>Pronto para rodar?</Text>
              </View>

              <TouchableOpacity
                style={[styles.onlineButton, !isOnline && styles.offlineButton]}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={isOnline ? "Ficar offline" : "Ficar online"}
                accessibilityState={{ selected: isOnline }}
                onPress={() => setIsOnline((current) => !current)}
              >
                <Lucide
                  name={isOnline ? "power" : "power-off"}
                  size={30}
                  color={isOnline ? "#17211D" : "#FFFFFF"}
                />

                <Text
                  style={[
                    styles.onlineButtonText,
                    !isOnline && styles.offlineButtonText,
                  ]}
                >
                  {isOnline ? "Online" : "Offline"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.requestStatusCard}
              activeOpacity={0.8}
              onPress={() => handleNavigation("Serviços")}
              accessibilityRole="button"
              accessibilityLabel="Ver serviços"
            >
              <View
                style={[
                  styles.requestStatusDot,
                  hasSimulatedRequest && styles.requestStatusDotSimulated,
                ]}
              />

              <View style={styles.requestStatusContent}>
                <Text style={styles.requestStatusTitle}>
                  {hasSimulatedRequest
                    ? "Simulação realizada"
                    : isOnline
                      ? "Aguardando solicitação"
                      : "Você está offline"}
                </Text>

                <Text style={styles.requestStatusSubtitle}>
                  {hasSimulatedRequest
                    ? "Teste local · Nenhuma corrida real"
                    : isOnline
                      ? "ViaU Car e Entrega · Centro"
                      : "Ative seu status para ficar disponível"}
                </Text>
              </View>

              <Lucide name="arrow-right" size={25} color={ACTIVE_ICON_COLOR} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.earningsCard}
              activeOpacity={0.8}
              onPress={() => handleNavigation("Ganhos")}
              accessibilityRole="button"
              accessibilityLabel="Consultar ganhos"
            >
              <View style={styles.earningsMain}>
                <Text style={styles.earningsLabel}>GANHOS DE HOJE</Text>
                <Text style={styles.earningsValue}>R$ 146,80</Text>
              </View>

              <View style={styles.earningsDivider} />

              <View style={styles.servicesSummary}>
                <Text style={styles.earningsLabel}>SERVIÇOS</Text>
                <Text style={styles.earningsValue}>
                  {hasSimulatedRequest ? "9" : "8"}
                </Text>
              </View>

              <Lucide name="chevron-right" size={23} color={LIME_COLOR} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.simulateButton}
              activeOpacity={0.7}
              onPress={handleSimulateRequest}
              accessibilityRole="button"
              accessibilityLabel="Simular nova solicitação"
            >
              <Text style={styles.simulateButtonText}>
                Simular nova solicitação
              </Text>
              <Lucide name="arrow-right" size={21} color="#18875A" />
            </TouchableOpacity>
          </>
        ) : (
          <>
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
          </>
        )}
      </View>

      <View style={styles.bottomNavigation}>
        {navigationItems.map((item) => {
          const isActive = item.label === "Início";

          return (
            <TouchableOpacity
              key={item.label}
              style={styles.navItem}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isActive }}
              onPress={() => handleNavigation(item.label)}
            >
              <Lucide
                name={item.icon}
                size={ICON_SIZE}
                color={isActive ? ACTIVE_ICON_COLOR : ICON_COLOR}
              />

              <Text style={isActive ? styles.navTextActive : styles.navText}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}
