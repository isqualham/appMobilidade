/* global __dirname */
const assert = require("node:assert/strict");
const { Buffer } = require("node:buffer");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

const SESSION_KEY = "viau_auth_session";
const root = path.resolve(__dirname, "..");
const user = {
  id: "user-1", nome: "Teste", email: "teste@example.com", administrador: false,
  prestador: true, statusAprovacao: "APROVADO", telefoneVerificado: true,
};
const jwt = (seconds = 3600) => `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds })).toString("base64url")}.signature`;
const pair = (seconds = 3600, refreshToken = "refresh-original") => ({ token: jwt(seconds), refreshToken });
const json = (value, status = 200) => new Response(JSON.stringify(value), { status });
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const tick = () => new Promise((resolve) => setImmediate(resolve));

// Load the real TypeScript modules in an isolated JS runtime. Only native storage
// and HTTP are replaced; no added test dependencies and no real credentials/network.
function runtime({ initial, store = new Map(), fetch, beforeWrite } = {}) {
  if (initial) store.set(SESSION_KEY, JSON.stringify(initial));
  const calls = [];
  const timers = new Set();
  const modules = new Map();
  const hookSlots = [];
  let hookIndex = 0;
  let effects = [];
  let providerValue;
  let dirty = false;
  const navigation = [];
  const appStateListeners = new Set();
  const sameDeps = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const react = {
    createContext: () => ({ Provider: "provider" }),
    useState: (initialValue) => {
      const index = hookIndex++;
      if (!(index in hookSlots)) hookSlots[index] = initialValue;
      return [hookSlots[index], (value) => {
        const next = typeof value === "function" ? value(hookSlots[index]) : value;
        if (!Object.is(next, hookSlots[index])) { hookSlots[index] = next; dirty = true; }
      }];
    },
    useCallback: (fn, deps) => {
      const index = hookIndex++;
      if (!sameDeps(hookSlots[index]?.deps, deps)) hookSlots[index] = { fn, deps };
      return hookSlots[index].fn;
    },
    useEffect: (fn, deps) => {
      const index = hookIndex++;
      if (!sameDeps(hookSlots[index]?.deps, deps)) {
        const previous = hookSlots[index];
        hookSlots[index] = { deps };
        effects.push(() => { previous?.cleanup?.(); hookSlots[index].cleanup = fn(); });
      }
    },
    useContext: () => providerValue,
  };
  const nativeStore = {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 7,
    async getItemAsync(key) { return store.get(key) ?? null; },
    async setItemAsync(key, value) {
      await beforeWrite?.(key, value);
      store.set(key, value);
    },
    async deleteItemAsync(key) { store.delete(key); },
  };
  const context = vm.createContext({
    Headers, AbortController, atob, Date,
    process: { env: { EXPO_PUBLIC_API_URL: "https://api.example.test" } },
    setTimeout: (fn) => { timers.add(fn); return fn; },
    clearTimeout: (fn) => timers.delete(fn),
    fetch: async (url, options) => {
      calls.push({ path: new URL(url).pathname, ...options });
      return fetch(url, options, calls);
    },
  });
  function load(filename) {
    if (modules.has(filename)) return modules.get(filename).exports;
    const module = { exports: {} };
    modules.set(filename, module);
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const requireLocal = (specifier) => {
      if (specifier === "expo-secure-store") return nativeStore;
      if (specifier === "react") return react;
      if (specifier === "react/jsx-runtime") return { jsx: (_type, props) => props };
      if (specifier === "react-native") return {
        Alert: { alert() {} },
        AppState: { currentState: "active", addEventListener: (_event, listener) => {
          appStateListeners.add(listener);
          return { remove: () => appStateListeners.delete(listener) };
        } },
      };
      if (specifier === "expo-router") return {
        usePathname: () => "/home", router: { replace: (route) => navigation.push(route) },
      };
      if (!specifier.startsWith(".")) throw new Error(`Unexpected module: ${specifier}`);
      const target = path.resolve(path.dirname(filename), specifier);
      return load(fs.existsSync(`${target}.ts`) ? `${target}.ts` : `${target}.tsx`);
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context)(requireLocal, module, module.exports);
    return module.exports;
  }
  return {
    api: load(path.join(root, "src/services/api.ts")),
    auth: load(path.join(root, "src/services/auth/auth.service.ts")),
    session: load(path.join(root, "src/services/auth/session.ts")),
    calls, store,
    mountAuth: async () => {
      const { AuthProvider } = load(path.join(root, "src/contexts/AuthContext.tsx"));
      function render() {
        hookIndex = 0;
        dirty = false;
        providerValue = AuthProvider({ children: null }).value;
        const pending = effects;
        effects = [];
        pending.forEach((effect) => effect());
      }
      const flush = async () => {
        for (let i = 0; i < 4; i += 1) { await tick(); if (dirty) render(); }
      };
      render();
      await flush();
      return { value: () => providerValue, flush, navigation,
        appState: (state) => appStateListeners.forEach((listener) => listener(state)),
        unmount: () => hookSlots.forEach((slot) => slot?.cleanup?.()),
      };
    },
    expireRequests: () => [...timers].forEach((fn) => fn()),
  };
}

