const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createMobileRuntime, ApiError, text, byLabel } = require("./helpers/mobile-runtime.cjs");
const id = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const trip = { origemEndereco: "Rua A", origemLatitude: -16, origemLongitude: -57, destinoEndereco: "Rua B", destinoLatitude: -16.1, destinoLongitude: -57.1 };
const categories = [{ id, nome: "Carro", ativo: true }, { id: other, nome: "Moto", ativo: true }];
const quote = { categoriaVeiculoId: id, valorTotal: 20.1, distanciaKm: 4, duracaoSegundos: 600 };
const ride = { id, status: "SOLICITADA", valorTotal: 21, distanciaKm: 4.2 };
const tick = () => new Promise(resolve => setImmediate(resolve));
function deferred() { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return { promise, resolve, reject }; }
function setup(overrides = {}, draft = trip) {
  const service = { getRideCategories: async () => categories, quotePassengerRide: async () => quote, getActivePassengerRide: async () => null, getPassengerRide: async () => ride, requestPassengerRide: async () => ride, isActivePassengerRide: r => ["SOLICITADA", "ACEITA", "PRESTADOR_A_CAMINHO", "EM_ANDAMENTO"].includes(r.status), ...overrides };
  const rt = createMobileRuntime({ fakeTimers: true, passengerService: service });
  const { usePassengerRide } = rt.load("src/components/home/usePassengerRide.ts");
  return { ...rt, renderHook: () => rt.render(() => usePassengerRide(draft)), draft: value => { draft=value; } };
}
async function ready(rt) { rt.renderHook(); await tick(); await rt.renderHook().selectCategory(id); }
test("contratos: categorias reais, cotação e solicitação sem preço nem passageiroId", async () => {
  const calls = [];
  const rt = createMobileRuntime({ apiRequest: async (url, options) => {
    calls.push([url, options]);
    if (url.includes("categorias")) return { categorias: categories.map(({ id, nome }) => ({ id, nome })) };
    return url.endsWith("cotacao") ? quote : { corrida: ride };
  } });
  const service = rt.load("src/services/corrida/passageiro.service.ts");
  assert.equal((await service.getRideCategories()).length, 2);
  assert.equal(calls[0][0], "/api/categorias-veiculo/disponiveis");
  await service.quotePassengerRide(trip, id);
  await service.requestPassengerRide({ ...trip, valorTotal: 1, passageiroId: other, distanciaKm: 999 }, id);
  assert.deepEqual(JSON.parse(calls[2][1].body), { ...trip, categoriaVeiculoId: id });
  assert.equal(calls[1][0], "/api/corrida/cotacao");
});
test("rejeita cotação de categoria diferente, dados inválidos e preserva duração nula", async () => {
  let value = { ...quote, duracaoSegundos: null };
  const rt = createMobileRuntime({ apiRequest: async () => value });
  const service = rt.load("src/services/corrida/passageiro.service.ts");
  assert.equal((await service.quotePassengerRide(trip, id)).duracaoSegundos, null);
  value = { ...quote, categoriaVeiculoId: other }; await assert.rejects(service.quotePassengerRide(trip, id));
  value = { ...quote, valorTotal: -1 }; await assert.rejects(service.quotePassengerRide(trip, id));
  await assert.rejects(service.requestPassengerRide({ ...trip, origemEndereco: "" }, id));
});
test("carrega categorias, cota e solicita apenas uma vez em toque duplo", async () => {
  const pending = deferred(); let writes = 0;
  const rt = setup({ requestPassengerRide: async () => { writes++; return pending.promise; } });
  await ready(rt); const state = rt.renderHook(); assert.equal(state.quote.valorTotal, 20.1);
  const first = state.confirm(); await tick(); await state.confirm(); assert.equal(writes, 1);
  pending.resolve(ride); await first; assert.equal(rt.renderHook().ride.status, "SOLICITADA"); rt.unmount();
});
test("recupera corrida ao reabrir sem trajeto e acompanha aceite e finalização", async () => {
  let active = ride;
  const rt = setup({ getActivePassengerRide: async () => active, getPassengerRide: async () => ({ ...ride, status: "FINALIZADA" }) }, null);
  rt.renderHook(); await tick(); assert.equal(rt.renderHook().ride.id, id);
  active = { ...ride, status: "ACEITA" }; rt.runTimers(); await tick(); assert.equal(rt.renderHook().ride.status, "ACEITA");
  active = null; rt.runTimers(); await tick(); assert.equal(rt.renderHook().ride.status, "FINALIZADA"); rt.unmount();
});
test("cotação atrasada não sobrescreve nova categoria ou trajeto", async () => {
  const pending = deferred();
  const rt = setup({ quotePassengerRide: async (_trip, category) => category === id ? pending.promise : { ...quote, categoriaVeiculoId: other } });
  rt.renderHook(); await tick(); const first = rt.renderHook().selectCategory(id);
  await rt.renderHook().selectCategory(other); pending.resolve(quote); await first;
  assert.equal(rt.renderHook().quote.categoriaVeiculoId, other);
  rt.draft({ ...trip, destinoEndereco: "Rua C" }); rt.renderHook(); await tick(); assert.equal(rt.renderHook().quote, null); rt.unmount();
});
test("falha de rede na criação não repete POST e recupera sucesso no polling", async () => {
  let active = null; let writes = 0;
  const rt = setup({ getActivePassengerRide: async () => active, requestPassengerRide: async () => { writes++; active = ride; throw new Error("timeout"); } });
  await ready(rt); await rt.renderHook().confirm(); assert.equal(rt.renderHook().checked, false);
  await rt.renderHook().confirm(); assert.equal(writes, 1);
  rt.runTimers(); await tick(); assert.equal(rt.renderHook().ride.id, id); rt.unmount();
});
test("corrida concorrente encontrada antes de criar evita POST", async () => {
  let active = null; let writes = 0;
  const rt = setup({ getActivePassengerRide: async () => active, requestPassengerRide: async () => { writes++; return ride; } });
  await ready(rt); active = ride; await rt.renderHook().confirm(); assert.equal(writes, 0); assert.equal(rt.renderHook().ride.id, id); rt.unmount();
});
test("erro de consulta bloqueia confirmação e erro 503 da cotação é mostrado", async () => {
  const rt = setup({ getActivePassengerRide: async () => { throw new Error("offline"); }, quotePassengerRide: async () => { throw new ApiError("Rotas indisponíveis", 503); } });
  await ready(rt); assert.equal(rt.renderHook().checked, false); assert.equal(rt.renderHook().quoteError, "Rotas indisponíveis"); rt.unmount();
});
test("logout ignora resposta atrasada; background suspende polling", async () => {
  let reads = 0; const pending = deferred();
  const rt = setup({ getActivePassengerRide: async () => { reads++; return pending.promise; } }, null);
  rt.renderHook(); rt.appState("background"); rt.runTimers(); assert.equal(reads, 1);
  rt.logout(); pending.resolve(ride); await tick(); assert.equal(rt.renderHook().ride, null); rt.unmount();
});
test("painel usa valores reais e mostra duração indisponível sem inventar minutos", () => {
  const rt = createMobileRuntime({ passengerRide: { categories, category: id, quote: { ...quote, duracaoSegundos: null }, checked: true } });
  const { PassengerRidePanel } = rt.load("src/components/home/PassengerRidePanel.tsx");
  const tree = PassengerRidePanel({ trip });
  assert.match(text(tree), /20,10/); assert.match(text(tree), /Duração indisponível/); assert.equal(byLabel(tree, "Confirmar corrida").props.disabled, false);
});
test("painel mantém Procurando prestador após criação sem nova navegação", () => {
  const rt = createMobileRuntime({ passengerRide: { ride, checked: true } });
  const { PassengerRidePanel } = rt.load("src/components/home/PassengerRidePanel.tsx");
  const tree = PassengerRidePanel({ trip }); assert.match(text(tree), /Procurando prestador\.\.\./); assert.equal(byLabel(tree, "Confirmar corrida"), undefined); assert.equal(rt.calls.routes.length, 0);
});
test("categorias vazias bloqueiam solicitação e explicam indisponibilidade", async () => {
  let writes = 0;
  const rt = setup({ getRideCategories: async () => [], requestPassengerRide: async () => { writes++; return ride; } });
  rt.renderHook(); await tick(); await rt.renderHook().confirm();
  assert.match(rt.renderHook().quoteError, /Nenhum prestador elegível/); assert.equal(writes, 0); rt.unmount();
});
test("409 preserva mensagem e reconcilia corrida concorrente por leitura", async () => {
  let active = null; let writes = 0;
  const rt = setup({ getActivePassengerRide: async () => active, requestPassengerRide: async () => { writes++; active = ride; throw new ApiError("Você já possui corrida ativa", 409); } });
  await ready(rt); await rt.renderHook().confirm(); assert.match(rt.renderHook().error, /corrida ativa/);
  await rt.renderHook().refresh(); assert.equal(rt.renderHook().ride.id, id); assert.equal(writes, 1); rt.unmount();
});
test("resposta malformada de corrida ativa é rejeitada", async () => {
  const rt = createMobileRuntime({ apiRequest: async () => ({ corrida: { id, status: "DESCONHECIDO" } }) });
  const service = rt.load("src/services/corrida/passageiro.service.ts");
  await assert.rejects(service.getActivePassengerRide());
});
test("Home passa origem e destino existentes para o painel sem nova rota", () => {
  let selectedTrip;
  const rt = createMobileRuntime({ realPassengerPanel: true, profile: "passenger", passengerRide: { categories, checked: true },
    params: { originName: trip.origemEndereco, originLatitude: String(trip.origemLatitude), originLongitude: String(trip.origemLongitude), destinationName: "Destino", destinationAddress: trip.destinoEndereco, destinationLatitude: String(trip.destinoLatitude), destinationLongitude: String(trip.destinoLongitude) },
  });
  const { HomeScreen } = rt.load("src/components/home/HomeScreen.tsx");
  const tree = rt.render(() => HomeScreen());
  function find(node) { if (!node || typeof node !== "object") return; if (node.props?.trip) selectedTrip = node.props.trip; const children = node.props?.children; (Array.isArray(children) ? children : [children]).forEach(find); }
  find(tree); assert.deepEqual(JSON.parse(JSON.stringify(selectedTrip)), trip);
  assert.match(text(tree), /Confirme sua corrida/); assert.equal(byLabel(tree, "Confirmar corrida").props.disabled, true);
  assert.equal(rt.calls.routes.length, 0);
});

