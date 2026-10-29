import { VehicleCategory } from "./VehicleCategory";
import { offerDiagnostic } from "../../services/offerDiagnostics";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Modal, ScrollView, Text, TouchableOpacity,
  useWindowDimensions, View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";

import { useAuth } from "../../contexts/AuthContext";
import { colors, iconSizes, spacing } from "../../theme";
import { HomeMap, type HomeMapHandle } from "./HomeMap";
import { DriverNavigation } from "./DriverNavigation";
import { driverStyles as styles } from "./DriverHomeStyles";
import { DriverOfferCard } from "./DriverOfferCard";
import { useDriverOffers } from "./useDriverOffers";
import { useDriverAvailability } from "./useDriverAvailability";

export function DriverHome({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user } = useAuth();
  const availability = useDriverAvailability(user);
  const mapRef = useRef<HomeMapHandle>(null);
  const insets = useSafeAreaInsets();
  const { height, width, fontScale } = useWindowDimensions();
  const compact = width < 360 || fontScale > 1.3;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const name = user?.name.trim().split(/\s+/)[0] || "prestador";
  const { isOnline, checking, known } = availability;

  const offers = useDriverOffers(
    isOnline && known && user?.statusAprovacao === "APROVADO" ? availability.selectedVehicle?.id : undefined,
    user?.id, checking,
  );

  useEffect(() => {
    offerDiagnostic({ stage: "state", online: isOnline, known,
      approved: user?.statusAprovacao === "APROVADO", vehicleSelected: Boolean(availability.selectedVehicle?.id),
      occupied: Boolean(offers.activeId), visible: isOnline && Boolean(offers.offer), verified: offers.verified });
  }, [isOnline, known, user?.statusAprovacao, availability.selectedVehicle?.id, offers.activeId, offers.offer, offers.verified]);

  const [expandedRideId, setExpandedRideId] = useState<string | null>(null);
  const [panelHeight, setPanelHeight] = useState(150);
  const navigating = Boolean(offers.activeRide);
  const expanded = Boolean(offers.activeId && expandedRideId === offers.activeId);

  function openSection(route: "/driver-services" | "/driver-earnings") {
    router.navigate(route);
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={[styles.mapArea, { minHeight: insets.top + 160 }]}>
        <View style={[styles.mapCanvas, { minHeight: insets.top + 100 }]}>
        <HomeMap ref={mapRef} isDriver isOnline={isOnline} contentInsetTop={insets.top + 64} contentInsetBottom={navigating ? panelHeight : height * 0.28} activeRide={offers.activeRide} />
        <View style={[styles.topBar, { top: insets.top + spacing.xl }]} pointerEvents="box-none">
          <TouchableOpacity style={styles.roundButton} onPress={onOpenMenu} accessibilityRole="button" accessibilityLabel="Abrir menu">
            <Lucide name="menu" size={iconSizes.menu} color={colors.neutral.carbon} />
          </TouchableOpacity>
          <View style={styles.statusBadge} accessibilityLiveRegion="polite">
            <View style={[styles.statusDot, isOnline && styles.onlineDot]} />
            <View style={styles.statusCopy}>
              <Text style={styles.statusTitle}>{checking ? "CONSULTANDO" : !known ? "INDISPONÍVEL" : isOnline ? "ONLINE" : "OFFLINE"}</Text>
              {!compact && <Text style={styles.statusSubtitle}>{!known ? "Consulte seu status" : isOnline ? "Disponibilidade salva" : "Você está offline"}</Text>}
            </View>
          </View>
          <TouchableOpacity
            style={styles.roundButton} accessibilityRole="button" accessibilityLabel="Notificações"
            onPress={() => Alert.alert("Notificações", "As notificações ainda não estão disponíveis.")}
          >
            <Lucide name="bell" size={iconSizes.large} color={colors.neutral.carbon} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.roundButton, styles.recenter, navigating ? { bottom: panelHeight + spacing.lg } : isOnline && { top: insets.top + 80, bottom: undefined }]} accessibilityRole="button"
          accessibilityLabel="Centralizar mapa na minha localização"
          onPress={() => mapRef.current?.centerOnUserLocation()}
        >
          <Lucide name="locate" size={iconSizes.large} color={colors.neutral.carbon} />
        </TouchableOpacity>
        </View>
        {(isOnline || offers.activeId) && <View style={styles.offerOverlay} pointerEvents="box-none" onLayout={event => setPanelHeight(event.nativeEvent.layout.height)}>
          <DriverOfferCard offers={offers} blocked={checking} maxHeight={height * (navigating ? 0.48 : 0.28)}
            collapsed={navigating && !expanded} onToggle={navigating ? () => setExpandedRideId(expanded ? null : offers.activeId) : undefined} />
        </View>}
      </View>

      {!navigating && <View style={[styles.sheet, { maxHeight: height * (isOnline || offers.activeId ? 0.3 : 0.57) }]}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          <View style={styles.handle} />
          <View style={[styles.greetingRow, compact && styles.stackedRow]}>
            <View style={[styles.greetingCopy, compact && styles.stackedCopy]}>
              <Text style={styles.greeting}>{greeting}, {name}</Text>
              <Text style={styles.title}>Pronto para rodar?</Text>
            </View>
            <TouchableOpacity
              style={[styles.availabilityButton, checking && styles.buttonBusy]}
              accessibilityRole="button" accessibilityLabel={!known ? "Atualizar status" : isOnline ? "Ficar offline" : "Ficar online"}
              accessibilityState={{ disabled: checking || offers.busy, busy: checking || offers.busy, selected: isOnline }}
              disabled={checking || offers.busy} onPress={() => void (!known ? availability.refresh() : isOnline ? availability.goOffline() : availability.goOnline())}
            >
              {checking ? <ActivityIndicator color={colors.neutral.carbon} /> :
                <Lucide name={isOnline ? "power" : "power-off"} size={iconSizes.large} color={colors.neutral.carbon} />}
              <Text style={styles.availabilityLabel}>{checking ? "Verificando…" : !known ? "Atualizar status" : isOnline ? "Ficar offline" : "Ficar online"}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.context}>
            {!known ? "Consulte sua disponibilidade antes de alterá-la." : isOnline ? "Você está online. Confira as ofertas para seu veículo no mapa." : "Selecione um veículo elegível para ficar online."}
          </Text>
          {availability.error && <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">{availability.error}</Text>}

          <TouchableOpacity style={styles.requestCard} accessibilityRole="button" accessibilityLabel="Ver serviços" onPress={() => openSection("/driver-services")}>
            <View style={[styles.requestHalo, isOnline && styles.onlineHalo]}>
              <View style={[styles.statusDot, isOnline && styles.onlineDot]} />
            </View>
            <View style={styles.requestCopy}>
              <Text style={styles.cardTitle}>{!known ? "Disponibilidade não confirmada" : isOnline ? "Disponibilidade online" : "Você está offline"}</Text>
              <Text style={styles.cardSubtitle}>
                {!known ? "Atualize o status para conferir" : isOnline ? availability.selectedVehicle?.label : "Sua disponibilidade está desativada"}
              </Text>
            </View>
            <Lucide name="arrow-right" size={iconSizes.medium} color={colors.neutral.carbon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.earningsCard} accessibilityRole="button"
            accessibilityLabel="Ver ganhos. Ganhos de hoje e quantidade de serviços indisponíveis."
            onPress={() => openSection("/driver-earnings")}
          >
            <View style={styles.earningsColumn}>
              <Text style={styles.earningsLabel}>GANHOS DE HOJE</Text>
              <Text style={styles.earningsValue}>—</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsColumn}>
              <Text style={styles.earningsLabel}>SERVIÇOS</Text>
              <Text style={styles.earningsValue}>—</Text>
            </View>
            <Lucide name="chevron-right" size={iconSizes.medium} color={colors.brand.primary} />
          </TouchableOpacity>
          <Text style={styles.emptyNote}>Resumo ainda indisponível</Text>
        </ScrollView>
      </View>}
      <DriverNavigation active="home" />

      <Modal visible={availability.vehicleChoices.length > 0} transparent animationType="slide" onRequestClose={availability.cancelSelection}>
        <View style={styles.modalOverlay}>
          <View style={[styles.vehicleSheet, { paddingBottom: insets.bottom + spacing.xxxl }]} accessibilityViewIsModal>
            <Text style={styles.title}>Escolha seu veículo</Text>
            <ScrollView>
              {availability.vehicleChoices.map((vehicle) => (
                <TouchableOpacity key={vehicle.id} style={styles.vehicleOption} accessibilityRole="button" accessibilityLabel={`Selecionar ${vehicle.label}`} onPress={() => void availability.selectVehicle(vehicle.id)}>
                  <View style={{ flex: 1 }}>
                    {vehicle.categoriaNome && <VehicleCategory name={vehicle.categoriaNome} textStyle={styles.vehicleLabel} />}
                    <Text style={styles.vehicleLabel}>{vehicle.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.vehicleOption} accessibilityRole="button" accessibilityLabel="Cancelar seleção de veículo" onPress={availability.cancelSelection}>
              <Text style={styles.cancelLabel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
