import { offerDiagnostic } from "../../services/offerDiagnostics";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { ApiError } from "../../services/api";
import { getSessionVersion, onSessionCleared } from "../../services/auth/session";
import { finishDriverRide, startDriverRide, type ActiveDriverRide, acceptDriverOffer, getActiveDriverRide, getDriverOffer, refuseDriverOffer, type DriverOffer } from "../../services/corrida/ofertas.service";

const POLL_INTERVAL_MS = 12000;

interface OfferState {
  offer: DriverOffer | null;
  activeId: string | null;
  activeRide: ActiveDriverRide | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  verified: boolean;
  notice: string | null;
}
const initial: OfferState = { offer: null, activeId: null, activeRide: null, loading: false, busy: false, error: null, verified: false, notice: null };

export function useDriverOffers(vehicleId: string | undefined, userId: string | undefined, blocked = false) {
  const identity = `${userId ?? ""}/${vehicleId ?? ""}`;
  const [owner, setOwner] = useState(identity);
  const [state, setState] = useState<OfferState>(initial);
  if (owner !== identity) {
    setOwner(identity);
    setState(initial);
  }
  const readController = useRef<AbortController | null>(null);
  const snapshot = useRef(state);
  const generation = useRef(0);
  const focused = useRef(false);
  const foreground = useRef(AppState.currentState !== "background" && AppState.currentState !== "inactive");
  const lock = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const update = useCallback((patch: Partial<OfferState>) => {
    snapshot.current = { ...snapshot.current, ...patch };
    setState(snapshot.current);
  }, []);

  const refresh = useCallback(async () => {
    if (!userId || !focused.current || !foreground.current || lock.current) {
      offerDiagnostic({ stage: "poll", reason: !userId || !focused.current ? "disabled" : !foreground.current ? "background" : "busy" });
      return;
    }
    offerDiagnostic({ stage: "poll", reason: "request", intervalMs: POLL_INTERVAL_MS, occupied: Boolean(snapshot.current.activeId), focused: focused.current, foreground: foreground.current });
    lock.current = true;
    const epoch = generation.current;
    const session = getSessionVersion();
    const valid = () => epoch === generation.current && session === getSessionVersion();
    const controller = new AbortController();
    readController.current = controller;
    update({ loading: true });
    try {
      // Também reconcilia um aceite cuja resposta se perdeu e recupera a corrida ao reabrir.
      const active = await getActiveDriverRide(controller.signal);
      if (!valid()) { offerDiagnostic({ stage: "card", reason: "stale" }); return; }
      if (active) offerDiagnostic({ stage: "card", reason: "occupied" });
      if (active) update({ activeId: active.id, activeRide: active, offer: null, verified: true, error: null });
      else if (vehicleId) {
        const offer = await getDriverOffer(snapshot.current.offer?.id, controller.signal);
        if (valid()) {
          update({ offer, activeId: null, activeRide: null, verified: true, error: null });
          offerDiagnostic({ stage: "card", reason: "applied", visible: Boolean(offer), verified: true });
        } else offerDiagnostic({ stage: "card", reason: "stale" });
      } else update({ activeId: null, activeRide: null, offer: null, verified: true, error: null });
    } catch (error) {
      if (valid()) offerDiagnostic({ stage: "card", reason: "unavailable" });
      if (valid()) update({ verified: false, error: error && typeof error === "object" && "status" in error && error.status === 401
        ? "Sessão expirada. Entre novamente."
        : error instanceof ApiError && error.status === 403
        ? "Confira se você e o veículo Online continuam aprovados e disponíveis."
        : error instanceof ApiError && error.status === 409
          ? "Sua disponibilidade mudou. Atualize para conferir a corrida ativa."
          : "Não foi possível consultar as ofertas. Confira a conexão e atualize." });
    } finally {
      lock.current = false;
      if (valid()) update({ loading: false });
    }
  }, [vehicleId, userId, update]);

  useEffect(() => {
    generation.current++;
    snapshot.current = initial;
    readController.current?.abort();
    return onSessionCleared(() => {
      generation.current++;
      focused.current = false;
      clearTimeout(timer.current);
      readController.current?.abort();
      snapshot.current = initial;
      setState(initial);
    });
  }, [vehicleId, userId]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    foreground.current = AppState.currentState !== "background" && AppState.currentState !== "inactive";
    let alive = true;
    const poll = async () => {
      // Enquanto ocupado, refresh consulta somente a corrida ativa, sem buscar ofertas.
      await refresh();
      if (alive && userId && (vehicleId || snapshot.current.activeId)) {
        offerDiagnostic({ stage: "poll", reason: "scheduled", intervalMs: POLL_INTERVAL_MS });
        timer.current = setTimeout(() => void poll(), POLL_INTERVAL_MS);
      } else offerDiagnostic({ stage: "poll", reason: "stopped" });
    };
    void poll();
    const subscription = AppState.addEventListener("change", value => {
      foreground.current = value === "active";
      if (!foreground.current) {
        generation.current++;
        readController.current?.abort();
        update({ verified: false, loading: false, busy: false });
      } else void refresh();
    });
    return () => {
      offerDiagnostic({ stage: "poll", reason: "stopped" });
      alive = false;
      focused.current = false;
      generation.current++;
      clearTimeout(timer.current);
      readController.current?.abort();
      subscription.remove();
      update({ verified: false, loading: false, busy: false });
    };
  }, [refresh, update, vehicleId, userId]));

  const act = async (action: "accept" | "refuse") => {
    const offer = snapshot.current.offer;
    if (!offer || !vehicleId || blocked || lock.current || !snapshot.current.verified || !focused.current || !foreground.current) return;
    lock.current = true;
    const epoch = generation.current;
    const session = getSessionVersion();
    const valid = () => epoch === generation.current && session === getSessionVersion();
    update({ busy: true, error: null, notice: null });
    let reconcile = false;
    try {
      if (action === "accept") {
        await acceptDriverOffer(offer.id, vehicleId);
        if (valid()) { update({ activeId: offer.id, activeRide: null, offer: null }); reconcile = true; }
      } else {
        await refuseDriverOffer(offer.id);
        if (valid()) { update({ offer: null, verified: false }); reconcile = true; }
      }
    } catch (error) {
      if (valid()) {
        update({ verified: false, notice: error instanceof ApiError && (error.status === 409 || error.status === 404)
          ? "A oferta ou sua disponibilidade mudou. Confira o resultado atualizado antes de continuar."
          : error instanceof ApiError && error.status === 403
            ? "Operação não permitida. Confira a aprovação do prestador, do veículo e sua disponibilidade Online."
            : "Não foi possível confirmar a operação. Vamos consultar o estado atual antes de tentar novamente." });
        reconcile = true;
      }
    } finally {
      lock.current = false;
      if (valid()) {
        update({ busy: false });
        // Somente leituras são repetidas; nunca reenviamos uma escrita automaticamente.
        if (reconcile) await refresh();
      }
    }
  };
  const changeRide = async (finish = false) => {
    const ride = snapshot.current.activeRide;
    if (!ride || !(finish ? ride.status === "EM_ANDAMENTO" : ["ACEITA", "PRESTADOR_A_CAMINHO"].includes(ride.status)) || lock.current || !snapshot.current.verified || blocked || !focused.current || !foreground.current) return;
    lock.current = true;
    const epoch = generation.current;
    const session = getSessionVersion();
    const valid = () => epoch === generation.current && session === getSessionVersion();
    update({ busy: true, notice: null });
    try {
      if (finish) await finishDriverRide(ride.id);
      else await startDriverRide(ride.id);
    } catch {
      if (valid()) update({ notice: "Não foi possível confirmar a alteração da corrida. Consultando o estado atual, sem repetir a operação." });
    } finally {
      lock.current = false;
      if (valid()) { update({ busy: false }); await refresh(); }
    }
  };
  return { ...state, startRide: () => changeRide(), finishRide: () => changeRide(true), refresh, accept: () => act("accept"), refuse: () => act("refuse") };
}
