import { getSessionVersion, onSessionCleared, withSessionStorage, RECENT_DESTINATIONS_KEY } from "../../services/auth/session";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Lucide } from "@react-native-vector-icons/lucide";

import {
  reverseGeocodeLocation,
  searchDestinations,
  type DestinationResult,
} from "../../services/location/geocoding.service";
import { getUserLocation } from "../../services/location/location.service";
import { styles } from "./DestinationStyles";

const HISTORY_KEY = RECENT_DESTINATIONS_KEY;
const MAX_RECENT_DESTINATIONS = 10;

const ICON_SIZE = 20;
const ICON_COLOR = "#475569";
const PRIMARY_COLOR = "#00864B";
const MUTED_COLOR = "#78817C";

type SearchMode = "origin" | "destination";

type DestinationMapParams = {
  mapDestinationName?: string | string[];
  mapDestinationAddress?: string | string[];
  mapDestinationLatitude?: string | string[];
  mapDestinationLongitude?: string | string[];
};

function getParamValue(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function DestinationScreen() {
  const params = useLocalSearchParams<DestinationMapParams>();

  const mapDestinationName = getParamValue(params.mapDestinationName);
  const mapDestinationAddress = getParamValue(params.mapDestinationAddress);
  const mapLatitude = getParamValue(params.mapDestinationLatitude);
  const mapLongitude = getParamValue(params.mapDestinationLongitude);

  const hasMapCoordinates =
    mapLatitude !== undefined &&
    mapLongitude !== undefined &&
    mapLatitude.trim() !== "" &&
    mapLongitude.trim() !== "";

  const parsedLatitude = hasMapCoordinates ? Number(mapLatitude) : NaN;
  const parsedLongitude = hasMapCoordinates ? Number(mapLongitude) : NaN;

  const invalidMapCoordinates =
    Boolean(mapDestinationName?.trim()) &&
    Boolean(mapDestinationAddress?.trim()) &&
    hasMapCoordinates &&
    (!Number.isFinite(parsedLatitude) ||
      !Number.isFinite(parsedLongitude) ||
      parsedLatitude < -90 ||
      parsedLatitude > 90 ||
      parsedLongitude < -180 ||
      parsedLongitude > 180);

  const [destination, setDestination] = useState("");
  const [currentLocation, setCurrentLocation] = useState(
    "Obtendo localização...",
  );
  const [originQuery, setOriginQuery] = useState("");

  const [originCoordinates, setOriginCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [originEditing, setOriginEditing] = useState(false);
  const [results, setResults] = useState<DestinationResult[]>([]);
  const [originResults, setOriginResults] = useState<DestinationResult[]>([]);
  const [recentDestinations, setRecentDestinations] = useState<
    DestinationResult[]
  >([]);
  const [selectedDestination, setSelectedDestination] =
    useState<DestinationResult | null>(null);
  const [selectedOrigin, setSelectedOrigin] =
    useState<DestinationResult | null>(null);

  const [searchMode, setSearchMode] = useState<SearchMode>("destination");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [originError, setOriginError] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => onSessionCleared(() => {
    setDestination(""); setCurrentLocation(""); setOriginQuery("");
    setOriginCoordinates(null); setSelectedOrigin(null); setSelectedDestination(null);
    setResults([]); setOriginResults([]); setRecentDestinations([]);
  }), []);

  const saveToHistory = useCallback(async (item: DestinationResult) => {
    const version = getSessionVersion();
    try {
      await withSessionStorage(version, async () => {
        const stored = await AsyncStorage.getItem(HISTORY_KEY);
        const previous: DestinationResult[] = stored ? JSON.parse(stored) : [];

        const updated = [
          item,
          ...previous.filter(
            (recent) =>
              recent.id !== item.id &&
              !(
                recent.latitude === item.latitude &&
                recent.longitude === item.longitude
              ),
          ),
        ].slice(0, MAX_RECENT_DESTINATIONS);

        setRecentDestinations(updated);
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      });
    } catch {
      setError("Não foi possível salvar o destino recente.");
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCurrentLocation() {
      const version = getSessionVersion();
      try {
        const location = await getUserLocation();
        const address = await reverseGeocodeLocation(
          location.latitude,
          location.longitude,
        );

        if (!active || version !== getSessionVersion()) return;

        if (version !== getSessionVersion()) return;
      setCurrentLocation(address);
        setOriginCoordinates({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      } catch {
        if (active) {
          setCurrentLocation("Minha localização atual");
        }
      }
    }

    void loadCurrentLocation();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        const stored = await withSessionStorage(getSessionVersion(), () => AsyncStorage.getItem(HISTORY_KEY));

        if (stored) {
          const parsed: unknown = JSON.parse(stored);

          if (active && Array.isArray(parsed)) {
            setRecentDestinations(parsed as DestinationResult[]);
          }
        }
      } catch {
        if (active) {
          setError("Não foi possível carregar os destinos recentes.");
        }
      } finally {
        if (active) {
          setHistoryLoaded(true);
        }
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, []);

  // Sincroniza os dados recebidos da tela de seleção no mapa.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (
      !mapDestinationName?.trim() ||
      !mapDestinationAddress?.trim() ||
      !hasMapCoordinates ||
      invalidMapCoordinates
    ) {
      return;
    }

    const selected: DestinationResult = {
      id: `map-${parsedLatitude}-${parsedLongitude}`,
      name: mapDestinationName,
      address: mapDestinationAddress,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
    };

    setDestination(selected.name);
    setSelectedDestination(selected);
    setResults([selected]);
    setSearchMode("destination");
    setOriginEditing(false);
    setError("");
    setOriginError("");

    void saveToHistory(selected);

    router.setParams({
      mapDestinationName: "",
      mapDestinationAddress: "",
      mapDestinationLatitude: "",
      mapDestinationLongitude: "",
    });
  }, [
    mapDestinationName,
    mapDestinationAddress,
    mapLatitude,
    mapLongitude,
    hasMapCoordinates,
    invalidMapCoordinates,
    parsedLatitude,
    parsedLongitude,
    saveToHistory,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSearch(mode: SearchMode = searchMode) {
    const version = getSessionVersion();
    Keyboard.dismiss();

    const query = mode === "origin" ? originQuery.trim() : destination.trim();

    if (query.length < 3) {
      if (mode === "origin") {
        setOriginError("Digite pelo menos 3 caracteres para pesquisar.");
        setOriginResults([]);
      } else {
        setError("Digite pelo menos 3 caracteres para pesquisar.");
        setResults([]);
        setSelectedDestination(null);
      }
      return;
    }

    setSearchMode(mode);
    setLoading(true);
    setError("");
    setOriginError("");

    if (mode === "origin") {
      setOriginResults([]);
    } else {
      setResults([]);
      setSelectedDestination(null);
    }

    try {
      const location = await getUserLocation();
      const found = await searchDestinations(
        query,
        location.latitude,
        location.longitude,
      );

      if (version !== getSessionVersion()) return;
      if (mode === "origin") {
        setOriginResults(found);

        if (found.length === 0) {
          setOriginError(
            "Nenhum endereço encontrado próximo à sua localização. Tente outro termo.",
          );
        }
      } else {
        setResults(found);

        if (found.length === 0) {
          setError(
            "Nenhum endereço encontrado próximo à sua localização. Tente outro termo.",
          );
        }
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível pesquisar. Tente novamente.";

      if (mode === "origin") {
        setOriginError(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectDestination(item: DestinationResult) {
    Keyboard.dismiss();
    setSelectedDestination(item);
    setDestination(item.name);
    setResults([item]);
    setError("");
    await saveToHistory(item);
  }

  function handleSelectOrigin(item: DestinationResult) {
    Keyboard.dismiss();
    setSelectedOrigin(item);
    setCurrentLocation(item.address);
    setOriginCoordinates({
      latitude: item.latitude,
      longitude: item.longitude,
    });
    setOriginQuery(item.name);
    setOriginEditing(false);
    setOriginResults([]);
    setOriginError("");
  }

  function handleRecentSelect(item: DestinationResult) {
    Keyboard.dismiss();
    setSelectedDestination(item);
    setDestination(item.name);
    setResults([item]);
    setError("");
    setSearchMode("destination");
  }

  function handleClearDestination() {
    setDestination("");
    setResults([]);
    setSelectedDestination(null);
    setError("");
  }

  function handleDestinationChange(value: string) {
    setDestination(value);
    setResults([]);
    setSelectedDestination(null);
    setError("");
  }

  function handleOriginChange(value: string) {
    setOriginQuery(value);
    setOriginResults([]);
    setOriginError("");
    setSelectedOrigin(null);
  }

  async function handleUseCurrentLocation() {
    const version = getSessionVersion();
    setSelectedOrigin(null);
    setOriginEditing(false);
    setOriginQuery("");
    setOriginResults([]);
    setOriginError("");
    setSearchMode("destination");
    setError("");

    try {
      const location = await getUserLocation();
      const address = await reverseGeocodeLocation(
        location.latitude,
        location.longitude,
      );

      if (version !== getSessionVersion()) return;
      setCurrentLocation(address);
      setOriginCoordinates({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } catch (err) {
      setOriginError(
        err instanceof Error
          ? err.message
          : "Não foi possível obter sua localização.",
      );
    }
  }

  function handleChooseOnMap() {
    Keyboard.dismiss();

    router.push({
      pathname: "/select-destination-map",
      params: selectedDestination
        ? {
            destinationName: selectedDestination.name,
            destinationAddress: selectedDestination.address,
            destinationLatitude: String(selectedDestination.latitude),
            destinationLongitude: String(selectedDestination.longitude),
          }
        : {},
    });
  }

  function handleContinue() {
    if (!selectedDestination) {
      setError("Selecione um destino antes de continuar.");
      return;
    }

    if (!originCoordinates) {
      setError("Não foi possível identificar a origem. Tente novamente.");
      return;
    }

    Keyboard.dismiss();

    router.replace({
      pathname: "/home",
      params: {
        originName: currentLocation,
        originLatitude: String(originCoordinates.latitude),
        originLongitude: String(originCoordinates.longitude),
        destinationName: selectedDestination.name,
        destinationAddress: selectedDestination.address,
        destinationLatitude: String(selectedDestination.latitude),
        destinationLongitude: String(selectedDestination.longitude),
      },
    });
  }

  const displayedError = invalidMapCoordinates
    ? "As coordenadas do destino selecionado são inválidas."
    : error;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
        >
          <Lucide name="arrow-left" size={ICON_SIZE} color={ICON_COLOR} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Defina seu destino</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.routeSection}>
          <View style={styles.routeLine}>
            <View style={styles.originDot} />
            <View style={styles.line} />
            <View style={styles.destinationSquare} />
          </View>

          <View style={styles.routeFields}>
            <View style={styles.originField}>
              <Text style={styles.fieldLabel}>Saindo de</Text>

              {originEditing ? (
                <>
                  <TextInput
                    style={styles.input}
                    value={originQuery}
                    onChangeText={handleOriginChange}
                    placeholder="Buscar endereço de origem"
                    placeholderTextColor={MUTED_COLOR}
                    returnKeyType="search"
                    autoCapitalize="words"
                    autoCorrect={false}
                    accessibilityLabel="Pesquisar endereço de origem"
                    onSubmitEditing={() => void handleSearch("origin")}
                    autoFocus
                  />

                  <View style={styles.originActions}>
                    <TouchableOpacity
                      onPress={() => void handleSearch("origin")}
                      disabled={loading}
                      accessibilityRole="button"
                      accessibilityLabel="Pesquisar origem"
                    >
                      <Text style={styles.searchHint}>Pesquisar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => void handleUseCurrentLocation()}
                      accessibilityRole="button"
                      accessibilityLabel="Usar localização atual"
                    >
                      <Text style={styles.searchHint}>
                        Usar minha localização
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Alterar endereço de origem"
                  onPress={() => {
                    setOriginQuery(selectedOrigin?.name ?? "");
                    setOriginEditing(true);
                    setOriginResults([]);
                    setOriginError("");
                    setSearchMode("origin");
                    setError("");
                  }}
                >
                  <Text style={styles.originValue} numberOfLines={2}>
                    {currentLocation}
                  </Text>
                  <Text style={styles.searchHint}>Toque para alterar</Text>
                </TouchableOpacity>
              )}
            </View>

            {originEditing && originError ? (
              <View style={styles.feedback}>
                <Text style={styles.feedbackText}>{originError}</Text>
              </View>
            ) : null}

            <View
              style={[
                styles.destinationField,
                selectedDestination && styles.destinationFieldSelected,
              ]}
            >
              <View style={styles.destinationInputContent}>
                <Text style={styles.fieldLabel}>Indo para</Text>

                <TextInput
                  style={styles.input}
                  value={destination}
                  onFocus={() => setSearchMode("destination")}
                  onChangeText={handleDestinationChange}
                  placeholder="Buscar endereço ou local"
                  placeholderTextColor={MUTED_COLOR}
                  returnKeyType="search"
                  autoCapitalize="words"
                  autoCorrect={false}
                  accessibilityLabel="Pesquisar destino"
                  onSubmitEditing={() => void handleSearch("destination")}
                />
              </View>

              {destination.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  accessibilityRole="button"
                  accessibilityLabel="Limpar pesquisa"
                  onPress={handleClearDestination}
                >
                  <Lucide name="x" size={ICON_SIZE} color={ICON_COLOR} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.searchIconButton}
                accessibilityRole="button"
                accessibilityLabel="Pesquisar endereço de destino"
                disabled={loading}
                onPress={() => void handleSearch("destination")}
              >
                <Lucide name="search" size={ICON_SIZE} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            </View>

            <Text style={styles.searchHint}>
              Digite o destino e toque na lupa para pesquisar.
            </Text>

            <TouchableOpacity
              style={styles.mapPickerButton}
              accessibilityRole="button"
              accessibilityLabel="Escolher destino no mapa"
              activeOpacity={0.75}
              onPress={handleChooseOnMap}
            >
              <Lucide name="map-pin" size={ICON_SIZE} color={PRIMARY_COLOR} />
              <Text style={styles.mapPickerText}>Escolher no mapa</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.historySection}>
          {loading ? (
            <View style={styles.feedback}>
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              <Text style={styles.feedbackText}>
                Pesquisando endereços próximos...
              </Text>
            </View>
          ) : searchMode === "origin" && originEditing ? (
            originResults.length > 0 ? (
              <View>
                <Text style={styles.sectionTitle}>ESCOLHA A ORIGEM</Text>

                {originResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.resultRow}
                    accessibilityRole="button"
                    accessibilityLabel={`Usar ${item.address} como origem`}
                    onPress={() => handleSelectOrigin(item)}
                  >
                    <View style={styles.placeIcon}>
                      <Lucide
                        name="map-pin"
                        size={ICON_SIZE}
                        color={ICON_COLOR}
                      />
                    </View>

                    <View style={styles.resultTextContainer}>
                      <Text style={styles.resultTitle}>{item.name}</Text>
                      <Text style={styles.resultAddress}>{item.address}</Text>
                    </View>

                    <Lucide
                      name="chevron-right"
                      size={ICON_SIZE}
                      color={ICON_COLOR}
                    />
                  </TouchableOpacity>
                ))}

                <Text style={styles.attribution}>
                  Dados de mapa © OpenStreetMap contributors
                </Text>
              </View>
            ) : (
              <View>
                <Text style={styles.sectionTitle}>ALTERAR ORIGEM</Text>
                <Text style={styles.feedbackText}>
                  Pesquise um endereço para definir outro local de embarque.
                </Text>
              </View>
            )
          ) : displayedError ? (
            <View style={styles.feedback}>
              <Text style={styles.feedbackTitle}>Atenção</Text>
              <Text style={styles.feedbackText}>{displayedError}</Text>
            </View>
          ) : results.length > 0 ? (
            <View>
              <Text style={styles.sectionTitle}>
                {selectedDestination
                  ? "Destino selecionado"
                  : "Resultados encontrados"}
              </Text>

              {results.map((item) => {
                const isSelected = selectedDestination?.id === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.resultRow,
                      isSelected && styles.resultRowSelected,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Selecionar ${item.address}`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => void handleSelectDestination(item)}
                  >
                    <View style={styles.placeIcon}>
                      <Lucide
                        name={isSelected ? "check-circle-2" : "map-pin"}
                        size={ICON_SIZE}
                        color={isSelected ? PRIMARY_COLOR : ICON_COLOR}
                      />
                    </View>

                    <View style={styles.resultTextContainer}>
                      <Text style={styles.resultTitle}>{item.name}</Text>
                      <Text style={styles.resultAddress}>{item.address}</Text>
                    </View>

                    <Lucide
                      name="chevron-right"
                      size={ICON_SIZE}
                      color={ICON_COLOR}
                    />
                  </TouchableOpacity>
                );
              })}

              <Text style={styles.attribution}>
                Dados de mapa © OpenStreetMap contributors
              </Text>

              {selectedDestination && (
                <View style={styles.selectionPanel}>
                  <Text style={styles.selectionTitle}>Destino selecionado</Text>
                  <Text style={styles.selectionAddress}>
                    {selectedDestination.address}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>LUGARES RECENTES</Text>

              {!historyLoaded ? (
                <ActivityIndicator
                  style={styles.historyLoading}
                  color={PRIMARY_COLOR}
                />
              ) : recentDestinations.length > 0 ? (
                recentDestinations.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.id}-${index}`}
                    style={styles.recentRow}
                    accessibilityRole="button"
                    accessibilityLabel={`Usar destino recente ${item.name}`}
                    onPress={() => handleRecentSelect(item)}
                  >
                    <View style={styles.recentIcon}>
                      <Lucide
                        name={index === 0 ? "clock-3" : "map-pin"}
                        size={ICON_SIZE}
                        color={ICON_COLOR}
                      />
                    </View>

                    <View style={styles.recentTextContainer}>
                      <Text style={styles.recentTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.recentAddress} numberOfLines={2}>
                        {item.address}
                      </Text>
                    </View>

                    <Lucide
                      name="chevron-right"
                      size={ICON_SIZE}
                      color={ICON_COLOR}
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Lucide name="search" size={32} color={MUTED_COLOR} />
                  <Text style={styles.emptyTitle}>
                    Seus destinos aparecerão aqui
                  </Text>
                  <Text style={styles.emptyDescription}>
                    Pesquise um endereço e selecione um resultado. Ele será
                    salvo automaticamente nos seus lugares recentes.
                  </Text>
                </View>
              )}

              <Text style={styles.attribution}>
                Dados de mapa © OpenStreetMap contributors
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {selectedDestination && results.length > 0 && !loading && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.continueButton}
            accessibilityRole="button"
            accessibilityLabel="Confirmar origem e destino"
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Confirmar destino</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
