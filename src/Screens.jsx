// MERIS Home — full-bleed resizable split-pane composition (Claude-style)
const { useState: useStateSC, useRef: useRefSC, useEffect: useEffectSC } = React;

// ---- resizable split group ----------------------------------------------
function Resizer({ dir, onDown }) {
  const [h, setH] = useStateSC(false);
  const isRow = dir === 'row';
  return (
    <div
      className="om-resizer"
      onPointerDown={onDown}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        flex: '0 0 auto', position: 'relative', zIndex: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: isRow ? 12 : '100%', height: isRow ? '100%' : 12,
        cursor: isRow ? 'col-resize' : 'row-resize', touchAction: 'none',
      }}
    >
      <div style={{
        width: isRow ? 4 : 36, height: isRow ? 36 : 4, borderRadius: 9999,
        background: h ? 'var(--ai)' : 'var(--color-border-strong)',
        opacity: h ? 1 : 0.5, transition: 'background 120ms ease, opacity 120ms ease',
      }} />
    </div>
  );
}

function Split({ direction = 'row', defaultSizes, minSize = 12, children, style }) {
  const items = React.Children.toArray(children).filter(Boolean);
  const n = items.length;
  const isRow = direction === 'row';
  const ref = useRefSC(null);
  const drag = useRefSC(null);
  const [sizes, setSizes] = useStateSC(() =>
    defaultSizes && defaultSizes.length === n ? defaultSizes : items.map(() => 100 / n)
  );

  function down(i, e) {
    e.preventDefault();
    const rect = ref.current.getBoundingClientRect();
    const total = isRow ? rect.width : rect.height;
    drag.current = { i, total, start: isRow ? e.clientX : e.clientY, base: [...sizes] };
    document.body.style.cursor = isRow ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
  function move(e) {
    const d = drag.current; if (!d) return;
    const pos = isRow ? e.clientX : e.clientY;
    const deltaPct = ((pos - d.start) / d.total) * 100;
    let a = d.base[d.i] + deltaPct, b = d.base[d.i + 1] - deltaPct;
    if (a < minSize) { b -= (minSize - a); a = minSize; }
    if (b < minSize) { a -= (minSize - b); b = minSize; }
    const next = [...d.base]; next[d.i] = a; next[d.i + 1] = b;
    setSizes(next);
  }
  function up() {
    drag.current = null;
    document.body.style.cursor = ''; document.body.style.userSelect = '';
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
  }
  useEffectSC(() => () => up(), []);

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: isRow ? 'row' : 'column', height: '100%', width: '100%', minWidth: 0, minHeight: 0, ...style }}>
      {items.map((child, i) => (
        <React.Fragment key={i}>
          <div style={{ flexGrow: sizes[i], flexBasis: 0, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>{child}</div>
          {i < n - 1 && <Resizer dir={direction} onDown={(e) => down(i, e)} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ---- block renderer (pane variant) --------------------------------------
function renderPane(key, density, menuItems, dash, focusedTag) {
  const common = { key, density, menuItems, style: { height: '100%' } };
  switch (key) {
    case 'dashboard': return <DashboardBlock {...common} chartHeight={210} kpiIds={dash && dash.kpiIds} widgets={dash && dash.widgets} onAddKpi={dash && dash.onAddKpi} onRemoveKpi={dash && dash.onRemoveKpi} onAddWidget={dash && dash.onAddWidget} onRemoveWidget={dash && dash.onRemoveWidget} onKpiAction={dash && dash.onKpiAction} sources={dash && dash.sources} pinnedDash={dash && dash.pinnedDash} />;
    case 'viewer3d':  return <Viewer3D {...common} focusedTag={focusedTag} />;
    case 'doctable':  return <DocTableBlock {...common} />;
    case 'assets':    return <AssetsTableBlock {...common} />;
    case 'resumo':    return <DailySummaryBlock {...common} />;
    case 'sign':      return <SignDocsBlock {...common} onToast={dash && dash.onToast} />;
    case 'textdoc':   return <TextDocBlock {...common} doc={dash && dash.textDoc} onToast={dash && dash.onToast} />;
    case 'doc':       return <DocPreviewBlock {...common} />;
    case 'report':    return <ReportPreviewBlock {...common} />;
    default: return null;
  }
}

function buildMenu(key, { isHome, onRemovePane, onPinHome, pinned }) {
  const items = [];
  // documents and reports cannot be pinned to the home
  if (!isHome && key !== 'doc' && key !== 'report' && key !== 'textdoc') {
    items.push({ icon: 'pin', label: pinned ? 'Fixado na home' : 'Fixar na home', disabled: pinned, onClick: () => onPinHome(key) });
    items.push({ divider: true });
  }
  items.push({ icon: 'x', label: 'Remover bloco', danger: true, onClick: () => onRemovePane(key) });
  return items;
}

// Drag-and-drop wrapper for reordering panes (grip handle appears on hover).
function PaneDnD({ id, dir, dragId, overId, setDragId, setOverId, onReorder, children }) {
  const [armed, setArmed] = useStateSC(false);
  const dragging = dragId === id;
  const over = overId === id && dragId && dragId !== id;
  return (
    <div
      className="pane-wrap"
      draggable={armed}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragId(id); }}
      onDragEnd={() => { setArmed(false); setDragId(null); setOverId(null); }}
      onDragOver={(e) => { if (dragId && dragId !== id) { e.preventDefault(); if (overId !== id) setOverId(id); } }}
      onDrop={(e) => { e.preventDefault(); if (dragId && dragId !== id) onReorder(dragId, id); setDragId(null); setOverId(null); }}
      style={{ position: 'relative', height: '100%', width: '100%', minWidth: 0, minHeight: 0,
        opacity: dragging ? 0.4 : 1,
        outline: over ? '2px solid var(--ai)' : 'none', outlineOffset: -2, borderRadius: 14,
        transition: 'opacity 120ms ease' }}
    >
      <div className="pane-grip" title="Arraste para reorganizar"
        onMouseDown={() => setArmed(true)} onMouseUp={() => setArmed(false)}
        style={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)', zIndex: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', height: 20, padding: '0 12px',
          borderRadius: 7, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)', color: 'var(--color-text-tertiary)', cursor: armed ? 'grabbing' : 'grab' }}>
        <Icon name="grip" size={14} />
      </div>
      {children}
    </div>
  );
}

function EmptyContent() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--color-bg-surface)', border: '1px dashed var(--color-border-strong)', borderRadius: 14, color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 24 }}>
      <Icon name="layers" size={28} />
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Nenhum bloco aberto</div>
      <div style={{ fontSize: 12.5, maxWidth: 240 }}>Peça um dashboard ou o viewer 3D ao MERIS, ou fixe um bloco aqui.</div>
    </div>
  );
}