test("login stores the complete pair before returning and never sends an old JWT", async () => {
  const next = pair();
  const app = runtime({ fetch: async () => json({ ...user, ...next }) });
  const result = await app.auth.signIn({ email: " teste@example.com ", password: "password" });
  assert.equal(result.id, user.id);
  assert.deepEqual(JSON.parse(app.store.get(SESSION_KEY)), next);
  assert.equal(app.calls[0].headers.get("Authorization"), null);
  assert.deepEqual(JSON.parse(app.calls[0].body), { email: "teste@example.com", senha: "password" });
});

test("phone login sends only telefone and senha and stores the session", async () => {
  const next = pair();
  const app = runtime({ fetch: async () => json({ ...user, ...next }) });
  await app.auth.signIn({ telefone: "+5565999991234", password: "password" });
  assert.deepEqual(JSON.parse(app.calls[0].body), { telefone: "+5565999991234", senha: "password" });
  assert.deepEqual(JSON.parse(app.store.get(SESSION_KEY)), next);
});

test("login rejects responses without a refresh token", async () => {
  const app = runtime({ fetch: async () => json({ ...user, token: jwt() }) });
  await assert.rejects(app.auth.signIn({ email: "x", password: "x" }), /inválida/);
  assert.equal(JSON.parse(app.store.get(SESSION_KEY)), null);
});

test("restores a valid session without refreshing and preserves approved profiles", async () => {
  const current = pair();
  const app = runtime({ initial: current, fetch: async () => json(user) });
  const restored = await app.auth.restoreSession();
  assert.equal(restored.profiles.includes("provider"), true);
  assert.equal(app.calls.length, 1);
  assert.equal(app.calls[0].path, "/api/auth/me");
  assert.equal(app.calls[0].headers.get("Authorization"), `Bearer ${current.token}`);
});

test("refreshes within 60 seconds of expiry and saves before issuing protected request", async () => {
  const next = pair(3600, "rotated");
  let app;
  app = runtime({ initial: pair(30), fetch: async (url, options) => {
    if (url.endsWith("/refresh")) {
      assert.equal(new Headers(options.headers).get("Authorization"), null);
      return json(next);
    }
    assert.deepEqual(JSON.parse(app.store.get(SESSION_KEY)), next);
    return json(user);
  } });
  await app.auth.restoreSession();
  assert.deepEqual(app.calls.map((call) => call.path), ["/api/auth/refresh", "/api/auth/me"]);
});

test("401 overrides locally valid expiry and replays a protected POST exactly once", async () => {
  let protectedCalls = 0;
  const app = runtime({ initial: pair(), fetch: async (url) => {
    if (url.endsWith("/refresh")) return json(pair(7200, "rotated"));
    return ++protectedCalls === 1 ? json({}, 401) : json({ ok: true });
  } });
  const result = await app.api.apiRequest("/protected", { method: "POST", body: "{}" });
  assert.equal(result.ok, true);
  assert.equal(protectedCalls, 2);
  assert.equal(app.calls.filter((call) => call.path.endsWith("/refresh")).length, 1);
});

test("two concurrent expired requests share one refresh", async () => {
  const gate = deferred();
  const app = runtime({ initial: pair(-10), fetch: async (url) =>
    url.endsWith("/refresh") ? gate.promise : json({ ok: true }) });
  const pending = Promise.all([app.api.apiRequest("/one"), app.api.apiRequest("/two")]);
  await tick();
  assert.equal(app.calls.length, 1);
  gate.resolve(json(pair(3600, "rotated")));
  await pending;
  assert.equal(app.calls.length, 3);
});

