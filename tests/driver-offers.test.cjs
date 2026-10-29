const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createMobileRuntime, ApiError, text, byLabel } = require("./helpers/mobile-runtime.cjs");
const id = "11111111-1111-4111-8111-111111111111";
const second = "22222222-2222-4222-8222-222222222222";
const offer = { id, status: "SOLICITADA", categoriaVeiculoId: id, categoriaNome: "Carro", valorTotal: 12.34, origemAproximada: { latitude: -16.07, longitude: -57.68 }, destinoAproximado: { latitude: -16.08, longitude: -57.69 } };
const tick = () => new Promise(resolve => setImmediate(resolve));
function deferred() { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return { promise, resolve, reject }; }
function setup(overrides = {}) {
  const service = { getActiveDriverRide: async () => null, getDriverOffer: async () => offer, acceptDriverOffer: async () => ({ id, status: "ACEITA" }), refuseDriverOffer: async () => {}, ...overrides };
  const runtime = createMobileRuntime({ fakeTimers: true, offersService: service });
  const { useDriverOffers } = runtime.load("src/components/home/useDriverOffers.ts");
  let vehicle = id;
  return { ...runtime, service, renderHook: () => runtime.render(() => useDriverOffers(vehicle, "driver")), vehicle: value => { vehicle = value; } };
}
test("oferta fixa é procurada nas páginas seguintes sem trocar pela primeira", async () => {
  const urls = [];
  const runtime = createMobileRuntime({ apiRequest: async url => {
    urls.push(url);
    if (url === "/api/categorias-veiculo") return { categorias: [{ id, nome: "Carro" }] };
    return url.includes("cursor=") ? { corridas: [offer], proximoCursor: null } : { corridas: [{ ...offer, id: second }], proximoCursor: "next" };
  } });
  const result = await runtime.load("src/services/corrida/ofertas.service.ts").getDriverOffer(id);
  assert.equal(result.id, id); assert.equal(result.categoriaNome, "Carro"); assert.equal(urls[0], "/api/corrida/disponiveis?limite=50"); assert.ok(urls.every(url => !url.includes("veiculoId="))); assert.match(urls[1], /cursor=next/);
});
test("oferta ausente após percorrer páginas permite a próxima; respostas inválidas falham", async () => {
  let invalid = false;
  const runtime = createMobileRuntime({ apiRequest: async url => url.includes("categorias") ? { categorias: [{ id, nome: "Carro" }] } : { corridas: [{ ...offer, id: second, valorTotal: invalid ? -1 : 10 }], proximoCursor: null } });
  const service = runtime.load("src/services/corrida/ofertas.service.ts");
  assert.equal((await service.getDriverOffer(id)).id, second);
  invalid = true; await assert.rejects(service.getDriverOffer(id));
});
test("aceite envia veículo; recusa envia corpo vazio e valida confirmação", async () => {
  const calls = [];
  const runtime = createMobileRuntime({ apiRequest: async (url, options) => {
    calls.push([url, options]);
    return url.endsWith("aceitar") ? { corrida: { id, status: "ACEITA" } } : { corridaId: id, recusada: true, recusadaEm: "2026-10-28T12:00:00.000Z" };
  } });
  const service = runtime.load("src/services/corrida/ofertas.service.ts");
  await service.acceptDriverOffer(id, second); await service.refuseDriverOffer(id);
  assert.deepEqual(JSON.parse(calls[0][1].body), { veiculoId: second });
  assert.equal(calls[1][0], `/api/corrida/${id}/recusar`); assert.equal(calls[1][1].body, "{}");
});
test("recusa busca automaticamente próxima oferta e bloqueia clique duplo", async () => {
  const pending = deferred(); let refusals = 0; let next = offer;
  const rt = setup({ getDriverOffer: async () => next, refuseDriverOffer: async () => { refusals++; await pending.promise; next = { ...offer, id: second }; } });
  rt.renderHook(); await tick(); const state = rt.renderHook();
  const first = state.refuse(); await state.accept(); await state.refuse();
  assert.equal(refusals, 1); pending.resolve(); await first;
  assert.equal(rt.renderHook().offer.id, second); rt.unmount();
});
test("consulta periódica envia ID fixo; erro preserva card e desabilita ações", async () => {
  let calls = 0; let current;
  const rt = setup({ getDriverOffer: async (held) => { current = held; if (++calls > 1) throw new Error("offline"); return offer; } });
  rt.renderHook(); await tick(); rt.runTimers(); await tick();
  const state = rt.renderHook(); assert.equal(current, id); assert.equal(state.offer.id, id); assert.equal(state.verified, false); assert.ok(state.error); rt.unmount();
});
test("409 reconcilia oferta perdida sem repetir POST", async () => {
  let calls = 0; let next = offer;
  const rt = setup({ getDriverOffer: async () => next, acceptDriverOffer: async () => { calls++; next = null; throw new ApiError("Conflito", 409); } });
  rt.renderHook(); await tick(); await rt.renderHook().accept();
  assert.equal(rt.renderHook().offer, null); assert.equal(calls, 1); rt.unmount();
});
test("resposta de aceite perdida recupera corrida ativa sem repetir escrita", async () => {
  let active = null; let calls = 0;
  const rt = setup({ getActiveDriverRide: async () => active, acceptDriverOffer: async () => { calls++; active = { id, status: "ACEITA" }; throw new Error("timeout"); } });
  rt.renderHook(); await tick(); await rt.renderHook().accept();
  assert.equal(rt.renderHook().activeId, id); assert.equal(calls, 1); rt.unmount();
});
test("resposta atrasada após trocar veículo ou encerrar sessão é ignorada", async () => {
  const pending = deferred(); const rt = setup({ getDriverOffer: () => pending.promise });
  rt.renderHook(); await tick(); rt.vehicle(second); rt.renderHook(); pending.resolve(offer); await tick();
  assert.equal(rt.renderHook().offer, null);
  rt.logout(); rt.runTimers(); await tick(); assert.equal(rt.renderHook().offer, null); rt.unmount();
});
test("background pausa consultas; retorno recupera corrida ativa", async () => {
  let reads = 0;
  const rt = setup({ getActiveDriverRide: async () => { reads++; return { id, status: "EM_ANDAMENTO" }; } });
  rt.renderHook(); await tick(); assert.equal(rt.renderHook().activeId, id);
  rt.appState("background"); rt.runTimers(); await tick(); assert.equal(reads, 1);
  rt.appState("active"); await tick(); assert.equal(reads, 2); rt.unmount();
});
test("card apresenta dados reais e ações acessíveis; erro bloqueia aceite", () => {
  const rt = createMobileRuntime(); const { DriverOfferCard } = rt.load("src/components/home/DriverOfferCard.tsx");
  const tree = DriverOfferCard({ offers: { offer, verified: false, error: "Sem conexão" }, blocked: false, maxHeight: 250 });
  assert.match(text(tree), /12,34/); assert.match(text(tree), /Carro/); assert.match(text(tree), /-16.07, -57.68/);
  assert.equal(byLabel(tree, "Aceitar oferta").props.disabled, true);
});
test("offline não consulta ofertas; 403 mantém oferta bloqueada", async () => {
  let reads = 0;
  const rt = setup({ getDriverOffer: async () => { reads++; throw new ApiError("Veículo suspenso", 403); } });
  rt.vehicle(undefined); rt.renderHook(); await tick(); assert.equal(reads, 0);
  rt.vehicle(id); rt.renderHook(); await tick();
  const state = rt.renderHook(); assert.equal(reads, 1); assert.equal(state.verified, false); assert.match(state.error, /aprovados/); rt.unmount();
});
test("background durante aceite não restaura oferta nem repete operação", async () => {
  const pending = deferred(); let active = null; let writes = 0;
  const rt = setup({ getActiveDriverRide: async () => active, acceptDriverOffer: async () => { writes++; await pending.promise; active = { id, status: "ACEITA" }; } });
  rt.renderHook(); await tick(); const request = rt.renderHook().accept();
  rt.appState("background"); pending.resolve(); await request;
  assert.equal(rt.renderHook().busy, false);
  rt.appState("active"); await tick();
  assert.equal(rt.renderHook().activeId, id); assert.equal(writes, 1); rt.unmount();
});
test("Home usa veículo Online aprovado e mostra oferta sem criar navegação", async () => {
  let requested;
  const rt = createMobileRuntime({ fakeTimers: true, realOffers: true,
    availability: { isOnline: true, known: true, checking: false, selectedVehicle: { id: second, label: "Carro aprovado" }, vehicleChoices: [] },
    offersService: { getActiveDriverRide: async () => null, getDriverOffer: async vehicle => { requested = vehicle; return offer; } },
  });
  const { DriverHome } = rt.load("src/components/home/DriverHome.tsx");
  rt.render(() => DriverHome({ onOpenMenu() {} })); await tick();
  const tree = rt.render(() => DriverHome({ onOpenMenu() {} }));
  assert.equal(requested, undefined); assert.match(text(tree), /12,34/); assert.ok(byLabel(tree, "Aceitar oferta"));
  assert.equal(rt.calls.routes.length, 0); rt.unmount();
});
test("ocupado acompanha corrida ativa sem consultar ofertas", async () => {
  let active = { id, status: "EM_ANDAMENTO" }; let activeReads = 0; let offerReads = 0;
  const rt = setup({ getActiveDriverRide: async () => { activeReads++; return active; }, getDriverOffer: async () => { offerReads++; return offer; } });
  rt.renderHook(); await tick();
  rt.runTimers(); await tick(); rt.runTimers(); await tick();
  assert.equal(activeReads, 3); assert.equal(offerReads, 0);
  active = null; await rt.renderHook().refresh();
  assert.equal(rt.renderHook().offer.id, id);
  rt.runTimers(); await tick(); assert.equal(offerReads, 2); rt.unmount();
});
test("aceite recupera detalhes e Offline ainda permite recuperar corrida ativa", async () => {
  let active = null; let offers = 0;
  const rt = setup({ getActiveDriverRide: async () => active, getDriverOffer: async () => { offers++; return offer; }, acceptDriverOffer: async () => { active = { id, status: "ACEITA" }; } });
  rt.renderHook(); await tick(); await rt.renderHook().accept();
  rt.runTimers(); await tick(); assert.equal(rt.renderHook().activeRide.status, "ACEITA"); assert.equal(offers, 1);
  rt.vehicle(undefined); rt.renderHook(); await tick(); rt.runTimers(); await tick();
  assert.equal(rt.renderHook().activeId, id); assert.equal(offers, 1); rt.unmount();
});

