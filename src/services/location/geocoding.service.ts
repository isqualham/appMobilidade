export interface DestinationResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  residential?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  country?: string;
}

interface NominatimReverseResult {
  display_name?: string;
  address?: NominatimAddress;
}

export async function searchDestinations(
  query: string,
  latitude: number,
  longitude: number,
): Promise<DestinationResult[]> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 3) {
    return [];
  }

  // Área aproximada de 15 km ao redor do GPS.
  const latitudeOffset = 0.135;
  const longitudeOffset =
    0.135 / Math.max(Math.cos((latitude * Math.PI) / 180), 0.2);

  const west = longitude - longitudeOffset;
  const east = longitude + longitudeOffset;
  const south = latitude - latitudeOffset;
  const north = latitude + latitudeOffset;

  const params = new URLSearchParams({
    q: normalizedQuery,
    format: "jsonv2",
    addressdetails: "1",
    limit: "5",
    countrycodes: "br",
    viewbox: `${west},${north},${east},${south}`,
    bounded: "1",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Não foi possível pesquisar o endereço. Tente novamente.");
  }

  const results: NominatimResult[] = await response.json();

  return results.map((item) => ({
    id: String(item.place_id),
    name: item.display_name.split(",")[0],
    address: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
  }));
}

export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number,
): Promise<string> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: "jsonv2",
    addressdetails: "1",
    zoom: "18",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Não foi possível identificar seu endereço.");
  }

  const result: NominatimReverseResult = await response.json();
  const address = result.address;

  if (!address) {
    return result.display_name || "Minha localização atual";
  }

  const street = address.road || address.pedestrian || address.residential;

  const neighborhood = address.neighbourhood || address.suburb;

  const city =
    address.city || address.town || address.village || address.municipality;

  const parts = [street, neighborhood, city, address.state].filter(
    (part, index, values): part is string =>
      Boolean(part) && values.indexOf(part) === index,
  );

  return parts.length > 0
    ? parts.join(", ")
    : result.display_name || "Minha localização atual";
}
