import { z } from "zod";
import { apiRequest } from "../api";

const route = "/api/prestadores/disponibilidade";
const availabilitySchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ONLINE"), veiculoId: z.string().uuid(), versao: z.number().int().min(0).max(2147483647) }),
  z.object({ status: z.literal("OFFLINE"), veiculoId: z.null(), versao: z.number().int().min(0).max(2147483647) }),
]);
export type DriverAvailability = z.infer<typeof availabilitySchema>;
export type AvailabilityChange =
  | { status: "ONLINE"; veiculoId: string; versao: number }
  | { status: "OFFLINE"; versao: number };
export interface DriverVehicle { id: string; label: string }

function parseAvailability(data: unknown): DriverAvailability {
  const result = availabilitySchema.safeParse(data);
  if (!result.success) throw new Error("A API retornou uma disponibilidade inválida. Consulte novamente.");
  return result.data;
}

export async function getAvailability(): Promise<DriverAvailability> {
  return parseAvailability(await apiRequest<unknown>(route));
}

export async function updateAvailability(change: AvailabilityChange): Promise<DriverAvailability> {
  return parseAvailability(await apiRequest<unknown>(route, { method: "PATCH", body: JSON.stringify(change) }));
}

export async function getEligibleVehicles(): Promise<DriverVehicle[]> {
  const [vehicles, categories] = await Promise.all([
    apiRequest<unknown>("/api/veiculos"), apiRequest<unknown>("/api/categorias-veiculo"),
  ]);
  const vehicleResult = z.object({ veiculos: z.array(z.object({
    id: z.string().uuid(), marca: z.string(), modelo: z.string(), placa: z.string(),
    ativo: z.boolean(), categoriaVeiculoId: z.string().uuid(),
  })) }).safeParse(vehicles);
  const categoryResult = z.object({ categorias: z.array(z.object({ id: z.string().uuid(), ativo: z.boolean() })) }).safeParse(categories);
  if (!vehicleResult.success || !categoryResult.success) throw new Error("Não foi possível validar a lista de veículos. Tente novamente.");
  // O GET de categorias retorna somente categorias e tipos ativos; o PATCH revalida no servidor.
  const eligibleCategories = new Set(categoryResult.data.categorias.filter(c => c.ativo).map(c => c.id));
  return vehicleResult.data.veiculos
    .filter(v => v.ativo && eligibleCategories.has(v.categoriaVeiculoId))
    .map(v => ({ id: v.id, label: `${v.marca} ${v.modelo} · ${v.placa}` }));
}

export async function hasActiveRide(): Promise<boolean> {
  const result = z.object({ corrida: z.object({ id: z.string().uuid() }).nullable() })
    .safeParse(await apiRequest<unknown>("/api/corrida/ativa"));
  if (!result.success) throw new Error("Não foi possível verificar a corrida ativa.");
  return result.data.corrida !== null;
}
