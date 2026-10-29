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
  signal?: AbortSignal,
): Promise<RouteResult> {
  const coordinates = [
    `${origin.longitude},${origin.latitude}`,
    `${destination.longitude},${destination.latitude}`,
  ].join(";");

  const url =
    `https://router.project-osrm.org/route/v1/driving/${coordinates}` +
    "?overview=full&geometries=geojson";

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error("Não foi possível calcular a rota.");
    }

    const data = (await response.json()) as OSRMResponse;
    const route = data.routes?.[0];

    if (data.code !== "Ok" || !route || !Number.isFinite(route.distance) || route.distance < 0 || !Number.isFinite(route.duration) || route.duration < 0 ||
      !Array.isArray(route.geometry?.coordinates) || route.geometry.coordinates.length < 2 ||
      !route.geometry.coordinates.every(point => Array.isArray(point) && point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]) && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90)) {
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
  } catch (error) {
    if (controller.signal.aborted) throw new Error("A consulta da rota foi interrompida ou excedeu o tempo limite. Tente novamente.");
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
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