test("polling lento não sobrepõe leituras nem permite aceite durante consulta", async () => {
  let reads = 0; let writes = 0; const pending = deferred();
  const rt = setup({ getDriverOffer: async () => { reads++; return pending.promise; }, acceptDriverOffer: async () => { writes++; } });
  rt.renderHook(); await tick(); await rt.renderHook().refresh(); rt.runTimers(); await rt.renderHook().accept();
  assert.equal(reads, 1); assert.equal(writes, 0); pending.resolve(offer); await tick(); rt.unmount();
});
test("card fica sobre o mapa e oferece atualização manual quando ocupado", () => {
  const rt = createMobileRuntime({ availability: { isOnline: true, known: true, checking: false, selectedVehicle: { id, label: "Carro" }, vehicleChoices: [] }, offers: { activeId: id, verified: true } });
  const { DriverHome } = rt.load("src/components/home/DriverHome.tsx");
  const { nodes } = require("./helpers/mobile-runtime.cjs");
  const tree = rt.render(() => DriverHome({ onOpenMenu() {} }));
  const overlay = nodes(tree).find(node => node?.props?.style?.position === "absolute" && node.props.style.bottom === 0 && node.props.style.left === 0);
  assert.ok(overlay); assert.match(text(overlay), /Corrida ativa/); assert.ok(byLabel(overlay, "Atualizar ofertas")); rt.unmount();
});
test("falha do catálogo não esconde uma oferta válida e logs não contêm dados pessoais", async () => {
  const rt = createMobileRuntime({ development: true, apiRequest: async url => {
    if (url.includes("categorias")) throw new ApiError("sensitive@example.com", 503);
    return { corridas: [offer], proximoCursor: null };
  } });
  const service = rt.load("src/services/corrida/ofertas.service.ts");
  const result = await service.getDriverOffer();
  assert.equal(result.id, id); assert.equal(result.categoriaNome, "Categoria indisponível");
  const logs = JSON.stringify(rt.diagnostics);
  assert.match(logs, /"count":1/); assert.match(logs, /unavailable/); assert.match(logs, /selected/);
  assert.doesNotMatch(logs, /sensitive|11111111|-16.07|-57.68|12.34/);
});
test("logs de ofertas ficam desativados em produção", async () => {
  const rt = createMobileRuntime({ apiRequest: async () => ({ corridas: [], proximoCursor: null }) });
  await rt.load("src/services/corrida/ofertas.service.ts").getDriverOffer(); assert.equal(rt.diagnostics.length, 0);
});
test("voltar à Home revalida ocupação antiga e recupera ofertas", async () => {
  let active = { id, status: "EM_ANDAMENTO" }; let reads = 0;
  const rt = setup({ getActiveDriverRide: async () => active, getDriverOffer: async () => { reads++; return offer; } });
  rt.renderHook(); await tick(); assert.equal(rt.renderHook().activeId, id);
  rt.blur(); active = null; rt.focus(); await tick();
  assert.equal(rt.renderHook().offer.id, id); assert.equal(reads, 1); rt.unmount();
});
test("foreground atual é relido ao voltar para Home após background fora da tela", async () => {
  const rt = setup(); rt.renderHook(); await tick(); rt.appState("background"); rt.blur();
  rt.appState("active"); rt.focus(); await tick();
  assert.equal(rt.renderHook().verified, true); assert.equal(rt.renderHook().offer.id, id); rt.unmount();
});
test("diagnóstico distingue execução, intervalo agendado e oferta aplicada", async () => {
  const rt = createMobileRuntime({ development: true, fakeTimers: true, offersService: {
    getActiveDriverRide: async () => null, getDriverOffer: async () => offer,
  } });
  const { useDriverOffers } = rt.load("src/components/home/useDriverOffers.ts");
  rt.render(() => useDriverOffers(id, "private-user")); await tick();
  const events = rt.diagnostics.map(entry => entry[1]);
  assert.ok(events.some(e => e.stage === "poll" && e.reason === "request" && e.intervalMs === 12000));
  assert.ok(events.some(e => e.reason === "scheduled" && e.intervalMs === 12000));
  assert.ok(events.some(e => e.stage === "card" && e.reason === "applied" && e.visible));
  assert.ok(events.every(e => typeof e.at === "string"));
  assert.doesNotMatch(JSON.stringify(events), /private-user|11111111/);
  rt.unmount();
});
test("resposta inesperada de corrida ativa é identificada sem registrar seu conteúdo", async () => {
  const rt = createMobileRuntime({ development: true, apiRequest: async () => ({ corrida: { status: "private-value" } }) });
  await assert.rejects(rt.load("src/services/corrida/ofertas.service.ts").getActiveDriverRide());
  assert.match(JSON.stringify(rt.diagnostics), /active_driver_ride.*invalid_response/);
  assert.doesNotMatch(JSON.stringify(rt.diagnostics), /private-value/);
});
test("início só muda status após confirmação na API e não duplica POST", async () => {
  const pending = deferred(); let writes = 0;
  let active = { id, status: "ACEITA", origem: { latitude: -16, longitude: -57, endereco: "Origem" }, destino: { latitude: -16.1, longitude: -57.1, endereco: "Destino" }, valorTotal: 20, distanciaKm: 4 };
  const rt = setup({ getActiveDriverRide: async () => active, startDriverRide: async () => { writes++; await pending.promise; active = { ...active, status: "EM_ANDAMENTO" }; } });
  rt.renderHook(); await tick(); const first = rt.renderHook().startRide(); await rt.renderHook().startRide();
  assert.equal(writes, 1); assert.equal(rt.renderHook().activeRide.status, "ACEITA");
  pending.resolve(); await first; assert.equal(rt.renderHook().activeRide.status, "EM_ANDAMENTO"); rt.unmount();
});
test("mapa usa GPS → embarque ao aceitar e GPS → destino ao iniciar, enquadrando rota", async () => {
  const requests = []; const fits = [];
  const rt = createMobileRuntime({ realMap: true, route: async (origin, target) => {
    requests.push([origin, target]); return { distanceMeters: 1000, durationSeconds: 120, coordinates: [origin, target] };
  } });
  const { HomeMap } = rt.load("src/components/home/HomeMap.tsx");
  const { nodes } = require("./helpers/mobile-runtime.cjs");
  let active = { id, status: "ACEITA", origem: { latitude: -16, longitude: -57, endereco: "Origem" }, destino: { latitude: -16.1, longitude: -57.1, endereco: "Destino" } };
  const render = () => rt.render(() => HomeMap({ isDriver: true, isOnline: true, activeRide: active }));
  render(); await tick(); let tree = render(); await tick(); tree = render();
  assert.equal(requests.at(-1)[0].latitude, -16.07); assert.equal(requests.at(-1)[1].latitude, -16);
  const map = nodes(tree).find(n => n?.type === "NativeMap");
  map.props.ref.current = { fitToCoordinates: (...args) => fits.push(args), animateToRegion() {} }; map.props.onMapReady(); render(); await tick(); render();
  assert.ok(fits.length > 0);
  active = { ...active, status: "EM_ANDAMENTO" }; render(); await tick(); render(); await tick(); tree = render();
  assert.equal(requests.at(-1)[0].latitude, -16.07); assert.equal(requests.at(-1)[1].latitude, -16.1);
  assert.ok(nodes(tree).some(n => n?.type === "Polyline")); rt.unmount();
});
test("falha de rota é informada sem inventar caminho", async () => {
  const rt = createMobileRuntime({ realMap: true, route: async () => { throw new Error("Rota indisponível"); } });
  const { HomeMap } = rt.load("src/components/home/HomeMap.tsx");
  const activeRide = { status: "ACEITA", origem: { latitude: -16, longitude: -57, endereco: "Origem" } };
  const render = () => rt.render(() => HomeMap({ isDriver: true, activeRide }));
  render(); await tick(); render(); await tick(); render(); await tick(); assert.match(text(render()), /Rota indisponível/); rt.unmount();
});
test("roteamento rejeita geometria inválida e encerra consulta por timeout", async () => {
  const invalid = createMobileRuntime({ fetch: async () => ({ ok: true, json: async () => ({ code: "Ok", routes: [{ distance: 10, duration: 2, geometry: { coordinates: [[999, 0], [0, 0]] } }] }) }) });
  await assert.rejects(invalid.load("src/services/location/route.service.ts").calculateRoute({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 1 }));
  const timeout = createMobileRuntime({ fakeTimers: true, fetch: async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted")))) });
  const request = timeout.load("src/services/location/route.service.ts").calculateRoute({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 1 });
  timeout.runTimers(); await assert.rejects(request, /tempo limite/);
});
test("início com resposta perdida consulta estado e nunca repete POST", async () => {
  let writes = 0; let active = { id, status: "ACEITA" };
  const rt = setup({ getActiveDriverRide: async () => active, startDriverRide: async () => { writes++; active = { id, status: "EM_ANDAMENTO" }; throw new Error("timeout"); } });
  rt.renderHook(); await tick(); await rt.renderHook().startRide();
  assert.equal(rt.renderHook().activeRide.status, "EM_ANDAMENTO"); assert.equal(writes, 1); rt.unmount();
});
test("Home ativa prioriza mapa e painel minimizado, mantendo ação ao expandir", () => {
  const active = { id, status: "ACEITA", origem: { endereco: "Embarque real" }, destino: { endereco: "Destino real" }, valorTotal: 20, distanciaKm: 4 };
  const rt = createMobileRuntime({ availability: { isOnline: true, known: true, checking: false, vehicleChoices: [] }, offers: { activeId: id, activeRide: active, verified: true } });
  const { DriverHome } = rt.load("src/components/home/DriverHome.tsx");
  const render = () => rt.render(() => DriverHome({ onOpenMenu() {} }));
  let tree = render(); assert.doesNotMatch(text(tree), /Pronto para rodar|GANHOS DE HOJE|Destino real/);
  assert.ok(byLabel(tree, "Iniciar corrida")); byLabel(tree, "Expandir detalhes da corrida").props.onPress();
  tree = render(); assert.match(text(tree), /Destino real/); assert.ok(byLabel(tree, "Iniciar corrida"));
  byLabel(tree, "Recolher detalhes da corrida").props.onPress(); assert.doesNotMatch(text(render()), /Destino real/); rt.unmount();
});
test("painel minimizado em andamento mantém Finalizar corrida com confirmação", () => {
  let finishes = 0;
  const rt = createMobileRuntime(); const { DriverOfferCard } = rt.load("src/components/home/DriverOfferCard.tsx");
  const tree = DriverOfferCard({ offers: { activeId: id, activeRide: { status: "EM_ANDAMENTO", destino: { endereco: "Destino" } }, verified: true, finishRide: async () => { finishes++; } }, collapsed: true, maxHeight: 250 });
  byLabel(tree, "Finalizar corrida").props.onPress(); assert.equal(finishes, 0);
  rt.calls.alerts[0][2][1].onPress(); assert.equal(finishes, 1);
});
test("finalização deduplica envio e recupera servidor após resposta perdida", async () => {
  const pending = deferred(); let active = { id, status: "EM_ANDAMENTO" }; let writes = 0;
  const rt = setup({ getActiveDriverRide: async () => active, finishDriverRide: async () => { writes++; await pending.promise; active = null; throw new Error("timeout"); } });
  rt.renderHook(); await tick(); const first = rt.renderHook().finishRide(); await rt.renderHook().finishRide();
  assert.equal(writes, 1); assert.equal(rt.renderHook().activeId, id);
  pending.resolve(); await first; assert.equal(rt.renderHook().activeId, null); assert.equal(writes, 1); rt.unmount();
});
test("serviço de finalização usa endpoint existente sem inventar corpo", async () => {
  let call;
  const rt = createMobileRuntime({ apiRequest: async (...args) => { call = args; return { corrida: { id, status: "FINALIZADA" } }; } });
  await rt.load("src/services/corrida/ofertas.service.ts").finishDriverRide(id);
  assert.equal(call[0], `/api/corrida/${id}/finalizar`); assert.equal(call[1].method, "POST"); assert.equal(call[1].body, undefined);
});
test("GPS acompanha câmera; gesto pausa; recentralização retoma; painel ajusta área útil", async () => {
  let gps; const moves = []; const fits = []; const handle = { current: null };
  const rt = createMobileRuntime({ realMap: true, onWatch: callback => { gps = callback; }, route: async (a,b) => ({ coordinates: [a,b], distanceMeters: 1000, durationSeconds: 60 }) });
  const { HomeMap } = rt.load("src/components/home/HomeMap.tsx"); const { nodes } = require("./helpers/mobile-runtime.cjs");
  const activeRide = { id, status: "ACEITA", origem: { latitude: -16, longitude: -57, endereco: "Origem" } };
  let padding = 140;
  const render = () => rt.render(() => HomeMap({ ref: handle, isDriver: true, isOnline: true, activeRide, contentInsetBottom: padding }));
  render(); await tick(); render(); await tick(); let tree = render();
  let map = nodes(tree).find(n => n?.type === "NativeMap"); map.props.ref.current = { animateToRegion: (...args) => moves.push(args), fitToCoordinates: (...args) => fits.push(args) };
  map.props.onMapReady(); render(); await tick(); render(); assert.ok(fits.length);
  gps({ coords: { latitude: -16.06, longitude: -57.67 } }); render(); await tick(); tree = render(); assert.ok(moves.length);
  map = nodes(tree).find(n => n?.type === "NativeMap"); map.props.onTouchStart(); const count = moves.length; const fitCount = fits.length;
  gps({ coords: { latitude: -16.05, longitude: -57.66 } }); render(); await tick(); render(); assert.equal(moves.length, count); assert.equal(fits.length, fitCount);
  handle.current.centerOnUserLocation(); assert.equal(moves.length, count + 1);
  gps({ coords: { latitude: -16.04, longitude: -57.65 } }); render(); await tick(); render(); assert.ok(moves.length > count + 1);
  padding = 320; tree = render(); map = nodes(tree).find(n => n?.type === "NativeMap"); assert.equal(map.props.mapPadding.bottom, 344); assert.ok(fits.length > fitCount); rt.unmount();
});
test("GPS significativo recalcula com limite e polling idêntico não refaz rota", async () => {
  let gps; const requests = [];
  const rt = createMobileRuntime({ realMap: true, fakeTimers: true, onWatch: cb => { gps = cb; }, route: async (a,b) => { requests.push([a,b]); return { coordinates: [a,b], distanceMeters: 1000, durationSeconds: 60 }; } });
  const { HomeMap } = rt.load("src/components/home/HomeMap.tsx");
  let activeRide = { id, status: "EM_ANDAMENTO", origem: { latitude: -15, longitude: -56, endereco: "Origem" }, destino: { latitude: -15.1, longitude: -56.1, endereco: "Destino" } };
  const render = () => rt.render(() => HomeMap({ isDriver: true, isOnline: true, activeRide }));
  render(); await tick(); render(); await tick(); render(); await tick(); render(); assert.equal(requests.length, 1);
  assert.equal(requests[0][0].latitude, -16.07);
  activeRide = { ...activeRide, origem: { ...activeRide.origem }, destino: { ...activeRide.destino } }; render(); await tick(); assert.equal(requests.length, 1);
  gps({ coords: { latitude: -16.07001, longitude: -57.68 } }); render(); rt.runTimers(); render(); assert.equal(requests.length, 1);
  gps({ coords: { latitude: -16.071, longitude: -57.68 } }); render(); assert.equal(requests.length, 1);
  gps({ coords: { latitude: -16.072, longitude: -57.68 } }); render(); assert.equal(requests.length, 1);
  rt.runTimers(); render(); await tick(); render(); assert.equal(requests.length, 2); assert.equal(requests[1][0].latitude, -16.072);
  rt.unmount();
});
test("troca de etapa não desenha ou enquadra resposta antiga; término remove rota", async () => {
  const pending = deferred(); const fits = []; let calls = 0;
  const rt = createMobileRuntime({ realMap: true, route: async (a,b) => { if (++calls === 1) return pending.promise; return { coordinates: [a,b], distanceMeters: 1000, durationSeconds: 60 }; } });
  const { HomeMap } = rt.load("src/components/home/HomeMap.tsx"); const { nodes } = require("./helpers/mobile-runtime.cjs");
  let activeRide = { id, status: "ACEITA", origem: { latitude: -15, longitude: -56, endereco: "Origem" }, destino: { latitude: -15.1, longitude: -56.1, endereco: "Destino" } };
  const render = () => rt.render(() => HomeMap({ isDriver: true, isOnline: true, activeRide }));
  render(); await tick(); render(); await tick(); let tree = render();
  const map = nodes(tree).find(n => n?.type === "NativeMap"); map.props.ref.current = { fitToCoordinates: (points) => fits.push(points), animateToRegion() {} }; map.props.onMapReady();
  activeRide = { ...activeRide, status: "EM_ANDAMENTO" }; tree = render();
  assert.equal(nodes(tree).some(n => n?.type === "Polyline"), false); assert.equal(fits.length, 0);
  render(); await tick(); tree = render();
  pending.resolve({ coordinates: [{ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 1 }], distanceMeters: 1, durationSeconds: 1 }); await tick(); tree = render();
  const line = nodes(tree).find(n => n?.type === "Polyline"); assert.equal(line.props.coordinates[0].latitude, -16.07); assert.equal(line.props.coordinates[1].latitude, -15.1);
  assert.ok(fits.every(points => points[0].latitude === -16.07 && points[1].latitude === -15.1));
  for (const status of ["FINALIZADA", "CANCELADA"]) { activeRide = { ...activeRide, status }; tree = render(); assert.equal(nodes(tree).some(n => n?.type === "Polyline"), false); }
  rt.unmount();
});
test("rota já exibida não é usada pela câmera durante transição de status", async () => {
  const pending = deferred(); const fits = []; let calls = 0;
  const rt = createMobileRuntime({ realMap: true, route: async (a,b) => ++calls === 1 ? { coordinates: [a,b], distanceMeters: 1000, durationSeconds: 60 } : pending.promise });
  const { HomeMap } = rt.load("src/components/home/HomeMap.tsx"); const { nodes } = require("./helpers/mobile-runtime.cjs");
  let activeRide = { id, status: "ACEITA", origem: { latitude: -15, longitude: -56, endereco: "Origem" }, destino: { latitude: -14, longitude: -55, endereco: "Destino" } };
  const render = () => rt.render(() => HomeMap({ isDriver: true, isOnline: true, activeRide }));
  render(); await tick(); render(); await tick(); render(); await tick(); let tree = render();
  const map = nodes(tree).find(n => n?.type === "NativeMap"); map.props.ref.current = { fitToCoordinates: points => fits.push(points), animateToRegion() {} }; map.props.onMapReady(); render(); assert.equal(fits.length, 1);
  activeRide = { ...activeRide, status: "EM_ANDAMENTO" }; tree = render(); render();
  assert.equal(nodes(tree).some(n => n?.type === "Polyline"), false); assert.equal(fits.length, 1);
  pending.resolve({ coordinates: [{ latitude: -16.07, longitude: -57.68 }, activeRide.destino], distanceMeters: 2000, durationSeconds: 120 }); await tick(); render();
  assert.equal(fits.length, 2); assert.equal(fits[1][1].latitude, -14); rt.unmount();
});
