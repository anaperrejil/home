// MERIS Home — sample domain data (pt-BR, UGH Boaventura / Petrobras commissioning)

const SUGGESTED_SKILLS = [
  { id: 'dash',   icon: 'layout-dashboard', title: 'Criar um dashboard',     desc: 'Monte um painel com os indicadores que você pedir.' },
  { id: 'resumo', icon: 'sparkles',         title: 'Resumir informações',    desc: 'Resuma o dia, documentos ou o status do projeto.' },
  { id: 'doc',    icon: 'file-text',        title: 'Gerar um documento',     desc: 'Atas, memorandos, relatórios e comunicados.' },
  { id: 'dados',  icon: 'table',            title: 'Analisar uma planilha',  desc: 'Importe um CSV e pergunte sobre os dados.' },
];

// "Sugestões para começar" — starter cards on the home welcome.
const STARTERS = [
  { id: 's1', icon: 'globe',          tone: 'info',      title: 'Montar onboarding do projeto', desc: 'Visão guiada do UGH Boaventura em minutos', prompt: 'Montar o onboarding guiado do projeto UGH Boaventura' },
  { id: 's2', icon: 'sparkles',       tone: 'discovery', title: 'Resumo do dia',                desc: 'O que mudou desde ontem e o que exige atenção', prompt: 'Gerar o resumo do dia no dashboard padrão' },
  { id: 's3', icon: 'file-text',      tone: 'success',   title: 'Documentos críticos da semana', desc: 'Emissões em atraso e pendências de SLA', prompt: 'Quais documentos estão aguardando aprovação?' },
  { id: 's4', icon: 'trending-up',    tone: 'info',      title: 'Aderência da curva S',          desc: 'Planejado versus realizado por disciplina', prompt: 'Resumir o avanço de comissionamento no dashboard padrão' },
  { id: 's5', icon: 'alert-triangle', tone: 'warning',   title: 'Itens fora de ciclo agora',     desc: 'Ativos e malhas fora do planejamento 6WLA', prompt: 'Abrir o viewer 3D com os ativos fora de ciclo' },
  { id: 's6', icon: 'boxes',          tone: 'discovery', title: 'Visualizar ativos em 3D',       desc: 'Navegar a planta e localizar TAGs', prompt: 'Abrir o visualizador 3D da planta' },
];

const KPIS = [
  { id: 'avanco',     label: 'AVANÇO GERAL',          value: '78,2', unit: '%',  delta: '+3,1 pts', trend: 'up',   tone: 'success', icon: 'gauge', viz: 'gauge', pct: 78.2 },
  { id: 'atividades', label: 'ATIVIDADES CONCLUÍDAS', value: '1.284', unit: '',   delta: '+96 na semana', trend: 'up', tone: 'info',  icon: 'list-checks', viz: 'sparkline', series: [820, 910, 980, 1040, 1120, 1190, 1284] },
  { id: 'prazo',      label: 'DESVIO DE PRAZO',       value: '−4,2', unit: 'd',   delta: 'melhora de 1,3d', trend: 'up', tone: 'warning', icon: 'clock' },
];