// ---- chat pane ----------------------------------------------------------
function ChatPane({ variant, messages, onSend, onSkill, showSkills, density, markRef, onClearMark, onQuickAction, onAction, activeFocus, onTagClick, thinking, onShare, onConclude, onRenameChat, chatMembers, wide, sharedHint, onConnect }) {
  const meta = [...messages].reverse().find((m) => m.chat);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: 'transparent', overflow: 'hidden' }}>
      {variant === 'thread' && <ConvHeader meta={meta && meta.chat} onShare={onShare} onConclude={onConclude} onRename={onRenameChat} members={chatMembers} />}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ChatPanel variant={variant} align={variant === 'welcome' ? 'center' : 'start'} messages={messages} onSend={onSend} onSkill={onSkill} showSkills={showSkills} density={density} narrow={!wide} markRef={markRef} onClearMark={onClearMark} onQuickAction={onQuickAction} onAction={onAction} activeFocus={activeFocus} onTagClick={onTagClick} thinking={thinking} sharedHint={sharedHint} onConnect={onConnect} />
      </div>
    </div>
  );
}

function ScreenContent(props) {
  const { scenario, density, messages, onSend, onSkill, showSkills, onOpenDash, onBackLibrary, onNewFromLibrary, onEdit, markRef, onMark, onClearMark, onQuickAction, onAction, activeFocus, onTagClick, thinking, onShare, chatMembers, onOpenSharedChat, sharedChats, panes, paneDir, homePanes, onRemovePane, onMovePane, onReorderPane, onPinHome, dashKpis, onAddKpi, onRemoveKpi, onKpiAction, dashWidgets, onAddWidget, onRemoveWidget, sources } = props;
  const [dragId, setDragId] = useStateSC(null);
  const [overId, setOverId] = useStateSC(null);

  if (scenario === 8) return <DashboardLibrary density={density} onOpen={onOpenDash} onNewMessage={onNewFromLibrary} onNewDashboard={props.onNewDashboard} onTvConfig={props.onTvConfig} dashboards={props.savedDashboards} onRenameDashboard={props.onRenameDashboard} onDeleteDashboard={props.onDeleteDashboard} dashGroups={props.dashGroups} onCreateGroup={props.onCreateGroup} onRenameGroup={props.onRenameGroup} onDeleteGroup={props.onDeleteGroup} onMoveDash={props.onMoveDash} onShareDashboard={props.onShareDashboard} onDescDashboard={props.onDescDashboard} homeDashId={props.homeDashId} onPinDashHome={props.onPinDashHome} onUnpinDashHome={props.onUnpinDashHome} onShareGroup={props.onShareGroup} />;
  if (scenario === 9) return <SavedDashboardView density={density} openDash={props.openDash} onBack={onBackLibrary} onEdit={onEdit} onKpiAction={onKpiAction} homeKpis={dashKpis} onShare={() => props.onShareDashboard && props.onShareDashboard(props.openDash)} sources={sources} homeDashId={props.homeDashId} onPinDashHome={props.onPinDashHome} onUnpinDashHome={props.onUnpinDashHome} />;
  if (scenario === 12) return <SharedChatsView sharedChats={sharedChats} onOpen={onOpenSharedChat} onNewShared={props.onNewSharedChat} onRenameShared={props.onRenameSharedChat} onFavShared={props.onFavSharedChat} />;
  if (scenario === 13) return <DataSourcesView sources={props.sources} onAddCsv={props.onAddCsv} onConnect={props.onConnect} onAsk={props.onAskSource} csvImport={props.csvImport} onUpdateFile={props.onUpdateFile} onDownloadFile={props.onDownloadFile} onDeleteFile={props.onDeleteFile} onShowHistory={props.onShowHistory} onSyncSource={props.onSyncSource} onConfigHome={props.onConfigHome} onTvConfig={props.onTvConfig} onOpenTvMode={props.onOpenTvMode} />;

  const chatVariant = scenario <= 2 ? 'welcome' : 'thread';
  const chatEl = <ChatPane variant={chatVariant} messages={messages} onSend={onSend} onSkill={onSkill} showSkills={showSkills} density={density} markRef={markRef} onClearMark={onClearMark} onQuickAction={onQuickAction} onAction={onAction} activeFocus={activeFocus} onTagClick={onTagClick} thinking={thinking} onShare={onShare} onConclude={props.onConcludeChat} onRenameChat={props.onRenameActiveChat} chatMembers={chatMembers} wide={panes.length === 0} sharedHint={props.sharedHint} onConnect={props.onConnect} />;

  let body = null;
  if (scenario === 10) {
    body = (
      <Split key="s10" direction="row" defaultSizes={[34, 66]}>
        {chatEl}
        <DashboardEditor density={density} openDash={props.openDash} onMark={onMark} markedId={markRef ? markRef.id : null} sources={sources} onSave={props.onSaveDashboard} />
      </Split>
    );
  } else {
    const isHome = scenario <= 2;
    const dash = { kpiIds: dashKpis, widgets: dashWidgets, onAddKpi, onRemoveKpi, onAddWidget, onRemoveWidget, onKpiAction, sources, pinnedDash: isHome ? props.homeDash : (props.convDash || null), textDoc: props.textDoc, onToast: props.onToast };
    const menuFor = (key) => buildMenu(key, { isHome, onRemovePane, onPinHome, pinned: homePanes.includes(key) });
    if (panes.length === 0) {
      // no blocks open → solo chat, header full-width, content centered by ChatPanel
      body = (
        <div key="centered" className="chat-centered" style={{ height: '100%', width: '100%' }}>{chatEl}</div>
      );
    } else {
      let content;
      if (panes.length === 1) content = renderPane(panes[0], density, menuFor(panes[0]), dash, activeFocus);
      else content = (
        <Split key={'in-' + paneDir + panes.join()} direction={paneDir}>
          {panes.map((p) => (
            <PaneDnD key={p} id={p} dir={paneDir} dragId={dragId} overId={overId} setDragId={setDragId} setOverId={setOverId} onReorder={onReorderPane}>
              {renderPane(p, density, menuFor(p), dash, activeFocus)}
            </PaneDnD>
          ))}
        </Split>
      );
      body = (
        <Split key={'out-' + scenario} direction="row" defaultSizes={[34, 66]}>
          {chatEl}
          <div key={'panewrap-' + panes.join()} className="pane-anim" style={{ height: '100%', width: '100%', minWidth: 0 }}>{content}</div>
        </Split>
      );
    }
  }

  return (
    <div style={{ height: '100%', minHeight: 0, background: 'var(--color-bg-app)', padding: 12 }}>
      {body}
    </div>
  );
}

