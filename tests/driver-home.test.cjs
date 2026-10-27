const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createMobileRuntime, nodes, text, byLabel } = require("./helpers/mobile-runtime.cjs");
const tick = () => new Promise((resolve) => setImmediate(resolve));
const vehicle = { id: "vehicle-1", label: "Veículo de teste" };

test("driver home uses real map and drawer callback; no fake money, counts or simulation", async () => {
  const runtime = createMobileRuntime();
  const { DriverHome } = runtime.load("src/components/home/DriverHome.tsx");
  let opened = false;
  runtime.render(() => DriverHome({ onOpenMenu() {} }));
  await tick();
  const tree = runtime.render(() => DriverHome({ onOpenMenu: () => { opened = true; } }));
  assert.match(text(tree), /OFFLINE/);
  assert.match(text(tree), /Rafael/);
  assert.match(text(tree), /Resumo ainda indisponível/);
  assert.doesNotMatch(text(tree), /146,80|Simular|Buscando solicitações|CENTRO/);
  assert.equal(nodes(tree).some((node) => node.type === "HomeMap"), true);
  byLabel(tree, "Abrir menu").props.onPress();
  assert.equal(opened, true);
  assert.equal(byLabel(tree, "Perfil"), undefined);
});

test("online presentation says saved availability and allows going offline", () => {
  let offline = false;
  const runtime = createMobileRuntime({ availability: {
    isOnline: true, known: true, checking: false, error: null, selectedVehicle: vehicle, vehicleChoices: [],
    goOffline: () => { offline = true; },
  } });
  const { DriverHome } = runtime.load("src/components/home/DriverHome.tsx");
  const tree = runtime.render(() => DriverHome({ onOpenMenu() {} }));
  assert.match(text(tree), /ONLINE/);
  assert.match(text(tree), /Você está online/);
  assert.doesNotMatch(text(tree), /Buscando/);
  byLabel(tree, "Ficar offline").props.onPress();
  assert.equal(offline, true);
});

test("bottom navigation only uses existing Router with three destinations", () => {
  const runtime = createMobileRuntime();
  const { DriverNavigation } = runtime.load("src/components/home/DriverNavigation.tsx");
  const tree = DriverNavigation({ active: "home" });
  const tabs = nodes(tree).filter((node) => node.props?.accessibilityRole === "button");
  assert.deepEqual(tabs.map((node) => node.props.accessibilityLabel), ["Início", "Serviços", "Ganhos"]);
  tabs.forEach((node) => node.props.onPress());
  assert.deepEqual(runtime.calls.routes, ["/driver-services", "/driver-earnings"]);
});

test("passenger home keeps destination navigation and the same side menu", () => {
  const runtime = createMobileRuntime({ profile: "passenger", stubDriver: true });
  const { HomeScreen } = runtime.load("src/components/home/HomeScreen.tsx");
  const tree = runtime.render(() => HomeScreen());
  assert.match(text(tree), /Para onde vamos/);
  assert.match(text(tree), /Atividade/);
  assert.match(text(tree), /Carteira/);
  byLabel(tree, "Digite seu destino").props.onPress();
  assert.equal(runtime.calls.routes[0], "/destination");
  byLabel(tree, "Abrir menu").props.onPress();
  const opened = runtime.render(() => HomeScreen());
  assert.match(text(opened), /Ver perfil/);
});

test("offline driver map shows location without starting continuous GPS tracking", async () => {
  const runtime = createMobileRuntime({ realMap: true });
  const { HomeMap } = runtime.load("src/components/home/HomeMap.tsx");
  runtime.render(() => HomeMap({ isDriver: true, isOnline: false }));
  await tick();
  const tree = runtime.render(() => HomeMap({ isDriver: true, isOnline: false }));
  assert.equal(runtime.calls.watch, 0);
  assert.equal(nodes(tree).filter((node) => node.type === "Marker").length, 1);
  assert.equal(nodes(tree).some((node) => node.type === "NativeMap"), true);
});

test("map handles GPS denial and offers retry", async () => {
  let attempts = 0;
  const runtime = createMobileRuntime({ realMap: true, location: async () => {
    if (++attempts === 1) throw new Error("Permissão negada");
    return { latitude: -16.07, longitude: -57.68 };
  } });
  const { HomeMap } = runtime.load("src/components/home/HomeMap.tsx");
  const render = () => runtime.render(() => HomeMap({ isDriver: true }));
  render(); await tick();
  const tree = render();
  assert.match(text(tree), /Localização indisponível/);
  byLabel(tree, "Tentar obter localização novamente").props.onPress();
  render(); await tick();
  assert.equal(nodes(render()).some((node) => node.type === "NativeMap"), true);
});
