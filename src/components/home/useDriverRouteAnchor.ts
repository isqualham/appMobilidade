import { useCallback, useEffect, useRef, useState } from "react";
import type { RouteCoordinate } from "../../services/location/route.service";

export const DRIVER_ROUTE_INTERVAL_MS = 15000;
export const DRIVER_ROUTE_DISTANCE_METERS = 50;
function distance(a: RouteCoordinate, b: RouteCoordinate) {
  const radians = Math.PI / 180;
  const latitude = (b.latitude - a.latitude) * radians;
  const longitude = (b.longitude - a.longitude) * radians;
  const h = Math.sin(latitude / 2) ** 2 + Math.cos(a.latitude * radians) * Math.cos(b.latitude * radians) * Math.sin(longitude / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

// O marcador/câmera usam todo GPS; somente a origem enviada ao roteador é limitada.
export function useDriverRouteAnchor(location: RouteCoordinate | null, key: string | null) {
  const [anchor, setAnchor] = useState<{ key: string; point: RouteCoordinate } | null>(null);
  const last = useRef<{ key: string; point: RouteCoordinate; time: number } | null>(null);
  const publish = useCallback((point: RouteCoordinate, routeKey: string) => {
    last.current = { key: routeKey, point, time: Date.now() };
    setAnchor({ key: routeKey, point });
  }, []);
  useEffect(() => {
    if (!location || !key) { last.current = null; return; }
    const previous = last.current;
    if (!previous || previous.key !== key) { publish(location, key); return; }
    if (distance(previous.point, location) < DRIVER_ROUTE_DISTANCE_METERS) return;
    const wait = Math.max(0, DRIVER_ROUTE_INTERVAL_MS - (Date.now() - previous.time));
    if (!wait) { publish(location, key); return; }
    const timer = setTimeout(() => publish(location, key), wait);
    return () => clearTimeout(timer);
  }, [location, key, publish]);
  return key && anchor?.key === key ? anchor.point : null;
}