function ConvHeader({ meta, onShare, onConclude, onRename, members }) {
  const [editing, setEditing] = useStateSC(false);
  const [draft, setDraft] = useStateSC('');
  const title = (meta && meta.title) || 'Conversa';
  const commit = () => { const v = draft.trim(); if (v && v !== title && onRename) onRename(v); setEditing(false); };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px 11px 22px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); else if (e.key === 'Escape') setEditing(false); }} onBlur={commit}
            style={{ width: '100%', maxWidth: 420, height: 32, padding: '0 9px', borderRadius: 8, border: '1px solid var(--ai)', outline: 'none', boxShadow: '0 0 0 3px color-mix(in srgb, var(--ai) 14%, transparent)', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
            {onRename && (
              <button onClick={() => { setDraft(title); setEditing(true); }} title="Renomear conversa"
                style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <Icon name="pencil" size={13} />
              </button>
            )}
          </div>
        )}
        <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{(meta && meta.subtitle) || 'Agente MERIS'}</div>
      </div>
      {members && members.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {members.slice(0, 3).map((u, i) => (
            <span key={u.id} title={u.name} style={{ marginLeft: i ? -8 : 0, borderRadius: '50%', boxShadow: '0 0 0 2px var(--color-bg-surface)' }}><Avatar user={u} size={26} /></span>
          ))}
          {members.length > 3 && <span style={{ marginLeft: -8, width: 26, height: 26, borderRadius: '50%', background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px var(--color-bg-surface)' }}>+{members.length - 3}</span>}
        </div>
      )}
      {onConclude && <SecondaryBtn icon="check-circle" onClick={onConclude}>Concluir</SecondaryBtn>}
      <SecondaryBtn icon="share-2" onClick={onShare}>Compartilhar</SecondaryBtn>
    </div>
  );
}