test("revalidates eligible categories immediately before submitting and blocks removed choice", async () => {
  let available = categories; let reads = 0; let writes = 0;
  const rt = setup({ getRideCategories: async () => { reads++; return available; }, requestPassengerRide: async () => { writes++; return ride; } });
  await ready(rt); available = [categories[1]];
  await rt.renderHook().confirm();
  assert.equal(reads, 2); assert.equal(writes, 0); assert.equal(rt.renderHook().quote, null);
  assert.match(rt.renderHook().quoteError, /Escolha outra/); rt.unmount();
});
test("no eligible provider at confirmation blocks creation and allows categories retry", async () => {
  let available = categories; let writes = 0;
  const rt = setup({ getRideCategories: async () => available, requestPassengerRide: async () => { writes++; return ride; } });
  await ready(rt); available = []; await rt.renderHook().confirm();
  assert.equal(writes, 0); assert.equal(rt.renderHook().categories.length, 0);
  assert.match(rt.renderHook().quoteError, /Nenhum prestador/);
  available = categories; await rt.renderHook().loadCategories(); assert.equal(rt.renderHook().categories.length, 2); rt.unmount();
});
test("reopening without active ride does not show a stale pending request", async () => {
  const rt = setup({}, null); rt.renderHook(); await tick();
  assert.equal(rt.renderHook().ride, null); assert.equal(rt.renderHook().checked, true); rt.unmount();
});
test("cancelamento envia motivo e reconsulta ativa antes de retornar; deduplica escritas", async () => {
  const pending = deferred(); const calls = [];
  const rt = createMobileRuntime({ apiRequest: async (url, options) => {
    calls.push([url, options]);
    if (url.endsWith("/cancelar")) { await pending.promise; return { corrida: { ...ride, status: "CANCELADA" } }; }
    if (url.includes("/ativa")) return { corrida: null };
    return { corrida: ride };
  } });
  const service = rt.load("src/services/corrida/passageiro.service.ts");
  const first = service.cancelPassengerSearch(id); const second = service.cancelPassengerSearch(id);
  await tick(); assert.equal(calls.filter(c => c[0].endsWith("/cancelar")).length, 1);
  pending.resolve(); const result = await first; await second;
  assert.equal(result.active, null); assert.equal(result.cancelled, true);
  assert.equal(calls.at(-1)[0], "/api/corrida/ativa?papel=passageiro");
  assert.ok(JSON.parse(calls.find(c => c[1]?.method === "POST")[1].body).motivo);
});
for (const status of ["ACEITA", "EM_ANDAMENTO", "CANCELADA"]) {
  test(`cancelar busca não envia POST quando servidor já está ${status}`, async () => {
    let writes = 0;
    const rt = createMobileRuntime({ apiRequest: async (url, options) => {
      if (options?.method === "POST") writes++;
      return { corrida: url.includes("/ativa") && status === "CANCELADA" ? null : { ...ride, status } };
    } });
    const result = await rt.load("src/services/corrida/passageiro.service.ts").cancelPassengerSearch(id);
    assert.equal(writes, 0); assert.equal(result.cancelled, status === "CANCELADA");
  });
}
test("timeout de cancelamento reconcilia sucesso sem repetir POST", async () => {
  let cancelled = false; let writes = 0;
  const rt = createMobileRuntime({ apiRequest: async (url, options) => {
    if (options?.method === "POST") { writes++; cancelled = true; throw new Error("timeout"); }
    if (url.includes("/ativa")) return { corrida: null };
    return { corrida: { ...ride, status: cancelled ? "CANCELADA" : "SOLICITADA" } };
  } });
  const result = await rt.load("src/services/corrida/passageiro.service.ts").cancelPassengerSearch(id);
  assert.equal(result.cancelled, true); assert.equal(writes, 1);
});
test("painel mantém corrida enquanto cancelamento pendente ou sem confirmação", async () => {
  const pending = deferred();
  const rt = setup({ getActivePassengerRide: async () => ride, cancelPassengerSearch: () => pending.promise });
  rt.renderHook(); await tick(); const operation = rt.renderHook().cancelSearch();
  assert.equal(rt.renderHook().ride.id, id); assert.equal(rt.renderHook().cancelling, true);
  pending.reject(new Error("offline")); await operation;
  assert.equal(rt.renderHook().ride.id, id); assert.match(rt.renderHook().error, /não foi removida/); rt.unmount();
});
test("painel retorna à solicitação somente após cancelamento e consulta ativa confirmados", async () => {
  const rt = setup({ getActivePassengerRide: async () => ride, cancelPassengerSearch: async () => ({ cancelled: true, active: null }) });
  rt.renderHook(); await tick(); await rt.renderHook().cancelSearch();
  assert.equal(rt.renderHook().ride, null); assert.equal(rt.renderHook().quote, null); rt.unmount();
});
test("Cancelar busca solicita confirmação antes de executar", () => {
  let cancels = 0;
  const rt = createMobileRuntime({ passengerRide: { ride, cancelSearch: async () => { cancels++; } } });
  const { PassengerRidePanel } = rt.load("src/components/home/PassengerRidePanel.tsx");
  const tree = PassengerRidePanel({ trip }); byLabel(tree, "Cancelar busca").props.onPress();
  assert.equal(cancels, 0); rt.calls.alerts[0][2][1].onPress(); assert.equal(cancels, 1);
});
for (const cancel of [true, false]) {
  test(`logout oferece escolha explícita; cancelar=${cancel}`, async () => {
    let cancels = 0; let logouts = 0;
    const rt = createMobileRuntime({ signOut: async () => { logouts++; }, passengerService: {
      getActivePassengerRide: async () => ride,
      cancelPassengerSearch: async () => { cancels++; return { active: null, cancelled: true }; },
    } });
    const { SideMenu } = rt.load("src/components/navigation/SideMenu.tsx");
    const tree = rt.render(() => SideMenu({ visible: true, onClose() {} }));
    await byLabel(tree, "Sair da conta").props.onPress();
    assert.equal(logouts, 0); assert.equal(cancels, 0);
    const choice = rt.calls.alerts[0][2].find(b => b.text === (cancel ? "Cancelar busca e sair" : "Sair sem cancelar"));
    choice.onPress(); await tick(); assert.equal(cancels, cancel ? 1 : 0); assert.equal(logouts, 1); rt.unmount();
  });
}
test("logout não cancela corrida aceita nem em andamento", async () => {
  for (const status of ["ACEITA", "EM_ANDAMENTO"]) {
    let cancels = 0; let logouts = 0;
    const rt = createMobileRuntime({ signOut: async () => { logouts++; }, passengerService: {
      getActivePassengerRide: async () => ({ ...ride, status }), cancelPassengerSearch: async () => { cancels++; },
    } });
    const { SideMenu } = rt.load("src/components/navigation/SideMenu.tsx");
    await byLabel(rt.render(() => SideMenu({ visible: true, onClose() {} })), "Sair da conta").props.onPress();
    assert.equal(cancels, 0); assert.equal(logouts, 1); rt.unmount();
  }
});
test("status alterado durante confirmação de logout interrompe saída sem cancelar", async () => {
  let logouts = 0;
  const rt = createMobileRuntime({ signOut: async () => { logouts++; }, passengerService: {
    getActivePassengerRide: async () => ride,
    cancelPassengerSearch: async () => ({ active: { ...ride, status: "ACEITA" }, cancelled: false }),
  } });
  const { SideMenu } = rt.load("src/components/navigation/SideMenu.tsx");
  await byLabel(rt.render(() => SideMenu({ visible: true, onClose() {} })), "Sair da conta").props.onPress();
  rt.calls.alerts[0][2][2].onPress(); await tick(); assert.equal(logouts, 0); assert.equal(rt.calls.alerts.at(-1)[0], "Corrida atualizada"); rt.unmount();
});
test("cancelamento de ACEITA exige autorização explícita e confirma pela API", async () => {
  let writes = 0;
  const rt = createMobileRuntime({ apiRequest: async (url, options) => {
    if (options?.method === "POST") { writes++; return { corrida: { ...ride, status: "CANCELADA" } }; }
    return { corrida: url.includes("/ativa") ? null : { ...ride, status: "ACEITA" } };
  } });
  const result = await rt.load("src/services/corrida/passageiro.service.ts").cancelPassengerSearch(id, true);
  assert.equal(writes, 1); assert.equal(result.cancelled, true); assert.equal(result.active, null);
});
test("painel ACEITA mostra veículo real e confirmação de Cancelar corrida", () => {
  let cancels = 0;
  const rt = createMobileRuntime({ passengerRide: { ride: { ...ride, status: "ACEITA", veiculo: { marca: "Marca real", modelo: "Modelo real", placa: "ABC1D23", cor: "Azul" } }, cancelSearch: async () => { cancels++; } } });
  const { PassengerRidePanel } = rt.load("src/components/home/PassengerRidePanel.tsx");
  const tree = PassengerRidePanel({ trip }); assert.match(text(tree), /Marca real\s+Modelo real/); assert.match(text(tree), /ABC1D23/);
  byLabel(tree, "Cancelar corrida").props.onPress(); assert.equal(cancels, 0); rt.calls.alerts[0][2][1].onPress(); assert.equal(cancels, 1);
});