test("late concurrent 401 reuses the rotation even when the new JWT is identical", async () => {
  const original = pair();
  const late401 = deferred();
  let one = 0;
  let two = 0;
  const app = runtime({ initial: original, fetch: async (url) => {
    if (url.endsWith("/refresh")) return json({ ...original, refreshToken: "rotated" });
    if (url.endsWith("/one")) return ++one === 1 ? json({}, 401) : json({ ok: true });
    return ++two === 1 ? late401.promise : json({ ok: true });
  } });
  const first = app.api.apiRequest("/one");
  const second = app.api.apiRequest("/two");
  await first;
  late401.resolve(json({}, 401));
  await second;
  assert.equal(app.calls.filter((call) => call.path.endsWith("/refresh")).length, 1);
});

test("pending requests are not released until the rotated pair is persisted", async () => {
  const gate = deferred();
  const next = pair(3600, "rotated");
  const app = runtime({ initial: pair(-1),
    beforeWrite: async (_key, value) => { if (value === JSON.stringify(next)) await gate.promise; },
    fetch: async (url) => url.endsWith("/refresh") ? json(next) : json({ ok: true }),
  });
  const pending = app.api.apiRequest("/protected");
  await tick();
  assert.equal(app.calls.length, 1);
  assert.equal(JSON.parse(app.store.get(SESSION_KEY)).refreshPending, true);
  gate.resolve();
  await pending;
  assert.equal(app.calls.length, 2);
});

for (const failure of ["invalid", "expired", "server-error", "network", "malformed"]) {
  test(`refresh failure (${failure}) clears session and never reuses the old token`, async () => {
    let notifications = 0;
    const app = runtime({ initial: pair(-1), fetch: async () => {
      if (failure === "network") throw new TypeError("Network failed");
      if (failure === "malformed") return json({ token: "incomplete" });
      return json({}, failure === "server-error" ? 503 : 401);
    } });
    app.session.onSessionCleared(() => { notifications += 1; });
    await assert.rejects(app.api.apiRequest("/protected"), { status: 401 });
    await assert.rejects(app.api.apiRequest("/protected"), { status: 401 });
    assert.equal(app.calls.length, 1);
    assert.equal(notifications, 1);
    assert.equal(JSON.parse(app.store.get(SESSION_KEY)), null);
  });
}

test("lost refresh response/timeout requires login without a second refresh", async () => {
  const app = runtime({ initial: pair(-1), fetch: async (_url, options) =>
    new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(new Error("timeout")))) });
  const pending = assert.rejects(app.api.apiRequest("/protected"), { status: 401 });
  await tick();
  app.expireRequests();
  await pending;
  assert.equal(await app.auth.restoreSession(), null);
  assert.equal(app.calls.length, 1);
});

test("a second 401 stops retries and invalidates the session", async () => {
  const app = runtime({ initial: pair(), fetch: async (url) =>
    url.endsWith("/refresh") ? json(pair(7200, "rotated")) : json({}, 401) });
  await assert.rejects(app.api.apiRequest("/protected"), { status: 401 });
  assert.equal(app.calls.length, 3);
  assert.equal(JSON.parse(app.store.get(SESSION_KEY)), null);
});

for (const networkFailure of [false, true]) {
  test(`logout clears locally and attempts revocation (network failure: ${networkFailure})`, async () => {
    const current = pair();
    const app = runtime({ initial: current, fetch: async () => {
      if (networkFailure) throw new TypeError("Network failed");
      return new Response(null, { status: 204 });
    } });
    await app.session.logoutSession();
    assert.equal(app.calls[0].path, "/api/auth/logout");
    assert.deepEqual(JSON.parse(app.calls[0].body), { refreshToken: current.refreshToken });
    assert.equal(JSON.parse(app.store.get(SESSION_KEY)), null);
    assert.equal(await app.auth.restoreSession(), null);
  });
}

test("logout during refresh cannot restore credentials or replay a pending request", async () => {
  const gate = deferred();
  const app = runtime({ initial: pair(-1), fetch: async (url) =>
    url.endsWith("/refresh") ? gate.promise : new Response(null, { status: 204 }) });
  const pending = assert.rejects(app.api.apiRequest("/protected"), /sessão foi alterada/);
  await tick();
  await app.session.logoutSession();
  gate.resolve(json(pair(3600, "late-rotation")));
  await pending;
  assert.equal(JSON.parse(app.store.get(SESSION_KEY)), null);
  assert.equal(app.calls.some((call) => call.path === "/protected"), false);
  assert.equal(app.calls.filter((call) => call.path.endsWith("/logout")).length, 2);
});