function LayoutToggle({ layout, onChange }) {
  const opts = [
    { id: 'stacked', icon: 'rows-2', title: 'Blocos empilhados' },
    { id: '2col', icon: 'columns-2', title: 'Blocos lado a lado' },
  ];
  return (
    <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--color-bg-subtle)', borderRadius: 9, border: '1px solid var(--color-border)' }}>
      {opts.map((o) => {
        const active = layout === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} title={o.title}
            style={{ width: 32, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'var(--color-bg-surface)' : 'transparent', color: active ? 'var(--ai-text)' : 'var(--color-text-tertiary)', boxShadow: active ? 'var(--shadow-xs)' : 'none', transition: 'all 120ms ease' }}>
            <Icon name={o.icon} size={16} />
          </button>
        );
      })}
    </div>
  );
}

// ---- dashboard edit mode (comment + reposition) -------------------------
const EDIT_LABELS = { scurve: 'Curva S', disciplina: 'Avanço por disciplina', ativos: 'Tabela de ativos', docs: 'Documentos críticos', feed: 'Feed do projeto' };

function Commentable({ id, label, onMark, marked, children }) {
  const [h, setH] = useStateSC(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ position: 'relative', borderRadius: 12, outline: marked ? '2px solid var(--ai)' : 'none', outlineOffset: 2, transition: 'outline 120ms ease', height: '100%' }}>
      {children}
      <button onClick={(e) => { e.stopPropagation(); onMark({ id, label }); }} title="Comentar no chat"
        style={{ position: 'absolute', top: 8, right: 8, zIndex: 6, width: 26, height: 26, borderRadius: 7, border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: marked ? 'var(--ai)' : 'var(--color-text-tertiary)', opacity: (h || marked) ? 1 : 0, transition: 'opacity 120ms ease' }}>
        <Icon name="message-square-plus" size={15} />
      </button>
    </div>
  );
}

function EditorRow({ i, drag, over, setDrag, setOver, onDropAt, children }) {
  const [h, setH] = useStateSC(false);
  return (
    <div
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      draggable onDragStart={() => setDrag(i)} onDragEnd={() => { setDrag(null); setOver(null); }}
      onDragOver={(e) => { e.preventDefault(); if (over !== i) setOver(i); }} onDrop={() => onDropAt(i)}
      style={{ position: 'relative', opacity: drag === i ? 0.4 : 1, outline: over === i && drag != null && drag !== i ? '2px dashed var(--ai)' : 'none', outlineOffset: 5, borderRadius: 14, transition: 'opacity 120ms ease' }}
    >
      <div title="Arraste para reposicionar"
        style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', zIndex: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 20, padding: '0 12px', borderRadius: 7, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', color: 'var(--color-text-tertiary)', cursor: 'grab', opacity: h ? 1 : 0, transition: 'opacity 120ms ease' }}>
        <Icon name="grip" size={14} />
      </div>
      {children}
    </div>
  );
}

function EdHd({ title, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</span>
      {badge && <Badge tone="info" dot>Em dia</Badge>}
    </div>
  );
}

