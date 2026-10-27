const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createMobileRuntime, approvedUser, ApiError } = require('./helpers/mobile-runtime.cjs');
const tick = () => new Promise(resolve => setImmediate(resolve));
const vehicle = { id: 'b12a0000-0000-4000-8000-000000000021', label: 'Carro · ABC1D23' };
const offline = { status: 'OFFLINE', veiculoId: null, versao: 3 };
const online = { status: 'ONLINE', veiculoId: vehicle.id, versao: 4 };
async function setup(options = {}) {
  const runtime = createMobileRuntime({ getAvailability: async () => offline, vehicles: async () => [vehicle], ...options });
  const { useDriverAvailability } = runtime.load('src/components/home/useDriverAvailability.ts');
  const render = () => runtime.render(() => useDriverAvailability(options.user ?? approvedUser));
  render(); await tick();
  return { runtime, render };
}

test('reads persisted status on entry and resume without automatic writes', async () => {
  const { runtime, render } = await setup({ getAvailability: async () => online });
  assert.equal(render().isOnline, true);
  runtime.appState('background');
  assert.equal(render().isOnline, true);
  runtime.appState('active'); await tick();
  assert.equal(runtime.calls.getAvailability, 2);
  assert.equal(runtime.calls.updates.length, 0);
});

test('requires explicit eligible vehicle choice and saves current version', async () => {
  const { runtime, render } = await setup();
  await render().goOnline();
  assert.equal(render().vehicleChoices.length, 1);
  assert.equal(render().isOnline, false);
  await render().selectVehicle('arbitrary');
  assert.equal(runtime.calls.updates.length, 0);
  await render().selectVehicle(vehicle.id);
  assert.deepEqual(runtime.calls.updates, [{ status: 'ONLINE', veiculoId: vehicle.id, versao: 3 }]);
  assert.equal(render().isOnline, true);
  await render().goOffline();
  assert.deepEqual(runtime.calls.updates[1], { status: 'OFFLINE', versao: 4 });
  assert.equal(render().isOnline, false);
});

test('canceling selection does not set offline on server', async () => {
  const { runtime, render } = await setup();
  await render().goOnline(); render().cancelSelection();
  await render().selectVehicle(vehicle.id);
  assert.equal(render().vehicleChoices.length, 0);
  assert.equal(runtime.calls.updates.length, 0);
});

test('unapproved providers and missing eligible vehicles cannot go online', async () => {
  for (const options of [{ user: { ...approvedUser, statusAprovacao: 'PENDENTE' } }, { vehicles: async () => [] }]) {
    const { runtime, render } = await setup(options);
    await render().goOnline();
    assert.equal(render().isOnline, false);
    assert.ok(render().error);
    assert.equal(runtime.calls.updates.length, 0);
  }
});

test('denied location does not send online update', async () => {
  const { runtime, render } = await setup({ location: async () => { throw new Error('Permissão de localização negada'); } });
  await render().goOnline();
  assert.match(render().error, /Permissão/);
  assert.equal(runtime.calls.updates.length, 0);
});

for (const active of [false, true]) {
  test(`409 reconciles status and active ride (${active}) without replay`, async () => {
    let state = offline;
    const { runtime, render } = await setup({
      getAvailability: async () => state,
      updateAvailability: async () => { state = online; throw new ApiError('Conflito', 409); },
      activeRide: async () => active,
    });
    await render().goOnline(); await render().selectVehicle(vehicle.id);
    assert.equal(render().isOnline, true);
    assert.equal(runtime.calls.updates.length, 1);
    assert.equal(runtime.calls.activeRide, 1);
    assert.match(render().error, active ? /corrida ativa/ : /outra sessão/);
  });
}

test('lost PATCH response reconciles via GET; no automatic write retry', async () => {
  let state = offline;
  const { runtime, render } = await setup({
    getAvailability: async () => state,
    updateAvailability: async () => { state = online; throw new Error('timeout'); },
  });
  await render().goOnline(); await render().selectVehicle(vehicle.id);
  assert.equal(render().isOnline, true);
  assert.equal(runtime.calls.updates.length, 1);
  assert.match(render().error, /Confira o status atual/);
});

