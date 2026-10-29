import { VehicleCategory } from "./VehicleCategory";
import { Alert, ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../theme";
import { driverStyles as styles } from "./DriverHomeStyles";
import type { useDriverOffers } from "./useDriverOffers";

type Props = { offers: ReturnType<typeof useDriverOffers>; blocked: boolean; maxHeight: number; collapsed?: boolean; onToggle?: () => void };
export function DriverOfferCard({ offers, blocked, maxHeight, collapsed = false, onToggle }: Props) {
  const { offer, activeId, loading, busy, error, verified } = offers;
  const disabled = blocked || loading || busy || !verified;
  const region = (point: { latitude: number; longitude: number }) => `${point.latitude.toFixed(2)}, ${point.longitude.toFixed(2)}`;
  return (
    <View style={[styles.offerCard, { maxHeight }]} accessibilityLiveRegion="polite">
      {onToggle && <TouchableOpacity style={styles.panelToggle} accessibilityRole="button" accessibilityLabel={collapsed ? "Expandir detalhes da corrida" : "Recolher detalhes da corrida"} accessibilityState={{ expanded: !collapsed }} onPress={onToggle}>
        <Text style={styles.availabilityLabel}>{offers.activeRide?.status === "EM_ANDAMENTO" ? "Em andamento" : "A caminho do embarque"} · {collapsed ? "Ver detalhes" : "Recolher"}</Text>
      </TouchableOpacity>}
      {!collapsed && <ScrollView contentContainerStyle={styles.offerContent}>
        <View style={styles.offerHeading}>
          <Text style={styles.cardTitle}>{activeId ? "Corrida ativa" : offer ? offer.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : loading ? "Buscando ofertas…" : error ? "Ofertas indisponíveis" : "Nenhuma oferta disponível"}</Text>
          {(loading || busy) && <ActivityIndicator color={colors.feedback.success} accessibilityLabel={busy ? "Enviando resposta" : "Consultando ofertas"} />}
        </View>
        {activeId && <Text style={styles.cardSubtitle}>Você possui uma corrida ativa. Novas ofertas ficam suspensas.</Text>}
        {offers.activeRide && <>
          <Text style={styles.cardTitle}>{offers.activeRide.status === "EM_ANDAMENTO" ? "Corrida em andamento" : "Vá até o embarque"}</Text>
          <Text style={styles.cardSubtitle}>Origem: {offers.activeRide.origem?.endereco}</Text>
          <Text style={styles.cardSubtitle}>Destino: {offers.activeRide.destino?.endereco}</Text>
          <Text style={styles.cardSubtitle}>{offers.activeRide.valorTotal?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} · {offers.activeRide.distanciaKm} km</Text>
        </>}
        {offer && <>
          <VehicleCategory name={offer.categoriaNome} textStyle={styles.offerCategory} />
          <Text style={styles.cardSubtitle}>Origem aproximada: {region(offer.origemAproximada)}</Text>
          <Text style={styles.cardSubtitle}>Destino aproximado: {region(offer.destinoAproximado)}</Text>
        </>}
        {!offer && !activeId && !loading && !error && <Text style={styles.cardSubtitle}>Aguardando solicitações para seu veículo Online.</Text>}
        {offers.notice && <Text style={styles.cardSubtitle}>{offers.notice}</Text>}
        {error && <Text style={styles.offerError} accessibilityRole="alert">{error}</Text>}
        {(error || activeId) && <TouchableOpacity style={styles.offerSecondary} accessibilityRole="button" accessibilityLabel="Atualizar ofertas" disabled={loading || busy} onPress={() => void offers.refresh()}>
          <Text style={styles.availabilityLabel}>Atualizar ofertas</Text>
        </TouchableOpacity>}
      </ScrollView>}
      {collapsed && <View style={styles.compactRideCopy}>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{offers.activeRide?.status === "EM_ANDAMENTO" ? offers.activeRide.destino?.endereco : offers.activeRide?.origem?.endereco}</Text>
        {(error || offers.notice) && <Text style={styles.offerError} accessibilityRole="alert">{error || offers.notice}</Text>}
        {error && <TouchableOpacity style={styles.offerSecondary} accessibilityRole="button" accessibilityLabel="Atualizar corrida" disabled={loading || busy} onPress={() => void offers.refresh()}><Text>Atualizar corrida</Text></TouchableOpacity>}
      </View>}
      {offers.activeRide && ["ACEITA", "PRESTADOR_A_CAMINHO"].includes(offers.activeRide.status) && <TouchableOpacity style={[styles.offerPrimary, styles.rideAction, disabled && styles.buttonBusy]} accessibilityRole="button" accessibilityLabel="Iniciar corrida" disabled={disabled}
        onPress={() => Alert.alert("Iniciar corrida?", "Confirme o embarque do passageiro antes de iniciar.", [
          { text: "Voltar", style: "cancel" }, { text: "Iniciar", onPress: () => void offers.startRide() },
        ])}><Text style={styles.availabilityLabel}>Iniciar corrida</Text></TouchableOpacity>}
      {offers.activeRide?.status === "EM_ANDAMENTO" && <TouchableOpacity style={[styles.offerPrimary, styles.rideAction, disabled && styles.buttonBusy]} accessibilityRole="button" accessibilityLabel="Finalizar corrida" disabled={disabled}
        onPress={() => Alert.alert("Finalizar corrida?", "Confirme que a viagem foi concluída.", [
          { text: "Voltar", style: "cancel" }, { text: "Finalizar", onPress: () => void offers.finishRide() },
        ])}><Text style={styles.availabilityLabel}>{busy ? "Aguarde…" : "Finalizar corrida"}</Text></TouchableOpacity>}
      {offer && !activeId && <View style={styles.offerActions}>
        <TouchableOpacity style={[styles.offerSecondary, styles.offerAction, disabled && styles.buttonBusy]} accessibilityRole="button" accessibilityLabel="Recusar oferta" accessibilityState={{ disabled }} disabled={disabled} onPress={() => void offers.refuse()}>
          <Text style={styles.availabilityLabel}>Recusar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.offerPrimary, styles.offerAction, disabled && styles.buttonBusy]} accessibilityRole="button" accessibilityLabel="Aceitar oferta" accessibilityState={{ disabled }} disabled={disabled} onPress={() => void offers.accept()}>
          <Text style={styles.availabilityLabel}>Aceitar</Text>
        </TouchableOpacity>
      </View>}
    </View>
  );
}
