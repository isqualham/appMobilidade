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
export interface DriverVehicle { id: string; label: string; categoriaNome?: string }

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
    statusAprovacao: z.enum(["APROVADO", "PENDENTE", "REJEITADO", "SUSPENSO"]),
  })) }).safeParse(vehicles);
  const categoryResult = z.object({ categorias: z.array(z.object({ id: z.string().uuid(), ativo: z.boolean(), nome: z.string().min(1).optional() })) }).safeParse(categories);
  if (!vehicleResult.success || !categoryResult.success) throw new Error("Não foi possível validar a lista de veículos. Tente novamente.");
  // O GET de categorias retorna somente categorias e tipos ativos; o PATCH revalida no servidor.
  const eligibleCategories = new Set(categoryResult.data.categorias.filter(c => c.ativo).map(c => c.id));
  const eligible = vehicleResult.data.veiculos
    .filter(v => v.statusAprovacao === "APROVADO" && v.ativo && eligibleCategories.has(v.categoriaVeiculoId))
    .map(v => ({ id: v.id, label: `${v.marca} ${v.modelo} · ${v.placa}`,
      ...(categoryResult.data.categorias.find(c => c.id === v.categoriaVeiculoId)?.nome
        ? { categoriaNome: categoryResult.data.categorias.find(c => c.id === v.categoriaVeiculoId)!.nome } : {}),
    }));
  if (!eligible.length && vehicleResult.data.veiculos.length) {
    const statuses = new Set(vehicleResult.data.veiculos.map(v => v.statusAprovacao));
    const messages = ["Nenhum veículo está elegível para ficar online."];
    if (statuses.has("PENDENTE")) messages.push("Há veículo pendente de aprovação. Aguarde a análise da administração.");
    if (statuses.has("REJEITADO")) messages.push("Há veículo rejeitado. Entre em contato com a administração para revisar o cadastro.");
    if (statuses.has("SUSPENSO")) messages.push("Há veículo suspenso. Entre em contato com a administração para regularizar a situação.");
    if (statuses.has("APROVADO")) messages.push("O veículo aprovado também precisa estar ativo, com categoria e tipo ativos.");
    throw new Error(messages.join(" "));
  }
  return eligible;
}

export async function hasActiveRide(): Promise<boolean> {
  const result = z.object({ corrida: z.object({ id: z.string().uuid() }).nullable() })
    .safeParse(await apiRequest<unknown>("/api/corrida/ativa"));
  if (!result.success) throw new Error("Não foi possível verificar a corrida ativa.");
  return result.data.corrida !== null;
}
