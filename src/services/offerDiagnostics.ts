// Nunca passar corpos, URLs completas, IDs, coordenadas, mensagens da API ou credenciais.
type Diagnostic = {
  stage: "http" | "auth" | "poll" | "page" | "card" | "category" | "state";
  reason?: "disabled" | "background" | "busy" | "occupied" | "request" | "stale" | "invalid_response" | "empty" | "selected" | "unavailable" | "network_or_abort" | "session_unavailable" | "pagination_limit" | "scheduled" | "stopped" | "applied" | "refreshing" | "refresh_failed" | "rejected";
  endpoint?: "offers" | "active_driver_ride" | "categories" | "availability";
  path?: string; intervalMs?: number; online?: boolean; known?: boolean; approved?: boolean;
  vehicleSelected?: boolean; occupied?: boolean; focused?: boolean; foreground?: boolean;
  visible?: boolean; verified?: boolean; keepingCurrent?: boolean; attempt?: number;
  status?: number; count?: number; page?: number; hasNext?: boolean; authenticated?: boolean;
};
export function offerDiagnostic(data: Diagnostic) {
  if (typeof __DEV__ !== "undefined" && __DEV__) console.info("[ViaU ofertas]", { at: new Date().toISOString(), ...data });
}