test("switching users during refresh preserves only the new account", async () => {
  const gate = deferred();
  const next = pair(7200, "account-two-refresh");
  const app = runtime({ initial: pair(-1), fetch: async (url) => {
    if (url.endsWith("/refresh")) return gate.promise;
    if (url.endsWith("/login")) return json({ ...user, id: "user-2", ...next });
    return new Response(null, { status: 204 });
  } });
  const oldRequest = assert.rejects(app.api.apiRequest("/protected"), /sessão foi alterada/);
  await tick();
  const newUser = await app.auth.signIn({ email: "other@example.com", password: "password" });
  gate.resolve(json(pair(3600, "old-account-rotated")));
  await oldRequest;
  assert.equal(newUser.id, "user-2");
  assert.deepEqual(JSON.parse(app.store.get(SESSION_KEY)), next);
});

test("a late login cannot undo logout", async () => {
  const gate = deferred();
  const app = runtime({ fetch: async () => gate.promise });
  const pending = assert.rejects(app.auth.signIn({ email: "x", password: "x" }), /sessão foi alterada/);
  await tick();
  await app.session.logoutSession();
  gate.resolve(json({ ...user, ...pair() }));
  await pending;
  assert.equal(JSON.parse(app.store.get(SESSION_KEY)), null);
});

test("a delayed /me cannot restore a logged-out user", async () => {
  const gate = deferred();
  const app = runtime({ initial: pair(), fetch: async (url) =>
    url.endsWith("/me") ? gate.promise : new Response(null, { status: 204 }) });
  const pending = assert.rejects(app.auth.restoreSession(), /sessão foi alterada/);
  await tick();
  await app.session.logoutSession();
  gate.resolve(json(user));
  await pending;
});

test("reopening the app uses the saved rotated refresh token", async () => {
  const store = new Map();
  const rotated = pair(3600, "rotated");
  const first = runtime({ store, initial: pair(-1), fetch: async (url) =>
    url.endsWith("/refresh") ? json(rotated) : json(user) });
  await first.auth.restoreSession();
  const second = runtime({ store, fetch: async () => json(user) });
  assert.equal((await second.auth.restoreSession()).id, user.id);
  assert.equal(second.calls.length, 1);
  assert.deepEqual(JSON.parse(store.get(SESSION_KEY)), rotated);
});

test("reopening after an interrupted rotation discards the uncertain refresh", async () => {
  const app = runtime({ initial: { ...pair(), refreshPending: true }, fetch: async () => {
    throw new Error("No request expected");
  } });
  assert.equal(await app.auth.restoreSession(), null);
  assert.equal(app.calls.length, 0);
  assert.equal(JSON.parse(app.store.get(SESSION_KEY)), null);
});

test("legacy access-only sessions require a new login", async () => {
  const store = new Map([["viau_auth_token", jwt()]]);
  const app = runtime({ store });
  assert.equal(await app.auth.restoreSession(), null);
  assert.equal(store.has("viau_auth_token"), false);
});

test("a normal protected network failure preserves credentials and never replays a write", async () => {
  const current = pair();
  const app = runtime({ initial: current, fetch: async () => { throw new TypeError("Network failed"); } });
  await assert.rejects(app.api.apiRequest("/protected", { method: "POST", body: "{}" }), /Network failed/);
  assert.equal(app.calls.length, 1);
  assert.deepEqual(JSON.parse(app.store.get(SESSION_KEY)), current);
});

test("undecodable JWT relies on server authorization, without a proactive refresh", async () => {
  const app = runtime({ initial: { token: "opaque-token", refreshToken: "refresh" }, fetch: async () => json(user) });
  await app.auth.restoreSession();
  assert.equal(app.calls.length, 1);
});

test("failure to persist a rotated pair blocks all pending requests and requires login", async () => {
  const next = pair(3600, "rotated");
  const app = runtime({ initial: pair(-1),
    beforeWrite: async (_key, value) => { if (value === JSON.stringify(next)) throw new Error("Storage failure"); },
    fetch: async () => json(next),
  });
  await assert.rejects(app.api.apiRequest("/protected"), { status: 401 });
  assert.equal(app.calls.filter((call) => call.path.endsWith("/refresh")).length, 1);
  assert.equal(app.calls.some((call) => call.path === "/protected"), false);
  assert.equal(JSON.parse(app.store.get(SESSION_KEY)), null);
});