function DashboardEditor({ density, openDash, onMark, markedId, sources, onSave }) {
  const blank = !!(openDash && openDash.blank);
  const name = openDash ? openDash.name : 'Comissionamento UGH Boaventura';
  const [order, setOrder] = useStateSC(blank ? ['kpis'] : ['kpis', 'scurve', 'disciplina', 'ativos']);
  const [drag, setDrag] = useStateSC(null);
  const [over, setOver] = useStateSC(null);
  const [extraKpis, setExtraKpis] = useStateSC([]);
  const pool = [...KPIS, ...KPIS_EXTRA];
  const baseKpis = blank ? [] : [...KPIS, KPIS_EXTRA[0]];
  const kpis = [...baseKpis, ...extraKpis.map((id) => pool.find((k) => k.id === id)).filter(Boolean)];
  const srcMap = {}; (sources || DATA_SOURCES).forEach((s) => { srcMap[s.id] = s; });
  const sourceFor = (id) => srcMap[KPI_SOURCE[id]] || srcMap.cortex;
  const cardInner = { border: '1px solid var(--color-border)', borderRadius: 12, padding: 16 };
  const WIDGET_MAP = { 'w-scurve': 'scurve', 'w-docs': 'docs', 'w-feed': 'feed' };
  const addedWidgets = Object.entries(WIDGET_MAP).filter(([, v]) => order.includes(v)).map(([w]) => w);
  const addWidget = (wid) => { const v = WIDGET_MAP[wid]; if (v && !order.includes(v)) setOrder((o) => [...o, v]); };

  function onDropAt(i) {
    if (drag == null || drag === i) { setDrag(null); setOver(null); return; }
    const a = [...order]; const [m] = a.splice(drag, 1); a.splice(i, 0, m);
    setOrder(a); setDrag(null); setOver(null);
  }

  function widget(id) {
    if (id === 'kpis') return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {kpis.map((k) => (
          <Commentable key={k.id} id={'kpi-' + k.id} label={'KPI · ' + k.label} onMark={onMark} marked={markedId === 'kpi-' + k.id}>
            <KpiCard kpi={k} density={density} source={sourceFor(k.id)} />
          </Commentable>
        ))}
        <KpiAddTile added={[...kpis.map((k) => k.id), ...addedWidgets]} onAddKpi={(id) => setExtraKpis((p) => p.includes(id) ? p : [...p, id])} onAddWidget={addWidget} />
      </div>
    );
    if (id === 'scurve') return (<div style={cardInner}><EdHd title="Curva S de avanço acumulado" badge /><SCurve height={210} /></div>);
    if (id === 'disciplina') return (<div style={cardInner}><EdHd title="Avanço por disciplina" /><DisciplineBars /></div>);
    if (id === 'feed') return (<div style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}><div style={{ padding: '12px 16px 0' }}><EdHd title="Feed do projeto" /></div><div style={{ padding: '0 2px' }}><ProjectFeed /></div></div>);
    if (id === 'docs') return (
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 16px' }}>
          <Icon name="file-text" size={17} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Documentos críticos</span>
        </div>
        <DataTable density={density} rows={CRIT_DOCS} columns={[
          { key: 'tag', label: 'TAG', render: (r) => <span className="font-mono" style={{ fontWeight: 500 }}>{r.tag}</span> },
          { key: 'title', label: 'Título', render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>{r.title}</span> },
          { key: 'status', label: 'Status', render: (r) => <Badge tone={r.tone} dot>{r.status}</Badge> },
        ]} />
      </div>
    );
    if (id === 'ativos') return (
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 16px' }}>
          <Icon name="boxes" size={17} style={{ color: 'var(--color-accent-text)' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Ativos em comissionamento</span>
        </div>
        <DataTable density={density} rows={ASSETS} columns={[
          { key: 'tag', label: 'TAG do ativo', render: (r) => <span className="font-mono" style={{ fontWeight: 500 }}>{r.tag}</span> },
          { key: 'type', label: 'Tipo', render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>{r.type}</span> },
          { key: 'prog', label: 'Avanço', render: (r) => <Progress value={r.prog} /> },
          { key: 'status', label: 'Status', render: (r) => <Badge tone={r.tone} dot>{r.status}</Badge> },
        ]} />
      </div>
    );
    return null;
  }

  const blockCount = kpis.length + order.filter((x) => x !== 'kpis').length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 14, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        <span style={{ color: 'var(--color-primary)', display: 'flex' }}><Icon name="layout-dashboard" size={18} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{blank && blockCount === 0 ? 'Dashboard vazio: comece pelo Adicionar KPI' : 'Arraste para reposicionar · comente nos blocos'}</div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: 'var(--ai-text)', background: 'var(--ai-bg)', padding: '4px 10px', borderRadius: 9999 }}>
          <Icon name="pencil" size={12} /> Editando
        </span>
        <button onClick={() => onSave && onSave({ kpiIds: kpis.map((k) => k.id), widgets: order.filter((x) => x !== 'kpis') })}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 34, padding: '0 14px', borderRadius: 8, border: 'none', background: 'var(--cta)', color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-xs)', flexShrink: 0 }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cta-dark)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--cta)'}>
          <Icon name="check" size={15} />Salvar
        </button>
      </header>
      <div className="sb-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {order.map((id, i) => {
            const w = widget(id);
            const node = id === 'kpis' ? w : (
              <Commentable id={id} label={EDIT_LABELS[id]} onMark={onMark} marked={markedId === id}>{w}</Commentable>
            );
            return (
              <EditorRow key={id} i={i} drag={drag} over={over} setDrag={setDrag} setOver={setOver} onDropAt={onDropAt}>
                {node}
              </EditorRow>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---- Chats compartilhados (view) ----------------------------------------
function SharedChatsView({ sharedChats, onOpen, onNewShared, onRenameShared, onFavShared }) {
  const byId = {}; TEAM.forEach((u) => { byId[u.id] = u; });
  const ACCESS_LBL = { 'pode-ver': 'Pode ver', 'pode-comentar': 'Pode comentar', 'pode-editar': 'Pode editar' };
  const [q, setQ] = useStateSC('');
  const ql = q.trim().toLowerCase();
  const list = [...(sharedChats || [])].filter((c) => !ql || c.title.toLowerCase().includes(ql)).sort((a, b) => (b.fav ? 1 : 0) - (a.fav ? 1 : 0));
  return (
    <div className="sb-scroll" style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '24px 32px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.01em' }}>Chats compartilhados</h1>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>Conversas com a equipe do UGH Boaventura</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 12px', borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', width: 250 }}>
              <Icon name="search" size={16} style={{ color: 'var(--color-text-tertiary)' }} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar conversa…"
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13.5, color: 'var(--color-text-primary)' }} />
              {q && <button onClick={() => setQ('')} style={{ width: 18, height: 18, border: 'none', borderRadius: 5, cursor: 'pointer', background: 'transparent', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><Icon name="x" size={13} /></button>}
            </div>
            <PrimaryBtn icon="plus" onClick={onNewShared}>Criar chat compartilhado</PrimaryBtn>
          </div>
        </div>
        {list.length === 0 ? (
          <div style={{ marginTop: 40, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 14 }}>{ql ? `Nenhuma conversa encontrada para “${q.trim()}”.` : 'Nenhum chat compartilhado'}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
            {list.map((c) => (
              <SharedChatRow key={c.id} c={c} byId={byId} accessLbl={ACCESS_LBL} onOpen={() => onOpen(c)} onRename={(t) => onRenameShared(c.id, t)} onFav={() => onFavShared(c.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SharedChatRow({ c, byId, accessLbl, onOpen, onRename, onFav }) {
  const [menu, setMenu] = useStateSC(false);
  const [editing, setEditing] = useStateSC(false);
  const [draft, setDraft] = useStateSC(c.title);
  const ref = useRefSC(null);
  const inRef = useRefSC(null);
  useEffectSC(() => {
    if (!menu) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenu(false); };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [menu]);
  useEffectSC(() => { if (editing && inRef.current) { inRef.current.focus(); inRef.current.select(); } }, [editing]);
  const commit = () => { const v = draft.trim(); if (v && v !== c.title) onRename(v); setEditing(false); };
  const members = c.members.map((id) => byId[id]).filter(Boolean);
  const owner = byId[c.owner];
  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: 'var(--shadow-sm)', transition: 'all 140ms ease' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
      <span style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--ai-bg)', color: 'var(--ai-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="message-square" size={18} /></span>
      <div style={{ flex: 1, minWidth: 0, cursor: editing ? 'default' : 'pointer' }} onClick={() => !editing && onOpen()}>
        {editing ? (
          <input ref={inRef} value={draft} onChange={(e) => setDraft(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); else if (e.key === 'Escape') setEditing(false); }} onBlur={commit}
            style={{ width: '100%', maxWidth: 420, height: 30, padding: '0 8px', borderRadius: 7, border: '1px solid var(--ai)', outline: 'none', boxShadow: '0 0 0 3px color-mix(in srgb, var(--ai) 14%, transparent)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }} />
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</span>
            {c.fav && <Icon name="star" size={14} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />}
          </span>
        )}
        <span style={{ display: 'block', fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{owner ? (owner.id === 'u-ana' ? 'Compartilhado por você' : `Compartilhado por ${owner.name}`) : ''} · {accessLbl[c.access]} · atualizado {c.updated}</span>
      </div>
      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {members.slice(0, 4).map((u, i) => (
          <span key={u.id} title={u.name} style={{ marginLeft: i ? -8 : 0, borderRadius: '50%', boxShadow: '0 0 0 2px var(--color-bg-surface)' }}><Avatar user={u} size={28} /></span>
        ))}
        {members.length > 4 && <span style={{ marginLeft: -8, width: 28, height: 28, borderRadius: '50%', background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px var(--color-bg-surface)' }}>+{members.length - 4}</span>}
      </span>
      <HdrIcon name="more-horizontal" title="Mais ações" onClick={() => setMenu((o) => !o)} />
      {menu && (
        <div style={{ position: 'absolute', top: 'calc(100% - 8px)', right: 12, zIndex: 40, minWidth: 196, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', padding: 5 }}>
          <button onClick={() => { setMenu(false); onFav(); }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 9px', border: 'none', background: 'transparent', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'left' }}>
            <Icon name="star" size={15} />{c.fav ? 'Remover dos favoritos' : 'Favoritar'}
          </button>
          <button onClick={() => { setMenu(false); setDraft(c.title); setEditing(true); }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 9px', border: 'none', background: 'transparent', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'left' }}>
            <Icon name="pencil" size={15} />Renomear
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Fontes de dados (healthcheck) --------------------------------------
function SourceStatusBadge({ status }) {
  const st = SOURCE_STATUS[status] || SOURCE_STATUS.ok;
  return <Badge tone={st.tone} dot>{st.label}</Badge>;
}

function SourceRow({ s, onRequest, onAsk, onSync }) {
  const isDown = s.status === 'down';
  const isStale = s.status === 'stale';
  const isPending = s.status === 'pending';
  const isSyncing = s.status === 'sync';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
      <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
        <Icon name={s.icon} size={20} />
        <span style={{ position: 'absolute', bottom: -2, right: -2, padding: 2, borderRadius: '50%', background: 'var(--color-bg-surface)' }}><SourceDot status={s.status} size={9} /></span>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.name}</span>
          <SourceStatusBadge status={s.status} />
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 3 }}>{s.system} · {s.desc}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexShrink: 0 }}>
        <Stat label="Registros" value={s.records} />
        <Stat label="Sincronização" value={s.sync} warn={isStale} />
        {s.kind === 'fixa' && (isSyncing ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 11px', borderRadius: 7, background: 'var(--color-info-bg)', color: 'var(--color-info-text)', fontSize: 12.5, fontWeight: 600 }}><Icon name="activity" size={14} />Sincronizando…</span>
        ) : (
          <HdrIcon name="refresh-cw" title="Sincronizar" onClick={() => onSync && onSync(s.id)} />
        ))}
        {!isSyncing && (
          <MiniBtn icon="message-square" onClick={() => onAsk && onAsk(s)}>Perguntar</MiniBtn>
        )}
      </div>
    </div>
  );
}

function SourceSection({ title, caption, children, action }) {
  return (
    <div style={{ marginTop: 26 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</div>
          {caption && <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{caption}</div>}
        </div>
        {action}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

// linha de progresso da importação simulada de um CSV
function CsvImportRow({ imp }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--color-bg-surface)', border: '1px solid var(--ai)', borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
      <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--ai-bg)', color: 'var(--ai-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="upload" size={20} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{imp.name}</span>
          <Badge tone="info" dot>Importando</Badge>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 7 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 9999, background: 'var(--color-bg-subtle)', overflow: 'hidden' }}>
            <div style={{ width: imp.pct + '%', height: '100%', background: 'var(--ai)', borderRadius: 9999, transition: 'width 600ms ease' }} />
          </div>
          <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)', flexShrink: 0, width: 34, textAlign: 'right' }}>{imp.pct}%</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>{imp.step}</div>
      </div>
    </div>
  );
}

// Arquivo anexado manualmente como fonte externa (baixar / atualizar / excluir / histórico)
function FileSourceRow({ s, onUpdate, onDownload, onDelete, onHistory }) {
  const [confirm, setConfirm] = useStateSC(false);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
      <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={s.icon || 'file-text'} size={20} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
        <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span>Adicionado em {s.added}</span>
          <span>Atualizado {s.sync}</span>
          <button onClick={() => onHistory(s)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: 'var(--ai-text)' }}>
            Histórico ({(s.history || []).length})
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <span style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)' }}>{s.system}</span>
        <span className="font-mono" style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{s.size}</span>
        <div style={{ display: 'flex', gap: 2 }}>
          <HdrIcon name="refresh-cw" title="Atualizar (anexar nova revisão)" onClick={() => onUpdate(s.id)} />
          <HdrIcon name="download" title="Baixar" onClick={() => onDownload(s)} />
          <HdrIcon name="trash-2" title="Excluir" onClick={() => setConfirm(true)} />
        </div>
      </div>
      {confirm && (
        <div style={{ position: 'absolute', top: 'calc(100% - 8px)', right: 12, zIndex: 40, width: 250, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', padding: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Excluir fonte?</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.45, marginBottom: 10 }}>O arquivo e seu histórico serão removidos das fontes.</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setConfirm(false)} style={{ height: 30, padding: '0 12px', borderRadius: 7, border: '1px solid var(--color-border-strong)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={() => { setConfirm(false); onDelete(s.id); }} style={{ height: 30, padding: '0 12px', borderRadius: 7, border: 'none', background: 'var(--color-danger)', color: '#fff', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Excluir</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Card que envolve cada sessão da Central de controle
function SectionCard({ children }) {
  return (
    <section style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 14, boxShadow: 'var(--shadow-sm)', padding: '20px 22px', marginTop: 18 }}>
      {children}
    </section>
  );
}

function DataSourcesView({ sources, onAddCsv, onConnect, onAsk, csvImport, onUpdateFile, onDownloadFile, onDeleteFile, onShowHistory, onSyncSource, onConfigHome, onTvConfig, onOpenTvMode }) {
  const fileRef = useRefSC(null);
  const list = sources || DATA_SOURCES;
  const fixed = list.filter((s) => s.kind === 'fixa');
  const csv = list.filter((s) => s.kind === 'csv');
  const manual = list.filter((s) => s.kind === 'manual');
  const counts = list.reduce((a, s) => { a[s.status] = (a[s.status] || 0) + 1; return a; }, {});
  const summary = [
    { k: 'ok', n: counts.ok || 0, label: 'Conectadas', tone: 'success', icon: 'check-circle' },
    { k: 'sync', n: (counts.sync || 0) + (csvImport ? 1 : 0), label: 'Sincronizando', tone: 'info', icon: 'activity' },
    { k: 'stale', n: counts.stale || 0, label: 'Desatualizadas', tone: 'warning', icon: 'clock' },
  ];
  const toneText = { success: 'var(--color-success-text)', info: 'var(--color-info-text)', warning: 'var(--color-warning-text)' };
  const toneBg = { success: 'var(--color-success-bg)', info: 'var(--color-info-bg)', warning: 'var(--color-warning-bg)' };
  const onFile = (e) => { const f = (e.target.files || [])[0]; if (f && onAddCsv) onAddCsv(f.name); e.target.value = ''; };
  const importBtn = (
    <SecondaryBtn icon="plus" onClick={() => onConnect && onConnect()}>Conectar fonte</SecondaryBtn>
  );
  return (
    <div className="sb-scroll" style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '24px 32px 40px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.01em' }}>Central de controle</h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '6px 0 0', whiteSpace: 'nowrap' }}>
          O centro de comando do seu workspace: personalize a home e acompanhe a saúde das fontes de dados.
        </p>

        <SectionCard>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>Home</div>
          <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>Dashboard fixado e modo de abertura</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 14, marginTop: 14, borderTop: '1px solid var(--color-border)' }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--ai-bg)', color: 'var(--ai-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="home" size={20} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>Configurar home</div>
              <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 3 }}>Escolha qual dashboard fica na home e como ela abre (3D, dashboard, os dois ou resumo do dia)</div>
            </div>
            <MiniBtn icon="settings" onClick={onConfigHome}>Configurar</MiniBtn>
          </div>
        </SectionCard>

        <SectionCard>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>Modo TV</div>
          <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>Dashboards em rotação para telões e salas de controle</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 14, marginTop: 14, borderTop: '1px solid var(--color-border)' }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--ai-bg)', color: 'var(--ai-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="tv" size={20} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>Configurar modo TV</div>
              <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 3 }}>Escolha os dashboards, o tempo de rotação e organize dashboards grandes em mais de uma tela</div>
            </div>
            <button onClick={onOpenTvMode}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', borderRadius: 7, border: 'none', background: 'var(--cta)', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0 }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cta-dark)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--cta)'}>
              <Icon name="tv" size={14} />Abrir modo TV
            </button>
            <MiniBtn icon="settings" onClick={onTvConfig}>Configurar</MiniBtn>
          </div>
        </SectionCard>

        <SectionCard>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>Fontes de dados</div>
          <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>Bases nativas do MERIS e planilhas que você importa como fontes externas.</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
          {summary.map((s) => (
            <div key={s.k} style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: '14px 16px', background: 'var(--color-bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: toneBg[s.tone], color: toneText[s.tone], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={s.icon} size={16} /></span>
                <span className="font-mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1 }}>{s.n}</span>
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginTop: 9 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <SourceSection title="Fontes fixas" caption="Bases nativas do MERIS · sempre disponíveis">
          {fixed.map((s) => <SourceRow key={s.id} s={s} onAsk={onAsk} onSync={onSyncSource} />)}
        </SourceSection>

        <SourceSection title="Fontes externas" caption="Bancos, data warehouses, APIs, modelos 3D e planilhas. Adição imediata, sem aprovação" action={importBtn}>
          {manual.map((s) => <FileSourceRow key={s.id} s={s} onUpdate={onUpdateFile} onDownload={onDownloadFile} onDelete={onDeleteFile} onHistory={onShowHistory} />)}
          {csvImport && <CsvImportRow imp={csvImport} />}
          {csv.map((s) => <SourceRow key={s.id} s={s} onAsk={onAsk} />)}
          {csv.length === 0 && manual.length === 0 && !csvImport && (
            <button onClick={() => onConnect && onConnect()}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '26px', border: '1.5px dashed var(--color-border-strong)', borderRadius: 12, background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, transition: 'all 120ms ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ai)'; e.currentTarget.style.background = 'var(--ai-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.background = 'transparent'; }}>
              <Icon name="plus" size={20} />
              <span>Conectar uma fonte externa</span>
              <span style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)' }}>PostgreSQL, BigQuery, Snowflake, API REST, Modelo 3D, JSON ou CSV</span>
            </button>
          )}
        </SourceSection>

          <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={onFile} />
        </SectionCard>
      </div>
    </div>
  );
}
function Stat({ label, value, warn }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 64 }}>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>{label}</span>
      <span className="font-mono" style={{ fontSize: 13, fontWeight: 500, color: warn ? 'var(--color-warning-text)' : 'var(--color-text-primary)' }}>{value}</span>
    </div>
  );
}

Object.assign(window, { ScreenContent, Split, Resizer, ChatPane, LayoutToggle, ConvHeader, DashboardEditor, Commentable, EditorRow, buildMenu, EmptyContent, PaneDnD, SharedChatsView, DataSourcesView });
