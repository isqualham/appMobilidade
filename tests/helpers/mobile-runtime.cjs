/* global __dirname */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "../..");

class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

const approvedUser = {
  id: "driver-1", name: "Rafael Silva", email: "rafael@example.com",
  prestador: true, statusAprovacao: "APROVADO", telefoneVerificado: true,
  profiles: ["client", "provider"], activeProfile: "client", administrador: false,
};

function createMobileRuntime(options = {}) {
  const user = options.user === undefined ? approvedUser : options.user;
  const calls = { routes: [], alerts: [], getAvailability: 0, updates: [], vehicles: 0, activeRide: 0, restore: 0, location: 0, watch: 0, stopWatch: 0 };
  const slots = [];
  const events = new Set();
  const sessionEvents = new Set();
  const cache = new Map();
  let index = 0;
  let effects = [];
  let session = 0;
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useState(initial) {
      const i = index++;
      if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
      return [slots[i], (v) => { slots[i] = typeof v === "function" ? v(slots[i]) : v; }];
    },
    useRef(initial) { const i = index++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
    useCallback(fn, deps) { const i = index++; if (!same(slots[i]?.deps, deps)) slots[i] = { value: fn, deps }; return slots[i].value; },
    useMemo(fn, deps) { const i = index++; if (!same(slots[i]?.deps, deps)) slots[i] = { value: fn(), deps }; return slots[i].value; },
    useEffect(fn, deps) {
      const i = index++;
      if (!same(slots[i]?.deps, deps)) {
        const previous = slots[i]; slots[i] = { deps };
        effects.push(() => { previous?.cleanup?.(); slots[i].cleanup = fn(); });
      }
    },
    useImperativeHandle(ref, create) { if (ref) ref.current = create(); },
    forwardRef: (component) => (props) => component(props, props.ref),
  };
  const native = Object.fromEntries(["View", "Text", "TouchableOpacity", "ScrollView", "Modal", "Image", "ActivityIndicator"].map((name) => [name, name]));
  Object.assign(native, {
    StyleSheet: { create: (value) => value, absoluteFill: { position: "absolute", inset: 0 } },
    useWindowDimensions: () => options.size ?? { width: 390, height: 844, fontScale: 1 },
    Alert: { alert: (...args) => calls.alerts.push(args) },
    AppState: { addEventListener: (_event, fn) => { events.add(fn); return { remove: () => events.delete(fn) }; } },
  });
  const mocks = {
    react,
    "react/jsx-runtime": { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: "Fragment" },
    "react-native": native,
    "expo-status-bar": { StatusBar: "StatusBar" },
    "expo-router": {
      router: { navigate: (route) => calls.routes.push(route), push: (route) => calls.routes.push(route) },
      useFocusEffect: fn => react.useEffect(fn, [fn]),
      Redirect: "Redirect", useLocalSearchParams: () => options.params ?? {},
    },
    "react-native-safe-area-context": { useSafeAreaInsets: () => options.insets ?? { top: 47, bottom: 34, left: 0, right: 0 } },
    "@react-native-vector-icons/lucide": { Lucide: "Icon" },
    "react-native-maps": { __esModule: true, default: "NativeMap", Marker: "Marker", Polyline: "Polyline" },
    "expo-location": {
      Accuracy: { High: 1 }, requestForegroundPermissionsAsync: async () => ({ status: "granted" }),
      watchPositionAsync: async () => { calls.watch++; return { remove: () => { calls.stopWatch++; } }; },
    },
  };
  const context = vm.createContext({ Date, Error, setTimeout, clearTimeout });
  function load(relative) {
    const filename = path.isAbsolute(relative) ? relative : path.join(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: {
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
    } }).outputText;
    const localRequire = (name) => {
      if (name in mocks) return mocks[name];
      if (name === "zod") return require("zod");
      if (name.endsWith("/api")) return { ApiError, apiRequest: options.apiRequest };
      if (name.endsWith("/disponibilidade.service") && !options.realAvailabilityService) return {
        getAvailability: async () => { calls.getAvailability++; return options.getAvailability ? options.getAvailability() : { status: "OFFLINE", veiculoId: null, versao: 0 }; },
        getEligibleVehicles: async () => { calls.vehicles++; return options.vehicles ? options.vehicles() : []; },
        updateAvailability: async change => { calls.updates.push(JSON.parse(JSON.stringify(change))); return options.updateAvailability ? options.updateAvailability(change) : { ...change, veiculoId: change.veiculoId ?? null, versao: change.versao + 1 }; },
        hasActiveRide: async () => { calls.activeRide++; return options.activeRide ? options.activeRide() : false; },
      };
      if (name.endsWith("/AuthContext")) return { useAuth: () => ({ user, activeProfile: options.profile ?? "driver", canUseProviderProfile: options.approved ?? true }) };
      if (name.endsWith("/auth.service")) return { restoreSession: async () => { calls.restore++; return options.restore ? options.restore() : user; } };
      if (name.endsWith("/auth/session")) return {
        getSessionVersion: () => session,
        onSessionCleared: (fn) => { sessionEvents.add(fn); return () => sessionEvents.delete(fn); },
      };
      if (name.endsWith("/location.service")) return { getUserLocation: async () => {
        calls.location++; return options.location ? options.location() : { latitude: -16.07, longitude: -57.68 };
      } };
      if (name === "./HomeMap" && !options.realMap) return { HomeMap: "HomeMap" };
      if (name === "./DriverHome" && options.stubDriver) return { DriverHome: "DriverHome" };
      if (name === "./useDriverAvailability" && options.availability) return { useDriverAvailability: () => options.availability };
      const target = path.resolve(path.dirname(filename), name);
      const resolved = [target + ".ts", target + ".tsx", path.join(target, "index.ts")].find(fs.existsSync);
      if (!resolved) throw new Error(`Unexpected import: ${name}`);
      return load(resolved);
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(localRequire, module, module.exports);
    return module.exports;
  }
  return {
    load, calls,
    render(fn) { index = 0; const result = fn(); const pending = effects; effects = []; pending.forEach((effect) => effect()); return result; },
    appState: (state) => events.forEach((fn) => fn(state)),
    logout() { session++; sessionEvents.forEach((fn) => fn()); },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
  };
}

function nodes(tree) {
  if (tree === null || tree === undefined || typeof tree === "boolean") return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (typeof tree !== "object") return [tree];
  if (typeof tree.type === "function") return nodes(tree.type(tree.props));
  if (tree.type === "Modal" && !tree.props.visible) return [];
  return [tree, ...nodes(tree.props?.children)];
}
const text = (tree) => nodes(tree).filter((item) => typeof item === "string" || typeof item === "number").join(" ");
const byLabel = (tree, label) => nodes(tree).find((item) => item?.props?.accessibilityLabel === label);
module.exports = { ApiError, createMobileRuntime, approvedUser, nodes, text, byLabel };
