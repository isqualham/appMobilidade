# Atualização para Expo SDK 58

## Versões alinhadas

| Dependência | Versão instalada |
| --- | --- |
| Expo | 58.0.20 |
| React / React DOM | 19.3.0 |
| React Native | 0.88.0 |
| Expo Router | 58.0.27 |
| Expo Location | 58.0.19 |
| react-native-maps | 1.29.11 |
| Reanimated | 4.7.1 |
| Worklets | 0.13.0 |
| react-native-screens | 4.30.0 |

As versões foram selecionadas pelo `expo install` e pela matriz `expo/bundledNativeModules.json`. Reanimated, Worklets e Screens foram declarados diretamente para evitar resolução transitiva fora da matriz. O Babel padrão do Expo configura Worklets automaticamente; não foi criado plugin manual ou alterado o transformador SVG do Metro. O provedor `react-native-maps` e a API estável de `expo-location` foram mantidos.

O aplicativo já importava Zod sem declará-lo diretamente. Foi declarada a versão 3.25.76 usada anteriormente, preservando os schemas existentes.

## Ajuste de código

A API estrita de tipos do RN 0.88 permite `null`/`undefined` em `AppState.currentState`. O tipo da variável `previousState` no AuthContext passou a ser inferido dessa propriedade. A comparação de estados, restauração de sessão, refresh token e autenticação não foram modificados.

## Node e Docker

O SDK exige Node `^22.13.0 || ^24.3.0 || ^26.0.0 || >=27.0.0`. O requisito foi declarado em `package.json`, e `.nvmrc` indica Node 24. O Node global 20.14.0 desta máquina é incompatível; para desenvolvimento local, selecionar Node 24 (`nvm use`, após instalar essa versão) antes de executar npm/Expo. As validações locais usaram Node 24.22.1 temporário, sem mudar a instalação global.

`Dockerfile`, `docker-compose.yaml`, rede, volumes, porta 8081 e configurações de polling foram preservados. O container existente usa Node 26.12.1/linux arm64, reconheceu todas as versões novas, carregou `metro.config.js` e passou no lint. O serviço não foi reiniciado. Um Metro que já estava em execução antes da atualização precisa ser reiniciado para carregar as novas dependências.

A imagem `node:alpine` continua flutuante, como antes. Os módulos são compartilhados pelo bind mount do projeto; uma futura instalação em outra arquitetura deve respeitar seus binários nativos. Nenhuma mudança de infraestrutura foi feita nesta tarefa.

## Validações concluídas

- Instalação limpa por `npm ci` concluída durante a migração; a continuação da validação não reinstalou dependências.
- `npm dedupe` removeu duplicações nativas sem ignorar peer dependencies. O lockfile final não contém links locais ou referências ao backup temporário.
- Expo Doctor: **20/20** verificações aprovadas.
- TypeScript: aprovado com a API estrita do RN, sem opt-out.
- `npm run lint`: aprovado normalmente, sem resolver alternativo, no host com Node 24 e no container com Node 26.
- `npm test`: **61/61** aprovados, incluindo sessão, login, disponibilidade e regressões de mapa/navegação com módulos nativos simulados.
- Exportação Metro/Hermes Android e iOS: aprovada após deduplicação. Artefatos locais em `/private/tmp/viau-sdk58-export-final`.
- `docker compose config --quiet`: aprovado; Docker Engine 29.8.2 acessível e serviço front em execução.

## Limitações e alertas

- Exportar bundles não é compilar APK/IPA nem testar GPS/mapas em dispositivo. É necessário reconstruir um development build compatível com SDK 58 ou usar Expo Go compatível, e testar permissões, localização, rotas, login e navegação no aparelho.
- `npm audit` reportou três entradas de severidade alta relacionadas a Zod <4.6.6: Zod, @expo/cli e Expo. O aviso é GHSA-mrhx-c7xc-m3w5 (consumo de memória em coleções grandes). A correção automática sugerida para Expo propõe downgrade para SDK 54; não foi aplicada. A migração de Zod para outra major e a atualização do CLI precisam ser avaliadas separadamente para preservar validações e compatibilidade. Não foram usados `--force` ou `--legacy-peer-deps`.
- Nenhuma configuração de credenciais, backend, Docker ou funcionalidade de produto foi alterada.

Referências: [guia de atualização](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/), [SDK 58](https://expo.dev/changelog/sdk-58), [Reanimated](https://docs.expo.dev/versions/v58.0.0/sdk/reanimated/), [mapas](https://docs.expo.dev/versions/v58.0.0/sdk/map-view/), [localização](https://docs.expo.dev/versions/v58.0.0/sdk/location/).
