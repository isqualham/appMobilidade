import { assertSessionVersion, getSessionVersion } from "../auth/session";
import { z } from "zod";
import { apiRequest } from "../api";

export const tripSchema = z.object({
  origemEndereco: z.string().trim().min(1).max(500),
  origemLatitude: z.number().finite().min(-90).max(90), origemLongitude: z.number().finite().min(-180).max(180),
  destinoEndereco: z.string().trim().min(1).max(500),
  destinoLatitude: z.number().finite().min(-90).max(90), destinoLongitude: z.number().finite().min(-180).max(180),
});
export type PassengerTrip = z.infer<typeof tripSchema>;
const requestSchema = tripSchema.extend({ categoriaVeiculoId: z.string().uuid() });
const categorySchema = z.object({ id: z.string().uuid(), nome: z.string().min(1) });
export type RideCategory = z.infer<typeof categorySchema>;
const quoteSchema = z.object({ categoriaVeiculoId: z.string().uuid(), valorTotal: z.number().finite().nonnegative(), distanciaKm: z.number().finite().nonnegative(), duracaoSegundos: z.number().finite().nonnegative().nullable() });
export type RideQuote = z.infer<typeof quoteSchema>;
const rideSchema = z.object({ veiculo: z.object({ placa: z.string(), marca: z.string(), modelo: z.string(), cor: z.string().nullable() }).nullable().optional(), id: z.string().uuid(), status: z.enum(["SOLICITADA", "ACEITA", "PRESTADOR_A_CAMINHO", "EM_ANDAMENTO", "FINALIZADA", "CANCELADA", "ENCERRADA_ANTECIPADAMENTE"]), valorTotal: z.number().finite().nonnegative(), distanciaKm: z.number().finite().nonnegative() });
export type PassengerRide = z.infer<typeof rideSchema>;
export const isActivePassengerRide = (ride: PassengerRide) => ["SOLICITADA", "ACEITA", "PRESTADOR_A_CAMINHO", "EM_ANDAMENTO"].includes(ride.status);
export async function getRideCategories(signal?: AbortSignal) {
  return z.object({ categorias: z.array(categorySchema) }).parse(await apiRequest<unknown>("/api/categorias-veiculo/disponiveis", { signal })).categorias;
}
export async function quotePassengerRide(trip: PassengerTrip, category: string, signal?: AbortSignal) {
  const body = requestSchema.parse({ ...trip, categoriaVeiculoId: category });
  const quote = quoteSchema.parse(await apiRequest<unknown>("/api/corrida/cotacao", { method: "POST", body: JSON.stringify(body), signal }));
  if (quote.categoriaVeiculoId !== category) throw new Error("A categoria da cotação não corresponde à seleção.");
  return quote;
}
export async function requestPassengerRide(trip: PassengerTrip, category: string) {
  // Lista explícita pelo schema: preço, distância, duração e passageiroId nunca são enviados.
  const body = requestSchema.parse({ ...trip, categoriaVeiculoId: category });
  return z.object({ corrida: rideSchema }).parse(await apiRequest<unknown>("/api/corrida", { method: "POST", body: JSON.stringify(body) })).corrida;
}
export async function getActivePassengerRide(signal?: AbortSignal) {
  const ride = z.object({ corrida: rideSchema.nullable() }).parse(await apiRequest<unknown>("/api/corrida/ativa?papel=passageiro", { signal })).corrida;
  if (ride && !isActivePassengerRide(ride)) throw new Error("Resposta de corrida ativa inválida.");
  return ride;
}
export async function getPassengerRide(id: string, signal?: AbortSignal) {
  const ride = z.object({ corrida: rideSchema }).parse(await apiRequest<unknown>(`/api/corrida/${id}`, { signal })).corrida;
  if (ride.id !== id) throw new Error("Resposta de corrida inválida.");
  return ride;
}

// Compartilhado entre painel e menu: uma escrita por corrida/sessão, sem retry automático.
const cancellations = new Map<string, Promise<{ active: PassengerRide | null; cancelled: boolean }>>();
export function cancelPassengerSearch(id: string, accepted = false) {
  const version = getSessionVersion();
  const key = `${version}/${id}/${accepted}`;
  const pending = cancellations.get(key);
  if (pending) return pending;
  const operation = (async () => {
    const previous = await getPassengerRide(id);
    assertSessionVersion(version);
    const allowed = previous.status === "SOLICITADA" || (accepted && previous.status === "ACEITA");
    if (allowed) {
      try {
        const result = z.object({ corrida: rideSchema }).parse(await apiRequest<unknown>(`/api/corrida/${id}/cancelar`, {
          method: "POST", body: JSON.stringify({ motivo: accepted ? "Passageiro solicitou cancelamento da corrida" : "Passageiro cancelou a busca por prestador" }),
        }));
        if (result.corrida.id !== id || result.corrida.status !== "CANCELADA") throw new Error("Cancelamento não confirmado.");
      } catch {
        assertSessionVersion(version);
        const actual = await getPassengerRide(id);
        assertSessionVersion(version);
        if (actual.status === "SOLICITADA" || (accepted && actual.status === "ACEITA")) throw new Error("Não foi possível confirmar o cancelamento. A busca permanece ativa. Confira a conexão e tente novamente.");
        if (actual.status !== "CANCELADA") return { active: await getActivePassengerRide(), cancelled: false };
      }
    }
    assertSessionVersion(version);
    const active = await getActivePassengerRide();
    assertSessionVersion(version);
    return { active, cancelled: allowed || previous.status === "CANCELADA" };
  })();
  cancellations.set(key, operation);
  void operation.finally(() => { if (cancellations.get(key) === operation) cancellations.delete(key); }).catch(() => undefined);
  return operation;
}