const KPIS_EXTRA = [
  { id: 'pendencias', label: 'PENDÊNCIAS ABERTAS', value: '23', unit: '', delta: '−5 na semana', trend: 'up', tone: 'success', icon: 'alert-triangle', viz: 'sparkline', series: [38, 35, 33, 30, 28, 26, 23] },
  { id: 'alertas',    label: 'ALERTAS CRÍTICOS',   value: '2',  unit: '', delta: '1 novo hoje', trend: 'down', tone: 'danger', icon: 'zap' },
  { id: 'malhas',    label: 'MALHAS LIBERADAS',   value: '342', unit: '/418', delta: '81,8%', trend: 'up', tone: 'info', icon: 'git-branch', viz: 'progress', pct: 81.8 },
  { id: 'naoconf',   label: 'NÃO CONFORMIDADES',  value: '23',  unit: '',     delta: '−5 na semana', trend: 'up', tone: 'success', icon: 'alert-triangle', viz: 'sparkline', series: [38, 35, 33, 30, 28, 26, 23] },
  { id: 'fvi',       label: 'TAGS SEM FVI',       value: '37',  unit: '',     delta: '−8 na semana', trend: 'up', tone: 'warning', icon: 'list-checks' },
  { id: 'sla',       label: 'PENDÊNCIAS SLA',     value: '12',  unit: '',     delta: '2 críticas', trend: 'down', tone: 'danger', icon: 'gauge' },
  { id: 'produt',    label: 'PRODUTIVIDADE',      value: '1,8', unit: '×',    delta: '+0,2 vs. meta', trend: 'up', tone: 'success', icon: 'activity', viz: 'bars', series: [1.2, 1.4, 1.3, 1.6, 1.7, 1.8] },
  { id: 'docs-emit', label: 'DOCUMENTOS EMITIDOS', value: '64', unit: '/7d', delta: '+12 na semana', trend: 'up', tone: 'info', icon: 'file-text', viz: 'bars', series: [8, 11, 9, 13, 12, 14, 18] },
  { id: 'adequacoes',label: 'ADEQUAÇÕES',         value: '18', unit: '',     delta: '7 abertas', trend: 'down', tone: 'warning', icon: 'pencil' },
  { id: 'revisoes',  label: 'REVISÕES EM CURSO',  value: '9',  unit: '',     delta: '3 disciplinas', trend: 'up', tone: 'info', icon: 'git-branch' },
  { id: 'criticos',  label: 'DOCUMENTOS CRÍTICOS',value: '5',  unit: '',     delta: 'SLA estourando', trend: 'down', tone: 'danger', icon: 'alert-triangle' },
  { id: 'aguardando',label: 'AGUARDANDO APROVAÇÃO',value: '7', unit: '',     delta: 'fila atual', trend: 'up', tone: 'warning', icon: 'clock' },
  { id: 'recem',     label: 'RECÉM-EMITIDOS',     value: '14', unit: '/24h', delta: 'últimas 24h', trend: 'up', tone: 'info', icon: 'file-text' },
  { id: 'marcos',    label: 'MARCOS DO MÊS',      value: '6',  unit: '/8',   delta: '2 pendentes', trend: 'up', tone: 'success', icon: 'check-circle' },
  { id: 'cronograma',label: 'ATRASO CAMINHO CRÍTICO',value: '3', unit: 'd',  delta: 'melhora de 1d', trend: 'up', tone: 'warning', icon: 'clock' },
];

// Catálogo "Adicionar à home" — KPIs e visualizações por grupo.
const HOME_CATALOG = [
  { group: 'Comissionamento', items: [
    { id: 'avanco', type: 'kpi', icon: 'check-circle', title: 'Avanço geral', desc: '% do plano concluído' },
    { id: 'atividades', type: 'kpi', icon: 'activity', title: 'Atividades concluídas', desc: 'Atividades fechadas na semana' },
    { id: 'naoconf', type: 'kpi', icon: 'alert-triangle', title: 'Pendências de teste', desc: 'Itens em retrabalho ou pendentes' },
  ] },
  { group: 'Engenharia', items: [
    { id: 'docs-emit', type: 'kpi', icon: 'file-text', title: 'Documentos emitidos', desc: 'Emissões nos últimos 7 dias' },
    { id: 'adequacoes', type: 'kpi', icon: 'pencil', title: 'Adequações', desc: 'Adequações abertas e fechadas' },
    { id: 'revisoes', type: 'kpi', icon: 'git-branch', title: 'Revisões em curso', desc: 'Revisões ativas por disciplina' },
  ] },
  { group: 'Documentos', items: [
    { id: 'w-docs', type: 'widget', icon: 'file-text', title: 'Documentos críticos', desc: 'Tabela de TAGs com SLA estourando' },
    { id: 'aguardando', type: 'kpi', icon: 'clock', title: 'Aguardando aprovação', desc: 'Fila de aprovação atual' },
    { id: 'recem', type: 'kpi', icon: 'file-text', title: 'Recém-emitidos', desc: 'Últimas 24h' },
  ] },
  { group: 'Planejamento', items: [
    { id: 'w-scurve', type: 'widget', icon: 'trending-up', title: 'Curva S', desc: 'Planejado vs realizado', alwaysOn: true },
    { id: 'w-feed', type: 'widget', icon: 'bell', title: 'Feed do projeto', desc: 'Atividade recente da equipe', alwaysOn: true },
    { id: 'cronograma', type: 'kpi', icon: 'clock', title: 'Cronograma', desc: 'Atrasos do caminho crítico' },
  ] },
];

