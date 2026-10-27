/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
function compile(file, req) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function('require', 'module', 'exports', code)(req, module, module.exports);
  return module.exports;
}
const schema = compile('src/components/login/LoginScreen.schema.ts', require);
for (const os of ['ios', 'android']) {
  test(`login by email and national phone preserves validation and navigation on ${os}`, async () => {
    let index = 0;
    const slots = [], calls = [], routes = [];
    const native = new Proxy({ Platform: { OS: os }, Keyboard: { dismiss() {} }, Alert: { alert() {} } }, { get: (o, k) => o[k] ?? k });
    const mocks = {
      react: { useState(initial) { const i = index++; if (!(i in slots)) slots[i] = initial; return [slots[i], v => { slots[i] = typeof v === 'function' ? v(slots[i]) : v; }]; } },
      'react-native': native,
      'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
      'expo-status-bar': { StatusBar: 'StatusBar' },
      'expo-router': { router: { replace: r => routes.push(r) } },
      '@react-native-vector-icons/lucide': { Lucide: 'Icon' },
      '../../theme': { colors: { neutral: { carbon: '#000' }, semantic: { actionPrimaryForeground: '#fff' } } },
      '../../contexts/AuthContext': { useAuth: () => ({ signInWithCredentials: async c => calls.push(c) }) },
      './LoginScreen.schema': schema, '../../../assets/viau-logo.svg': 'Logo', './LoginScreenStyles': { styles: {} },
    };
    const { LoginScreen } = compile('src/components/login/LoginScreen.tsx', name => { assert.ok(name in mocks, name); return mocks[name]; });
    const flatten = t => !t || typeof t !== 'object' ? [] : Array.isArray(t) ? t.flatMap(flatten) : [t, ...flatten(t.props?.children)];
    const render = () => { index = 0; return flatten(LoginScreen()); };
    const field = label => render().find(n => n.props.accessibilityLabel === label).props;
    assert.equal(field('E-mail ou telefone').textContentType, os === 'ios' ? 'username' : undefined);
    assert.equal(field('Senha').secureTextEntry, true);
    field('Senha').onChangeText('test-password');
    for (const invalid of ['', 'person@', '99999-1234', '(00) 99999-1234', 'abc65999991234', '123.456.789-01']) {
      field('E-mail ou telefone').onChangeText(invalid);
      await field('Entrar').onPress();
      assert.equal(calls.length, 0);
    }
    for (const [input, expected] of [
      [' person@example.com ', { email: 'person@example.com' }],
      ['(65) 99999-1234', { telefone: '+5565999991234' }],
      ['6532221234', { telefone: '+556532221234' }],
    ]) {
      field('E-mail ou telefone').onChangeText(input);
      await field('Entrar').onPress();
      assert.deepEqual(calls.at(-1), { ...expected, password: 'test-password' });
    }
    assert.deepEqual(routes, ['/home', '/home', '/home']);
    field('Senha').onChangeText('short');
    await field('Entrar').onPress();
    assert.equal(calls.length, 3);
  });
}

test('phone validation explains incomplete numbers, invalid DDD and invalid number format', () => {
  for (const [identifier, message] of [
    ['99999-1234', /Telefone incompleto/],
    ['(65) 9999-1234', /Celular incompleto/],
    ['(23) 99999-1234', /DDD inválido/],
    ['(65) 89999-1234', /Número inválido/],
    ['5565999991234', /10 ou 11 dígitos/],
    ['65.99999.1234', /apenas números/],
    ['person@', /e-mail válido/],
  ]) {
    const result = schema.loginSchema.safeParse({ identifier, password: 'test-password' });
    assert.equal(result.success, false);
    assert.match(result.error.issues[0].message, message);
  }
});
