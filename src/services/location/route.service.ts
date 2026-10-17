export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
  coordinates: RouteCoordinate[];
}

interface OSRMResponse {
  code: string;
  routes?: {
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
  }[];
}

export async function calculateRoute(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
): Promise<RouteResult> {
  const coordinates = [
    `${origin.longitude},${origin.latitude}`,
    `${destination.longitude},${destination.latitude}`,
  ].join(";");

  const url =
    `https://router.project-osrm.org/route/v1/driving/${coordinates}` +
    "?overview=full&geometries=geojson";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Não foi possível calcular a rota.");
  }

  const data = (await response.json()) as OSRMResponse;
  const route = data.routes?.[0];

  if (data.code !== "Ok" || !route) {
    throw new Error("Não foi encontrada uma rota para esse destino.");
  }

  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    coordinates: route.geometry.coordinates.map(([longitude, latitude]) => ({
      latitude,
      longitude,
    })),
  };
}

export function formatDistance(distanceMeters: number): string {
  const kilometers = distanceMeters / 1000;

  if (kilometers < 1) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${kilometers.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`;
}

export function formatDuration(durationSeconds: number): string {
  const minutes = Math.max(1, Math.round(durationSeconds / 60));

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours} h ${remainingMinutes} min`
    : `${hours} h`;
}