// Project activity feed (home widget).
const PROJECT_FEED = [
  { id: 'f1', tone: 'danger',  kind: 'BO Crítica', text: 'BO-247: Vazamento detectado no skid V-128 durante teste hidrostático.', who: 'Carlos M.', when: 'há 12 min' },
  { id: 'f2', tone: 'accent',  kind: 'Marco', text: 'Pasta 12: Comissionamento concluído na malha L-04.', who: 'Time C&M', when: 'há 1 h' },
  { id: 'f3', tone: 'success', kind: 'Aprovação', text: 'Plano de comissionamento TP-2401 aprovado pela qualidade.', who: 'Lucia F.', when: 'há 2 h' },
  { id: 'f4', tone: 'warning', kind: 'BO', text: 'BO-246: Divergência de revisão entre P&ID e isométrico.', who: 'Equipe Eng.', when: 'há 4 h' },
  { id: 'f5', tone: 'info',    kind: 'Documento', text: 'Lista de cabos IE-2401 revisada · 14 itens alterados.', who: 'Disciplina IE', when: 'há 6 h' },
];

// Critical documents (home widget table).
const CRIT_DOCS = [
  { tag: '10"-V128-4730-1387-RWP02', title: 'P&ID do Skid de injeção V-128', status: 'Aprovado', tone: 'success', rev: '04' },
  { tag: '6"-V128-3210-1042-IQ', title: 'Folha de dados da Válvula VA-101', status: 'Em réplica', tone: 'warning', rev: '02' },
  { tag: 'IE-2401-LP-005', title: 'Lista de cabos do Painel de força', status: 'Aguardando', tone: 'info', rev: '01' },
  { tag: 'MC-COMM-TP-2401', title: 'Plano de comissionamento TP-2401', status: 'Crítico', tone: 'danger', rev: '03' },
  { tag: 'QA-INSP-0987', title: 'Relatório de inspeção visual', status: 'Aprovado', tone: 'success', rev: '02' },
];