test('unavailable GET is unknown, not offline, and can be retried', async () => {
  let failed = true;
  const { render } = await setup({ getAvailability: async () => { if (failed) throw new Error('network'); return online; } });
  assert.equal(render().known, false);
  assert.ok(render().error);
  failed = false; await render().refresh();
  assert.equal(render().isOnline, true);
});

test('duplicate selection taps send one PATCH and logout ignores late responses', async () => {
  let resolve;
  const pending = new Promise(done => { resolve = done; });
  const { runtime, render } = await setup({ updateAvailability: async () => pending });
  await render().goOnline();
  const first = render().selectVehicle(vehicle.id);
  await render().selectVehicle(vehicle.id);
  runtime.logout(); resolve(online); await first;
  assert.equal(runtime.calls.updates.length, 1);
  assert.equal(render().known, false);
});

test('background cancels pending selection without altering server state', async () => {
  let resolve;
  const { runtime, render } = await setup({ vehicles: () => new Promise(done => { resolve = done; }) });
  const pending = render().goOnline(); await tick();
  runtime.appState('background'); resolve([vehicle]); await pending;
  assert.equal(render().vehicleChoices.length, 0);
  assert.equal(runtime.calls.updates.length, 0);
});

test('service filters vehicles using active category/type catalog and validates responses', async () => {
  const category = 'b12a0000-0000-4000-8000-000000000031';
  const requests = [];
  let invalid = false;
  const runtime = createMobileRuntime({ realAvailabilityService: true, apiRequest: async (route, options) => {
    requests.push({ route, options });
    if (route === '/api/veiculos') return { veiculos: [
      { id: vehicle.id, marca: 'Marca', modelo: 'Modelo', placa: 'ABC1D23', ativo: true, categoriaVeiculoId: category },
      { id: vehicle.id, marca: 'Marca', modelo: 'Inativo', placa: 'ABC1D23', ativo: false, categoriaVeiculoId: category },
      { id: vehicle.id, marca: 'Marca', modelo: 'Categoria inativa', placa: 'ABC1D23', ativo: true, categoriaVeiculoId: vehicle.id },
    ] };
    if (route === '/api/categorias-veiculo') return { categorias: [{ id: category, ativo: true }] };
    return invalid ? { status: 'ONLINE', veiculoId: null, versao: -1 } : offline;
  } });
  const service = runtime.load('src/services/prestador/disponibilidade.service.ts');
  assert.equal((await service.getEligibleVehicles()).length, 1);
  await service.updateAvailability({ status: 'OFFLINE', versao: 3 });
  assert.equal(requests.at(-1).options.method, 'PATCH');
  assert.deepEqual(JSON.parse(requests.at(-1).options.body), { status: 'OFFLINE', versao: 3 });
  invalid = true;
  await assert.rejects(service.getAvailability(), /disponibilidade inválida/);
});

for (const [status, message] of [[400, /dados de disponibilidade/], [403, /Alteração não permitida/], [500, /Não foi possível confirmar/]]) {
  test(`PATCH ${status} retains reconciled server state and provides feedback`, async () => {
    const { runtime, render } = await setup({
      getAvailability: async () => online,
      updateAvailability: async () => { throw new ApiError('Erro', status); },
    });
    await render().goOffline();
    assert.equal(render().isOnline, true);
    assert.match(render().error, message);
    assert.equal(runtime.calls.updates.length, 1);
  });
}

test('failed reconciliation after a write leaves status unknown, never invents offline', async () => {
  let failed = false;
  const { runtime, render } = await setup({
    getAvailability: async () => { if (failed) throw new Error('network'); return online; },
    updateAvailability: async () => { failed = true; throw new Error('timeout'); },
  });
  await render().goOffline();
  assert.equal(render().known, false);
  assert.equal(runtime.calls.updates.length, 1);
});
