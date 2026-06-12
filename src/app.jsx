// MERIS Home — app shell. Orchestrates the 9 scenarios + live interactions.
const { useState, useEffect, useRef, useMemo } = React;

const PANE_LABELS = { dashboard: 'Dashboard', viewer3d: 'Viewer 3D', doctable: 'Documentos', assets: 'Tabela de ativos', doc: 'Documento', resumo: 'Resumo do dia', textdoc: 'Documento gerado', sign: 'Documentos para assinar' };

const ACCENTS = {
  azul:    { ai: '#2563EB', aiBg: '#DBEAFE', aiText: '#1D4ED8', cta: '#2563EB', ctaDark: '#1D4ED8' },
  violeta: { ai: '#6D28D9', aiBg: '#EDE9FE', aiText: '#6D28D9', cta: '#6D28D9', ctaDark: '#5B21B6' },
  misto:   { ai: '#6D28D9', aiBg: '#EDE9FE', aiText: '#6D28D9', cta: '#2563EB', ctaDark: '#1D4ED8' },
};

// canned assistant replies by route
const REPLIES = {
  dashboard: { text: 'Pronto. Adicionei ao seu dashboard padrão os KPIs de aderência ao plano, testes concluídos e desvio de prazo, com a curva S do período. O painel está aberto à direita. Qualquer KPI pode ser incluído pelo botão “Adicionar KPI”.', note: 'Dashboard padrão atualizado' },
  viewer:    { text: 'Abri o viewer 3D da U-4730 com as TAGs do escopo destacadas por status. Abaixo, a tabela de ativos lista o avanço de comissionamento de cada equipamento.', note: 'Viewer 3D + tabela de ativos' },
  doc:       { text: 'Localizei o P&ID PID-4730-001 (Rev. B). O documento está aberto à direita com TAG, revisão e status no cabeçalho. A folha 1 cobre a unidade de bombeio.', note: 'Documento técnico aberto · P&ID' },
  panels:    { text: 'Organizei a área em três painéis: a conversa à esquerda, o dashboard padrão ao centro e o viewer 3D da planta à direita. Os painéis podem ser reorganizados a qualquer momento.', note: '3 painéis simultâneos' },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "azul",
  "density": "comfortable",
  "sidebar": "manual",
  "showSkills": true
}/*EDITMODE-END*/;

function routeScenario(text) {
  const t = text.toLowerCase();
  const hasReport = /(relat[óo]rio|report|semanal|resumo executivo)/.test(t);
  const hasApproval = /(aprova|aguardando|fila de aprova|pend[êe]ncia de aprova)/.test(t);
  const hasDoc = /(p&id|p\&id|pid|documento|desenho|folha|fvi)/.test(t);
  const hasDash = /(dashboard|painel de|curva|kpi|ader[êe]ncia|indicador|gr[áa]fico|desvio|sla|meta|teste|avan[çc]o)/.test(t);
  const has3d = /(3d|planta|viewer|visualizador|ativo|tag|malha|equipamento|modelo|skid)/.test(t);
  if (hasApproval) return { scen: 6, route: 'approvals' };
  if (hasReport) return { scen: 6, route: 'report' };
  if (hasDoc && !hasDash && !has3d) return { scen: 6, route: 'doc' };
  if (hasDash && !has3d) return { scen: 4, route: 'dashboard' };
  if (has3d && !hasDash) return { scen: 5, route: 'viewer' };
  // não citou dash nem 3d (ou citou os dois) → mantém os dois abertos
  return { scen: 7, route: 'panels' };
}

const ROUTE_SCEN = { dashboard: 4, viewer: 5, doc: 6, report: 6, panels: 7 };