// S-curve: previsto (planned) vs realizado (actual), % acumulado por mês.
const SCURVE = {
  labels: ['Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
  previsto:  [4, 11, 22, 36, 52, 67, 79, 88, 95, 100],
  realizado: [3, 9, 19, 33, 49, 64, 74, 84, null, null], // futuro = null
};

// Floating asset TAGs over the 3D plant (x/y as % of viewport box).
const PLANT_TAGS = [
  { id: 'SKID', code: 'Skid 4730-IF-001', x: 50, y: 18, status: 'warning' },
  { id: 'P001', code: 'Pump P-001',       x: 26, y: 34, status: 'info' },
  { id: 'V001', code: '21-V-001',         x: 72, y: 42, status: 'success' },
  { id: 'TQ07', code: 'TQ-07',            x: 80, y: 64, status: 'info' },
  { id: 'C310', code: 'C-310',            x: 16, y: 60, status: 'success' },
];

const DOCS = [
  { tag: '10"-V128-4730-1387-RWP02(ZUT)-IQ', disc: 'Instrumentação', rev: 'C', status: 'Aprovado',            tone: 'success' },
  { tag: 'PID-4730-001-RB',                   disc: 'Tubulação',      rev: 'B', status: 'Em Andamento',        tone: 'info' },
  { tag: 'MAL-EL-2204-FVM',                   disc: 'Elétrica',       rev: 'A', status: 'Aguardando Aprovação', tone: 'warning' },
  { tag: 'TQ-07-1102-FVI',                    disc: 'Mecânica',       rev: 'D', status: 'Aprovado',            tone: 'success' },
  { tag: 'P-204-A-3380-SOP',                  disc: 'Instrumentação', rev: 'B', status: 'Reprovado',           tone: 'danger' },
  { tag: 'C-310-7741-TTAS',                   disc: 'Comissionamento',rev: 'A', status: 'Em Andamento',        tone: 'info' },
];

const ASSETS = [
  { tag: 'P-204-A',        type: 'Bomba centrífuga',  area: 'U-4730', prog: 92, status: 'Em Andamento', tone: 'info' },
  { tag: 'V-128',          type: 'Vaso de pressão',   area: 'U-4730', prog: 100, status: 'Liberado',    tone: 'success' },
  { tag: 'TQ-07',          type: 'Tanque de teto fixo',area: 'U-3380', prog: 78, status: 'Em Andamento', tone: 'info' },
  { tag: 'C-310',          type: 'Compressor',        area: 'U-7741', prog: 64, status: 'Pendência',    tone: 'warning' },
  { tag: 'PSV-441',        type: 'Válvula de segurança',area: 'U-4730', prog: 100, status: 'Liberado',  tone: 'success' },
];

// Grupos para organizar os dashboards (pastas)
const DASH_GROUPS = [
  { id: 'g-comm',   name: 'Comissionamento' },
  { id: 'g-gestao', name: 'Gestão executiva' },
];

const SAVED_DASHBOARDS = [
  { id: 'd1', name: 'Comissionamento UGH Boaventura', desc: 'Visão executiva do comissionamento: curva S, malhas e ativos.', edited: 'há 2 horas',  charts: 4, accent: 'info',    kind: 'scurve',  group: 'g-comm',   members: ['u-ana', 'u-kalil', 'u-carlos'], large: true },
  { id: 'd2', name: 'Aderência ao plano 6WLA', desc: 'Aderência semanal ao plano 6WLA por disciplina.', edited: 'ontem',       charts: 3, accent: 'success', kind: 'bars',    group: 'g-comm',   members: [] },
  { id: 'd3', name: 'SLA de réplica e tréplica', desc: 'Acompanhamento dos prazos de réplica e tréplica.', edited: 'há 3 dias',   charts: 2, accent: 'warning', kind: 'donut',   group: 'g-gestao', members: ['u-ana', 'u-lucia'] },
  { id: 'd4', name: 'Heatmap de não conformidades', desc: 'Mapa de calor das não conformidades por área.', edited: 'há 5 dias',   charts: 5, accent: 'danger',  kind: 'heatmap', group: null,       members: [] },
  { id: 'd5', name: 'Ranking de áreas por avanço', desc: 'Comparativo de avanço físico entre áreas.', edited: 'há 1 semana', charts: 3, accent: 'accent',  kind: 'bars',    group: 'g-gestao', members: [] },
  { id: 'd6', name: 'Emissão por disciplina', desc: 'Volume de emissões de documentos por disciplina.', edited: 'há 2 semanas',charts: 4, accent: 'brand',   kind: 'scurve',  group: null,       members: [] },
];

const RECENT_CHATS = {
  'Hoje': [
    { id: 'c1', title: 'Aderência da curva S' },
    { id: 'c2', title: 'Documentos críticos esta semana' },
    { id: 'c3', title: 'Replanejamento da semana 21' },
  ],
  'Ontem': [
    { id: 'c4', title: 'Testes de comissionamento da U-4730' },
    { id: 'c5', title: 'Aprovações pendentes na fila' },
  ],
  'Últimos 7 dias': [
    { id: 'c6', title: 'Onboarding do projeto' },
    { id: 'c7', title: 'Curva de avanço físico' },
    { id: 'c8', title: 'Análise de desvios da curva S' },
    { id: 'c9', title: 'Pendências de réplica e tréplica' },
  ],
  'Anterior': [
    { id: 'c10', title: 'Plano de inspeção do Painel de força' },
    { id: 'c11', title: 'Resumo executivo abril' },
    { id: 'c12', title: 'Ativos do TAG ZUT IQ' },
  ],
};

// Rich seeded conversations per use case. parts: string | {tag} | {b}
const CONVERSATIONS = {
  viewer: {
    user: 'Abrir o 3D do Skid 4730-IF-001 e o contexto da pendência',
    agent: 'analista de engenharia',
    chat: { title: 'Skid 4730-IF-001: linhas adicionais', subtitle: 'Atualizado ontem' },
    rich: {
      title: 'Skid 4730-IF-001: linhas adicionais',
      badges: [{ label: 'Em caminho crítico', tone: 'discovery', icon: 'zap' }, { label: 'Engenharia', tone: 'neutral' }],
      blocks: [
        { type: 'p', parts: ['A contraparte solicita a inclusão de duas linhas adicionais ao ', { tag: 'Skid 4730-IF-001', focus: 'SKID' }, ' e teste integrado em campo. A solicitação não consta na Lista Mestra de Documentos da Revisão E.'] },
        { type: 'p', parts: [{ b: 'Justificativa.' }, ' Classificado como crítico porque o teste depende da ', { tag: 'Pump P-001', focus: 'P001' }, ' estar comissionada e da liberação do vaso ', { tag: '21-V-001', focus: 'V001' }, '. Há ainda uma pendência ', { tag: 'SLA estourado: réplica 6 dias', sla: true }, ' neste escopo.'] },
        { type: 'refs', items: ['Cláusula 4.2: Escopo de fornecimento', 'Anexo III: LMD Rev. E', 'Memorial descritivo IF-001'] },
        { type: 'action', label: 'Ver no 3D', icon: 'boxes', kind: 'viewer' },
      ],
    },
  },
  dashboard: {
    user: 'Resumir o avanço de comissionamento no dashboard padrão',
    agent: 'analista de dados',
    chat: { title: 'Avanço de comissionamento', subtitle: 'Atualizado há 8 min' },
    rich: {
      title: 'Avanço de comissionamento (semana 20)',
      badges: [{ label: 'Em dia', tone: 'success', icon: 'check-circle' }, { label: 'Gestão', tone: 'neutral' }],
      blocks: [
        { type: 'p', parts: ['A ', { b: 'aderência ao plano' }, ' está em 87,4% (+2,1 pts na semana) e a curva S segue acima do previsto. Os testes concluídos somam 1.284, puxados pela ', { tag: 'U-4730', focus: 'P001' }, '.'] },
        { type: 'p', parts: ['O desvio de prazo recuou para −4,2 dias. O principal ofensor segue sendo a disciplina de ', { b: 'Tubulação' }, ' (61%), concentrada na ', { tag: 'U-3380', focus: 'TQ07' }, '.'] },
        { type: 'refs', items: ['Plano 6WLA semana 20', 'Curva S de referência Rev. E'] },
        { type: 'action', label: 'Abrir dashboard padrão', icon: 'layout-dashboard', kind: 'dashboard' },
      ],
    },
  },
  doc: {
    user: 'Abrir o P&ID PID-4730-001 e checar a revisão',
    agent: 'analista de documentação',
    chat: { title: 'P&ID PID-4730-001', subtitle: 'Atualizado ontem' },
    rich: {
      title: 'P&ID PID-4730-001 Rev. B',
      badges: [{ label: 'Em Andamento', tone: 'info', icon: 'circle-dot' }, { label: 'Tubulação', tone: 'neutral' }],
      blocks: [
        { type: 'p', parts: ['O documento ', { tag: 'PID-4730-001', kind: 'doc' }, ' está na Revisão B, emitido em 14/05/2026. A folha 1 cobre a unidade de bombeio e referencia a malha ', { tag: 'MAL-EL-2204', kind: 'doc' }, '.'] },
        { type: 'p', parts: [{ b: 'Atenção.' }, ' Markup pendente de réplica na linha 10"-RWP, com ', { tag: 'SLA estourado: 4 dias', sla: true }, ', que precisa ser conciliado antes da próxima emissão.'] },
        { type: 'refs', items: ['Lista de linhas U-4730', 'Markup Rev. A → Rev. B'] },
        { type: 'action', label: 'Abrir documento', icon: 'file-text', kind: 'doc' },
      ],
    },
  },
  report: {
    user: 'Gerar o relatório semanal de comissionamento',
    agent: 'analista de dados',
    chat: { title: 'Relatório semanal', subtitle: 'Atualizado ontem' },
    rich: {
      title: 'Relatório semanal UGH Boaventura',
      badges: [{ label: 'Pronto para revisão', tone: 'accent', icon: 'check-circle' }, { label: 'Semana 20', tone: 'neutral' }],
      blocks: [
        { type: 'p', parts: ['Compilei o relatório da semana com avanço físico, testes concluídos e pendências fora do SLA. O período fechou com ', { b: '342 malhas liberadas' }, ' de 418 e 23 não conformidades em aberto.'] },
        { type: 'p', parts: ['As ', { tag: 'NC elétricas', kind: 'doc' }, ' caíram 5 no período; as de ', { tag: 'Tubulação', kind: 'doc' }, ' seguem como prioridade. Restam ', { tag: 'SLA estourado: 12 itens', sla: true }, ' para tratar.'] },
        { type: 'refs', items: ['Relatório semana 19', 'Plano de ação de NCs'] },
        { type: 'action', label: 'Abrir relatório', icon: 'file-text', kind: 'report' },
      ],
    },
  },
  approvals: {
    user: 'Quais documentos estão aguardando aprovação?',
    agent: 'analista de documentação',
    chat: { title: 'Aprovações em aberto', subtitle: 'Atualizado ontem' },
    rich: {
      badges: [{ label: 'Aguardando aprovação', tone: 'info' }],
      blocks: [
        { type: 'p', parts: ['Há ', { b: '7 documentos' }, ' aguardando aprovação, sendo 3 com SLA estourado:'] },
        { type: 'list', items: [
          [{ tag: 'P&ID-001 Rev. 3', kind: 'doc' }, ', disciplina mecânica, ', { sla: true, tag: 'SLA estourado (+4 dias)' }],
          [{ tag: 'Memorial descritivo IF-001', kind: 'doc' }, ', ', { sla: true, tag: 'SLA estourado (+2 dias)' }],
          [{ tag: 'Procedimento de teste hidrostático IF-001', kind: 'doc' }, ', ', { sla: true, tag: 'SLA estourado (+1 dia)' }],
          ['Lista de instrumentos ', { tag: 'skid 4730-IF-001', focus: 'SKID' }, ', dentro do prazo'],
          ['Dossiê TAP-022, dentro do prazo'],
        ] },
        { type: 'p', parts: ['Quer que eu envie um lembrete automático aos responsáveis?'] },
        { type: 'refs', items: ['Fila de aprovação do GED'] },
      ],
    },
  },
};
const GED_FILES = [
  { id: 'g1', name: 'PID-4730-001-RB.pdf',  disc: 'Tubulação',      rev: 'B', size: '2,4 MB', date: '14/05/2026' },
  { id: 'g2', name: 'MAL-EL-2204-FVM.pdf',  disc: 'Elétrica',       rev: 'A', size: '880 KB', date: '12/05/2026' },
  { id: 'g3', name: 'TQ-07-1102-FVI.pdf',   disc: 'Mecânica',       rev: 'D', size: '1,1 MB', date: '09/05/2026' },
  { id: 'g4', name: 'P-204-A-3380-SOP.pdf', disc: 'Instrumentação', rev: 'B', size: '640 KB', date: '08/05/2026' },
  { id: 'g5', name: 'C-310-7741-TTAS.pdf',  disc: 'Comissionamento',rev: 'A', size: '3,0 MB', date: '05/05/2026' },
  { id: 'g6', name: 'LMD-4730-Rev-E.xlsx',  disc: 'Documentação',   rev: 'E', size: '420 KB', date: '02/05/2026' },
  { id: 'g7', name: 'Memorial-IF-001.docx', disc: 'Engenharia',     rev: 'C', size: '310 KB', date: '28/04/2026' },
];

// ---- Fontes de dados (+ healthcheck) -------------------------------------
// kind: 'fixa' (nativa do MERIS) · 'csv' (planilha importada pelo usuário)
// status: 'ok' (Conectada) · 'sync' (Sincronizando) · 'stale' (Desatualizada)
const DATA_SOURCES = [
  { id: 'cortex', name: 'Cortex MERIS',    system: 'Núcleo de dados',   kind: 'fixa', icon: 'database',       status: 'ok',    latency: '120 ms', sync: 'há 3 min', records: '48.210', desc: 'Malhas, FVIs, comissionamento, ativos e ordens de serviço.' },
  { id: 'ged',    name: 'GED documental',  system: 'MERIS GED',         kind: 'fixa', icon: 'folder',         status: 'ok',    latency: '90 ms',  sync: 'há 8 min', records: '12.940', desc: 'Documentos técnicos, revisões e fluxo de aprovação.' },
  { id: 'email',  name: 'Matriz de e-mail', system: 'Comunicações',      kind: 'fixa', icon: 'message-square', status: 'stale', latency: '180 ms', sync: 'há 9 h',   records: '3.045',  desc: 'Tratativas por e-mail vinculadas a documentos e pendências.' },
];
// Fonte externa anexada manualmente (arquivo), com histórico de atualizações
DATA_SOURCES.push({
  id: 'csv-ativos', name: 'Lista_Ativos_U4730_Rev04.csv', system: 'Ativos', kind: 'manual', icon: 'table',
  status: 'ok', size: '1,8 MB', added: '12/03/2026', sync: 'há 2 dias', records: '418', latency: '—',
  desc: 'Planilha anexada manualmente por Ana Beatriz.',
  history: [
    { rev: '04', who: 'Ana Beatriz',   when: '09/06/2026, 14:32', note: 'Atualização do avanço por TAG após testes da semana' },
    { rev: '03', who: 'Kalil Wansan',  when: '28/05/2026, 09:10', note: 'Inclusão dos ativos do skid 4730-IF-001' },
    { rev: '02', who: 'Ana Beatriz',   when: '02/04/2026, 16:45', note: 'Correção de TAGs duplicadas (12 linhas)' },
    { rev: '01', who: 'Paulo Andrade', when: '12/03/2026, 11:02', note: 'Planilha anexada' },
  ],
});
const SOURCE_BY_ID = {}; DATA_SOURCES.forEach((s) => { SOURCE_BY_ID[s.id] = s; });

// Procedência: cada KPI/visualização é alimentado por uma fonte.
const KPI_SOURCE = {
  avanco: 'cortex', atividades: 'cortex', prazo: 'cortex', pendencias: 'cortex', alertas: 'cortex',
  aderencia: 'cortex', testes: 'cortex', desvio: 'cortex',
  malhas: 'cortex', naoconf: 'email', fvi: 'cortex', sla: 'ged',
  produt: 'cortex', 'docs-emit': 'ged', adequacoes: 'ged', revisoes: 'ged',
  criticos: 'ged', aguardando: 'ged', recem: 'ged', marcos: 'cortex', cronograma: 'cortex',
};
const SOURCE_STATUS = {
  ok:      { label: 'Conectada',     tone: 'success', icon: 'check-circle' },
  sync:    { label: 'Sincronizando', tone: 'info',    icon: 'activity' },
  stale:   { label: 'Desatualizada', tone: 'warning', icon: 'clock' },
  down:    { label: 'Não conectada', tone: 'neutral', icon: 'lock' },
  pending: { label: 'Solicitada',    tone: 'info',    icon: 'clock' },
};

// Documentos aguardando assinatura (bloco da home, somente leitura)
const SIGN_DOCS = [
  { tag: 'MC-COMM-TP-2401',  title: 'Plano de comissionamento TP-2401',  kind: 'Plano',       who: 'Lúcia Ferraz',   due: 'hoje',     tone: 'danger' },
  { tag: 'QA-INSP-0987',     title: 'Relatório de inspeção visual',      kind: 'Relatório',   who: 'Carlos Macena',  due: 'amanhã',   tone: 'warning' },
  { tag: 'TQ-07-1102-FVI',   title: 'Folha de verificação de instrumento', kind: 'FVI',       who: 'Rafael Laratta', due: 'em 3 dias', tone: 'info' },
  { tag: 'LMD-4730-Rev-F',   title: 'Lista mestra de documentos Rev. F', kind: 'LMD',         who: 'Paulo Andrade',  due: 'em 5 dias', tone: 'info' },
];

// Equipe do projeto (para compartilhamento de chats)
const TEAM = [
  { id: 'u-ana',    name: 'Ana Beatriz',     role: 'Gestora de projeto',        email: 'ana.beatriz@coodex.ai',   color: '#2563EB' },
  { id: 'u-carlos', name: 'Carlos Macena',   role: 'Eng. de comissionamento',   email: 'carlos.macena@coodex.ai', color: '#0E7490' },
  { id: 'u-lucia',  name: 'Lúcia Ferraz',    role: 'Qualidade e inspeção',      email: 'lucia.ferraz@coodex.ai',  color: '#1F8A5B' },
  { id: 'u-rafael', name: 'Rafael Laratta',  role: 'Eng. de instrumentação',    email: 'rafael.laratta@coodex.ai',color: '#6D28D9' },
  { id: 'u-kalil',  name: 'Kalil Wansan',    role: 'Planejamento 6WLA',         email: 'kalil.wansan@coodex.ai',  color: '#B45309' },
  { id: 'u-marina', name: 'Marina Toledo',   role: 'Eng. elétrica',             email: 'marina.toledo@coodex.ai', color: '#BE185D' },
  { id: 'u-paulo',  name: 'Paulo Andrade',   role: 'Documentação técnica (GED)', email: 'paulo.andrade@coodex.ai', color: '#475569' },
];

// Chats compartilhados (com a Ana ou pela Ana)
const SHARED_CHATS = [
  { id: 'sc1', title: 'Desvios da curva S (semana 21)', owner: 'u-ana',    members: ['u-ana', 'u-kalil', 'u-carlos'], access: 'pode-editar', updated: 'há 2 horas' },
  { id: 'sc2', title: 'Não conformidades elétricas U-4730', owner: 'u-marina', members: ['u-marina', 'u-ana', 'u-lucia'], access: 'pode-comentar', updated: 'ontem' },
  { id: 'sc3', title: 'Plano de inspeção do Painel de força', owner: 'u-lucia', members: ['u-lucia', 'u-ana'], access: 'pode-ver', updated: 'há 3 dias' },
  { id: 'sc4', title: 'Teste hidrostático do V-128', owner: 'u-carlos', members: ['u-carlos', 'u-ana', 'u-rafael'], access: 'pode-comentar', updated: 'há 5 horas' },
  { id: 'sc5', title: 'Replanejamento 6WLA (semana 22)', owner: 'u-kalil', members: ['u-kalil', 'u-ana'], access: 'pode-editar', updated: 'ontem' },
  { id: 'sc6', title: 'Dossiê TAP-022 para aprovação', owner: 'u-paulo', members: ['u-paulo', 'u-ana', 'u-lucia'], access: 'pode-ver', updated: 'há 2 dias' },
  { id: 'sc7', title: 'Inspeções da semana na malha L-04', owner: 'u-lucia', members: ['u-lucia', 'u-carlos', 'u-ana', 'u-marina'], access: 'pode-comentar', updated: 'há 4 dias' },
];

Object.assign(window, {
  SUGGESTED_SKILLS, STARTERS, KPIS, KPIS_EXTRA, SCURVE, PLANT_TAGS,
  DOCS, ASSETS, SAVED_DASHBOARDS, RECENT_CHATS, CONVERSATIONS, GED_FILES,
  HOME_CATALOG, PROJECT_FEED, CRIT_DOCS, TEAM, SHARED_CHATS,
  DATA_SOURCES, SOURCE_BY_ID, KPI_SOURCE, SOURCE_STATUS, DASH_GROUPS, SIGN_DOCS,
});
