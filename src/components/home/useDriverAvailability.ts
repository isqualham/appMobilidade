import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import type { User } from "../../services/auth/auth.types";
import { ApiError } from "../../services/api";
import { getSessionVersion, onSessionCleared } from "../../services/auth/session";
import { getUserLocation } from "../../services/location/location.service";
import {
  getAvailability, getEligibleVehicles, hasActiveRide, updateAvailability,
  type DriverAvailability, type DriverVehicle,
} from "../../services/prestador/disponibilidade.service";

export function isApprovedDriver(user: User | null): user is User {
  return Boolean(user?.prestador && user.statusAprovacao === "APROVADO" &&
    user.profiles.includes("provider") && user.telefoneVerificado);
}

export function useDriverAvailability(user: User | null) {
  const [availability, setAvailability] = useState<DriverAvailability | null>(null);
  const [vehicleChoices, setVehicleChoices] = useState<DriverVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<DriverVehicle | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const snapshot = useRef<DriverAvailability | null>(null);
  const choices = useRef<DriverVehicle[]>([]);
  const busy = useRef(false);
  const generation = useRef(0);
  const selectionGeneration = useRef(0);

  const cancelSelection = useCallback(() => {
    selectionGeneration.current += 1;
    choices.current = [];
    setVehicleChoices([]);
  }, []);

  const apply = useCallback((value: DriverAvailability) => {
    snapshot.current = value;
    setAvailability(value);
    setSelectedVehicle(value.status === "ONLINE"
      ? { id: value.veiculoId, label: "Veículo selecionado" } : null);
  }, []);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const current = generation.current;
    const session = getSessionVersion();
    const valid = () => current === generation.current && session === getSessionVersion();
    setChecking(true);
    setError(null);
    cancelSelection();
    try {
      const state = await getAvailability();
      if (valid()) apply(state);
    } catch (cause) {
      if (valid()) {
        snapshot.current = null;
        setAvailability(null);
        setError(cause instanceof ApiError && cause.status === 401
          ? "Sessão expirada. Entre novamente."
          : "Não foi possível consultar sua disponibilidade. Verifique a conexão e tente novamente.");
      }
    } finally {
      busy.current = false;
      if (valid()) setChecking(false);
    }
  }, [apply, cancelSelection]);

  useFocusEffect(useCallback(() => {
    void refresh();
    return cancelSelection;
  }, [refresh, cancelSelection]));

  useEffect(() => {
    const unsubscribe = onSessionCleared(() => {
      generation.current += 1;
      snapshot.current = null;
      setAvailability(null);
      setSelectedVehicle(null);
      cancelSelection();
    });
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") void refresh();
      // Apenas fecha a seleção; background/logout nunca mudam o estado no servidor.
      if (state === "background") cancelSelection();
    });
    return () => { generation.current += 1; unsubscribe(); subscription.remove(); };
  }, [refresh, cancelSelection]);

  async function goOnline() {
    if (busy.current) return;
    const selection = ++selectionGeneration.current;
    if (!isApprovedDriver(user)) {
      setError("Seu cadastro precisa estar aprovado e o telefone verificado para ficar online.");
      return;
    }
    busy.current = true;
    const current = generation.current;
    const session = getSessionVersion();
    const valid = () => current === generation.current && session === getSessionVersion();
    setChecking(true);
    setError(null);
    try {
      const state = await getAvailability();
      if (!valid()) return;
      apply(state);
      if (state.status === "ONLINE") return;
      const vehicles = await getEligibleVehicles();
      if (!valid()) return;
      if (!vehicles.length) {
        setError("Você precisa de um veículo ativo com categoria e tipo ativos para ficar online.");
        return;
      }
      await getUserLocation();
      if (!valid()) return;
      if (selection !== selectionGeneration.current) return;
      choices.current = vehicles;
      setVehicleChoices(vehicles);
    } catch (cause) {
      if (valid()) setError(cause instanceof Error ? cause.message : "Não foi possível consultar os veículos. Tente novamente.");
    } finally {
      busy.current = false;
      if (valid()) setChecking(false);
    }
  }

  async function change(status: "ONLINE" | "OFFLINE", vehicle?: DriverVehicle) {
    if (busy.current || !snapshot.current) return;
    if (snapshot.current.versao > 2147483646) {
      setError("Não é possível atualizar esta versão de disponibilidade. Entre em contato com o suporte.");
      return;
    }
    const versao = snapshot.current.versao;
    busy.current = true;
    const current = generation.current;
    const session = getSessionVersion();
    const valid = () => current === generation.current && session === getSessionVersion();
    setChecking(true);
    setError(null);
    cancelSelection();
    try {
      const state = await updateAvailability(status === "ONLINE" && vehicle
        ? { status: "ONLINE", veiculoId: vehicle.id, versao }
        : { status: "OFFLINE", versao });
      if (!valid()) return;
      apply(state);
      if (state.status === "ONLINE" && vehicle?.id === state.veiculoId) setSelectedVehicle(vehicle);
    } catch (cause) {
      if (!valid()) return;
      // Inclusive após timeout: consultar para reconciliar, jamais repetir o PATCH.
      snapshot.current = null;
      setAvailability(null);
      const conflict = cause instanceof ApiError && cause.status === 409;
      const results = await Promise.allSettled([getAvailability(), ...(conflict ? [hasActiveRide()] : [])]);
      if (!valid()) return;
      const state = results[0];
      if (state.status === "fulfilled" && typeof state.value !== "boolean") apply(state.value);
      const active = results[1];
      if (conflict) {
        setError(active?.status === "fulfilled" && active.value === true
          ? "Existe uma corrida ativa. Não é possível alterar a disponibilidade durante a corrida."
          : "Conflito ao alterar a disponibilidade: outra sessão pode ter atualizado o estado ou existe uma corrida ativa. Confira o status e tente novamente quando possível.");
      } else if (cause instanceof ApiError && cause.status === 400) {
        setError("Os dados de disponibilidade foram recusados. Atualize o status e selecione o veículo novamente.");
      } else if (cause instanceof ApiError && cause.status === 403) {
        setError("Alteração não permitida. Confira sua aprovação e se o veículo, a categoria e o tipo estão ativos.");
      } else if (cause instanceof ApiError && cause.status === 401) {
        setError("Sessão expirada. Entre novamente.");
      } else {
        setError("Não foi possível confirmar a alteração. Confira o status atual; se estiver indisponível, toque em Atualizar status antes de tentar novamente.");
      }
    } finally {
      busy.current = false;
      if (valid()) setChecking(false);
    }
  }

  async function selectVehicle(id: string) {
    const vehicle = choices.current.find(choice => choice.id === id);
    if (vehicle && isApprovedDriver(user)) await change("ONLINE", vehicle);
  }

  return {
    isOnline: availability?.status === "ONLINE", known: availability !== null,
    checking, error, selectedVehicle, vehicleChoices, goOnline,
    goOffline: () => change("OFFLINE"), selectVehicle, cancelSelection, refresh,
  };
}
