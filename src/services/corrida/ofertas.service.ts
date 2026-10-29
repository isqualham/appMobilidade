import { offerDiagnostic } from "../offerDiagnostics";
import { z } from "zod";
import { apiRequest } from "../api";

const point = z.object({ latitude: z.number().finite().min(-90).max(90), longitude: z.number().finite().min(-180).max(180) });
const offerSchema = z.object({
  id: z.string().uuid(), status: z.literal("SOLICITADA"), categoriaVeiculoId: z.string().uuid(),
  valorTotal: z.number().finite().nonnegative(), origemAproximada: point, destinoAproximado: point,
});
export type DriverOffer = z.infer<typeof offerSchema> & { categoriaNome: string };
const pageSchema = z.object({ corridas: z.array(offerSchema), proximoCursor: z.string().min(1).nullable() });
const activeSchema = z.object({ corrida: z.object({ origem: point.extend({ endereco: z.string() }), destino: point.extend({ endereco: z.string() }), valorTotal: z.number().finite().nonnegative(), distanciaKm: z.number().finite().nonnegative(), id: z.string().uuid(), status: z.enum(["SOLICITADA", "ACEITA", "PRESTADOR_A_CAMINHO", "EM_ANDAMENTO"]) }).nullable() });

export type ActiveDriverRide = NonNullable<z.infer<typeof activeSchema>["corrida"]>;

export async function getActiveDriverRide(signal?: AbortSignal) {
  const parsed = activeSchema.safeParse(await apiRequest<unknown>("/api/corrida/ativa?papel=prestador", { signal }));
  if (!parsed.success) {
    offerDiagnostic({ stage: "page", endpoint: "active_driver_ride", reason: "invalid_response" });
    throw new Error("A API retornou uma corrida ativa inválida.");
  }
  offerDiagnostic({ stage: "state", occupied: Boolean(parsed.data.corrida) });
  return parsed.data.corrida;
}

// A ausência na primeira página não prova que a oferta deixou de existir.
export async function getDriverOffer(currentId?: string, signal?: AbortSignal): Promise<DriverOffer | null> {
  let cursor: string | null = null;
  let first: z.infer<typeof offerSchema> | undefined;
  let selected: z.infer<typeof offerSchema> | undefined;
  const seen = new Set<string>();
  let pageNumber = 0;
  do {
    const data = await apiRequest<unknown>(
      `/api/corrida/disponiveis?limite=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, { signal },
    );
    const count = data && typeof data === "object" && "corridas" in data && Array.isArray(data.corridas) ? data.corridas.length : undefined;
    const parsed = pageSchema.safeParse(data);
    offerDiagnostic({ stage: "page", count, page: ++pageNumber, hasNext: parsed.success ? parsed.data.proximoCursor !== null : undefined, reason: parsed.success ? undefined : "invalid_response" });
    if (!parsed.success) throw new Error("A API retornou ofertas inválidas. Atualize novamente.");
    const page = parsed.data;
    first ??= page.corridas[0];
    selected = currentId ? page.corridas.find(item => item.id === currentId) : first;
    if (selected) break;
    cursor = page.proximoCursor;
    if (cursor && (seen.has(cursor) || seen.size >= 20)) {
      offerDiagnostic({ stage: "page", reason: "pagination_limit", page: pageNumber });
      throw new Error("Não foi possível confirmar a disponibilidade da oferta. Atualize novamente.");
    }
    if (cursor) seen.add(cursor);
  } while (cursor);
  selected ??= first;
  if (!selected) { offerDiagnostic({ stage: "card", reason: "empty" }); return null; }
  let categoriaNome = "Categoria indisponível";
  try {
  const categories = z.object({ categorias: z.array(z.object({ id: z.string().uuid(), nome: z.string().min(1) })) })
    .parse(await apiRequest<unknown>("/api/categorias-veiculo", { signal }));
  categoriaNome = categories.categorias.find(c => c.id === selected.categoriaVeiculoId)?.nome ?? categoriaNome;
  } catch {
    // O catálogo complementa o card; sua indisponibilidade não invalida uma oferta real.
    if (signal?.aborted) throw new Error("Consulta cancelada.");
    offerDiagnostic({ stage: "category", reason: "unavailable" });
  }
  offerDiagnostic({ stage: "card", reason: "selected", keepingCurrent: selected.id === currentId });
  return { ...selected, categoriaNome };
}

export async function acceptDriverOffer(id: string, vehicleId: string) {
  const response = z.object({ corrida: z.object({ id: z.literal(id), status: z.literal("ACEITA") }) })
    .parse(await apiRequest<unknown>(`/api/corrida/${id}/aceitar`, { method: "POST", body: JSON.stringify({ veiculoId: vehicleId }) }));
  return response.corrida;
}

export async function refuseDriverOffer(id: string) {
  z.object({ corridaId: z.literal(id), recusada: z.literal(true), recusadaEm: z.string().datetime() })
    .parse(await apiRequest<unknown>(`/api/corrida/${id}/recusar`, { method: "POST", body: "{}" }));
}

export async function startDriverRide(id: string) {
  const response = z.object({ corrida: z.object({ id: z.literal(id), status: z.literal("EM_ANDAMENTO") }) })
    .parse(await apiRequest<unknown>(`/api/corrida/${id}/iniciar`, { method: "POST" }));
  return response.corrida;
}

export async function finishDriverRide(id: string) {
  return z.object({ corrida: z.object({ id: z.literal(id), status: z.literal("FINALIZADA") }) })
    .parse(await apiRequest<unknown>(`/api/corrida/${id}/finalizar`, { method: "POST" })).corrida;
}
