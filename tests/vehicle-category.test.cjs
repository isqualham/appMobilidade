const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createMobileRuntime, text, nodes } = require("./helpers/mobile-runtime.cjs");

for (const [name, icon] of [["Moto", "motorbike"], ["Carro Econômico", "car-front"], ["Carro Premium", "car-front"], ["Carro Porta-Malas Grande", "car-front"]]) {
  test(`categoria mantém nome da API e ícone correto: ${name}`, () => {
    const rt = createMobileRuntime();
    const { VehicleCategory } = rt.load("src/components/home/VehicleCategory.tsx");
    const tree = rt.render(() => VehicleCategory({ name }));
    assert.equal(text(tree), name);
    assert.ok(nodes(tree).some(n => n.type === "Icon" && n.props.name === icon));
  });
}
test("categoria desconhecida preserva nome e não inventa tipo de veículo", () => {
  const rt = createMobileRuntime();
  const { VehicleCategory, categoryIcon } = rt.load("src/components/home/VehicleCategory.tsx");
  assert.equal(text(rt.render(() => VehicleCategory({ name: "Categoria indisponível" }))), "Categoria indisponível");
  assert.equal(categoryIcon("Categoria indisponível"), undefined);
});
test("seleção do prestador associa nome da API pelo ID sem mudar elegibilidade", async () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const rt = createMobileRuntime({ apiRequest: async url => url === "/api/veiculos"
    ? { veiculos: [{ id, marca: "Marca", modelo: "Modelo", placa: "ABC1D23", ativo: true, statusAprovacao: "APROVADO", categoriaVeiculoId: id }] }
    : { categorias: [{ id, nome: "Moto", ativo: true }] } });
  const { getEligibleVehicles } = rt.load("src/services/prestador/disponibilidade.service.ts");
  const result = await getEligibleVehicles();
  assert.equal(result.length, 1);
  assert.equal(result[0].id, id);
  assert.equal(result[0].categoriaNome, "Moto");
  assert.equal(result[0].label, "Marca Modelo · ABC1D23");
});
