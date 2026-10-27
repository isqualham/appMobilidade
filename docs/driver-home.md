# Home do prestador — tarefa 11

## Auditoria e reaproveitamento

- `HomeScreen` continha o fluxo do passageiro e uma apresentação simulada do prestador (online inicial, ganhos e contagem fictícios). O fluxo do passageiro foi mantido; a apresentação do prestador foi extraída para `DriverHome`.
- `HomeMap`, `location.service`, `SideMenu`, `AuthContext`, Expo Router e a infraestrutura HTTP/autenticação existentes são reutilizados. Não há outro Drawer ou provedor de mapas.
- Os tokens de `src/theme` fornecem cores, espaçamento, raios, tamanhos e pesos tipográficos. Os ícones continuam sendo Lucide. As famílias tipográficas declaradas nos tokens não estão carregadas no aplicativo; preserva-se a fonte de sistema já utilizada.
- Não havia telas de Serviços/Ganhos, consulta de veículos elegíveis, resumo financeiro ou recuperação de corrida ativa implementados neste checkout.
- O item “Ver perfil” do Drawer foi preservado. Sua ação existente apenas fecha o menu; não há uma tela de perfil funcional para reaproveitar. Essa limitação anterior não foi ampliada nesta tarefa.

## Disponibilidade integrada

O contrato foi confirmado por leitura de `apiMobilidade/docs/disponibilidade-prestador.md`, DTOs, rotas e repositórios do backend. Nenhum arquivo do backend foi alterado.

- `GET /api/prestadores/disponibilidade` fornece `{ status, veiculoId, versao }` na entrada, no retorno à home e ao retomar o aplicativo.
- `GET /api/veiculos` lista veículos próprios. `GET /api/categorias-veiculo` lista somente categorias e tipos ativos; o aplicativo cruza os IDs e remove veículos inativos. O PATCH revalida aprovação, propriedade e elegibilidade no servidor.
- Ao escolher Ficar online, a versão é atualizada por GET e o seletor existente apresenta os veículos elegíveis. Mesmo um único veículo exige escolha explícita. O PATCH envia `{ status: "ONLINE", veiculoId, versao }`.
- Ficar offline envia somente `{ status: "OFFLINE", versao }`. A tela aplica a resposta confirmada; não faz atualização otimista.
- HTTP 409 provoca nova consulta de disponibilidade e `GET /api/corrida/ativa`, sem repetição automática do PATCH. Corrida ativa recebe mensagem específica. A consulta não cancela nem altera corridas.
- Em falhas de rede, timeout ou resposta inválida após escrita, o aplicativo reconcilia com GET, sem repetir a escrita. Falha na reconciliação mostra estado desconhecido e botão Atualizar status.
- Há mensagens para 400, 401, 403 e falhas gerais. Cliques concorrentes são bloqueados. Respostas posteriores ao logout/desmontagem são ignoradas.
- Background, logout, navegação e troca de perfil não enviam Offline automaticamente. A disponibilidade pertence ao servidor e é compartilhada entre sessões. Somente a seleção ainda não confirmada é descartada.
- O HTTP e refresh token existentes são reutilizados. Não há polling de ofertas, rastreamento remoto ou persistência local adicional.

Pré-requisito de implantação: a documentação do backend informa que a migration `20261027010000_disponibilidade_prestador` ainda precisa ser aplicada no ambiente correspondente. Não foi executada nesta integração, e a API real não foi exercitada com credenciais de usuário.

## Interface e navegação

- Mapa superior, menu existente, status central, aviso de notificações indisponíveis e botão para recentralizar.
- Painel branco arredondado, saudação personalizada, disponibilidade, cartão de solicitações e resumo sem valores fictícios.
- Início, Serviços e Ganhos usam o mesmo Expo Router. As duas novas rotas são estruturas mínimas com estado indisponível e o Drawer existente, restritas ao perfil de prestador.
- Safe areas no topo e rodapé; painel rolável e reorganização para telas estreitas/fontes ampliadas. Áreas de toque mínimas de 44 pontos.
- Localização negada apresenta erro e permite tentar novamente.

Diferenças intencionais da referência: estado inicial consultado no servidor, ausência da aba Perfil e da simulação, dados financeiros indisponíveis e mensagens sobre disponibilidade persistida. O mapa e o marcador são os nativos existentes, não a ilustração do Figma. A tipografia depende das fontes atualmente disponíveis no projeto.

## Próximas integrações

1. Recuperar e apresentar a corrida ativa real após login/reabertura. A consulta após 409 apenas identifica o bloqueio de disponibilidade; não implementa uma tela de corrida.
2. Integrar recebimento de ofertas e aceite em tarefa própria.
3. Integrar resumo de ganhos/serviços, notificações e o destino do item de perfil quando os respectivos contratos/telas estiverem disponíveis.
4. Validar visualmente em Android/iOS, incluindo fonte ampliada, GPS real e sessão simultânea em dois dispositivos. Os testes usam doubles dos módulos nativos e HTTP; não substituem execução em dispositivo.

## Validação

- `npx tsc --noEmit`.
- `npm test`: regressão de autenticação e testes de disponibilidade, apresentação, navegação e mapa.
- `npm run lint`: o ambiente apresenta a falha conhecida do binding nativo `unrs-resolver`. ESLint validado pela API Node com a configuração Expo e substituição temporária de `import/resolver` pelo resolver Node, sem modificar configuração/dependências.
- Node instalado: 20.14.0; Expo alerta que requer versão >=20.19.4.

Não houve alteração de backend, autenticação, armazenamento de tokens ou instalação de dependências.