// Build the seeded message pair for a route — rich when available.
function seedMessages(route, userText) {
  const conv = CONVERSATIONS[route];
  if (conv) return [{ role: 'user', text: userText || conv.user, time: 'ontem, 18:40' }, { role: 'assistant', rich: conv.rich, agent: conv.agent, chat: conv.chat, time: 'ontem, 18:42' }];
  return [{ role: 'user', text: userText || 'Abrir painel', time: 'agora' }, { role: 'assistant', ...(REPLIES[route] || REPLIES.dashboard), time: 'agora' }];
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [scenario, setScenario] = useState(1);
  const [collapsed, setCollapsed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [panes, setPanes] = useState(['dashboard', 'viewer3d']);
  const [paneDir, setPaneDir] = useState('col');
  const [homePanes, setHomePanes] = useState(['dashboard', 'viewer3d']);
  const [activeNav, setActiveNav] = useState('home');
  const [activeChat, setActiveChat] = useState(null);
  const [openDash, setOpenDash] = useState(null);
  const [markRef, setMarkRef] = useState(null);
  const [toast, setToast] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [dashKpis, setDashKpis] = useState(['atividades', 'pendencias', 'docs-emit', 'alertas']);
  const [dashWidgets, setDashWidgets] = useState(['w-scurve']);
  const [focusedTag, setFocusedTag] = useState(null);
  const [chats, setChats] = useState(() => JSON.parse(JSON.stringify(RECENT_CHATS)));
  const [savedDashboards, setSavedDashboards] = useState(() => JSON.parse(JSON.stringify(SAVED_DASHBOARDS)));
  const [dashGroups, setDashGroups] = useState(() => JSON.parse(JSON.stringify(DASH_GROUPS)));
  const [homeDashId, setHomeDashId] = useState('home'); // 'home' = Dashboard padrão; ou id de um dashboard salvo
  const homeDash = homeDashId === 'home' ? null : (savedDashboards.find((d) => d.id === homeDashId) || null);
  const [convDash, setConvDash] = useState(null); // dashboard salvo aberto em split na conversa
  const [homeConfigOpen, setHomeConfigOpen] = useState(false);
  const [textDoc, setTextDoc] = useState(null); // documento gerado pelo agente (bloco lateral)
  const [welcomeOpen, setWelcomeOpen] = useState(true); // apresentação da nova home
  const [tvConfig, setTvConfig] = useState({ ids: ['home', 'd1'], interval: 30, fit: true }); // modo TV
  const [tvConfigOpen, setTvConfigOpen] = useState(false);
  const [tvOpen, setTvOpen] = useState(false);
  const [sharedChats, setSharedChats] = useState(() => JSON.parse(JSON.stringify(SHARED_CHATS)));
  const [shareModal, setShareModal] = useState(null);
  const [chatMembers, setChatMembers] = useState({});
  const [sources, setSources] = useState(() => JSON.parse(JSON.stringify(DATA_SOURCES)));
  const [searchOpen, setSearchOpen] = useState(false);
  const [concludeModal, setConcludeModal] = useState(null); // { chatId, title }
  const [csvImport, setCsvImport] = useState(null); // simulação de importação de CSV em andamento
  const [historyDrawerId, setHistoryDrawerId] = useState(null); // drawer de histórico de uma fonte manual
  // alerta na sidebar = só problemas em bases nativas (software não conectado é estado normal, não alerta)
  const sourceAlert = sources.filter((s) => s.kind === 'fixa' && (s.status === 'down' || s.status === 'stale')).length;

  const acc = ACCENTS[t.accent] || ACCENTS.azul;
  const density = t.density;

  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 2600); return () => clearTimeout(id); }, [toast]);

  function paneConfig(scen) {
    switch (scen) {
      case 1: return { panes: homePanes, dir: 'col' };
      case 2: return { panes: homePanes, dir: 'row' };
      case 4: return { panes: ['dashboard'], dir: 'row' };
      case 5: return { panes: ['viewer3d', 'assets'], dir: 'col' };
      case 6: return { panes: ['doc'], dir: 'row' };
      case 7: return { panes: ['dashboard', 'viewer3d'], dir: 'row' };
      default: return { panes: [], dir: 'row' };
    }
  }

  // apply a scenario's canonical state
  function go(id) {
    setScenario(id);
    setConvDash(null);
    if (id <= 2) {
      setActiveNav('home'); setActiveChat(null); setMessages([]);
      setPanes(homePanes); setPaneDir(id === 2 ? 'row' : 'col');
    } else if (id >= 4 && id <= 7) {
      setActiveNav('home'); setActiveChat('c1');
      const cfg = paneConfig(id); setPanes(cfg.panes); setPaneDir(cfg.dir);
      const route = id === 4 ? 'dashboard' : id === 5 ? 'viewer' : id === 6 ? 'doc' : 'panels';
      setMessages(seedMessages(route));
    } else if (id === 8) {
      setActiveNav('dashboards'); setOpenDash(null);
    } else if (id === 9) {
      setActiveNav('dashboards'); setOpenDash(SAVED_DASHBOARDS[0]);
    } else if (id === 10) {
      setActiveNav('dashboards'); setMarkRef(null);
      if (!openDash) setOpenDash(SAVED_DASHBOARDS[0]);
      setActiveChat('c1');
      setMessages([{ role: 'assistant', text: 'Modo de edição aberto. Arraste os blocos para reposicioná-los ou clique no ícone de comentário em um bloco para comentar sobre ele aqui no chat.' }]);
    }
  }

  // sidebar collapse: manual by default; the tweak can force a state
  useEffect(() => {
    if (t.sidebar === 'colapsada') setCollapsed(true);
    else if (t.sidebar === 'expandida') setCollapsed(false);
    // 'manual' → user controls it with the toggle
  }, [t.sidebar]);

  // user switches the home arrangement from the top bar
  function changeLayout(l) {
    setPaneDir(l === '2col' ? 'row' : 'col');
    setScenario(l === '2col' ? 2 : 1);
    setPanes(homePanes);
  }

  function routePaneConfig(route, scen) {
    if (route === 'report') return { panes: ['report'], dir: 'row' };
    if (route === 'approvals') return { panes: ['doc'], dir: 'row' };
    return paneConfig(scen);
  }

  function openRoute(scen, route, userText) {
    const cfg = routePaneConfig(route, scen);
    setConvDash(null);
    setActiveChat('c1'); setActiveNav('home'); setOpenDash(null);
    setPanes(cfg.panes); setPaneDir(cfg.dir);
    setMessages(seedMessages(route, userText));
    setScenario(scen);
  }

  // mensagem que cita um dashboard salvo pelo nome → divide a tela com aquele dashboard
  function namedDashIn(text) {
    const t = text.toLowerCase();
    return savedDashboards.find((d) => {
      const nm = d.name.toLowerCase();
      if (t.includes(nm)) return true;
      const words = nm.split(/[^a-zà-ú0-9]+/).filter((w) => w.length >= 5);
      return words.length > 0 && words.every((w) => t.includes(w));
    }) || null;
  }
  // fluxos dedicados das "Sugestões para começar"
  function openOnboarding(text) {
    setConvDash(null); setActiveChat('c1'); setActiveNav('home'); setOpenDash(null);
    setPanes(['dashboard', 'viewer3d']); setPaneDir('row'); setScenario(7);
    setMessages((m) => [...m, { role: 'user', text, time: 'agora' }]);
    replyAfter({ role: 'assistant', agent: 'guia do projeto', time: 'agora', chat: { title: 'Onboarding UGH Boaventura', subtitle: 'Visão guiada do projeto' }, rich: {
      title: 'Bem-vinda ao UGH Boaventura',
      badges: [{ label: 'Onboarding', tone: 'info', icon: 'globe' }, { label: 'Comissionamento', tone: 'neutral' }],
      blocks: [
        { type: 'p', parts: ['O projeto está na ', { b: 'semana 20' }, ' do plano 6WLA, com 87,4% de aderência e 342 de 418 malhas liberadas. Abri o dashboard padrão e o viewer 3D ao lado para você se ambientar.'] },
        { type: 'checklist', title: 'Tour sugerido', items: [
          { label: 'Dashboard padrão', done: true, hint: 'KPIs de aderência, testes e desvio de prazo (aberto ao lado)' },
          { label: 'Viewer 3D da planta', done: true, hint: 'TAGs por status na U-4730 (aberto ao lado)' },
          { label: 'Documentos críticos', done: false, hint: 'Pergunte: "Quais documentos estão aguardando aprovação?"' },
          { label: 'Fontes de dados', done: false, hint: 'Cortex MERIS, GED e Matriz de e-mail, com healthcheck' },
        ] },
        { type: 'refs', items: ['Plano 6WLA semana 20', 'Equipe do projeto: 7 pessoas'] },
      ],
    } }, 800);
  }
  function openDailySummary(text) {
    setConvDash(homeDash); setActiveChat('c1'); setActiveNav('home'); setOpenDash(null); // o resumo abre com o dashboard configurado da home
    setPanes(['resumo', 'dashboard']); setPaneDir('col'); setScenario(7);
    setMessages((m) => [...m, { role: 'user', text, time: 'agora' }]);
    replyAfter({ role: 'assistant', agent: 'analista de dados', time: 'agora', chat: { title: 'Resumo do dia', subtitle: 'O que mudou desde ontem' }, rich: {
      title: 'Resumo do dia',
      badges: [{ label: 'Hoje', tone: 'info', icon: 'sparkles' }],
      blocks: [
        { type: 'kpi-snap', id: 'avanco', label: 'AVANÇO GERAL' },
        { type: 'p', parts: ['Desde ontem: ', { b: '+96 atividades concluídas' }, ' e o avanço geral subiu 3,1 pts. Três pontos exigem atenção:'] },
        { type: 'list', items: [
          [{ b: 'BO-247 crítica:' }, ' vazamento detectado no skid ', { tag: 'Skid 4730-IF-001', focus: 'SKID' }, ' durante teste hidrostático.'],
          ['Marco concluído: comissionamento da malha L-04 (Pasta 12).'],
          ['3 documentos aguardando aprovação, 1 com ', { tag: 'SLA estourado: 4 dias', sla: true }, '.'],
        ] },
        { type: 'refs', items: ['Feed do projeto, últimas 24h'] },
        { type: 'action', label: 'Abrir dashboard padrão', icon: 'layout-dashboard', kind: 'dashboard' },
      ],
    } }, 800);
  }

  // criação de documento pelo chat: abre bloco lateral com o texto gerado
  function buildTextDoc(text) {
    const t = text.toLowerCase();
    const kinds = [['memorando', 'Memorando'], ['ata', 'Ata de reunião'], ['procedimento', 'Procedimento'], ['relatório', 'Relatório'], ['relatorio', 'Relatório'], ['comunicado', 'Comunicado'], ['ofício', 'Ofício'], ['oficio', 'Ofício'], ['e-mail', 'E-mail'], ['email', 'E-mail'], ['carta', 'Carta'], ['especificação', 'Especificação técnica'], ['especificacao', 'Especificação técnica'], ['plano', 'Plano']];
    const found = kinds.find(([k]) => t.includes(k));
    const kind = found ? found[1] : 'Documento';
    return {
      title: kind + ' · Linhas adicionais do Skid 4730-IF-001',
      sections: [
        { h: '1. Objetivo', t: 'Registrar a tratativa sobre a solicitação de inclusão de duas linhas adicionais ao Skid 4730-IF-001 e do teste integrado em campo, itens não contemplados na Lista Mestra de Documentos da Revisão E.' },
        { h: '2. Contexto', t: 'O escopo encontra-se em caminho crítico: o teste depende do comissionamento da Pump P-001 e da liberação do vaso 21-V-001. Há pendência de réplica com SLA estourado há 6 dias.' },
        { h: '3. Pontos de decisão', t: '• Formalizar a inclusão das linhas na LMD (emissão da Revisão F).\n• Definir responsável e data para o teste integrado em campo.\n• Tratar a pendência de réplica antes da próxima emissão.' },
        { h: '4. Encaminhamentos', t: 'Submeter este documento à aprovação da engenharia e registrar a decisão no GED, vinculada ao dossiê do skid.' },
      ],
    };
  }
  function openTextDoc(text) {
    const doc = buildTextDoc(text);
    setTextDoc(doc);
    setConvDash(null); setActiveChat('c1'); setActiveNav('home'); setOpenDash(null);
    setPanes(['textdoc']); setPaneDir('row'); setScenario(4);
    setMessages((m) => [...m, { role: 'user', text, time: 'agora' }]);
    replyAfter({ role: 'assistant', agent: 'redator técnico', time: 'agora', chat: { title: doc.title, subtitle: 'Documento gerado' }, text: 'Criei o documento ao lado, já estruturado com objetivo, contexto, pontos de decisão e encaminhamentos. Posso ajustar o tom, acrescentar seções, citar TAGs específicas ou preparar a versão para o GED.' }, 900);
  }

  function pushAndRoute(text) {
    if (/\b(criar|gerar|escrever|redigir|elaborar|preparar)\b[\s\S]*(documento|memorando|ata|procedimento|relat[óo]rio|comunicado|of[íi]cio|e-?mail|carta|especifica[çc][ãa]o|plano de a[çc][ãa]o|texto)/i.test(text)) { openTextDoc(text); return; }
    if (/onboarding/i.test(text)) { openOnboarding(text); return; }
    if (/resumo do dia/i.test(text)) { openDailySummary(text); return; }
    const named = namedDashIn(text);
    const { scen, route } = named ? { scen: 4, route: 'dashboard' } : routeScenario(text);
    const cfg = routePaneConfig(route, scen);
    setConvDash(named);
    setActiveChat('c1'); setActiveNav('home'); setOpenDash(null);
    setPanes(cfg.panes); setPaneDir(cfg.dir);
    const seed = seedMessages(route, text);
    if (named && seed[1]) seed[1] = { ...seed[1], rich: null, text: `Abri o dashboard “${named.name}” ao lado, em tela dividida. Posso desdobrar qualquer indicador, ajustar o período ou comparar com o dashboard padrão.`, chat: { title: named.name, subtitle: 'Dashboard salvo' } };
    setMessages((m) => [...m, seed[0]]);
    setScenario(scen);
    replyAfter(seed.slice(1), 750);
  }

  function replyAfter(assistantMsgs, delay) {
    setThinking(true);
    setTimeout(() => { setThinking(false); setMessages((m) => [...m, ...(Array.isArray(assistantMsgs) ? assistantMsgs : [assistantMsgs])]); }, delay || 700);
  }

  function handleSend(text, atts) {
    if (scenario === 10) {
      const ref = markRef ? markRef.label : null;
      setMessages((m) => [...m, { role: 'user', text, atts, ref }]);
      setMarkRef(null);
      if (ref) replyAfter({ role: 'assistant', agent: 'analista de dados', time: 'agora', rich: kpiCommentRich(ref) }, 800);
      else replyAfter({ role: 'assistant', text: 'Anotado. Posso reorganizar os blocos, trocar gráficos ou ajustar filtros do dashboard, é só descrever.' });
      return;
    }
    // chat compartilhado: agente só responde quando mencionado com @meris
    if (activeChat && sharedChats.some((s) => s.id === activeChat)) {
      const mentioned = /@meris/i.test(text);
      setMessages((m) => [...m, { role: 'user', text, atts, author: 'u-ana' }]);
      if (mentioned) {
        // citou um artefato → divide a tela e mostra para o grupo
        const named = namedDashIn(text);
        const tl = text.toLowerCase();
        const hasDoc = /(p&id|p\&id|pid|documento|desenho|folha|fvi)/.test(tl);
        const hasReport = /(relat[óo]rio|report)/.test(tl);
        const hasDash = !!named || /(dashboard|painel|curva|kpi|indicador)/.test(tl);
        const has3d = /(\b3d\b|planta|viewer|visualizador|ativo|tag|malha|skid)/.test(tl);
        let label = null;
        if (hasReport) { setPanes(['report']); setPaneDir('row'); label = 'o relatório'; }
        else if (hasDoc && !hasDash) { setPanes(['doc']); setPaneDir('row'); label = 'o documento'; }
        else if (hasDash) { setConvDash(named); setPanes(['dashboard']); setPaneDir('row'); label = named ? `o dashboard “${named.name}”` : 'o dashboard'; }
        else if (has3d) { setPanes(['viewer3d', 'assets']); setPaneDir('col'); label = 'o viewer 3D com a tabela de ativos'; }
        if (label) {
          replyAfter({ role: 'assistant', agent: 'assistente', text: `Abri ${label} ao lado, em tela dividida, visível para todos da conversa. Posso destacar pontos específicos ou registrar uma ação para o grupo.` }, 800);
        } else {
          replyAfter({ role: 'assistant', agent: 'assistente', text: 'Recebi a menção. Posso resumir o ponto discutido, abrir o painel ou documento relacionado, ou registrar uma ação para o grupo. O que precisa?' }, 800);
        }
      }
      return;
    }
    if (atts && atts.length) {
      const names = atts.map((a) => a.name).join(', ');
      const reply = atts.length === 1
        ? `Analisei ${names}. Identifiquei a revisão vigente, o status de aprovação e as malhas referenciadas. Pergunte sobre pendências, markups ou TAGs específicas do documento.`
        : `Analisei os ${atts.length} arquivos anexados (${names}). Posso cruzar as revisões, listar divergências entre eles ou destacar TAGs em comum.`;
      setActiveChat('c1');
      setMessages((m) => [...m, { role: 'user', text, atts }]);
      if (scenario <= 2) setScenario(4);
      replyAfter({ role: 'assistant', text: reply }, 900);
      return;
    }
    // pedido que depende de uma base indisponível → "sei fazer, mas falta a base"
    const miss = missingSourceFor(text);
    if (miss) {
      setActiveChat('c1'); setActiveNav('home'); setOpenDash(null);
      setPanes([]); setPaneDir('row');
      if (scenario < 4 || scenario > 7) setScenario(4);
      setMessages((m) => [...m, { role: 'user', text }]);
      replyAfter({ role: 'assistant', agent: 'analista de dados', time: 'agora', rich: missingSourceRich(miss) }, 800);
      return;
    }
    if (scenario >= 4 && scenario <= 7 && messages.length) {
      // if the message clearly names another artifact, re-route; otherwise continue in place
      const namesArtifact = /(dashboard|painel|curva|kpi|3d|planta|viewer|visualizador|ativo|tag|malha|p&id|pid|documento|relat[óo]rio|report)/i.test(text);
      if (namesArtifact) { pushAndRoute(text); return; }
      setMessages((m) => [...m, { role: 'user', text }]);
      replyAfter({ role: 'assistant', text: 'Atualizei o painel à direita com base no pedido. É possível fixar este resultado em Meus dashboards ou exportar.' });
    } else {
      pushAndRoute(text);
    }
  }

  // clicking a TAG/asset chip in a message → open 3D (or doc) in split, focus it
  function handleTagClick(part) {
    if (part.kind === 'doc') {
      setOpenDash(null); setActiveNav('home'); setActiveChat('c1');
      setPanes(['doc']); setPaneDir('row'); setScenario(6);
      setFocusedTag(null);
      return;
    }
    // asset → viewer 3D split, focused
    setOpenDash(null); setActiveNav('home'); setActiveChat('c1');
    setPanes((p) => p.includes('viewer3d') ? p : ['viewer3d', ...p.filter((x) => x !== 'doc')]);
    if (scenario < 4 || scenario > 7) setScenario(5);
    else if (!panes.includes('viewer3d')) setScenario(5);
    setFocusedTag(part.focus || null);
  }

  function handleSkill(skill) {
    if (skill.id === 'resumo') { openDailySummary(skill.title); return; }
    if (skill.id === 'doc') { openTextDoc('Gerar um documento técnico'); return; }
    if (skill.id === 'dados') {
      setConvDash(null); setActiveChat('c1'); setActiveNav('home'); setOpenDash(null);
      setPanes([]); setPaneDir('row'); setScenario(4);
      setMessages((m) => [...m, { role: 'user', text: skill.title, time: 'agora' }]);
      replyAfter({ role: 'assistant', agent: 'analista de dados', time: 'agora', rich: { blocks: [
        { type: 'p', parts: ['Posso analisar qualquer planilha: importe um CSV como fonte externa e pergunte em linguagem natural (médias, rankings, desvios e cruzamentos com o Cortex MERIS).'] },
        { type: 'callout', tone: 'info', icon: 'upload', title: 'Importe a planilha na Central de controle', text: 'A fonte fica disponível na hora, sem aprovação.', action: { label: 'Abrir Central de controle', icon: 'database', kind: 'open-sources' } },
      ] } }, 800);
      return;
    }
    openRoute(4, 'dashboard', skill.title);
  }

  function handleQuickAction(kind) {
    if (kind === 'open-sources') { handleNav('sources'); return; }
    const paneKey = kind === 'viewer' ? 'viewer3d' : kind === 'dashboard' ? 'dashboard' : kind === 'doc' ? 'doc' : kind === 'report' ? 'report' : null;
    const inChat = scenario >= 4 && scenario <= 7 && messages.length > 0;
    if (inChat && paneKey) {
      // add the panel beside the current ones (split the screen) — máx. 2 blocos
      setActiveNav('home'); setOpenDash(null);
      setPanes((p) => p.includes(paneKey) ? p : (p.length >= 2 ? [p[0], paneKey] : [...p, paneKey]));
      setPaneDir('row');
      setScenario((s) => (s >= 4 && s <= 7) ? 7 : s);
      const labels = { dashboard: 'o dashboard padrão', viewer: 'o viewer 3D', doc: 'o documento', report: 'o relatório' };
      setMessages((m) => [...m, { role: 'assistant', text: `Abri ${labels[kind]} ao lado, no mesmo espaço. Os painéis podem ser reorganizados ou removidos a qualquer momento.`, time: 'agora' }]);
      return;
    }
    if (kind === 'dashboard') openRoute(4, 'dashboard');
    else if (kind === 'viewer') openRoute(5, 'viewer');
    else if (kind === 'doc') openRoute(6, 'doc');
    else if (kind === 'report') openRoute(6, 'report');
  }

  function swap(arr, id, dir) {
    const i = arr.indexOf(id); const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return arr;
    const a = [...arr]; const tmp = a[i]; a[i] = a[j]; a[j] = tmp; return a;
  }
  function removePane(id) {
    setPanes((p) => p.filter((x) => x !== id));
    if (scenario <= 2) setHomePanes((h) => h.filter((x) => x !== id));
  }
  function movePane(id, dir) {
    setPanes((p) => swap(p, id, dir));
    if (scenario <= 2) setHomePanes((h) => swap(h, id, dir));
  }
  function reorderPanes(fromId, toId) {
    const reorder = (arr) => {
      const a = [...arr]; const fi = a.indexOf(fromId), ti = a.indexOf(toId);
      if (fi < 0 || ti < 0 || fi === ti) return arr;
      a.splice(fi, 1); a.splice(ti, 0, fromId); return a;
    };
    setPanes(reorder);
    if (scenario <= 2) setHomePanes(reorder);
  }
  function pinToHome(id) {
    setHomePanes((h) => h.includes(id) ? h : (h.length >= 2 ? [h[0], id] : [...h, id]));
    setToast((PANE_LABELS[id] || 'Bloco') + ' fixado na home');
  }

  function handleKpiAction(action, kpi) {
    if (action === 'share') { openShareCard(kpi); return; }
    if (action === 'delete') {
      if (kpi.widget) setDashWidgets((w) => w.filter((x) => x !== kpi.id));
      else setDashKpis((k) => k.filter((x) => x !== kpi.id));
      setToast(kpi.label + ' deletado do dashboard');
      return;
    }
    if (action === 'pin') {
      if (kpi.widget) { setDashWidgets((w) => w.includes(kpi.id) ? w : [...w, kpi.id]); }
      else { setDashKpis((k) => k.includes(kpi.id) ? k : [...k, kpi.id]); }
      setHomePanes((h) => h.includes('dashboard') ? h : (h.length >= 2 ? [h[0], 'dashboard'] : [...h, 'dashboard']));
      setToast(kpi.label + ' fixado na home');
    }
    else if (action === 'remove') {
      if (kpi.widget) setDashWidgets((w) => w.filter((x) => x !== kpi.id));
      else setDashKpis((k) => k.filter((x) => x !== kpi.id));
      setToast(kpi.label + ' removido da home');
    }
    else if (action === 'ask') {
      setActiveNav('home'); setActiveChat('c1'); setOpenDash(null);
      const cfg = paneConfig(4); setPanes(cfg.panes); setPaneDir(cfg.dir); setScenario(4);
      setMessages([
        { role: 'user', text: `Perguntar sobre o indicador ${kpi.label}`, time: 'agora' },
        { role: 'assistant', agent: 'analista de dados', chat: { title: kpi.label, subtitle: 'Indicador do dashboard padrão' }, time: 'agora', rich: {
          badges: [{ label: 'Indicador', tone: 'info' }],
          blocks: [
            { type: 'kpi-snap', id: kpi.id, widget: kpi.widget, label: kpi.label },
            { type: 'p', parts: ['O indicador ', { b: kpi.label }, kpi.value ? ` está em ${kpi.value}${kpi.unit || ''} (${kpi.delta}). O cálculo considera o escopo da UGH Boaventura na janela 6WLA vigente.` : ' considera o escopo da UGH Boaventura na janela 6WLA vigente.'] },
            { type: 'p', parts: ['É possível ajustar o período de referência, definir uma meta ou desdobrar o indicador por disciplina. A fonte usada neste cálculo:'] },
            { type: 'dbfield', value: (KPI_SOURCE[kpi.id] || 'meris') },
            { type: 'refs', items: ['Plano 6WLA semana 20', 'Memória de cálculo do indicador'] },
            { type: 'action', label: 'Abrir dashboard padrão', icon: 'layout-dashboard', kind: 'dashboard' },
          ],
        } },
      ]);
    }
  }

  function handleNav(dest) {
    if (dest === 'new-chat') { newChat(); }
    else if (dest === 'home') { goHome(); }
    else if (dest === 'dashboards') { go(8); }
    else if (dest === 'shared') { setActiveNav('shared'); setOpenDash(null); setScenario(12); }
    else if (dest === 'sources') { setActiveNav('sources'); setOpenDash(null); setActiveChat(null); setMessages([]); setScenario(13); }
  }

  function handleMark(ref) { setMarkRef(ref); }

  // ---- fontes de dados -----------------------------------------------------
  // sincronização manual de uma fonte fixa (simulada)
  function syncSource(id) {
    const setS = (patch) => setSources((ss) => ss.map((x) => x.id === id ? { ...x, ...patch } : x));
    setS({ status: 'sync' });
    setTimeout(() => {
      setS({ status: 'ok', sync: 'agora' });
      const g = SOURCE_BY_ID[id]; if (g) { g.status = 'ok'; g.sync = 'agora'; }
      setToast((SOURCE_BY_ID[id] ? SOURCE_BY_ID[id].name : 'Fonte') + ' sincronizada');
    }, 2200);
  }

  // ---- fonte externa anexada manualmente (arquivo) --------------------------
  function updateFileSource(id) {
    setSources((ss) => ss.map((src) => {
      if (src.id !== id) return src;
      const m = src.name.match(/Rev(\d+)/i);
      const nextRev = m ? String(parseInt(m[1], 10) + 1).padStart(2, '0') : String((src.history || []).length + 1).padStart(2, '0');
      const name = m ? src.name.replace(/Rev\d+/i, 'Rev' + nextRev) : src.name;
      const entry = { rev: nextRev, who: 'Ana Beatriz', when: 'agora', note: 'Nova revisão anexada' };
      const ns = { ...src, name, sync: 'agora', history: [entry, ...(src.history || [])] };
      const g = SOURCE_BY_ID[id]; if (g) Object.assign(g, ns); // registro global em sincronia
      return ns;
    }));
    setToast('Nova revisão anexada');
  }
  function downloadFileSource(src) { setToast('Download iniciado: ' + src.name); }
  function deleteFileSource(id) {
    const src = SOURCE_BY_ID[id];
    setSources((ss) => ss.filter((x) => x.id !== id));
    const gi = DATA_SOURCES.findIndex((x) => x.id === id);
    if (gi >= 0) DATA_SOURCES.splice(gi, 1);
    delete SOURCE_BY_ID[id];
    if (historyDrawerId === id) setHistoryDrawerId(null);
    setToast((src ? src.name : 'Arquivo') + ' excluído das fontes');
  }

  // o usuário importa fontes externas em CSV por conta própria — com simulação de processamento
  function addCsvSource(fileName) {
    const fname = fileName || 'cronograma-junho.csv';
    const display = fname.replace(/\.csv$/i, '');
    const records = String(140 + (fname.length * 53) % 1800);
    const cols = 6 + (fname.length % 7);
    const steps = [
      { pct: 18, step: 'Lendo arquivo…' },
      { pct: 46, step: `Mapeando ${cols} colunas (TAG, data, avanço…)` },
      { pct: 74, step: `Validando ${records} registros` },
      { pct: 96, step: 'Indexando para consultas do agente…' },
    ];
    setCsvImport({ name: fname, pct: 4, step: 'Enviando arquivo…' });
    steps.forEach((s, i) => setTimeout(() => setCsvImport({ name: fname, ...s }), 700 * (i + 1)));
    setTimeout(() => {
      const id = 'csv-' + display.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) + '-' + Date.now() % 1000;
      const ns = { id, name: display, system: 'CSV importado', kind: 'csv', icon: 'table', status: 'ok', latency: '—', sync: 'agora', records, desc: `Planilha importada por Ana Beatriz · ${cols} colunas · ${fname}` };
      DATA_SOURCES.push(ns); SOURCE_BY_ID[id] = ns; // disponibiliza no seletor de base das mensagens
      setSources((ss) => [...ss, ns]);
      setCsvImport(null);
      setToast('Fonte CSV conectada: ' + display);
    }, 700 * (steps.length + 1));
  }
  function askAboutSource(src) {
    setActiveNav('home'); setActiveChat('c1'); setOpenDash(null);
    setPanes([]); setPaneDir('row'); setScenario(4);
    setMessages([
      { role: 'user', text: `O que a fonte ${src.name} alimenta no MERIS?`, time: 'agora' },
      { role: 'assistant', agent: 'analista de dados', chat: { title: src.name, subtitle: 'Fonte de dados · ' + src.system }, time: 'agora', rich: {
        badges: [{ label: SOURCE_STATUS[src.status].label, tone: SOURCE_STATUS[src.status].tone, icon: SOURCE_STATUS[src.status].icon }],
        blocks: [
          { type: 'p', parts: ['A fonte ', { b: src.name }, ` (${src.system}) alimenta: ${src.desc} Última sincronização ${src.sync}.`] },
          { type: 'dbfield', value: src.id },
          { type: 'p', parts: ['Posso listar os indicadores que dependem desta fonte ou abrir o healthcheck completo.'] },
        ],
      } },
    ]);
  }
  // pedido que depende de dados fora das fontes fixas → "sei fazer, mas falta a base"
  function missingSourceFor(text) {
    const t = text.toLowerCase();
    const needsCronograma = /(custo|financeir|or[çc]ament|cronograma|caminho cr[íi]tico|linha de base|baseline|replanej|earned value|\bevm\b|curva prevista)/.test(t);
    const hasCronogramaCsv = sources.some((s) => s.kind === 'csv' && /cronograma|baseline|planejamento/i.test(s.name));
    if (needsCronograma && !hasCronogramaCsv) return { topic: 'cronograma' };
    return null;
  }
  function missingSourceRich() {
    return {
      badges: [{ label: 'Dados não disponíveis', tone: 'warning', icon: 'alert-triangle' }],
      blocks: [
        { type: 'p', parts: ['Sei montar essa análise. O método de cálculo é direto. O ponto é que ela depende da ', { b: 'linha de base do cronograma' }, ', que não está nas fontes fixas do MERIS (Cortex, GED e Matriz de e-mail).'] },
        { type: 'callout', tone: 'warning', icon: 'upload', title: 'Importe o cronograma como fonte externa (CSV)', text: 'Exporte o cronograma do seu planejamento em CSV e importe em Fontes de dados. A análise roda na hora, sem aprovação.', action: { label: 'Abrir Fontes de dados', icon: 'database', kind: 'open-sources' } },
        { type: 'p', parts: ['Assim que a planilha for importada, eu cruzo com o avanço real do Cortex MERIS e entrego o comparativo.'] },
      ],
    };
  }
  function kpiCommentRich(ref) {
    const cron = sources.find((s) => s.kind === 'csv');
    const baselineHint = cron ? `${cron.name} (CSV) · importado` : 'Importe o cronograma como CSV em Fontes de dados';
    const tail = cron
      ? 'Com a base importada, falta apenas a meta para eu recalcular e atualizar o bloco. Qual é a meta deste indicador?'
      : 'Assim que o CSV do cronograma for importado e a meta definida, recalculo e atualizo o bloco.';
    return {
      title: 'Comentário registrado',
      badges: [{ label: 'Comentando', tone: 'info', icon: 'message-square-plus' }],
      blocks: [
        { type: 'refs', items: [ref] },
        { type: 'p', parts: ['Para tratar este componente, preciso confirmar alguns insumos. O que já está disponível segue marcado:'] },
        { type: 'checklist', title: 'Informações necessárias', items: [
          { label: 'Período de referência', done: true, hint: 'Semana 20 (06 a 12 jun), detectado' },
          { label: 'Escopo / disciplina', done: true, hint: 'UGH Boaventura' },
          { label: 'Linha de base do cronograma', done: !!cron, hint: baselineHint },
          { label: 'Meta do indicador', done: false, hint: 'Informe a meta para comparar planejado × realizado' },
        ] },
        { type: 'dbfield', value: 'cortex' },
        { type: 'p', parts: [tail] },
      ],
    };
  }

  // Each recent chat maps to a use case.
  const CHAT_UC = { c1: 'dash', c2: 'doc', c3: 'dash', c4: 'dash+doc', c5: 'report', c6: 'chat', c7: 'dash', c8: '3d+report', c9: 'doc', c10: 'report', c11: 'dash+doc', c12: '3d' };
  function ucConfig(uc) {
    switch (uc) {
      case 'dash': return { panes: ['dashboard'], dir: 'row', route: 'dashboard' };
      case 'doc': return { panes: ['doc'], dir: 'row', route: 'doc' };
      case 'report': return { panes: ['report'], dir: 'row', route: 'report' };
      case '3d': return { panes: ['viewer3d', 'assets'], dir: 'col', route: 'viewer' };
      case 'dash+doc': return { panes: ['dashboard', 'doc'], dir: 'row', route: 'dashboard' };
      case '3d+report': return { panes: ['viewer3d', 'report'], dir: 'row', route: 'viewer' };
      default: return { panes: [], dir: 'row', route: null };
    }
  }
  function openChat(id) {
    let title = id;
    for (const g of Object.keys(chats)) { const f = chats[g].find((x) => x.id === id); if (f) title = f.title; }
    const cfg = ucConfig(CHAT_UC[id] || 'chat');
    setActiveChat(id); setActiveNav('home'); setOpenDash(null);
    setPanes(cfg.panes); setPaneDir(cfg.dir); setScenario(4);
    if (!cfg.route) {
      setMessages([
        { role: 'user', text: title, time: 'ontem, 18:40' },
        { role: 'assistant', agent: 'assistente', chat: { title, subtitle: 'Conversa' }, time: 'ontem, 18:41', text: 'Posso ajudar com esse tópico, abrir um painel, documento ou relatório relacionado, ou cruzar dados de comissionamento. Como prefere seguir?' },
      ]);
    } else {
      const seed = seedMessages(cfg.route, title);
      if (seed[1]) { seed[1] = { ...seed[1], chat: { ...(seed[1].chat || {}), title } }; }
      setMessages(seed);
    }
  }

  // ---- concluir conversa ----------------------------------------------------
  function openConcludeChat(id) {
    const cid = id || activeChat;
    if (!cid) return;
    setConcludeModal({ chatId: cid, title: chatTitleById(cid) });
  }
  function confirmConclude(note) {
    const cid = concludeModal.chatId;
    const noteTxt = (note || '').trim() || undefined;
    const shared = sharedChats.find((s) => s.id === cid);
    if (shared) {
      // chat compartilhado concluído → sai da lista de compartilhados e vai para "Concluídas"
      setSharedChats((s) => s.filter((x) => x.id !== cid));
      setChats((c) => ({ ...c, 'Concluídas': [{ id: cid, title: shared.title, concluded: true, note: noteTxt }, ...(c['Concluídas'] || [])] }));
    } else {
      setChats((c) => {
        const next = {}; let moved = null;
        for (const g of Object.keys(c)) {
          if (g === 'Concluídas') { next[g] = c[g]; continue; }
          next[g] = c[g].filter((x) => { if (x.id === cid) { moved = x; return false; } return true; });
        }
        if (moved) next['Concluídas'] = [{ ...moved, concluded: true, note: noteTxt }, ...(next['Concluídas'] || [])];
        return next;
      });
    }
    if (activeChat === cid) go(1); // conversa ativa concluída → volta à home
    setConcludeModal(null);
    setToast('Conversa concluída');
  }

  function favChat(id) {
    let nowFav = false;
    setChats((c) => {
      const next = {};
      for (const g of Object.keys(c)) next[g] = c[g].map((x) => { if (x.id === id) { nowFav = !x.fav; return { ...x, fav: !x.fav }; } return x; });
      return next;
    });
    setTimeout(() => setToast(nowFav ? 'Adicionado aos favoritos' : 'Removido dos favoritos'), 0);
  }

  // renomear a conversa ativa (header do chat) — sincroniza sidebar e o título da thread
  function renameActiveChat(title) {
    if (!activeChat) return;
    if (sharedChats.some((sc) => sc.id === activeChat)) renameSharedChat(activeChat, title);
    else { renameChat(activeChat, title); setToast('Conversa renomeada'); }
    setMessages((m) => m.map((x) => x.chat ? { ...x, chat: { ...x.chat, title } } : x));
  }

  function renameChat(id, title) {
    setChats((c) => {
      const next = {};
      for (const g of Object.keys(c)) next[g] = c[g].map((x) => x.id === id ? { ...x, title } : x);
      return next;
    });
  }
  function deleteChat(id) {
    setChats((c) => {
      const next = {};
      for (const g of Object.keys(c)) next[g] = c[g].filter((x) => x.id !== id);
      return next;
    });
    if (activeChat === id) setActiveChat(null);
    setToast('Conversa excluída');
  }

  // ---- grupos de dashboards (pastas) --------------------------------------
  function createDashGroup(name) {
    const id = 'g-' + Date.now();
    setDashGroups((g) => [...g, { id, name: (name && name.trim()) || 'Novo grupo' }]);
    setToast('Grupo criado');
    return id;
  }
  function renameDashGroup(id, name) { setDashGroups((g) => g.map((x) => x.id === id ? { ...x, name } : x)); }
  function deleteDashGroup(id) {
    setDashGroups((g) => g.filter((x) => x.id !== id));
    setSavedDashboards((d) => d.map((x) => x.group === id ? { ...x, group: null } : x));
    setToast('Grupo removido · dashboards mantidos em "Sem grupo"');
  }
  function moveDashToGroup(dashId, groupId) {
    setSavedDashboards((d) => d.map((x) => x.id === dashId ? { ...x, group: groupId } : x));
    const g = dashGroups.find((x) => x.id === groupId);
    setToast(g ? 'Movido para ' + g.name : 'Removido do grupo');
  }
  function openShareDashboard(dash) {
    if (!dash) return;
    setShareModal({ mode: 'dashboard', dashId: dash.id, title: dash.name, presetMembers: dash.members || [] });
  }
  // compartilhar um grupo inteiro: aplica o acesso a todos os dashboards do grupo
  function openShareGroup(group) {
    const inGroup = savedDashboards.filter((d) => d.group === group.id);
    const union = [...new Set(inGroup.flatMap((d) => d.members || []))];
    setShareModal({ mode: 'group', groupId: group.id, title: group.name, presetMembers: union, groupCount: inGroup.length });
  }

  // fixar um dashboard salvo na home (substitui o Dashboard padrão como bloco da home)
  function pinDashboardToHome(d) {
    if (!d || d.id === 'home') { setHomeDashId('home'); setToast('Dashboard padrão fixado na home'); return; }
    setHomeDashId(d.id);
    setHomePanes((h) => h.includes('dashboard') ? h : (h.length >= 2 ? ['dashboard', h[1]] : ['dashboard', ...h]));
    setToast(d.name + ' fixado na home');
  }
  // ---- configuração da home --------------------------------------------------
  function changeHomeBlocks(sel) {
    if (!sel.length) return;
    setHomePanes(sel);
    if (scenario <= 2) { setPanes(sel); setPaneDir('col'); }
    setToast('Blocos da home atualizados');
  }
  function goHome() { go(1); }
  // chat vazio: sem blocos abertos, só a saudação e as sugestões
  function newChat() {
    setScenario(1); setConvDash(null); setActiveNav('home'); setActiveChat(null);
    setMessages([]); setPanes([]); setPaneDir('col'); setOpenDash(null);
  }
  function applyWelcome(sel) {
    const panesSel = sel.length ? sel : ['dashboard', 'viewer3d'];
    setHomePanes(panesSel); setPanes(panesSel); setPaneDir('col');
    setWelcomeOpen(false);
    setToast('Home pronta, bom trabalho!');
  }

  function unpinDashboard() {
    setHomeDashId('home');
    setToast('Dashboard padrão restaurado na home');
  }

  function updateDashboardDesc(id, desc) { setSavedDashboards((dd) => dd.map((x) => x.id === id ? { ...x, desc } : x)); setToast('Descrição atualizada'); }
  // novo dashboard: abre o editor vazio para montar com Adicionar KPI
  function startNewDashboard() {
    setOpenDash({ id: 'new', name: 'Novo dashboard', blank: true });
    setActiveNav('dashboards'); setActiveChat('c1'); setMarkRef(null);
    setMessages([{ role: 'assistant', text: 'Dashboard em branco aberto. Use o Adicionar KPI para montar os indicadores, arraste para organizar e clique em Salvar quando terminar. Também posso adicionar blocos: é só pedir.' }]);
    setScenario(10);
  }
  function saveDashboard(payload) {
    if (openDash && openDash.blank) {
      const nd = { id: 'd' + Date.now(), name: openDash.name || 'Novo dashboard', desc: 'Dashboard criado por Ana Beatriz.', edited: 'agora', charts: (payload && payload.kpiIds ? payload.kpiIds.length : 0) + (payload && payload.widgets ? payload.widgets.length : 0), accent: 'info', kind: 'bars', group: null, members: [] };
      setSavedDashboards((d) => [nd, ...d]);
      setOpenDash(nd);
      setScenario(9);
      setToast('Dashboard salvo em Meus dashboards');
    } else {
      setScenario(9);
      setToast('Alterações salvas');
    }
  }
  // novo chat compartilhado (direto da tela de chats compartilhados)
  function openShareNewChat() {
    setShareModal({ mode: 'card', cardLabel: null, title: 'Novo chat compartilhado' });
  }
  function renameSharedChat(id, title) { setSharedChats((s) => s.map((x) => x.id === id ? { ...x, title } : x)); setToast('Conversa renomeada'); }
  function favSharedChat(id) {
    let nowFav = false;
    setSharedChats((s) => s.map((x) => { if (x.id === id) { nowFav = !x.fav; return { ...x, fav: !x.fav }; } return x; }));
    setTimeout(() => setToast(nowFav ? 'Adicionado aos favoritos' : 'Removido dos favoritos'), 0);
  }

  function renameDashboard(id, name) { setSavedDashboards((d) => d.map((x) => x.id === id ? { ...x, name } : x)); setToast('Dashboard renomeado'); }
  function deleteDashboard(id) {
    setSavedDashboards((d) => d.filter((x) => x.id !== id));
    if (openDash && openDash.id === id) { setOpenDash(null); setScenario(8); }
    if (homeDashId === id) setHomeDashId('home'); // dashboard fixado excluído → padrão volta à home
    setToast('Dashboard excluído');
  }

  function addKpi(id) {
    setDashKpis((k) => k.includes(id) ? k : [...k, id]);
    const def = [...KPIS, ...KPIS_EXTRA].find((x) => x.id === id);
    setToast((def ? def.label : 'KPI') + ' adicionado ao dashboard padrão');
  }
  function removeKpi(id) { setDashKpis((k) => k.filter((x) => x !== id)); }
  function addWidget(id) {
    setDashWidgets((w) => w.includes(id) ? w : [...w, id]);
    const labels = { 'w-docs': 'Documentos críticos', 'w-feed': 'Feed do projeto', 'w-scurve': 'Curva S' };
    setToast((labels[id] || 'Visualização') + ' adicionada à home');
  }
  function removeWidget(id) { setDashWidgets((w) => w.filter((x) => x !== id)); }

  // ---- compartilhamento ----
  const TEAM_BY_ID = {}; TEAM.forEach((u) => { TEAM_BY_ID[u.id] = u; });
  function chatTitleById(id) {
    for (const g of Object.keys(chats)) { const f = chats[g].find((x) => x.id === id); if (f) return f.title; }
    const sc = sharedChats.find((x) => x.id === id); return sc ? sc.title : 'Conversa';
  }
  function currentChatMembers() {
    const ids = (activeChat && chatMembers[activeChat]) || ['u-ana'];
    return ids.map((id) => TEAM_BY_ID[id]).filter(Boolean);
  }
  function openShareChat(id) {
    const cid = id || activeChat;
    if (!cid) return;
    setShareModal({ mode: 'chat', chatId: cid, title: chatTitleById(cid) });
  }
  function openShareCard(item) {
    const it = typeof item === 'string' ? { label: item } : item;
    setShareModal({ mode: 'card', cardLabel: it.label, cardItem: it, title: 'Nova conversa sobre ' + it.label });
  }
  function confirmShare(result) {
    const memberIds = result.members.map((m) => m.userId);
    if (shareModal.mode === 'card') {
      // inicia novo chat do zero (sobre um card ou genérico) e compartilha
      const newId = 'sc' + Date.now();
      const title = shareModal.cardLabel ? 'Sobre ' + shareModal.cardLabel : 'Chat com a equipe';
      setSharedChats((s) => [{ id: newId, title, owner: 'u-ana', members: memberIds, access: result.linkAccess || 'pode-comentar', updated: 'agora' }, ...s]);
      setChatMembers((m) => ({ ...m, [newId]: memberIds }));
      setActiveChat(newId); setActiveNav('home'); setOpenDash(null);
      setPanes([]); setPaneDir('row'); setScenario(4);
      const it = shareModal.cardItem || (shareModal.cardLabel ? { label: shareModal.cardLabel } : null);
      if (!it) {
        setMessages([
          { role: 'assistant', agent: 'assistente', chat: { title, subtitle: 'Conversa compartilhada' }, time: 'agora', text: `Chat compartilhado criado com ${memberIds.length} ${memberIds.length === 1 ? 'pessoa' : 'pessoas'}. Mencione @meris para acionar o agente, ou renomeie a conversa pelo menu em Chats compartilhados.` },
        ]);
        setToast('Chat compartilhado criado');
        setShareModal(null);
        return;
      }
      setMessages([
        { role: 'user', text: `Quero discutir ${shareModal.cardLabel} com a equipe.`, time: 'agora' },
        { role: 'assistant', agent: 'assistente', chat: { title, subtitle: 'Conversa compartilhada' }, time: 'agora', rich: {
          badges: [{ label: 'Compartilhado com a equipe', tone: 'info', icon: 'users' }],
          blocks: [
            { type: 'kpi-snap', id: it.id, widget: it.widget, label: it.label },
            { type: 'p', parts: [`Conversa criada sobre ${shareModal.cardLabel} e compartilhada com ${memberIds.length} ${memberIds.length === 1 ? 'pessoa' : 'pessoas'}. O snapshot acima registra o estado do componente neste momento. Posso resumir, abrir o painel relacionado ou destacar pontos de atenção para o grupo.`] },
          ],
        } },
      ]);
      setToast('Conversa criada e compartilhada');
    } else if (shareModal.mode === 'group') {
      setSavedDashboards((d) => d.map((x) => x.group === shareModal.groupId ? { ...x, members: memberIds } : x));
      const others = memberIds.filter((id) => id !== 'u-ana').length;
      setToast(`Grupo compartilhado com ${others} ${others === 1 ? 'pessoa' : 'pessoas'} (${shareModal.groupCount} ${shareModal.groupCount === 1 ? 'dashboard' : 'dashboards'})`);
    } else if (shareModal.mode === 'dashboard') {
      setSavedDashboards((d) => d.map((x) => x.id === shareModal.dashId ? { ...x, members: memberIds } : x));
      const others = memberIds.filter((id) => id !== 'u-ana').length;
      setToast(others > 0 ? `Dashboard compartilhado com ${others} ${others === 1 ? 'pessoa' : 'pessoas'}` : 'Compartilhamento do dashboard atualizado');
    } else {
      const cid = shareModal.chatId;
      setChatMembers((m) => ({ ...m, [cid]: memberIds }));
      setSharedChats((s) => {
        const exists = s.find((x) => x.id === cid);
        if (exists) return s.map((x) => x.id === cid ? { ...x, members: memberIds, access: result.linkAccess || x.access, updated: 'agora' } : x);
        return [{ id: cid, title: chatTitleById(cid), owner: 'u-ana', members: memberIds, access: result.linkAccess || 'pode-comentar', updated: 'agora' }, ...s];
      });
      setToast('Conversa compartilhada com ' + memberIds.length + ' ' + (memberIds.length === 1 ? 'pessoa' : 'pessoas'));
    }
    setShareModal(null);
  }
  function openSharedChat(sc) {
    setChatMembers((m) => ({ ...m, [sc.id]: sc.members }));
    setActiveChat(sc.id); setActiveNav('home'); setOpenDash(null);
    setPanes([]); setPaneDir('row'); setScenario(4);
    setMessages([
      { role: 'assistant', agent: 'assistente', chat: { title: sc.title, subtitle: 'Conversa compartilhada' }, time: 'há 2 horas', text: 'Esta é uma conversa compartilhada com a equipe. As mensagens e painéis ficam visíveis para todos com acesso.' },
    ]);
  }

  const rootVars = {
    '--ai': acc.ai, '--ai-bg': acc.aiBg, '--ai-text': acc.aiText,
    '--cta': acc.cta, '--cta-dark': acc.ctaDark,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--color-bg-app)', ...rootVars }}>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', background: 'var(--color-bg-app)' }}>
        <ModuleRail activeModule="home" onHome={goHome} onModule={(m) => setToast(m.label + ' disponível no MERIS completo')} />
        <Sidebar
          collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)}
          activeNav={activeNav} onNav={handleNav}
          activeChat={activeChat} onSelectChat={openChat}
          chats={chats} onRenameChat={renameChat} onDeleteChat={deleteChat} onShareChat={openShareChat} onFavChat={favChat}
          sourceAlert={sourceAlert}
        />
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TopBar scenario={scenario} openDash={openDash} onCrumb={() => { setOpenDash(null); setScenario(8); }} onCrumbDash={() => setScenario(9)} onSearch={() => setSearchOpen(true)} />
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <ScreenContent
              scenario={scenario} density={density} openDash={openDash}
              panes={panes} paneDir={paneDir} homePanes={homePanes}
              onRemovePane={removePane} onMovePane={movePane} onReorderPane={reorderPanes} onPinHome={pinToHome}
              onQuickAction={handleQuickAction}
              onAction={handleQuickAction}
              activeFocus={focusedTag} onTagClick={handleTagClick} thinking={thinking}
              dashKpis={dashKpis} onAddKpi={addKpi} onRemoveKpi={removeKpi} onKpiAction={handleKpiAction}
              dashWidgets={dashWidgets} onAddWidget={addWidget} onRemoveWidget={removeWidget}
              messages={messages}
              onSend={handleSend} onSkill={handleSkill} showSkills={t.showSkills}
              onOpenDash={(d) => { setOpenDash(d); setScenario(9); }}
              onBackLibrary={() => { setOpenDash(null); setScenario(8); }}
              onNewFromLibrary={(text) => pushAndRoute(text)}
              savedDashboards={savedDashboards} onRenameDashboard={renameDashboard} onDeleteDashboard={deleteDashboard}
              dashGroups={dashGroups} onCreateGroup={createDashGroup} onRenameGroup={renameDashGroup} onDeleteGroup={deleteDashGroup} onMoveDash={moveDashToGroup} onShareDashboard={openShareDashboard} onShareGroup={openShareGroup} onDescDashboard={updateDashboardDesc}
              homeDashId={homeDashId} homeDash={homeDash} convDash={convDash} onPinDashHome={pinDashboardToHome} onUnpinDashHome={unpinDashboard}
              onShare={() => openShareChat()} chatMembers={currentChatMembers()} onShareCard={openShareCard}
              onConcludeChat={activeChat && sharedChats.some((s) => s.id === activeChat) ? () => openConcludeChat() : null}
              onRenameActiveChat={renameActiveChat}
              sharedChats={sharedChats} onOpenSharedChat={openSharedChat}
              sharedHint={!!(activeChat && sharedChats.some((s) => s.id === activeChat))}
              onEdit={() => go(10)}
              markRef={markRef} onMark={handleMark} onClearMark={() => setMarkRef(null)}
              sources={sources} onAddCsv={addCsvSource} onAskSource={askAboutSource} csvImport={csvImport}
              textDoc={textDoc} onToast={setToast}
              onConfigHome={() => setHomeConfigOpen(true)}
              onNewDashboard={startNewDashboard} onSaveDashboard={saveDashboard}
              onTvConfig={() => setTvConfigOpen(true)} onOpenTvMode={() => setTvOpen(true)}
              onNewSharedChat={openShareNewChat} onRenameSharedChat={renameSharedChat} onFavSharedChat={favSharedChat}
              onUpdateFile={updateFileSource} onDownloadFile={downloadFileSource} onDeleteFile={deleteFileSource} onShowHistory={(src) => setHistoryDrawerId(src.id)}
              onSyncSource={syncSource}
            />
          </div>
        </main>
      </div>
      <Tweaks t={t} setTweak={setTweak} />
      {shareModal && <ShareModal mode={shareModal.mode} title={shareModal.title} cardLabel={shareModal.cardLabel} presetMembers={shareModal.presetMembers} groupCount={shareModal.groupCount} onClose={() => setShareModal(null)} onConfirm={confirmShare} />}
      {searchOpen && <GlobalSearch chats={chats} dashboards={savedDashboards} onOpenChat={openChat} onOpenDashboard={(d) => { setOpenDash(d); setActiveNav('dashboards'); setScenario(9); }} onClose={() => setSearchOpen(false)} />}
      {concludeModal && <ConcludeChatModal title={concludeModal.title} onClose={() => setConcludeModal(null)} onConfirm={confirmConclude} />}
      {welcomeOpen && <WelcomeModal onConfirm={applyWelcome} />}
      {tvConfigOpen && <TvConfigModal config={tvConfig} dashboards={savedDashboards} onChange={setTvConfig} onOpenTv={() => { setTvConfigOpen(false); setTvOpen(true); }} onClose={() => setTvConfigOpen(false)} />}
      {tvOpen && <TvOverlay config={tvConfig} dashboards={savedDashboards} onClose={() => setTvOpen(false)} onInterval={(sec) => setTvConfig((c) => ({ ...c, interval: sec }))} />}
      {homeConfigOpen && <HomeConfigModal blocks={homePanes} onBlocks={changeHomeBlocks} homeDashId={homeDashId} dashboards={savedDashboards} onPickDash={(d) => pinDashboardToHome(d)} onClose={() => setHomeConfigOpen(false)} />}
      {historyDrawerId && (() => { const src = sources.find((x) => x.id === historyDrawerId); return src ? <HistoryDrawer source={src} onClose={() => setHistoryDrawerId(null)} /> : null; })()}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 80, display: 'flex', alignItems: 'center', gap: 9, background: 'var(--color-text-primary)', color: '#fff', padding: '10px 16px', borderRadius: 10, boxShadow: 'var(--shadow-lg)', fontSize: 13.5, fontWeight: 500 }}>
          <Icon name="check" size={16} style={{ color: 'var(--color-success)' }} />{toast}
        </div>
      )}
    </div>
  );
}