test("logout during persistence of a refresh pair cannot leave the new credentials stored", async () => {
  const gate = deferred();
  const next = pair(3600, "rotated");
  const app = runtime({ initial: pair(-1),
    beforeWrite: async (_key, value) => { if (value === JSON.stringify(next)) await gate.promise; },
    fetch: async (url) => url.endsWith("/refresh") ? json(next) : new Response(null, { status: 204 }),
  });
  const pending = assert.rejects(app.api.apiRequest("/protected"), /sessão foi alterada/);
  await tick();
  const logout = app.session.logoutSession();
  gate.resolve();
  await Promise.all([pending, logout]);
  assert.equal(JSON.parse(app.store.get(SESSION_KEY)), null);
  assert.equal(app.calls.some((call) => call.path === "/protected"), false);
  assert.equal(app.calls.some((call) => call.path.endsWith("/logout") && JSON.parse(call.body).refreshToken === "rotated"), true);
});

test("ordinary write timeout never triggers refresh or automatic repetition", async () => {
  const current = pair();
  const app = runtime({ initial: current, fetch: async (_url, options) =>
    new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(new Error("timeout")))) });
  const pending = assert.rejects(app.api.apiRequest("/protected", { method: "PATCH", body: "{}" }), /timeout/);
  await tick();
  app.expireRequests();
  await pending;
  assert.equal(app.calls.length, 1);
  assert.deepEqual(JSON.parse(app.store.get(SESSION_KEY)), current);
});

test("AuthContext restores user and approved driver navigation", async () => {
  const app = runtime({ initial: pair(), fetch: async () => json(user) });
  const context = await app.mountAuth();
  assert.equal(context.value().isAuthenticated, true);
  assert.equal(context.value().isLoadingAuth, false);
  context.value().setActiveProfile("driver");
  await context.flush();
  assert.equal(context.value().activeProfile, "driver");
  context.unmount();
});

test("AuthContext clears immediately when an unrelated protected request cannot refresh", async () => {
  const app = runtime({ initial: pair(), fetch: async (url) =>
    url.endsWith("/me") ? json(user) : json({}, 401) });
  const context = await app.mountAuth();
  await assert.rejects(app.api.apiRequest("/protected"), { status: 401 });
  await context.flush();
  assert.equal(context.value().user, null);
  assert.equal(context.navigation.at(-1), "/login");
  context.unmount();
});

test("AuthContext ignores late user data after switching accounts", async () => {
  const gate = deferred();
  let meCalls = 0;
  const app = runtime({ initial: pair(), fetch: async (url) => {
    if (url.endsWith("/me")) return ++meCalls === 1 ? json(user) : gate.promise;
    return json({ ...user, id: "user-2", ...pair(7200, "account-two") });
  } });
  const context = await app.mountAuth();
  const oldRefresh = context.value().refreshUser();
  await tick();
  await context.value().signInWithCredentials({ email: "other@example.com", password: "password" });
  gate.resolve(json(user));
  await oldRefresh;
  await context.flush();
  assert.equal(context.value().user.id, "user-2");
  context.unmount();
});

test("AuthContext logout clears UI before revocation finishes and preserves unrelated local data", async () => {
  const gate = deferred();
  const app = runtime({ initial: pair(), fetch: async (url) =>
    url.endsWith("/me") ? json(user) : gate.promise });
  app.store.set("unrelated-active-ride-reference", "ride-id");
  const context = await app.mountAuth();
  const logout = context.value().signOut();
  await context.flush();
  assert.equal(context.value().isAuthenticated, false);
  assert.equal(context.navigation.at(-1), "/login");
  gate.reject(new TypeError("Network failed"));
  await logout;
  assert.equal(app.store.get("unrelated-active-ride-reference"), "ride-id");
  context.unmount();
});

test("AuthContext recovers session on foreground after initial /me network failure", async () => {
  let calls = 0;
  const app = runtime({ initial: pair(), fetch: async () => {
    if (++calls === 1) throw new TypeError("Network failed");
    return json(user);
  } });
  const context = await app.mountAuth();
  assert.equal(context.value().user, null);
  context.appState("background");
  context.appState("active");
  await context.flush();
  assert.equal(context.value().user.id, user.id);
  context.unmount();
});

test("existing phone-verification navigation is preserved after restoring a session", async () => {
  const app = runtime({ initial: pair(), fetch: async () => json({ ...user, telefoneVerificado: false }) });
  const context = await app.mountAuth();
  assert.equal(context.navigation.at(-1), "/autenticacao-telefone");
  context.unmount();
});
