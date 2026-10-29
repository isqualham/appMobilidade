import { useDriverRouteAnchor } from "./useDriverRouteAnchor";
import type { ActiveDriverRide } from "../../services/corrida/ofertas.service";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline, type Region } from "react-native-maps";
import * as Location from "expo-location";

import { colors } from "../../theme";
import {
  getUserLocation,
  type UserLocation,
} from "../../services/location/location.service";
import {
  calculateRoute,
  formatDistance,
  formatDuration,
  type RouteCoordinate,
  type RouteResult,
} from "../../services/location/route.service";
import { styles } from "./HomeMapStyles";

export type MapOrigin = {
  name: string;
  latitude: number;
  longitude: number;
};

export type MapDestination = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type HomeMapHandle = {
  centerOnUserLocation: () => void;
  showOrigin: (origin: MapOrigin) => void;
  showDestination: (destination: MapDestination) => void;
  clearRoute: () => void;
};

type HomeMapProps = {
  isDriver?: boolean;
  isOnline?: boolean;
  contentInsetTop?: number;
  contentInsetBottom?: number;
  activeRide?: ActiveDriverRide | null;
};

export const HomeMap = forwardRef<HomeMapHandle, HomeMapProps>(function HomeMap(
  { isDriver = false, isOnline = false, contentInsetTop = 0, contentInsetBottom = 300, activeRide = null },
  ref,
) {
  const mapRef = useRef<MapView>(null);
  const routeRequestId = useRef(0);
  const followCamera = useRef(true);
  const fittedRide = useRef("");
  const followedPosition = useRef<UserLocation | null>(null);

  const [location, setLocation] = useState<UserLocation | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<MapOrigin | null>(null);
  const [passengerDestination, setDestination] = useState<MapDestination | null>(null);
  const [routeState, setRouteState] = useState<{ key: string; result: RouteResult } | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [locationAttempt, setLocationAttempt] = useState(0);

  const shouldTrackDriver = isDriver && (isOnline || Boolean(activeRide));
  const rideTarget = activeRide?.status === "EM_ANDAMENTO" ? activeRide.destino : activeRide?.origem;
  const targetLatitude = rideTarget?.latitude;
  const targetLongitude = rideTarget?.longitude;
  const targetAddress = rideTarget?.endereco;
  const rideStatus = activeRide?.status;
  const destination = useMemo<MapDestination | null>(() => {
    if (!isDriver) return passengerDestination;
    if (!rideStatus || !["ACEITA", "PRESTADOR_A_CAMINHO", "EM_ANDAMENTO"].includes(rideStatus) || targetLatitude === undefined || targetLongitude === undefined) return null;
    return { latitude: targetLatitude, longitude: targetLongitude, name: rideStatus === "EM_ANDAMENTO" ? "Destino do passageiro" : "Embarque do passageiro", address: targetAddress ?? "" };
  }, [isDriver, rideStatus, targetLatitude, targetLongitude, targetAddress, passengerDestination]);
  const driverRouteKey = isDriver && destination ? `${activeRide?.id}/${rideStatus}/${targetLatitude}/${targetLongitude}/${locationAttempt}` : null;
  const driverAnchor = useDriverRouteAnchor(location, driverRouteKey);

  // Obtém a localização inicial para abrir o mapa.
  useEffect(() => {
    let active = true;

    async function loadLocation() {
      try {
        const userLocation = await getUserLocation();

        if (active) {
          setLocation(userLocation);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível obter sua localização.",
          );
        }
      }
    }

    void loadLocation();

    return () => {
      active = false;
    };
  }, [locationAttempt]);

  // Acompanha o GPS somente quando o prestador está online.
  useEffect(() => {
    if (!shouldTrackDriver) return;

    let active = true;
    let subscription: Location.LocationSubscription | null = null;

    async function startTracking() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!active) return;

        if (permission.status !== "granted") {
          setError(
            "Permita o acesso à localização para ficar disponível no ViaU.",
          );
          return;
        }

        setError(null);

        const currentSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 5,
            timeInterval: 3000,
          },
          (position) => {
            if (!active) return;

            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
        );

        if (active) {
          subscription = currentSubscription;
        } else {
          currentSubscription.remove();
        }
      } catch {
        if (active) {
          setError("Não foi possível acompanhar sua localização GPS.");
        }
      }
    }

    void startTracking();

    return () => {
      active = false;
      subscription?.remove();
    };
  }, [shouldTrackDriver]);

  useImperativeHandle(
    ref,
    () => ({
      centerOnUserLocation() {
        followCamera.current = true;
        if (!location || !mapReady) return;

        const region: Region = {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        };

        mapRef.current?.animateToRegion(region, 600);
      },

      showOrigin(origin) {
        setSelectedOrigin(origin);
      },

      showDestination(selectedDestination) {
        setDestination(selectedDestination);
      },

      clearRoute() {
        routeRequestId.current += 1;
        setSelectedOrigin(null);
        setDestination(null);
        setRouteState(null);
        setLoadingRoute(false);
        setRouteError(null);

        if (location && mapReady) {
          mapRef.current?.animateToRegion(
            {
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            },
            600,
          );
        }
      },
    }),
    [location, mapReady],
  );

  const routeOrigin: RouteCoordinate | null = useMemo(() => {
    if (isDriver) return driverAnchor;
    if (!isDriver && selectedOrigin) {
      return {
        latitude: selectedOrigin.latitude,
        longitude: selectedOrigin.longitude,
      };
    }

    if (location) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
      };
    }

    return null;
  }, [selectedOrigin, location, isDriver, driverAnchor]);
  const requestKey = `${driverRouteKey ?? "passenger"}/${routeOrigin?.latitude}/${routeOrigin?.longitude}/${destination?.latitude}/${destination?.longitude}`;
  const route = routeState?.key === requestKey ? routeState.result : null;

  // Reutiliza o roteamento para embarque do prestador e viagem do passageiro.
  useEffect(() => {
    const requestId = ++routeRequestId.current;

    if (routeOrigin === null || destination === null) {
      setRouteState(null);
      setRouteError(null);
      setLoadingRoute(false);
      return;
    }

    const controller = new AbortController();
    const origin = routeOrigin;
    const target: RouteCoordinate = {
      latitude: destination.latitude,
      longitude: destination.longitude,
    };

    let active = true;

    async function loadRoute() {
      setLoadingRoute(true);
      setRouteState(null);
      setRouteError(null);

      try {
        const result = await calculateRoute(origin, target, controller.signal);

        if (active && requestId === routeRequestId.current) {
          setRouteState({ key: requestKey, result });
        }
      } catch (err) {
        if (active && requestId === routeRequestId.current) {
          setRouteError(
            err instanceof Error
              ? err.message
              : "Não foi possível calcular a rota.",
          );
        }
      } finally {
        if (active && requestId === routeRequestId.current) {
          setLoadingRoute(false);
        }
      }
    }

    void loadRoute();

    return () => {
      active = false;
      controller.abort();
    };
  }, [isDriver, routeOrigin, destination, locationAttempt, requestKey]);

  // Enquadra a rota e reserva espaço para os cards.
  useEffect(() => {
    if (!destination || !mapReady || !mapRef.current) return;
    const framing = `${driverRouteKey ?? "passenger"}/${contentInsetTop}/${contentInsetBottom}`;
    if (isDriver && (!followCamera.current || fittedRide.current === framing)) return;

    if (route?.coordinates.length) {
      if (isDriver) fittedRide.current = framing;
      mapRef.current.fitToCoordinates(route.coordinates, {
        edgePadding: {
          top: isDriver ? 24 : Math.max(120, contentInsetTop + 48),
          right: 55,
          bottom: isDriver ? 24 : contentInsetBottom + 32,
          left: 55,
        },
        animated: true,
      });
      return;
    }

    if (isDriver) return;
    mapRef.current.animateToRegion(
      {
        latitude: destination.latitude,
        longitude: destination.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      },
      800,
    );
  }, [destination, route, mapReady, contentInsetTop, contentInsetBottom, isDriver, driverRouteKey]);

  // Segue o prestador somente enquanto ele está online.
  useEffect(() => {
    const previous = followedPosition.current;
    followedPosition.current = location;
    if (!followCamera.current || !shouldTrackDriver || !location || !mapReady || !mapRef.current ||
      (activeRide && (!previous || (previous.latitude === location.latitude && previous.longitude === location.longitude)))) {
      return;
    }

    mapRef.current.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      },
      500,
    );
  }, [shouldTrackDriver, mapReady, location, activeRide]);

  if (error) {
    return (
      <View style={[styles.messageContainer, contentInsetTop > 0 && { paddingTop: contentInsetTop }]}>
        <Text style={styles.messageTitle}>Localização indisponível</Text>
        <Text style={styles.message}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton} accessibilityRole="button" accessibilityLabel="Tentar obter localização novamente"
          onPress={() => {
            setError(null);
            setLocationAttempt((attempt) => attempt + 1);
          }}
        >
          <Text style={styles.retryLabel}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={[styles.messageContainer, contentInsetTop > 0 && { paddingTop: contentInsetTop }]}>
        <ActivityIndicator size="large" color={colors.neutral.carbon} />
        <Text style={styles.message}>Localizando você...</Text>
      </View>
    );
  }

  const initialRegion: Region = {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.008,
    longitudeDelta: 0.008,
  };

  const originCoordinate: RouteCoordinate = routeOrigin ?? {
    latitude: location.latitude,
    longitude: location.longitude,
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onMapReady={() => setMapReady(true)}
        mapPadding={isDriver ? { top: contentInsetTop + 48, bottom: contentInsetBottom + 24, left: 24, right: 24 } : undefined}
        onTouchStart={() => { if (isDriver) followCamera.current = false; }}
        onPanDrag={() => { if (isDriver) followCamera.current = false; }}
        showsUserLocation={!isDriver}
        showsMyLocationButton={!isDriver}
      >
        {isDriver ? (
          <>
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Sua localização"
            description={isOnline ? "Posição GPS atual" : "Última localização obtida"}
            pinColor={colors.brand.primary}
          />
          {destination && <Marker coordinate={destination} title={destination.name} description={destination.address} />}
          {activeRide?.status === "EM_ANDAMENTO" && <Marker coordinate={activeRide.origem} title="Origem do passageiro" />}
          {route && <Polyline coordinates={route.coordinates} strokeColor={colors.feedback.success} strokeWidth={5} />}
          </>
        ) : (
          <>
            <Marker
              coordinate={originCoordinate}
              title={selectedOrigin?.name ?? "Minha localização atual"}
              description="Origem da viagem"
              pinColor="#00864B"
            />

            {destination && (
              <Marker
                coordinate={{
                  latitude: destination.latitude,
                  longitude: destination.longitude,
                }}
                title={destination.name}
                description={destination.address}
                pinColor="#E87524"
              />
            )}

            {route && (
              <Polyline
                coordinates={route.coordinates}
                strokeColor="#18875A"
                strokeWidth={5}
              />
            )}
          </>
        )}
      </MapView>

      {isDriver && destination && (loadingRoute || routeError) && <View style={{ position: "absolute", top: contentInsetTop, left: 16, right: 70, backgroundColor: colors.neutral.white, padding: 8 }}>
        <Text style={{ color: routeError ? colors.feedback.danger : colors.neutral.carbon }}>{loadingRoute ? "Calculando rota…" : routeError}</Text>
        {routeError && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Tentar rota novamente" onPress={() => setLocationAttempt(attempt => attempt + 1)}><Text>Tentar novamente</Text></TouchableOpacity>}
      </View>}
      {!isDriver && destination && (
        <View
          style={{
            position: "absolute",
            top: 76,
            left: 16,
            right: 16,
            padding: 16,
            borderRadius: 16,
            backgroundColor: colors.neutral.white,
            elevation: 5,
          }}
        >
          <Text
            style={{
              color: colors.neutral.carbon,
              fontSize: 16,
              fontWeight: "700",
            }}
          >
            {destination.name}
          </Text>

          <Text
            style={{
              color: colors.neutral.muted,
              fontSize: 12,
              marginTop: 4,
            }}
          >
            Origem: {selectedOrigin?.name ?? "Minha localização atual"}
          </Text>

          {loadingRoute ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 10,
              }}
            >
              <ActivityIndicator size="small" color={colors.feedback.success} />
              <Text style={{ color: colors.neutral.muted }}>
                Calculando rota...
              </Text>
            </View>
          ) : route ? (
            <View
              style={{
                flexDirection: "row",
                gap: 20,
                marginTop: 10,
              }}
            >
              <View>
                <Text style={{ color: colors.neutral.muted, fontSize: 12 }}>
                  Distância
                </Text>
                <Text
                  style={{
                    color: colors.neutral.carbon,
                    fontSize: 18,
                    fontWeight: "800",
                  }}
                >
                  {formatDistance(route.distanceMeters)}
                </Text>
              </View>

              <View>
                <Text style={{ color: colors.neutral.muted, fontSize: 12 }}>
                  Tempo estimado
                </Text>
                <Text
                  style={{
                    color: colors.neutral.carbon,
                    fontSize: 18,
                    fontWeight: "800",
                  }}
                >
                  {formatDuration(route.durationSeconds)}
                </Text>
              </View>
            </View>
          ) : routeError ? (
            <Text
              style={{
                color: colors.feedback.danger,
                marginTop: 8,
              }}
            >
              {routeError}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
});