// ---- concluir conversa (modal) ---------------------------------------------
function ConcludeChatModal({ title, onClose, onConfirm }) {
  const [note, setNote] = useState('');
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onMouseDown={(e) => e.stopPropagation()} style={{ width: 'min(460px, 96vw)', background: 'var(--color-bg-surface)', borderRadius: 14, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--color-success-bg)', color: 'var(--color-success-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="check-circle" size={17} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Concluir conversa?</div>
            <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="x" size={17} /></button>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 13.5, color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>A conversa será encerrada e movida para <strong style={{ fontWeight: 600 }}>Concluídas</strong>. Você pode reabri-la a qualquer momento pela sidebar.</p>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: 7 }}>Nota de encerramento (opcional)</div>
          <textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500}
            placeholder="Ex.: pendências resolvidas, aguardando próxima emissão…"
            style={{ width: '100%', resize: 'vertical', minHeight: 76, maxHeight: 180, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--color-border-strong)', outline: 'none', fontFamily: 'inherit', fontSize: 13.5, lineHeight: 1.5, color: 'var(--color-text-primary)', background: 'var(--color-bg-surface)', boxSizing: 'border-box' }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--ai)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--ai) 14%, transparent)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--color-border-strong)'; e.target.style.boxShadow = 'none'; }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--color-border)' }}>
          <button onClick={onClose}
            style={{ height: 38, padding: '0 14px', borderRadius: 9, border: '1px solid var(--color-border-strong)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => onConfirm(note)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 16px', borderRadius: 9, border: 'none', background: 'var(--cta)', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-xs)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cta-dark)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--cta)'}>
            <Icon name="check" size={16} />Concluir chat
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- modo TV: assistente de configuração em etapas ---------------------------
function TvConfigModal({ config, dashboards, onChange, onOpenTv, onClose }) {
  const [step, setStep] = useState(1);
  const [q, setQ] = useState('');
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  const options = [{ id: 'home', name: 'Dashboard padrão', desc: 'KPIs fixados em tempo real', kind: 'scurve', accent: 'info' }, ...dashboards];
  const sel = config.ids;
  const selected = sel.map((id) => options.find((o) => o.id === id)).filter(Boolean);
  const toggle = (id) => {
    const cur = sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id];
    if (cur.length === 0) return;
    onChange({ ...config, ids: cur });
  };
  const moveDash = (id, delta) => {
    const i = sel.indexOf(id); const j = i + delta;
    if (i < 0 || j < 0 || j >= sel.length) return;
    const ids = [...sel]; const t = ids[i]; ids[i] = ids[j]; ids[j] = t;
    onChange({ ...config, ids });
  };
  const totalSlides = selected.reduce((s, d) => s + (d.large ? 2 : 1), 0);
  const STEPS = [{ n: 1, label: 'Dashboards' }, { n: 2, label: 'Tempo e telas' }, { n: 3, label: 'Confirmar' }];
  const navBtn = (label, primary, onClick, disabled) => (
    <button onClick={onClick} disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 16px', borderRadius: 9, border: primary ? 'none' : '1px solid var(--color-border-strong)', background: disabled ? 'var(--color-bg-subtle)' : primary ? 'var(--cta)' : 'var(--color-bg-surface)', color: disabled ? 'var(--color-text-tertiary)' : primary ? '#fff' : 'var(--color-text-primary)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: disabled ? 'default' : 'pointer' }}>
      {label}
    </button>
  );
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onMouseDown={(e) => e.stopPropagation()} style={{ width: 'min(620px, 96vw)', maxHeight: '88vh', background: 'var(--color-bg-surface)', borderRadius: 14, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--ai-bg)', color: 'var(--ai-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="tv" size={17} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Configurar modo TV</div>
              <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 1 }}>Monte a rotação de dashboards para o telão</div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={17} /></button>
          </div>
          {/* stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '16px 0 0' }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s.n}>
                <button onClick={() => s.n < step && setStep(s.n)} style={{ display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', padding: 0, cursor: s.n < step ? 'pointer' : 'default', fontFamily: 'inherit' }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: step >= s.n ? 'var(--ai)' : 'var(--color-bg-subtle)', color: step >= s.n ? '#fff' : 'var(--color-text-tertiary)', transition: 'all 120ms ease' }} className="font-mono">{step > s.n ? '✓' : s.n}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: step === s.n ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>{s.label}</span>
                </button>
                {i < STEPS.length - 1 && <span style={{ flex: 1, height: 2, margin: '0 10px', borderRadius: 2, background: step > s.n ? 'var(--ai)' : 'var(--color-border)' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="sb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 22px 18px' }}>
          {step === 1 && (
            <>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Selecione os dashboards da rotação. A ordem de seleção define a ordem de exibição.</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 12px', borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', marginBottom: 12 }}>
                <Icon name="search" size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar dashboard…"
                  style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13.5, color: 'var(--color-text-primary)' }} />
                {q && <button onClick={() => setQ('')} style={{ width: 18, height: 18, border: 'none', borderRadius: 5, cursor: 'pointer', background: 'transparent', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><Icon name="x" size={13} /></button>}
              </div>
              {q.trim() && options.filter((d) => d.name.toLowerCase().includes(q.trim().toLowerCase()) || (d.desc || '').toLowerCase().includes(q.trim().toLowerCase())).length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginBottom: 10 }}>Nenhum dashboard encontrado para “{q.trim()}”.</div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {options.filter((d) => !q.trim() || d.name.toLowerCase().includes(q.trim().toLowerCase()) || (d.desc || '').toLowerCase().includes(q.trim().toLowerCase())).map((d) => {
                  const on = sel.includes(d.id);
                  const order = sel.indexOf(d.id) + 1;
                  return (
                    <button key={d.id} onClick={() => toggle(d.id)}
                      style={{ position: 'relative', display: 'flex', flexDirection: 'column', textAlign: 'left', padding: 0, overflow: 'hidden', borderRadius: 12, border: `1.5px solid ${on ? 'var(--ai)' : 'var(--color-border)'}`, background: 'var(--color-bg-surface)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 120ms ease' }}>
                      <Thumb kind={d.kind || 'bars'} accent={d.accent || 'info'} height={64} />
                      {on && <span style={{ position: 'absolute', top: 8, left: 8, width: 24, height: 24, borderRadius: '50%', background: 'var(--ai)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }} className="font-mono">{order}</span>}
                      {d.large && <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--color-warning-text)', background: 'var(--color-warning-bg)', borderRadius: 9999, padding: '2px 7px' }}>2 TELAS</span>}
                      <div style={{ padding: '9px 11px 11px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                        {d.desc && <div style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.desc}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>Tempo em cada tela</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[10, 30, 60].map((sec) => (
                  <button key={sec} onClick={() => onChange({ ...config, interval: sec })}
                    style={{ flex: 1, height: 44, borderRadius: 10, border: `1.5px solid ${config.interval === sec ? 'var(--ai)' : 'var(--color-border)'}`, background: config.interval === sec ? 'var(--ai-bg)' : 'var(--color-bg-surface)', color: config.interval === sec ? 'var(--ai-text)' : 'var(--color-text-secondary)', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer' }} className="font-mono">
                    {sec}s
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: 'var(--ai-bg)', marginBottom: 14 }}>
                <Icon name="tv" size={16} style={{ color: 'var(--ai-text)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--ai-text)', lineHeight: 1.45 }}>
                  <strong style={{ fontWeight: 700 }}>{totalSlides} {totalSlides === 1 ? 'tela' : 'telas'}</strong> na rotação, trocando a cada <strong style={{ fontWeight: 700 }}>{config.interval}s</strong>. Ciclo completo: <strong style={{ fontWeight: 700 }}>{totalSlides * config.interval}s</strong>. {config.fit ? 'Conteúdo ajustado para caber na tela.' : 'Conteúdo em tamanho real, com rolagem.'}
                </span>
              </div>
              {selected.some((d) => d.large) && (
                <div style={{ display: 'flex', gap: 10, padding: '11px 14px', borderRadius: 10, background: 'var(--color-warning-bg)', marginBottom: 14 }}>
                  <Icon name="maximize-2" size={15} style={{ color: 'var(--color-warning-text)', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12.5, color: 'var(--color-warning-text)', lineHeight: 1.5 }}>
                    {selected.filter((d) => d.large).map((d) => d.name).join(', ')} não cabe em uma tela: os blocos serão <strong style={{ fontWeight: 700 }}>divididos e reposicionados automaticamente</strong> em 2 telas na rotação.
                  </span>
                </div>
              )}
              <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>Use as setas para reposicionar a ordem de exibição.</div>
              {selected.flatMap((d, di) => d.large ? [{ d, part: 1 }, { d, part: 2 }] : [{ d }]).map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--ai)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }} className="font-mono">{i + 1}</span>
                  <div style={{ width: 74, borderRadius: 7, overflow: 'hidden', border: '1px solid var(--color-border)', flexShrink: 0 }}>
                    <Thumb kind={it.d.kind || 'bars'} accent={it.d.accent || 'info'} height={38} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.d.name}{it.part ? ' · Tela ' + it.part + ' de 2' : ''}</div>
                  </div>
                  <span className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{config.interval}s</span>
                  {(!it.part || it.part === 1) ? (
                    <span style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                      <button onClick={() => moveDash(it.d.id, -1)} disabled={sel.indexOf(it.d.id) === 0} title="Mover para cima"
                        style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: sel.indexOf(it.d.id) === 0 ? 'var(--color-border-strong)' : 'var(--color-text-secondary)', cursor: sel.indexOf(it.d.id) === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="chevron-up" size={13} /></button>
                      <button onClick={() => moveDash(it.d.id, 1)} disabled={sel.indexOf(it.d.id) === sel.length - 1} title="Mover para baixo"
                        style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: sel.indexOf(it.d.id) === sel.length - 1 ? 'var(--color-border-strong)' : 'var(--color-text-secondary)', cursor: sel.indexOf(it.d.id) === sel.length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="chevron-down" size={13} /></button>
                    </span>
                  ) : <span style={{ width: 50, flexShrink: 0 }} />}
                </div>
              ))}
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '12px 22px', borderTop: '1px solid var(--color-border)' }}>
          <div>{step > 1 && navBtn('Voltar', false, () => setStep(step - 1))}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {step < 3 && navBtn('Avançar', true, () => setStep(step + 1), sel.length === 0)}
            {step === 3 && navBtn('Concluir', false, onClose)}
            {step === 3 && (
              <button onClick={onOpenTv}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 16px', borderRadius: 9, border: 'none', background: 'var(--cta)', color: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-xs)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cta-dark)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--cta)'}>
                <Icon name="tv" size={16} />Abrir modo TV
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- modo TV: player fullscreen -----------------------------------------------
function TvKpiDark({ kpi }) {
  const tone = { success: 'var(--color-success)', info: '#60A5FA', warning: 'var(--color-warning)', danger: 'var(--color-danger)' }[kpi.tone] || '#60A5FA';
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '22px 24px', minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#E2E8F0', marginBottom: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kpi.label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="font-mono" style={{ fontSize: 52, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{kpi.value}</span>
        {kpi.unit && <span className="font-mono" style={{ fontSize: 20, color: '#CBD5E1' }}>{kpi.unit}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 15, color: tone, fontWeight: 600 }}>
        <Icon name="trending-up" size={17} />{kpi.delta}
      </div>
    </div>
  );
}

function TvCtl({ icon, onClick, title, danger }) {
  return (
    <button onClick={onClick} title={title}
      style={{ width: 38, height: 38, borderRadius: 9, border: '1px solid rgba(255,255,255,0.12)', background: danger ? 'rgba(220,38,38,0.25)' : 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={16} />
    </button>
  );
}

function TvOverlay({ config, dashboards, onClose, onInterval }) {
  const all = [{ id: 'home', name: 'Dashboard padrão', kind: 'scurve' }, ...dashboards];
  const slides = config.ids.flatMap((id) => {
    const dsh = all.find((d) => d.id === id);
    if (!dsh) return [];
    if (dsh.large) {
      // não cabe em uma tela: divisão automática equilibrada em 2 telas
      return [{ dash: dsh, part: 1, blocks: ['kpis', 'scurve'] }, { dash: dsh, part: 2, blocks: ['disciplina', 'feed'] }];
    }
    return [{ dash: dsh, blocks: ['kpis', 'scurve', 'disciplina'] }];
  });
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pct, setPct] = useState(0);
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString('pt-BR'));
  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('pt-BR')), 1000);
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => { clearInterval(t); window.removeEventListener('keydown', k); };
  }, []);
  const pctRef = useRef(0);
  useEffect(() => { pctRef.current = pct; }, [pct]);
  useEffect(() => {
    if (paused) return;
    const total = config.interval * 1000;
    const start = Date.now() - (pctRef.current / 100) * total; // retoma de onde parou
    const t = setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= total) {
        setIdx((i) => (i + 1) % slides.length);
        setPct(0);
      } else {
        setPct((elapsed / total) * 100);
      }
    }, 200);
    return () => clearInterval(t);
  }, [paused, config.interval, slides.length, idx]);
  const goto = (delta) => { pctRef.current = 0; setPct(0); setIdx((i) => (i + delta + slides.length) % slides.length); };
  const cur = slides[idx] || slides[0];
  const dash = cur && cur.dash;
  const blocks = (cur && cur.blocks) || ['kpis', 'scurve', 'disciplina'];
  const chartBlocks = blocks.filter((b) => b !== 'kpis');
  const kpis = [...KPIS, ...KPIS_EXTRA].slice(0, 5);
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const measure = () => {
      if (!config.fit || !outerRef.current || !innerRef.current) { setScale(1); return; }
      const avail = outerRef.current.clientHeight - 30; // desconta o padding superior da área
      const need = innerRef.current.scrollHeight;
      setScale(need > 0 ? Math.min(1, avail / need) : 1);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [idx, config.fit, slides.length]);
  // variáveis claras para os gráficos (que usam os tokens do tema claro)
  const darkVars = { '--color-text-primary': '#F8FAFC', '--color-text-secondary': '#E2E8F0', '--color-text-tertiary': '#A8B4C4', '--color-border': 'rgba(255,255,255,0.22)', '--color-bg-subtle': 'rgba(255,255,255,0.14)', '--color-bg-surface': '#0B1220' };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 130, background: '#0B1220', display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', flexShrink: 0 }}>
        <MerisMark size={36} radius={9} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ color: 'var(--ai)' }}>Centro Visual</span> <span style={{ color: '#fff' }}>do Projeto</span>
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '0.08em', color: '#CBD5E1', textTransform: 'uppercase', marginTop: 2 }}>UGH Boaventura · Contrato Petrobras</div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9999, padding: '6px 14px', color: '#fff', fontSize: 14, fontWeight: 700 }} className="font-mono">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ai)' }} />{idx + 1} / {slides.length}
        </span>
        <span className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>{clock}</span>
        <div style={{ display: 'flex', gap: 7 }}>
          <TvCtl icon="chevron-left" title="Anterior" onClick={() => goto(-1)} />
          <TvCtl icon={paused ? 'play' : 'pause'} title={paused ? 'Retomar rotação' : 'Pausar rotação'} onClick={() => setPaused((p) => !p)} />
          <TvCtl icon="chevron-right" title="Próximo" onClick={() => goto(1)} />
          <button title="Mudar o tempo por tela (10s / 30s / 60s)" onClick={() => onInterval && onInterval({ 10: 30, 30: 60, 60: 10 }[config.interval] || 30)}
            style={{ height: 38, padding: '0 12px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700 }} className="font-mono">{config.interval}s</button>
          <TvCtl icon="x" title="Sair do modo TV" danger onClick={onClose} />
        </div>
      </div>
      {/* progress */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ width: pct + '%', height: '100%', background: 'var(--ai)' }} />
      </div>
      {/* slide */}
      <div ref={outerRef} className="sb-scroll" style={{ flex: 1, minHeight: 0, overflow: config.fit ? 'hidden' : 'auto', padding: '22px 26px 0' }}>
        <div ref={innerRef} style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: scale < 1 ? `${100 / scale}%` : '100%', paddingBottom: 22, ...darkVars }}>
          <div style={{ maxWidth: 1560, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <span style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--ai)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, fontWeight: 700 }} className="font-mono">{idx + 1}</span>
            <div>
              <div style={{ fontSize: 30, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{dash ? dash.name + (cur && cur.part ? ' · Tela ' + cur.part + ' de 2' : '') : ''}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#CBD5E1', marginTop: 4 }}>Atualizado em tempo real · UGH Boaventura</div>
            </div>
            <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, color: '#fff', background: 'rgba(255,255,255,0.08)', borderRadius: 9999, padding: '8px 15px', fontSize: 14.5, fontWeight: 600 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-success)' }} /> Ao vivo
            </span>
          </div>
          {blocks.includes('kpis') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 14 }}>
              {kpis.map((k) => <TvKpiDark key={k.id} kpi={k} />)}
            </div>
          )}
          {chartBlocks.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: chartBlocks.length === 1 ? '1fr' : chartBlocks.includes('scurve') ? '1.7fr 1fr' : '1fr 1fr', gap: 14 }}>
              {chartBlocks.map((b) => (
                <div key={b} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px' }}>
                  {b === 'scurve' && (<>
                    <div style={{ fontSize: 19, fontWeight: 600, color: '#fff', marginBottom: 14 }}>Curva S de avanço acumulado</div>
                    <div style={{ maxWidth: chartBlocks.length === 1 ? 980 : 'none', margin: '0 auto', zoom: 1.25 }}><SCurve height={chartBlocks.length === 1 ? 330 : 290} /></div>
                  </>)}
                  {b === 'disciplina' && (<>
                    <div style={{ fontSize: 19, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Avanço por disciplina</div>
                    <div style={{ zoom: 1.35 }}><DisciplineBars /></div>
                  </>)}
                  {b === 'feed' && (<>
                    <div style={{ fontSize: 19, fontWeight: 600, color: '#fff', marginBottom: 10 }}>Feed do projeto</div>
                    {PROJECT_FEED.map((f) => (
                      <div key={f.id} style={{ display: 'flex', gap: 10, padding: '9px 0', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.tone === 'danger' ? 'var(--color-danger)' : f.tone === 'success' ? 'var(--color-success)' : 'var(--color-primary)', marginTop: 5, flexShrink: 0 }} />
                        <div style={{ fontSize: 16, color: '#F8FAFC', fontWeight: 500, lineHeight: 1.55 }}><strong style={{ color: f.tone === 'danger' ? 'var(--color-danger)' : f.tone === 'success' ? 'var(--color-success)' : '#93C5FD', fontWeight: 700 }}>{f.kind}</strong> {f.text}<div style={{ fontSize: 13, fontWeight: 400, color: '#94A3B8', marginTop: 3 }}>{f.who} {f.when}</div></div>
                      </div>
                    ))}
                  </>)}
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- apresentação da nova home (primeiro acesso) ----------------------------
function WelcomeModal({ onConfirm }) {
  const [sel, setSel] = useState([]);
  const OPTS = [
    { id: 'dashboard', icon: 'layout-dashboard', title: 'Dashboard padrão',        desc: 'KPIs, curva S e feed do projeto' },
    { id: 'resumo',    icon: 'sparkles',         title: 'Resumo diário',           desc: 'O que aconteceu, em formato de feed' },
    { id: 'sign',      icon: 'pencil',           title: 'Documentos para assinar', desc: 'O que aguarda sua assinatura (leitura)' },
    { id: 'viewer3d',  icon: 'boxes',            title: 'Viewer 3D',               desc: 'Planta industrial com TAGs por status' },
  ];
  const toggle = (id) => setSel((cur) => { if (!cur.includes(id) && cur.length >= 2) return cur; return cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]; });
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: 'min(620px, 96vw)', background: 'var(--color-bg-surface)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '28px 28px 6px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><MerisMark size={44} radius={11} /></div>
          <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-text-primary)' }}>Bem-vinda à nova Home</div>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.55, margin: '8px auto 0', maxWidth: 460 }}>
            Agora a sua home é conversacional: o chat com o MERIS fica ao centro e os blocos que você escolher abrem em tela dividida ao lado.
          </p>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ai-text)', marginTop: 12 }}>Selecione o que você gostaria de ver · escolha 1 ou 2 · {sel.length}/2</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '16px 28px 8px' }}>
          {OPTS.map((o) => {
            const on = sel.includes(o.id);
            const blocked = !on && sel.length >= 2;
            return (
              <button key={o.id} onClick={() => toggle(o.id)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 14px', borderRadius: 12, textAlign: 'left', cursor: blocked ? 'default' : 'pointer', fontFamily: 'inherit', border: `1.5px solid ${on ? 'var(--ai)' : 'var(--color-border)'}`, background: on ? 'var(--ai-bg)' : 'var(--color-bg-surface)', opacity: blocked ? 0.45 : 1, transition: 'all 120ms ease' }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: on ? 'var(--ai)' : 'var(--color-bg-subtle)', color: on ? '#fff' : 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={o.icon} size={17} /></span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>{o.title}</span>
                    {on && <Icon name="check-circle" size={15} style={{ color: 'var(--ai-text)', flexShrink: 0 }} />}
                  </span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2, lineHeight: 1.4 }}>{o.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px 22px' }}>
          <span style={{ flex: 1, fontSize: 12, color: 'var(--color-text-tertiary)' }}>Dá para mudar depois na Central de controle.</span>
          <button disabled={sel.length === 0} onClick={() => onConfirm(sel)}
            style={{ height: 40, padding: '0 22px', borderRadius: 10, border: 'none', background: sel.length ? 'var(--cta)' : 'var(--color-bg-subtle)', color: sel.length ? '#fff' : 'var(--color-text-tertiary)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: sel.length ? 'pointer' : 'default', boxShadow: sel.length ? 'var(--shadow-xs)' : 'none' }}
            onMouseEnter={(e) => { if (sel.length) e.currentTarget.style.background = 'var(--cta-dark)'; }} onMouseLeave={(e) => { if (sel.length) e.currentTarget.style.background = 'var(--cta)'; }}>
            Começar
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- configurar home (modal) -------------------------------------------------
function HomeConfigModal({ blocks, onBlocks, homeDashId, dashboards, onPickDash, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  const OPTS = [
    { id: 'dashboard', icon: 'layout-dashboard', title: 'Dashboard',               desc: 'KPIs, curva S e feed do projeto' },
    { id: 'resumo',    icon: 'sparkles',         title: 'Resumo diário',           desc: 'O que aconteceu, em formato de feed' },
    { id: 'sign',      icon: 'pencil',           title: 'Documentos para assinar', desc: 'O que aguarda sua assinatura (leitura)' },
    { id: 'viewer3d',  icon: 'boxes',            title: 'Viewer 3D',               desc: 'Planta industrial com TAGs por status' },
  ];
  const sel = blocks || [];
  const toggle = (id) => {
    if (!sel.includes(id) && sel.length >= 2) return; // nunca mais de 2
    const cur = sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id];
    if (cur.length === 0) return; // mantém pelo menos 1 bloco
    onBlocks(cur);
  };
  const dashOptions = [{ id: 'home', name: 'Dashboard padrão', desc: 'KPIs fixados em tempo real' }, ...dashboards];
  const sectionLbl = (txt) => <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', margin: '14px 0 8px' }}>{txt}</div>;
  const row = (key, icon, title, desc, active, onClick, dimmed) => (
    <button key={key} onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${active ? 'var(--ai)' : 'var(--color-border)'}`, background: active ? 'var(--ai-bg)' : 'var(--color-bg-surface)', cursor: dimmed ? 'default' : 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 120ms ease', marginBottom: 7, opacity: dimmed ? 0.45 : 1 }}>
      <span style={{ width: 32, height: 32, borderRadius: 9, background: active ? 'var(--ai)' : 'var(--color-bg-subtle)', color: active ? '#fff' : 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={16} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        {desc && <span style={{ display: 'block', fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{desc}</span>}
      </span>
      {active && <Icon name="check" size={16} style={{ color: 'var(--ai-text)', flexShrink: 0 }} />}
    </button>
  );
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onMouseDown={(e) => e.stopPropagation()} style={{ width: 'min(520px, 96vw)', maxHeight: '86vh', background: 'var(--color-bg-surface)', borderRadius: 14, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--ai-bg)', color: 'var(--ai-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="settings" size={17} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Configurar home</div>
            <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>Escolha os blocos e o dashboard da home</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="x" size={17} /></button>
        </div>
        <div className="sb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '6px 20px 18px' }}>
          {sectionLbl(`Blocos da home · escolha 1 ou 2 · ${sel.length}/2`)}
          {OPTS.map((o) => {
            const on = sel.includes(o.id);
            const blocked = !on && sel.length >= 2;
            return row(o.id, o.icon, o.title, o.desc, on, () => toggle(o.id), blocked);
          })}
          {sectionLbl('Dashboard da home')}
          {dashOptions.map((dd) => row(dd.id, 'layout-dashboard', dd.name, dd.desc || (dd.edited ? 'Editado ' + dd.edited : null), (homeDashId || 'home') === dd.id, () => onPickDash(dd)))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--color-border)' }}>
          <button onClick={onClose}
            style={{ height: 38, padding: '0 18px', borderRadius: 9, border: 'none', background: 'var(--cta)', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-xs)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cta-dark)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--cta)'}>
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- drawer de histórico de uma fonte anexada -------------------------------
function HistoryDrawer({ source, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  const hist = source.history || [];
  const initials = (name) => name.split(' ').slice(0, 2).map((p) => p[0]).join('');
  const colorFor = (name) => { const u = TEAM.find((t) => t.name === name); return (u && u.color) || 'var(--ai)'; };
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.4)' }}>
      <aside onMouseDown={(e) => e.stopPropagation()} className="pane-anim" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(420px, 94vw)', background: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={source.icon || 'file-text'} size={18} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{source.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>Histórico de atualizações: {hist.length} {hist.length === 1 ? 'versão' : 'versões'} · {source.system} · {source.size}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="x" size={17} /></button>
        </div>
        <div className="sb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 20px' }}>
          {hist.map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: colorFor(h.who), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>{initials(h.who)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>{h.who}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ai-text)', background: 'var(--ai-bg)', borderRadius: 9999, padding: '2px 8px' }} className="font-mono">Rev {h.rev}</span>
                  {i === 0 && <Badge tone="success" dot>Atual</Badge>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 3, lineHeight: 1.5 }}>{h.note}</div>
                <div style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)', marginTop: 3 }}>{h.when}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

// ---- global search (topbar) ----------------------------------------------
function GlobalSearch({ chats, dashboards, onOpenChat, onOpenDashboard, onClose }) {
  const [q, setQ] = useState('');
  const ql = q.trim().toLowerCase();
  const chatItems = [];
  Object.entries(chats).forEach(([group, list]) => list.forEach((c) => chatItems.push({ ...c, group })));
  const mChats = chatItems.filter((c) => !ql || c.title.toLowerCase().includes(ql));
  const mDash = (dashboards || []).filter((d) => !ql || d.name.toLowerCase().includes(ql));
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  const row = (key, icon, title, meta, onClick) => (
    <button key={key} onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '9px 11px', border: 'none', background: 'transparent', borderRadius: 9, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
      <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={15} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--color-text-tertiary)' }}>{meta}</span>
      </span>
      <Icon name="chevron-right" size={15} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
    </button>
  );
  const sectionLbl = (txt) => <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', padding: '8px 11px 4px' }}>{txt}</div>;
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '90px 24px 24px' }}>
      <div onMouseDown={(e) => e.stopPropagation()} style={{ width: 'min(560px, 96vw)', maxHeight: '70vh', background: 'var(--color-bg-surface)', borderRadius: 14, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <Icon name="search" size={17} style={{ color: 'var(--color-text-tertiary)' }} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar conversas e dashboards…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 14.5, color: 'var(--color-text-primary)' }} />
          <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--color-text-tertiary)', border: '1px solid var(--color-border)', borderRadius: 5, padding: '2px 6px' }}>esc</span>
        </div>
        <div className="sb-scroll" style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
          {mChats.length === 0 && mDash.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--color-text-tertiary)' }}>Nenhum resultado para “{q.trim()}”.</div>
          )}
          {mChats.length > 0 && sectionLbl('Conversas')}
          {mChats.map((c) => row('c-' + c.id, 'message-square', c.title, c.group, () => { onClose(); onOpenChat(c.id); }))}
          {mDash.length > 0 && sectionLbl('Dashboards')}
          {mDash.map((d) => row('d-' + d.id, 'layout-dashboard', d.name, `Editado ${d.edited} · ${d.charts} blocos`, () => { onClose(); onOpenDashboard(d); }))}
        </div>
      </div>
    </div>
  );
}

// ---- notifications (topbar bell) ------------------------------------------
function NotifBell() {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [open]);
  const toneColor = { danger: 'var(--color-danger)', accent: 'var(--color-accent-text)', success: 'var(--color-success)', warning: 'var(--color-warning)', info: 'var(--color-primary)' };
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => { setOpen((o) => !o); setSeen(true); }} title="Notificações"
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'} onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent'; }}
        style={{ position: 'relative', width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: open ? 'var(--color-bg-subtle)' : 'transparent', color: 'var(--color-text-secondary)', transition: 'background 120ms ease' }}>
        <Icon name="bell" size={18} />
        {!seen && <span style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: '50%', background: 'var(--color-danger)', border: '1.5px solid var(--color-bg-surface)' }} />}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 40, right: 0, zIndex: 60, width: 360, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>Notificações · UGH Boaventura</div>
          <div className="sb-scroll" style={{ maxHeight: 320, overflowY: 'auto', padding: '4px 16px 10px' }}>
            {PROJECT_FEED.map((f) => (
              <div key={f.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: toneColor[f.tone], marginTop: 5, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.5 }}><strong style={{ fontWeight: 600 }}>{f.kind}</strong> {f.text}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{f.who} · {f.when}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- top bar inside the app ---------------------------------------------
function TopBar({ scenario, openDash, onCrumb, onCrumbDash, onSearch }) {
  let context = 'Home';
  if (scenario >= 4 && scenario <= 7) context = 'Conversa';
  if (scenario === 8) context = 'Meus dashboards';
  if (scenario === 12) context = 'Chats compartilhados';
  if (scenario === 13) context = 'Central de controle';
  const isSaved = scenario === 9;
  const isEdit = scenario === 10;
  const dashName = openDash ? openDash.name : 'Dashboard salvo';
  return (
    <div style={{ height: 54, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: 'var(--color-text-tertiary)', minWidth: 0 }}>
        <Icon name="home" size={16} />
        <Icon name="chevron-right" size={14} />
        {isSaved || isEdit ? (
          <>
            <button onClick={onCrumb} className="crumb-link" style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500, color: 'var(--color-text-secondary)', padding: 0, whiteSpace: 'nowrap' }}>Meus dashboards</button>
            <Icon name="chevron-right" size={14} />
            {isEdit ? (
              <button onClick={onCrumbDash} className="crumb-link" style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500, color: 'var(--color-text-secondary)', padding: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280 }}>{dashName}</button>
            ) : (
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dashName}</span>
            )}
            {isEdit && (
              <>
                <Icon name="chevron-right" size={14} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--ai-text)', fontWeight: 600, whiteSpace: 'nowrap' }}><Icon name="pencil" size={13} /> Edição</span>
              </>
            )}
          </>
        ) : (
          <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{context}</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <WorkspacePill />
        <TopIcon name="search" title="Buscar conversas e dashboards" onClick={onSearch} />
        <NotifBell />
      </div>
    </div>
  );
}
// seletor de projeto (workspace) no topo
function WorkspacePill() {
  const [open, setOpen] = useState(false);
  const [ws, setWs] = useState('UGH Boaventura');
  const ref = useRef(null);
  const OPTIONS = ['UGH Boaventura', 'REPLAN Carteira 2', 'UTGCA Caraguatatuba'];
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen((o) => !o)} className="ws-pill" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: open ? 'var(--color-bg-subtle)' : 'var(--color-bg-surface)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }} />
        {ws}
        <Icon name="chevron-down" size={15} style={{ color: 'var(--color-text-tertiary)' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 40, right: 0, zIndex: 60, minWidth: 230, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', padding: 5 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', padding: '6px 9px 4px' }}>Projetos</div>
          {OPTIONS.map((o) => (
            <button key={o} onClick={() => { setWs(o); setOpen(false); }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 9px', border: 'none', background: 'transparent', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'left' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: o === ws ? 'var(--color-success)' : 'var(--color-border-strong)', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{o}</span>
              {o === ws && <Icon name="check" size={14} style={{ color: 'var(--ai-text)' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TopIcon({ name, badge, title, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button title={title} onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ position: 'relative', width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: h ? 'var(--color-bg-subtle)' : 'transparent', color: 'var(--color-text-secondary)', transition: 'background 120ms ease' }}>
      <Icon name={name} size={18} />
      {badge && <span style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: '50%', background: 'var(--color-danger)', border: '1.5px solid var(--color-bg-surface)' }} />}
    </button>
  );
}

// ---- Tweaks panel --------------------------------------------------------
function Tweaks({ t, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Camada de IA" />
      <TweakRadio label="Acento" value={t.accent} options={['azul', 'violeta', 'misto']} onChange={(v) => setTweak('accent', v)} />
      <TweakToggle label="Skills sugeridas" value={t.showSkills} onChange={(v) => setTweak('showSkills', v)} />
      <TweakSection label="Layout" />
      <TweakRadio label="Densidade" value={t.density} options={['comfortable', 'compact']} onChange={(v) => setTweak('density', v)} />
      <TweakRadio label="Sidebar" value={t.sidebar} options={['manual', 'expandida', 'colapsada']} onChange={(v) => setTweak('sidebar', v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
