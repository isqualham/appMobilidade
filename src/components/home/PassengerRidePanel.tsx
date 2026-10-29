import { VehicleCategory } from "./VehicleCategory";
import type { ReactNode } from "react";
import { Alert, ActivityIndicator, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { colors } from "../../theme";
import { isActivePassengerRide, type PassengerTrip, type PassengerRide } from "../../services/corrida/passageiro.service";
import { usePassengerRide } from "./usePassengerRide";
import { driverStyles as cardStyles } from "./DriverHomeStyles";
import { styles } from "./HomeScreenStyles";

const statusLabels: Record<PassengerRide["status"], string> = {
  SOLICITADA: "Procurando prestador...", ACEITA: "Corrida aceita", PRESTADOR_A_CAMINHO: "Prestador a caminho",
  EM_ANDAMENTO: "Corrida em andamento", FINALIZADA: "Corrida finalizada", CANCELADA: "Corrida cancelada", ENCERRADA_ANTECIPADAMENTE: "Corrida encerrada antecipadamente",
};
export function PassengerRidePanel({ trip, children }: { trip: PassengerTrip | null; children: ReactNode }) {
  const ride = usePassengerRide(trip);
  const { height } = useWindowDimensions();
  if (!trip && !ride.ride && ride.checked && !ride.error) return children;
  const disabled = !ride.checked || ride.loading || ride.sending || ride.quoting || !ride.quote;
  const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return (
    <View style={[styles.bottomSheet, { maxHeight: height * 0.48 }]} accessibilityLiveRegion="polite">
      <ScrollView>
        <View style={styles.handle} />
        <Text style={cardStyles.cardTitle}>{ride.ride ? statusLabels[ride.ride.status] : trip ? "Confirme sua corrida" : "Consultando corrida ativa…"}</Text>
        {(ride.loading || ride.quoting || ride.sending || ride.cancelling) && <ActivityIndicator color={colors.feedback.success} accessibilityLabel={ride.sending ? "Solicitando corrida" : "Carregando dados da corrida"} />}
        {ride.ride ? <>
          <Text style={cardStyles.cardSubtitle}>{money(ride.ride.valorTotal)} · {ride.ride.distanciaKm.toLocaleString("pt-BR")} km</Text>
          <Text style={cardStyles.cardSubtitle}>O status é atualizado automaticamente.</Text>
          {ride.ride.status === "ACEITA" && <>
            {ride.ride.veiculo && <Text style={cardStyles.cardSubtitle}>{ride.ride.veiculo.marca} {ride.ride.veiculo.modelo} · {ride.ride.veiculo.placa}{ride.ride.veiculo.cor ? ` · ${ride.ride.veiculo.cor}` : ""}</Text>}
            <Text style={cardStyles.cardSubtitle}>Nome e contato do prestador não disponibilizados pela API.</Text>
          </>}
          {(ride.ride.status === "SOLICITADA" || ride.ride.status === "ACEITA") && <TouchableOpacity style={cardStyles.offerSecondary} accessibilityRole="button" accessibilityLabel={ride.ride.status === "ACEITA" ? "Cancelar corrida" : "Cancelar busca"}
            disabled={ride.cancelling || ride.loading} accessibilityState={{ disabled: ride.cancelling || ride.loading, busy: ride.cancelling }}
            onPress={() => Alert.alert(ride.ride?.status === "ACEITA" ? "Cancelar corrida?" : "Cancelar busca?", "Deseja confirmar o cancelamento?", [
              { text: "Voltar", style: "cancel" },
              { text: ride.ride?.status === "ACEITA" ? "Cancelar corrida" : "Cancelar busca", style: "destructive", onPress: () => void ride.cancelSearch() },
            ])}>
            <Text style={cardStyles.availabilityLabel}>{ride.cancelling ? "Cancelando…" : ride.ride.status === "ACEITA" ? "Cancelar corrida" : "Cancelar busca"}</Text>
          </TouchableOpacity>}
          {!isActivePassengerRide(ride.ride) && <TouchableOpacity style={cardStyles.vehicleOption} accessibilityRole="button" accessibilityLabel="Escolher novo trajeto" onPress={() => { ride.newTrip(); router.push("/destination"); }}>
            <Text style={cardStyles.cancelLabel}>Escolher novo trajeto</Text>
          </TouchableOpacity>}
        </> : trip && <>
          <Text style={cardStyles.cardSubtitle}>Origem: {trip.origemEndereco}</Text>
          <Text style={cardStyles.cardSubtitle}>Destino: {trip.destinoEndereco}</Text>
          <TouchableOpacity style={cardStyles.vehicleOption} accessibilityRole="button" accessibilityLabel="Alterar origem e destino" disabled={ride.sending} onPress={() => router.push("/destination")}>
            <Text style={cardStyles.cancelLabel}>Alterar trajeto</Text>
          </TouchableOpacity>
          <Text style={cardStyles.cardTitle}>Escolha a categoria</Text>
          {ride.categories.map(category => <TouchableOpacity key={category.id}
            style={[cardStyles.vehicleOption, ride.category === category.id && cardStyles.onlineHalo]}
            accessibilityRole="button" accessibilityLabel={`Selecionar categoria ${category.nome}`}
            accessibilityState={{ selected: ride.category === category.id, disabled: ride.sending }} disabled={ride.sending}
            onPress={() => void ride.selectCategory(category.id)}>
            <VehicleCategory name={category.nome} textStyle={cardStyles.vehicleLabel} />
          </TouchableOpacity>)}
          {ride.quote && <>
            <Text style={cardStyles.cardTitle}>{money(ride.quote.valorTotal)}</Text>
            <Text style={cardStyles.cardSubtitle}>{ride.quote.distanciaKm.toLocaleString("pt-BR")} km · {ride.quote.duracaoSegundos === null ? "Duração indisponível" : `${Math.ceil(ride.quote.duracaoSegundos / 60)} min estimados`}</Text>
            <Text style={cardStyles.cardSubtitle}>Estimativa da API. O valor será recalculado ao solicitar.</Text>
          </>}
          {ride.quoteError && <Text style={cardStyles.offerError} accessibilityRole="alert">{ride.quoteError}</Text>}
          {ride.quoteError && <TouchableOpacity style={cardStyles.offerSecondary} accessibilityRole="button" accessibilityLabel="Atualizar cotação" disabled={ride.quoting || ride.sending} onPress={() => void (ride.category ? ride.selectCategory(ride.category) : ride.loadCategories())}>
            <Text style={cardStyles.availabilityLabel}>Tentar novamente</Text>
          </TouchableOpacity>}
        </>}
        {ride.error && <Text style={cardStyles.offerError} accessibilityRole="alert">{ride.error}</Text>}
        {ride.error && <TouchableOpacity style={cardStyles.offerSecondary} accessibilityRole="button" accessibilityLabel="Atualizar corrida" disabled={ride.loading || ride.sending} onPress={() => void ride.refresh()}>
          <Text style={cardStyles.availabilityLabel}>Atualizar corrida</Text>
        </TouchableOpacity>}
      </ScrollView>
      {trip && !ride.ride && <TouchableOpacity style={[cardStyles.offerPrimary, disabled && cardStyles.buttonBusy]} accessibilityRole="button" accessibilityLabel="Confirmar corrida" accessibilityState={{ disabled, busy: ride.sending }} disabled={disabled} onPress={() => void ride.confirm()}>
        <Text style={cardStyles.availabilityLabel}>{ride.sending ? "Solicitando…" : "Confirmar corrida"}</Text>
      </TouchableOpacity>}
    </View>
  );
}
