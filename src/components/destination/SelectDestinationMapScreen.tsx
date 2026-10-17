import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import MapView, { type Region } from "react-native-maps";
import { router, useLocalSearchParams } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";

import { colors } from "../../theme";
import {
  getUserLocation,
  type UserLocation,
} from "../../services/location/location.service";
import { reverseGeocodeLocation } from "../../services/location/geocoding.service";

import { styles } from "./SelectDestinationMapStyles";

const ICON_SIZE = 22;
const ICON_COLOR = "#475569";
const PRIMARY_COLOR = colors.neutral.carbon;

export function SelectDestinationMapScreen() {
  const mapRef = useRef<MapView>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const regionRef = useRef<Region | null>(null);

  const params = useLocalSearchParams<{
    destinationName?: string;
    destinationAddress?: string;
    destinationLatitude?: string;
    destinationLongitude?: string;
  }>();

  const destinationAddress = params.destinationAddress;
  const destinationLatitude = params.destinationLatitude;
  const destinationLongitude = params.destinationLongitude;

  const [location, setLocation] = useState<UserLocation | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [address, setAddress] = useState("Localizando endereço...");
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [error, setError] = useState("");
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");

  useEffect(() => {
    let active = true;

    async function initializeMap() {
      try {
        const userLocation = await getUserLocation();

        const latitude =
          destinationLatitude !== undefined
            ? Number(destinationLatitude)
            : userLocation.latitude;

        const longitude =
          destinationLongitude !== undefined
            ? Number(destinationLongitude)
            : userLocation.longitude;

        const initialRegion: Region = {
          latitude: Number.isFinite(latitude)
            ? latitude
            : userLocation.latitude,
          longitude: Number.isFinite(longitude)
            ? longitude
            : userLocation.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        };

        if (!active) return;

        setLocation(userLocation);
        setRegion(initialRegion);
        regionRef.current = initialRegion;

        const initialAddress =
          destinationAddress ||
          (await reverseGeocodeLocation(
            initialRegion.latitude,
            initialRegion.longitude,
          ));

        if (active) {
          setAddress(initialAddress);
          setAddressQuery(initialAddress);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar o mapa.",
          );
        }
      } finally {
        if (active) {
          setLoadingLocation(false);
        }
      }
    }

    void initializeMap();

    return () => {
      active = false;

      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
        searchTimer.current = null;
      }
    };
  }, [destinationAddress, destinationLatitude, destinationLongitude]);

  function handleRegionChangeComplete(nextRegion: Region) {
    regionRef.current = nextRegion;
    setRegion(nextRegion);
    setError("");
    setLoadingAddress(true);

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    searchTimer.current = setTimeout(async () => {
      try {
        const result = await reverseGeocodeLocation(
          nextRegion.latitude,
          nextRegion.longitude,
        );

        if (
          regionRef.current?.latitude === nextRegion.latitude &&
          regionRef.current?.longitude === nextRegion.longitude
        ) {
          setAddress(result);
          setAddressQuery(result);
        }
      } catch {
        if (
          regionRef.current?.latitude === nextRegion.latitude &&
          regionRef.current?.longitude === nextRegion.longitude
        ) {
          setAddress("Não foi possível identificar este endereço");
        }
      } finally {
        if (
          regionRef.current?.latitude === nextRegion.latitude &&
          regionRef.current?.longitude === nextRegion.longitude
        ) {
          setLoadingAddress(false);
        }
      }
    }, 700);
  }

  function centerOnUser() {
    if (!location) return;

    const nextRegion: Region = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    };

    mapRef.current?.animateToRegion(nextRegion, 500);
  }

  function confirmDestination() {
    if (!region || !address.trim()) {
      setError("Aguarde a identificação do endereço antes de continuar.");
      return;
    }

    if (loadingAddress) {
      setError("Aguarde a identificação do endereço antes de continuar.");
      return;
    }

    router.replace({
      pathname: "/destination",
      params: {
        mapDestinationName: address.split(",")[0],
        mapDestinationAddress: address,
        mapDestinationLatitude: String(region.latitude),
        mapDestinationLongitude: String(region.longitude),
      },
    });
  }

  function handleConfirmAddressEdit() {
    const value = addressQuery.trim();

    if (value) {
      setAddress(value);
      setError("");
    }

    setEditingAddress(false);
  }

  if (loadingLocation) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Preparando o mapa...</Text>
      </View>
    );
  }

  if (!region) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar style="dark" />

        <Text style={styles.errorText}>
          {error || "Não foi possível abrir o mapa."}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      />

      <View
        pointerEvents="none"
        style={styles.centerMarkerContainer}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.markerShadow} />
        <View style={styles.centerMarker}>
          <Lucide name="map-pin" size={28} color={colors.neutral.carbon} />
        </View>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        onPress={() => router.back()}
      >
        <Lucide name="arrow-left" size={ICON_SIZE} color={ICON_COLOR} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.myLocationButton}
        accessibilityRole="button"
        accessibilityLabel="Voltar para minha localização"
        onPress={centerOnUser}
      >
        <Lucide name="locate" size={ICON_SIZE} color={ICON_COLOR} />
      </TouchableOpacity>

      <View style={styles.bottomSheet}>
        <View style={styles.handle} />

        <Text style={styles.title}>Confirme o destino</Text>
        <Text style={styles.subtitle}>
          Mova o mapa para ajustar o ponto exato.
        </Text>

        {editingAddress ? (
          <View style={styles.addressEditor}>
            <TextInput
              style={styles.addressInput}
              value={addressQuery}
              onChangeText={setAddressQuery}
              onSubmitEditing={handleConfirmAddressEdit}
              placeholder="Editar endereço"
              placeholderTextColor={colors.neutral.muted}
              returnKeyType="done"
              autoFocus
              accessibilityLabel="Editar endereço selecionado"
            />

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Confirmar edição do endereço"
              onPress={handleConfirmAddressEdit}
            >
              <Text style={styles.editAction}>OK</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addressCard}
            accessibilityRole="button"
            accessibilityLabel="Editar endereço selecionado"
            onPress={() => {
              setAddressQuery(address);
              setEditingAddress(true);
            }}
          >
            <Lucide name="map-pin" size={ICON_SIZE} color={PRIMARY_COLOR} />

            <View style={styles.addressTextContainer}>
              <Text style={styles.addressTitle} numberOfLines={1}>
                {loadingAddress
                  ? "Atualizando endereço..."
                  : address.split(",")[0]}
              </Text>

              <Text style={styles.addressDescription} numberOfLines={2}>
                {address}
              </Text>
            </View>

            {loadingAddress ? (
              <ActivityIndicator color={PRIMARY_COLOR} />
            ) : (
              <Lucide name="pencil" size={18} color={ICON_COLOR} />
            )}
          </TouchableOpacity>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[
            styles.confirmButton,
            (loadingAddress || editingAddress) && styles.confirmButtonDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Confirmar destino"
          disabled={loadingAddress || editingAddress}
          onPress={confirmDestination}
        >
          <Text style={styles.confirmButtonText}>Confirmar destino</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
