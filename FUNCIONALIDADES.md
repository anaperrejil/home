# MERIS — Home conversacional · Documentação completa do protótipo

> Documentação de handoff. Jornadas, telas, itens e comportamentos implementados.
> Rodar: `python3 serve.py` na pasta do projeto → http://localhost:5173/Home.html
>
> **Backlog de produto**: os épicos e histórias de usuário vivem no Linear —
> [PRO-53 · Home MERIS](https://linear.app/coodex-ai/issue/PRO-53/home-meris).
> Este documento descreve **o que o protótipo faz**; o Linear define **o que será construído**.
>
> **Requisitos de handover das jornadas** (gatilho, pré-condições, passos, ramificações,
> estados de erro/vazio/permissão, resultado e critério de sucesso): [ESPECIFICACAO-JORNADAS.md](./ESPECIFICACAO-JORNADAS.md).

---

# Parte 1 · Jornadas do usuário

## J1 · Primeiro acesso
1. Ao abrir o app, surge o modal **"Bem-vinda à nova Home"** (marca M + explicação da home conversacional) com 4 blocos: Dashboard padrão, Resumo diário, Documentos para assinar, Viewer 3D.
2. O usuário **escolhe 1 ou 2** (com 2 marcados os demais esmaecem; "Começar" desabilitado em 0; o modal Configurar home mantém o contador "N/2").
3. Confirmando, a home abre com o chat ao centro e os blocos escolhidos em tela dividida. A escolha sincroniza com a Central de controle.

## J2 · Conversar e abrir painéis
1. Na home, o usuário pergunta no chat ou usa as 6 **sugestões para começar** (onboarding guiado, resumo do dia, documentos críticos, curva S, itens fora de ciclo, 3D) — cada uma com resposta própria.
2. O roteamento por intenção abre o painel certo **em tela dividida**: dashboard, documento (P&ID), relatório (RIR), viewer 3D + ativos, fila de aprovações. Citar um **dashboard salvo pelo nome** abre aquele dashboard específico ao lado.
3. Recursos da conversa: chips de TAG clicáveis (focam o 3D / abrem documento), chips de SLA, cards de referência, checklists, campo de base de dados, título **renomeável inline** (lápis), Compartilhar, painéis redimensionáveis e reordenáveis, menu **Skills**, **seletor de fonte de dados** (Automático ou uma fonte específica).

## J3 · Criar documentos (artefatos)
1. Pedir *"criar/gerar/escrever/redigir [ata, memorando, relatório, procedimento, comunicado, ofício, e-mail, carta, especificação, plano de ação]"* abre um **bloco lateral com o documento gerado** — título adaptado ao tipo, cabeçalho (projeto · data), seções numeradas e assinatura.
2. Ações: **Copiar texto** (clipboard + toast) e **Baixar .docx** (toast). O agente ("redator técnico") oferece ajustar tom, seções, TAGs ou preparar para o GED.

## J4 · Dados que não existem nas bases
1. Pedidos que dependem de dados fora das fontes fixas (linha de base do cronograma, custo, EVM…) recebem a resposta *"Sei montar essa análise. O método de cálculo é direto. O ponto é que ela depende da linha de base do cronograma, que não está nas fontes fixas"*, com callout **"Importe o cronograma como fonte externa (CSV)"** e botão **Abrir Fontes de dados**.
2. Após conectar a fonte (J4a/J8), a checklist de insumos dos comentários de KPI reconhece a base como disponível ✓.

## J4a · Conectar uma fonte externa (assistente de conexão)
1. **"Conectar fonte"** (na Central de controle → Fontes externas) abre o **catálogo de conectores**: PostgreSQL, BigQuery, Snowflake, API REST, Modelo 3D (AVEVA E3D/PDMS ou Plant 3D), Pacote JSON e Planilha CSV.
2. Cada tipo tem um **assistente por etapas** com stepper próprio: conexão/credenciais ou upload → teste/detecção (spinner "analisando…" e resultado simulado: teste de conexão, schemas com checkbox, endpoints, schema inferido, relações do pacote JSON com % de match) → confirmação.
3. **Resumo final com IA**: identifica o tema da fonte e sugere **perguntas prontas clicáveis**. Clicar numa sugestão **conecta a fonte e já abre um chat** com aquela pergunta (badge "Fonte conectada" + campo de base de dados). "Conectar fonte" apenas registra e mostra toast.
4. A fonte conectada entra na lista de **Fontes externas** (status "Conectada", registros, sincronização) e fica disponível no **seletor de fonte do chat** (J2) e no campo de base das mensagens.

## J5 · Organizar dashboards
1. **Meus dashboards**: busca no header (nome + descrição, grupos vazios somem durante a busca), grupos/pastas com contagem e avatares, seção "Sem grupo".
2. Menu do grupo: **Compartilhar grupo** (compartilha todos os dashboards de uma vez, com aviso "dashboards adicionados depois herdam o acesso"), Renomear, Excluir (dashboards caem em "Sem grupo").
3. Menu do card: **Fixar na home / Remover da home**, **Compartilhar**, **Mover para grupo** (submenu com check), **Renomear** (inline), **Editar descrição** (inline), **Deletar** (confirmação). Selos **Home** e **Compartilhado** + avatares no card. Excluir o dashboard fixado restaura o padrão na home.

## J6 · Criar e editar dashboards
1. **Novo dashboard** abre o editor **em branco** ("Dashboard vazio: comece pelo Adicionar KPI").
2. No editor: tile **Adicionar KPI** (catálogo por grupos com busca — KPIs e visualizações: Curva S, Documentos críticos, Feed), arrastar blocos para reordenar, **comentar componentes** (ícone marca o item → chip no composer → resposta com card Referência + checklist de insumos + campo de base).
3. **Salvar** (sempre no header): num dashboard novo cria a entrada em Meus dashboards; num existente confirma "Alterações salvas" — ambos voltam à visão interna, que exibe **nome + descrição + status** (fixado na home / compartilhado com N pessoas / atualizado automaticamente).

## J7 · Colaborar
1. **Compartilhar conversa**: modal com pessoas (busca por nome/cargo), níveis pode ver/comentar/editar, remover acesso, link do projeto (toggle + nível + copiar).
2. **Compartilhar a partir de um KPI** ("Compartilhar" no menu do card): modal **"Criar chat sobre o indicador"** com botão **Criar chat** — cria a conversa compartilhada já com o **snapshot congelado** do indicador na primeira mensagem.
3. **Chats compartilhados** (tela): botão **Criar chat compartilhado** (modal → inicia a conversa na hora), busca, **Favoritar** (estrela + topo da lista) e **Renomear** (inline) no menu de cada item.
4. Na conversa em grupo, o agente só responde quando mencionado (**@meris**). Se a menção citar documento/dashboard (inclusive por nome)/relatório/3D, o painel **abre em tela dividida, visível para todos**.
5. **Concluir** (exclusivo de chats compartilhados, no header): modal de confirmação com **nota de encerramento opcional** → a conversa sai da lista, vai para **Concluídas** na sidebar (com a nota) e o chat fecha voltando à home. Conversas concluídas podem ser reabertas.

## J8 · Central de controle
1. **Card Home**: Configurar → modal com **blocos da home** (mesmo seletor de 1–2 do onboarding, aplica ao vivo) + **dashboard da home** (padrão ou salvos, com descrição).
2. **Card Modo TV**: **Abrir modo TV** (direto, com a config salva) + Configurar → assistente em etapas (J9).
3. **Card Fontes de dados**: resumo (Conectadas/Sincronizando/Desatualizadas); **fontes fixas** (Cortex MERIS, GED documental, Matriz de e-mail) com **Sincronizar** (ícone ↻ → "Sincronizando…" → conectada agora) e **Perguntar** (abre conversa sobre a fonte); **fontes externas** com botão **Conectar fonte** → abre o **assistente de conexão** (J4a: catálogo de 7 tipos + wizard por etapas + resumo com IA). Arquivos anexados (ex.: `Lista_Ativos_U4730_Rev04.csv`) têm **Baixar**, **Atualizar** (vira Rev+1 e alimenta o histórico), **Excluir** (confirmação) e **Histórico (N)** — drawer lateral com as versões, autores, notas e datas (badge "Atual" na vigente). A importação de CSV avulsa mantém a simulação de processamento (enviar → ler → mapear colunas → validar → indexar, com barra de progresso).

## J9 · Modo TV (telões e salas de controle)
1. **Assistente em 3 etapas** com stepper: **(1) Dashboards** — cards com miniatura, busca ("podem haver muitos dashboards") e número da ordem de seleção; dashboards grandes mostram o selo "2 TELAS". **(2) Tempo** — 10s / 30s / 60s por tela. **(3) Confirmar** — resumo ("N telas, trocando a cada Xs, ciclo completo de Ys"), aviso de dashboard grande (*"não cabe em uma tela: os blocos serão divididos e reposicionados automaticamente em 2 telas"*) e playlist final com miniaturas + **setas ↑/↓ para reposicionar**. Botões Concluir e **Abrir modo TV**.
2. **Player fullscreen**: header escuro (marca, "Centro Visual do Projeto", subtítulo do contrato), contador de slide, **relógio ao vivo**, controles **◀ anterior · ⏸/▶ pausar-retomar · próximo ▶ · chip de tempo clicável (cicla 10/30/60s) · ✕ sair**; barra de progresso do slide; rotação automática baseada em tempo real.
3. Slides: número + nome do dashboard ("· Tela 1 de 2" nos divididos), selo Ao vivo, KPIs grandes (valor 52px), Curva S (largura limitada quando sozinha), Avanço por disciplina e Feed **com tipografia e contraste calibrados para distância** — e o conteúdo **sempre cabe na tela** (escala medida pelo conteúdo real). `esc` fecha.

---

# Parte 2 · Telas e itens

## Rail de módulos (1º nível, 56px)
| Item | Comportamento |
|---|---|
| Logo M | Marca (estático) |
| **Home** (1º ícone, ativo) | Volta à tela inicial com os blocos configurados |
| GED, Engenharia, Comissionamento, Planejamento 6WLA, Gestão, Viewer 3D, Relatórios | Tooltip; clique → toast "disponível no MERIS completo" |
| Suporte · Ajuda · Configurações · Avatar AB | Toast / tooltip |

## Sidebar (2º nível, 260px ↔ 64px)
- Toggle de colapso (Tweak pode forçar estado).
- **Workspace**: Home · Meus dashboards · Chats compartilhados · **Central de controle**.
- Divisor + label **SEUS CHATS** + **Novo chat** (estilo neutro; abre chat vazio só com sugestões) + **busca** (fundo branco; filtra por título, ✕ limpa, estado vazio).
- Grupos de conversas em sentence case: **Favoritos** (no topo, via menu Favoritar), Hoje, Ontem, Últimos 7 dias, Anterior, **Concluídas**.
- Menu "…" da conversa: Favoritar/Remover dos favoritos · Compartilhar · Renomear (inline) · Excluir (confirmação).

## Barra superior
- Breadcrumb contextual com níveis clicáveis (Home / Conversa / Meus dashboards › nome › Edição / Central de controle / Chats compartilhados).
- **Seletor de projeto** (dropdown com 3 projetos, check no ativo).
- **Lupa → busca global** (conversas + dashboards; esc fecha; clique navega).
- **Sino → notificações** (feed do projeto; ponto some ao abrir).

## Home conversacional
- Saudação dinâmica por hora + data + resumo do dia.
- 6 cards de sugestão funcionais.
- Blocos configuráveis (1–2): Dashboard, **Resumo diário** (chips de estatísticas + feed Hoje/Ontem), **Documentos para assinar** (tabela somente leitura; rodapé "a assinatura é feita na tela de relatórios" + botão), Viewer 3D. Redimensionáveis, reordenáveis, fixáveis/removíveis pelo menu.
- Com um dashboard salvo fixado, o bloco principal renderiza esse dashboard.

## Composer
- Auto-grow · 0/4000 · Enter envia · Shift+Enter quebra.
- **Anexar** (GED com busca, ou arquivo local; chips removíveis; resposta de análise).
- **Skills** (genéricas): Criar um dashboard · Resumir informações · Gerar um documento · Analisar uma planilha (cada uma com fluxo real).
- **Fonte: Automático** — seletor de fonte de dados: **Automático** (o agente escolhe a fonte que melhor responde, padrão) ou uma fonte específica (fixas + externas conectadas). Fonte escolhida destaca o chip em azul; o dropdown usa posição fixa (abre para cima ou para baixo conforme o espaço, nunca cortado).
- Em modo edição: chip "Comentando: {item}".

## Cards de KPI (padrão único em todas as telas)
- Card com mini-visualização (gauge/sparkline/barras/progresso), **fonte de dados no rodapé** (texto cinza, alinhado embaixo à esquerda, sem divisória, sem separadores) — em home, conversas, dashboard salvo, dashboard fixado e editor.
- Menu "…": **Perguntar sobre** (resposta com **snapshot citado**) · **Fixar na home / Remover da home** · **Compartilhar** (→ Criar chat com snapshot) · **Deletar** (vermelho).
- Dashboard padrão default: Atividades concluídas, Pendências abertas, Documentos emitidos, Alertas críticos + **Curva S** + Feed (KPIs genéricos; os específicos do domínio ficam no catálogo).
- O menu dropdown usa posição fixa — nunca é cortado por contêineres.

## Meus dashboards / Dashboard aberto / Editor
(ver J5/J6) — header da biblioteca: busca + Novo grupo + Novo dashboard, na mesma linha.

## Chats compartilhados
(ver J7) — header: busca + Criar chat compartilhado, na mesma linha; favoritos primeiro.

## Central de controle
(ver J8) — cada sessão em um **card componente** (Home, Modo TV, Fontes de dados); título 20px; subtítulo em uma linha.

## Modais
| Modal | Função |
|---|---|
| Bem-vinda à nova Home | Seleção inicial de 1–2 blocos |
| Configurar home | Blocos (1–2) + dashboard fixado |
| Configurar modo TV | Assistente em 3 etapas (J9) |
| Compartilhar conversa / dashboard / grupo | Pessoas + níveis + link |
| Criar chat sobre o indicador | Snapshot + Criar chat |
| Concluir conversa | Confirmação + nota opcional |
| Adicionar ao dashboard | Catálogo de KPIs/visualizações (só no editor) |
| Anexar do GED | Busca de documentos |
| Conectar fonte externa | Catálogo de 7 conectores + assistente por etapas + resumo com IA (J4a) |
| Busca global | Conversas + dashboards |
| Drawer Histórico | Versões do arquivo anexado |

## Acessibilidade e padronização
- Títulos de página 20px; textos secundários `#334155` e terciários `#64748B` (tons fortes em todas as telas).
- Margens uniformes (24px topo / 32px laterais) em todas as telas de página, iguais à home.
- Sem travessões (—) nem separadores "·" nos rodapés de cards; textos reescritos com pontuação natural.
- Modo TV com paleta clara própria (rótulos `#E2E8F0+`, trilhas e grades visíveis, feed em destaque com tipo colorido por severidade).
- Toasts confirmam toda ação de estado.

---

# Parte 3 · Arquitetura

| Arquivo | Responsabilidade |
|---|---|
| `Home.html` | Shell + estilos globais + carga dos módulos (React 18 + Babel via CDN, com versionamento de cache) |
| `src/icons.jsx` | Set de ícones (traço Lucide 1.5px, inclui play/pause/star/refresh) + marca MERIS |
| `src/data.jsx` | Dados de exemplo: KPIs, fontes, dashboards (grupos, descrições, `large`), equipe, conversas, docs para assinar |
| `src/Blocks.jsx` | Blocos: dashboard, KPIs, Curva S, viewer 3D, tabelas, Resumo do dia, Documento gerado, Documentos p/ assinar |
| `src/DocPanes.jsx` | Documento técnico (P&ID) e relatório (RIR) |
| `src/ShareModal.jsx` | Compartilhamento (conversa / indicador / dashboard / grupo) |
| `src/Connector.jsx` | Assistente de conexão de fontes externas (catálogo de conectores + wizards por tipo + resumo com IA) |
| `src/ChatPanel.jsx` | Chat: boas-vindas, thread, composer (com seletor de fonte), mensagens ricas, snapshot, checklist, campo de base |
| `src/Sidebar.jsx` | Rail de módulos + sidebar de chats (favoritos, grupos, busca) |
| `src/Library.jsx` | Meus dashboards (grupos, cards, descrições) + dashboard salvo |
| `src/Screens.jsx` | Composição de telas, split panes, editor, Central de controle, chats compartilhados |
| `src/app.jsx` | Estado global, roteamento, topbar, busca global, notificações, modais, modo TV (wizard + player) |
| `serve.py` | Servidor local sem cache (porta 5173) |
