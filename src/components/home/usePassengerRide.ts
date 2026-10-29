import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { ApiError } from "../../services/api";
import { getSessionVersion, onSessionCleared } from "../../services/auth/session";
import { cancelPassengerSearch, getActivePassengerRide, getPassengerRide, getRideCategories, isActivePassengerRide, quotePassengerRide, requestPassengerRide, type PassengerTrip, type PassengerRide, type RideCategory, type RideQuote } from "../../services/corrida/passageiro.service";

interface State {
  categories: RideCategory[]; category: string | null; quote: RideQuote | null;
  ride: PassengerRide | null; checked: boolean; loading: boolean; quoting: boolean; sending: boolean; cancelling: boolean;
  error: string | null; quoteError: string | null;
}
const initial: State = { categories: [], category: null, quote: null, ride: null, checked: false, loading: false, quoting: false, sending: false, cancelling: false, error: null, quoteError: null };
const failure = (error: unknown, fallback: string) => error instanceof ApiError ? error.message : fallback;

// Montado apenas na Home do passageiro; o componente é identificado pela conta.
export function usePassengerRide(trip: PassengerTrip | null) {
  const [state, setState] = useState(initial);
  const snapshot = useRef(state);
  const alive = useRef(false);
  const foreground = useRef(AppState.currentState !== "background" && AppState.currentState !== "inactive");
  const session = useRef(getSessionVersion());
  const reading = useRef(false);
  const writing = useRef(false);
  const readAbort = useRef<AbortController | null>(null);
  const quoteAbort = useRef<AbortController | null>(null);
  const quoteVersion = useRef(0);
  const valid = useCallback(() => alive.current && session.current === getSessionVersion(), []);
  const update = useCallback((patch: Partial<State>) => {
    snapshot.current = { ...snapshot.current, ...patch };
    setState(snapshot.current);
  }, []);

  const refresh = useCallback(async () => {
    if (!valid() || !foreground.current || reading.current || writing.current) return;
    reading.current = true;
    const controller = new AbortController(); readAbort.current = controller;
    update({ loading: true, sending: false });
    try {
      let ride = await getActivePassengerRide(controller.signal);
      const previous = snapshot.current.ride;
      if (!ride && previous) ride = isActivePassengerRide(previous) ? await getPassengerRide(previous.id, controller.signal) : previous;
      if (ride?.status === "CANCELADA") ride = null;
      if (valid() && !controller.signal.aborted) update({ ride, checked: true, error: null });
    } catch (error) {
      if (valid() && !controller.signal.aborted) update({ checked: false, error: failure(error, "Não foi possível consultar sua corrida. Confira a conexão e atualize.") });
    } finally {
      reading.current = false;
      if (valid()) update({ loading: false });
    }
  }, [update, valid]);

  useFocusEffect(useCallback(() => {
    alive.current = true;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      const current = snapshot.current;
      if (!current.checked || (current.ride && isActivePassengerRide(current.ride))) await refresh();
      if (!stopped) timer = setTimeout(() => void poll(), 5000);
    };
    void poll();
    const subscription = AppState.addEventListener("change", value => {
      foreground.current = value === "active";
      if (foreground.current) void refresh();
      else { readAbort.current?.abort(); update({ checked: false }); }
    });
    const unsubscribe = onSessionCleared(() => {
      alive.current = false; stopped = true; clearTimeout(timer);
      readAbort.current?.abort(); quoteAbort.current?.abort(); update(initial);
    });
    return () => {
      alive.current = false; stopped = true; clearTimeout(timer);
      readAbort.current?.abort(); quoteAbort.current?.abort(); subscription.remove(); unsubscribe();
    };
  }, [refresh, update]));

  const loadCategories = useCallback(async () => {
    if (!trip || !valid()) return;
    const revision = ++quoteVersion.current;
    quoteAbort.current?.abort();
    const controller = new AbortController(); quoteAbort.current = controller;
    update({ categories: [], category: null, quote: null, quoting: true, quoteError: null });
    try {
      const categories = await getRideCategories(controller.signal);
      if (valid() && revision === quoteVersion.current && !controller.signal.aborted) update({ categories, quoteError: categories.length ? null : "Nenhum prestador elegível disponível no momento. Tente novamente em instantes." });
    } catch (error) {
      if (valid() && revision === quoteVersion.current && !controller.signal.aborted) update({ quoteError: failure(error, "Não foi possível carregar as categorias. Tente novamente.") });
    } finally {
      if (valid() && revision === quoteVersion.current) update({ quoting: false });
    }
  }, [trip, update, valid]);

  useFocusEffect(useCallback(() => {
    void loadCategories();
    return () => { quoteAbort.current?.abort(); };
  }, [loadCategories]));

  const selectCategory = async (category: string) => {
    if (!trip || !valid() || writing.current || snapshot.current.ride || !snapshot.current.categories.some(c => c.id === category)) return;
    const revision = ++quoteVersion.current;
    quoteAbort.current?.abort();
    const controller = new AbortController(); quoteAbort.current = controller;
    update({ category, quote: null, quoting: true, quoteError: null });
    try {
      const quote = await quotePassengerRide(trip, category, controller.signal);
      if (valid() && revision === quoteVersion.current && !controller.signal.aborted) update({ quote });
    } catch (error) {
      if (valid() && revision === quoteVersion.current && !controller.signal.aborted) update({ quoteError: failure(error, "Não foi possível calcular a cotação. Tente novamente.") });
    } finally {
      if (valid() && revision === quoteVersion.current) update({ quoting: false });
    }
  };

  const confirm = async () => {
    const current = snapshot.current;
    if (!trip || !valid() || !foreground.current || writing.current || reading.current || !current.checked || current.ride || current.quoting || !current.quote || current.category !== current.quote.categoriaVeiculoId) return;
    writing.current = true;
    update({ sending: true, error: null });
    try {
      // Revalida a corrida ativa imediatamente antes da escrita.
      const existing = await getActivePassengerRide();
      if (!valid()) return;
      if (existing) { update({ ride: existing, quote: null, checked: true }); return; }
      const categories = await getRideCategories();
      if (!valid()) return;
      update({ categories });
      if (!categories.some(category => category.id === current.category)) {
        update({ category: null, quote: null, quoteError: categories.length
          ? "Esta categoria não tem mais prestadores elegíveis. Escolha outra categoria."
          : "Nenhum prestador elegível disponível no momento. Tente novamente em instantes." });
        return;
      }
      const ride = await requestPassengerRide(trip, current.quote.categoriaVeiculoId);
      if (valid()) update({ ride, quote: null, checked: true });
    } catch (error) {
      if (valid()) update({ checked: false, quote: null, error: failure(error, "Não foi possível confirmar a solicitação. Atualize para verificar se a corrida foi criada antes de tentar novamente.") });
    } finally {
      writing.current = false;
      if (valid()) update({ sending: false });
    }
  };
  const cancelSearch = async () => {
    const current = snapshot.current.ride;
    if (!valid() || !foreground.current || writing.current || reading.current || !(current?.status === "SOLICITADA" || current?.status === "ACEITA")) return;
    writing.current = true;
    update({ cancelling: true, error: null });
    try {
      const result = await cancelPassengerSearch(current.id, current.status === "ACEITA");
      if (!valid()) return;
      update({ ride: result.active, checked: true, quote: null, category: null,
        error: result.cancelled ? null : "O status da corrida mudou. Confira a situação atual; nenhum novo cancelamento foi enviado." });
      if (!result.active) await loadCategories();
    } catch {
      if (valid()) update({ error: "Não foi possível confirmar o cancelamento e consultar a corrida ativa. Atualize ou tente novamente. A corrida não foi removida localmente." });
    } finally {
      writing.current = false;
      if (valid()) update({ cancelling: false });
    }
  };
  const newTrip = () => {
    if (snapshot.current.ride && !isActivePassengerRide(snapshot.current.ride)) {
      update({ ride: null, quote: null, category: null });
    }
  };
  return { ...state, refresh, loadCategories, selectCategory, confirm, cancelSearch, newTrip };
}
