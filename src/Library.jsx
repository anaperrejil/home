// MERIS Home — "Meus dashboards" library (screen 8) + saved dashboard view (screen 9)
const { useState: useStateLB, useRef: useRefLB, useEffect: useEffectLB } = React;

const ACCENT_HEX = {
  info: '#2563EB', success: '#16A34A', warning: '#D97706',
  danger: '#DC2626', accent: '#6D28D9', brand: '#0E7490',
};

// ---- mini thumbnails -----------------------------------------------------
function Thumb({ kind, accent, height = 88 }) {
  const c = ACCENT_HEX[accent] || '#2563EB';
  return (
    <div style={{ width: '100%', height, background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, overflow: 'hidden' }}>
      <svg viewBox="0 0 200 96" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {kind === 'scurve' && (<g>
          <polyline points="8,82 40,64 72,48 104,30 136,20 168,14 192,12" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <polyline points="8,84 40,72 72,58 104,42 136,30 168,22 192,18" fill="none" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4"/>
          <line x1="8" y1="88" x2="192" y2="88" stroke="#CBD5E1" strokeWidth="1"/>
        </g>)}
        {kind === 'bars' && (<g>
          {[28,52,40,68,84,60].map((h,i)=><rect key={i} x={10+i*31} y={88-h} width="20" height={h} rx="3" fill={i%2? c : c+'88'} />)}
        </g>)}
        {kind === 'donut' && (<g transform="translate(100,48)">
          <circle r="32" fill="none" stroke="#E2E8F0" strokeWidth="14"/>
          <circle r="32" fill="none" stroke={c} strokeWidth="14" strokeDasharray="138 201" strokeLinecap="round" transform="rotate(-90)"/>
        </g>)}
        {kind === 'heatmap' && (<g>
          {Array.from({length:4}).map((_,r)=>Array.from({length:8}).map((__,cc)=>{
            const op = (Math.sin(r*1.7+cc)*0.5+0.5);
            return <rect key={r+'-'+cc} x={8+cc*23} y={8+r*21} width="19" height="17" rx="2" fill={c} opacity={0.15+op*0.7}/>;
          }))}
        </g>)}
      </svg>
    </div>
  );
}

function AvatarStack({ ids, size = 24, max = 3 }) {
  const byId = {}; TEAM.forEach((u) => { byId[u.id] = u; });
  const users = (ids || []).map((id) => byId[id]).filter(Boolean);
  if (!users.length) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {users.slice(0, max).map((u, i) => (
        <span key={u.id} title={u.name} style={{ marginLeft: i ? -8 : 0, borderRadius: '50%', boxShadow: '0 0 0 2px var(--color-bg-surface)' }}><Avatar user={u} size={size} /></span>
      ))}
      {users.length > max && <span style={{ marginLeft: -8, width: size, height: size, borderRadius: '50%', background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', fontSize: size * 0.4, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px var(--color-bg-surface)' }}>+{users.length - max}</span>}
    </span>
  );
}

function GroupSection({ group, items, card, onRenameGroup, onDeleteGroup, onShareGroup }) {
  const memberUnion = [...new Set(items.flatMap((d) => d.members || []))];
  const editable = !!group.id && onRenameGroup;
  const [menu, setMenu] = useStateLB(false);
  const [editing, setEditing] = useStateLB(false);
  const [draft, setDraft] = useStateLB(group.name);
  const ref = useRefLB(null);
  const inRef = useRefLB(null);
  useEffectLB(() => {
    if (!menu) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenu(false); };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [menu]);
  useEffectLB(() => { if (editing && inRef.current) { inRef.current.focus(); inRef.current.select(); } }, [editing]);
  const commit = () => { const v = draft.trim(); if (v && v !== group.name) onRenameGroup(group.id, v); setEditing(false); };
  return (
    <div style={{ marginTop: 30 }}>
      <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 13, position: 'relative' }}>
        <Icon name={group.id ? 'folder' : 'layers'} size={17} style={{ color: 'var(--color-text-tertiary)' }} />
        {editing ? (
          <input ref={inRef} value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); else if (e.key === 'Escape') setEditing(false); }} onBlur={commit}
            style={{ height: 30, padding: '0 8px', borderRadius: 7, border: '1px solid var(--ai)', outline: 'none', boxShadow: '0 0 0 3px color-mix(in srgb, var(--ai) 16%, transparent)', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', minWidth: 200 }} />
        ) : (
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>{group.name}</span>
        )}
        <span style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)' }}>· {items.length}</span>
        {memberUnion.length > 0 && <span style={{ marginLeft: 2 }}><AvatarStack ids={memberUnion} size={22} /></span>}
        {editable && !editing && (
          <button onClick={() => setMenu((o) => !o)} title="Mais ações"
            style={{ width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: menu ? 'var(--color-bg-subtle)' : 'transparent', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="more-horizontal" size={16} />
          </button>
        )}
        {menu && (
          <div style={{ position: 'absolute', top: 30, left: 28, zIndex: 30, minWidth: 178, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', padding: 5 }}>
            <CardMenuRow icon="share-2" label="Compartilhar grupo" onClick={() => { setMenu(false); onShareGroup && onShareGroup(group); }} />
            <CardMenuRow icon="pencil" label="Renomear grupo" onClick={() => { setMenu(false); setDraft(group.name); setEditing(true); }} />
            <CardMenuRow icon="trash-2" label="Excluir grupo" danger onClick={() => { setMenu(false); onDeleteGroup(group.id); }} />
          </div>
        )}
      </div>
      {items.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {items.map((d) => (
            <DashboardCard key={d.id} d={d} hov={card.hovId === d.id} onHov={(v) => card.setHovId(v ? d.id : null)}
              onOpen={() => card.onOpen(d)} onRename={(name) => card.onRenameDashboard(d.id, name)} onDelete={() => card.onDeleteDashboard(d.id)}
              onShareDashboard={() => card.onShareDashboard(d)} groups={card.groups} onMove={(gid) => card.onMoveDash(d.id, gid)} onDesc={(txt) => card.onDescDashboard(d.id, txt)}
              pinnedHome={card.homeDashId === d.id} onPinHome={() => card.onPinDashHome(d)} onUnpinHome={() => card.onUnpinDashHome()} />
          ))}
        </div>
      ) : (
        <div style={{ padding: 18, border: '1px dashed var(--color-border-strong)', borderRadius: 12, fontSize: 13, color: 'var(--color-text-tertiary)' }}>Nenhum dashboard neste grupo. Use “Mover para grupo” no menu “…” de um dashboard.</div>
      )}
    </div>
  );
}

function DashboardLibrary({ density, onOpen, onNewMessage, onNewDashboard, onTvConfig, dashboards, onRenameDashboard, onDeleteDashboard, dashGroups, onCreateGroup, onRenameGroup, onDeleteGroup, onMoveDash, onShareDashboard, onDescDashboard, homeDashId, onPinDashHome, onUnpinDashHome, onShareGroup }) {
  const [hovId, setHovId] = useStateLB(null);
  const [creating, setCreating] = useStateLB(false);
  const [groupName, setGroupName] = useStateLB('');
  const [q, setQ] = useStateLB('');
  const ql = q.trim().toLowerCase();
  const all = dashboards || SAVED_DASHBOARDS;
  const list = ql ? all.filter((d) => d.name.toLowerCase().includes(ql) || (d.desc || '').toLowerCase().includes(ql)) : all;
  const groups = dashGroups || [];
  const ungrouped = list.filter((d) => !d.group || !groups.some((g) => g.id === d.group));
  const card = { hovId, setHovId, onOpen, onRenameDashboard, onDeleteDashboard, onMoveDash, onShareDashboard, onDescDashboard, groups, homeDashId, onPinDashHome, onUnpinDashHome };
  const submitGroup = () => { const v = groupName.trim(); if (v) onCreateGroup(v); setGroupName(''); setCreating(false); };
  return (
    <div style={{ height: '100%', overflowY: 'auto' }} className="sb-scroll">
      <div style={{ padding: '24px 32px 40px' }}>
        <PageHeader
          title="Meus dashboards"
          subtitle="Painéis salvos por você e pela equipe. Organize em grupos e compartilhe"
          action={<div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 12px', borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', width: 250 }}>
              <Icon name="search" size={16} style={{ color: 'var(--color-text-tertiary)' }} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar dashboard…"
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13.5, color: 'var(--color-text-primary)' }} />
              {q && <button onClick={() => setQ('')} style={{ width: 18, height: 18, border: 'none', borderRadius: 5, cursor: 'pointer', background: 'transparent', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><Icon name="x" size={13} /></button>}
            </div>
            <SecondaryBtn icon="folder" onClick={() => setCreating(true)}>Novo grupo</SecondaryBtn>
            <PrimaryBtn icon="plus" onClick={onNewDashboard}>Novo dashboard</PrimaryBtn>
          </div>}
        />

        {creating && (
          <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
            <input autoFocus value={groupName} onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitGroup(); else if (e.key === 'Escape') { setCreating(false); setGroupName(''); } }}
              placeholder="Nome do grupo…"
              style={{ height: 38, padding: '0 12px', borderRadius: 9, border: '1px solid var(--ai)', outline: 'none', boxShadow: '0 0 0 3px color-mix(in srgb, var(--ai) 14%, transparent)', fontFamily: 'inherit', fontSize: 14, color: 'var(--color-text-primary)', minWidth: 260 }} />
            <PrimaryBtn icon="check" onClick={submitGroup}>Criar grupo</PrimaryBtn>
            <button onClick={() => { setCreating(false); setGroupName(''); }}
              style={{ height: 38, padding: '0 14px', borderRadius: 9, border: '1px solid var(--color-border-strong)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Cancelar</button>
          </div>
        )}

        {ql && list.length === 0 && (
          <div style={{ marginTop: 22, fontSize: 13, color: 'var(--color-text-tertiary)' }}>Nenhum dashboard encontrado para “{q.trim()}”.</div>
        )}

        {/* grupos */}
        {groups.map((g) => {
          const items = list.filter((d) => d.group === g.id);
          if (ql && items.length === 0) return null;
          return <GroupSection key={g.id} group={g} items={items} card={card} onRenameGroup={onRenameGroup} onDeleteGroup={onDeleteGroup} onShareGroup={onShareGroup} />;
        })}

        {/* sem grupo */}
        {ungrouped.length > 0 && <GroupSection group={{ id: null, name: 'Sem grupo' }} items={ungrouped} card={card} />}
      </div>
    </div>
  );
}

function DashboardCard({ d, hov, onHov, onOpen, onRename, onDelete, onShareDashboard, groups, onMove, onDesc, pinnedHome, onPinHome, onUnpinHome }) {
  const [menu, setMenu] = useStateLB(false);
  const [view, setView] = useStateLB('main'); // 'main' | 'move'
  const [confirm, setConfirm] = useStateLB(false);
  const [editing, setEditing] = useStateLB(false);
  const [draft, setDraft] = useStateLB(d.name);
  const [editingDesc, setEditingDesc] = useStateLB(false);
  const [draftDesc, setDraftDesc] = useStateLB(d.desc || '');
  const ref = useRefLB(null);
  const inputRef = useRefLB(null);
  const shared = d.members && d.members.length > 0;
  useEffectLB(() => {
    if (!menu && !confirm) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setMenu(false); setConfirm(false); setView('main'); } };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [menu, confirm]);
  useEffectLB(() => { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [editing]);
  const commit = () => { const v = draft.trim(); if (v && v !== d.name) onRename(v); setEditing(false); };
  const commitDesc = () => { const v = draftDesc.trim(); if (v !== (d.desc || '')) onDesc(v); setEditingDesc(false); };
  const openMenu = () => { setMenu((o) => !o); setConfirm(false); setView('main'); };
  return (
    <div ref={ref}
      onMouseEnter={() => onHov(true)} onMouseLeave={() => onHov(false)}
      style={{
        position: 'relative', display: 'flex', flexDirection: 'column', textAlign: 'left',
        background: 'var(--color-bg-surface)', fontFamily: 'inherit',
        border: '1px solid var(--color-border)', borderRadius: 14,
        boxShadow: (hov || menu) ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transform: (hov || menu) ? 'translateY(-2px)' : 'none', transition: 'all 140ms ease',
      }}>
      <div onClick={() => !editing && onOpen()} style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', borderRadius: '13px 13px 0 0' }}>
        <Thumb kind={d.kind} accent={d.accent} />
        <span style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
          {pinnedHome && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 9999, background: 'var(--ai)', color: '#fff', fontSize: 11, fontWeight: 600 }}>
              <Icon name="home" size={12} /> Home
            </span>
          )}
          {shared && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px 3px 7px', borderRadius: 9999, background: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-sm)', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              <Icon name="users" size={12} /> Compartilhado
            </span>
          )}
        </span>
      </div>
      {/* menu trigger */}
      {(hov || menu) && !editing && (
        <button onClick={(e) => { e.stopPropagation(); openMenu(); }} title="Mais ações"
          style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-sm)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="more-horizontal" size={16} />
        </button>
      )}
      {menu && !confirm && view === 'main' && (
        <div style={{ position: 'absolute', top: 42, right: 10, zIndex: 30, minWidth: 188, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', padding: 5 }}>
          {pinnedHome
            ? <CardMenuRow icon="pin" label="Remover da home" onClick={() => { setMenu(false); onUnpinHome && onUnpinHome(); }} />
            : <CardMenuRow icon="pin" label="Fixar na home" onClick={() => { setMenu(false); onPinHome && onPinHome(); }} />}
          <CardMenuRow icon="share-2" label="Compartilhar" onClick={() => { setMenu(false); onShareDashboard && onShareDashboard(); }} />
          <CardMenuRow icon="folder" label="Mover para grupo" chevron onClick={() => setView('move')} />
          <CardMenuRow icon="pencil" label="Renomear" onClick={() => { setMenu(false); setDraft(d.name); setEditing(true); }} />
          <CardMenuRow icon="file-text" label="Editar descrição" onClick={() => { setMenu(false); setDraftDesc(d.desc || ''); setEditingDesc(true); }} />
          <CardMenuRow icon="trash-2" label="Excluir" danger onClick={() => setConfirm(true)} />
        </div>
      )}
      {menu && !confirm && view === 'move' && (
        <div style={{ position: 'absolute', top: 42, right: 10, zIndex: 30, minWidth: 210, maxHeight: 280, overflowY: 'auto', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', padding: 5 }} className="sb-scroll">
          <CardMenuRow icon="chevron-left" label="Mover para…" onClick={() => setView('main')} />
          <div style={{ height: 1, background: 'var(--color-border)', margin: '5px 0' }} />
          {(groups || []).map((g) => (
            <CardMenuRow key={g.id} icon="folder" label={g.name} check={d.group === g.id} onClick={() => { onMove(g.id); setMenu(false); setView('main'); }} />
          ))}
          <CardMenuRow icon="layers" label="Sem grupo" check={!d.group} onClick={() => { onMove(null); setMenu(false); setView('main'); }} />
        </div>
      )}
      {confirm && (
        <div style={{ position: 'absolute', top: 42, right: 10, zIndex: 30, width: 232, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', padding: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Excluir dashboard?</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.45, marginBottom: 10 }}>Esta ação não pode ser desfeita.</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setConfirm(false); setMenu(false); }} style={{ height: 30, padding: '0 12px', borderRadius: 7, border: '1px solid var(--color-border-strong)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={() => { setConfirm(false); setMenu(false); onDelete(); }} style={{ height: 30, padding: '0 12px', borderRadius: 7, border: 'none', background: 'var(--color-danger)', color: '#fff', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Excluir</button>
          </div>
        </div>
      )}
      <div style={{ padding: '11px 13px 12px' }}>
        {editing ? (
          <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); else if (e.key === 'Escape') setEditing(false); }} onBlur={commit}
            style={{ width: '100%', height: 30, padding: '0 8px', marginBottom: 6, borderRadius: 7, border: '1px solid var(--ai)', outline: 'none', boxShadow: '0 0 0 3px color-mix(in srgb, var(--ai) 16%, transparent)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)' }} />
        ) : (
          <div onClick={onOpen} style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 3, lineHeight: 1.35, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
        )}
        {editingDesc ? (
          <input autoFocus value={draftDesc} onChange={(e) => setDraftDesc(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitDesc(); else if (e.key === 'Escape') setEditingDesc(false); }} onBlur={commitDesc}
            placeholder="Descrição do dashboard…"
            style={{ width: '100%', height: 26, padding: '0 7px', marginBottom: 6, borderRadius: 6, border: '1px solid var(--ai)', outline: 'none', boxShadow: '0 0 0 3px color-mix(in srgb, var(--ai) 14%, transparent)', fontFamily: 'inherit', fontSize: 12, color: 'var(--color-text-primary)' }} />
        ) : (
          d.desc && <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 6, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.desc}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            <Icon name="clock" size={13} /> Editado {d.edited}
          </span>
          {shared
            ? <AvatarStack ids={d.members} size={22} />
            : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-text-tertiary)' }}><Icon name="activity" size={13} /> {d.charts} blocos</span>}
        </div>
      </div>
    </div>
  );
}

function WidgetMenu({ item, onAction, pinned }) {
  const [open, setOpen] = useStateLB(false);
  const ref = useRefLB(null);
  useEffectLB(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen((o) => !o)} title="Mais ações"
        style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: open ? 'var(--color-primary-light)' : 'transparent', color: open ? 'var(--color-primary)' : 'var(--color-text-tertiary)', transition: 'all 120ms ease' }}>
        <Icon name="more-horizontal" size={16} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 32, right: 0, zIndex: 45, minWidth: 188, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', padding: 5 }}>
          <CardMenuRow icon="message-square" label="Perguntar sobre" onClick={() => { setOpen(false); onAction('ask', item); }} />
          {pinned
            ? <CardMenuRow icon="pin" label="Remover da home" onClick={() => { setOpen(false); onAction('remove', item); }} />
            : <CardMenuRow icon="pin" label="Fixar na home" onClick={() => { setOpen(false); onAction('pin', item); }} />}
          <CardMenuRow icon="share-2" label="Compartilhar" onClick={() => { setOpen(false); onAction('share', item); }} />
          <div style={{ height: 1, background: 'var(--color-border)', margin: '5px 0' }} />
          <CardMenuRow icon="trash-2" label="Deletar" danger onClick={() => { setOpen(false); onAction('delete', item); }} />
        </div>
      )}
    </div>
  );
}

function CardMenuRow({ icon, label, danger, onClick, chevron, check }) {
  return (
    <button onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.background = danger ? 'var(--color-danger-bg)' : 'var(--color-bg-subtle)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 9px', border: 'none', background: 'transparent', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: danger ? 'var(--color-danger)' : 'var(--color-text-primary)', textAlign: 'left' }}>
      <Icon name={icon} size={15} />
      <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      {chevron && <Icon name="chevron-right" size={14} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />}
      {check && <Icon name="check" size={14} style={{ color: 'var(--ai-text)', flexShrink: 0 }} />}
    </button>
  );
}

// ---- saved dashboard (screen 9) -----------------------------------------
function SavedDashboardView({ density, openDash, onBack, onEdit, onKpiAction, homeKpis, onShare, sources, homeDashId, onPinDashHome, onUnpinDashHome }) {
  const name = openDash ? openDash.name : 'Comissionamento UGH Boaventura';
  const members = (openDash && openDash.members) || [];
  const shared = members.length > 0;
  const isHome = !!(openDash && openDash.home);
  const pinnedHome = isHome ? (!homeDashId || homeDashId === 'home') : !!(openDash && homeDashId === openDash.id);
  const srcMap = {}; (sources || DATA_SOURCES).forEach((s) => { srcMap[s.id] = s; });
  const sourceFor = (id) => srcMap[KPI_SOURCE[id]] || srcMap.cortex;
  return (
    <div style={{ height: '100%', overflowY: 'auto' }} className="sb-scroll">
      <div style={{ padding: '24px 32px 40px' }}>
        <PageHeader
          title={name}
          subtitle={(() => {
            const status = pinnedHome ? 'Fixado na home · atualizado em tempo real' : shared ? `Compartilhado com a equipe · ${members.length} ${members.length === 1 ? 'pessoa' : 'pessoas'}` : 'Atualizado automaticamente · última edição há 2 horas';
            const desc = openDash && openDash.desc;
            return desc ? `${desc} · ${status}` : status;
          })()}
          action={<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {shared && <AvatarStack ids={members} size={30} />}
            {pinnedHome ? (
              !isHome && <SecondaryBtn icon="pin" onClick={onUnpinDashHome}>Remover da home</SecondaryBtn>
            ) : (
              <SecondaryBtn icon="pin" onClick={() => onPinDashHome && onPinDashHome(isHome ? { id: 'home' } : openDash)}>Fixar na home</SecondaryBtn>
            )}
            {!isHome && <SecondaryBtn icon="share-2" onClick={onShare}>Compartilhar</SecondaryBtn>}
            <PrimaryBtn icon="pencil" onClick={onEdit}>Editar</PrimaryBtn>
          </div>}
        />
        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 22 }}>
          {[...KPIS, KPIS_EXTRA[0]].slice(0, 4).map((k) => <KpiCard key={k.id} kpi={k} density={density} onAction={onKpiAction} pinned={(homeKpis || []).includes(k.id)} source={sourceFor(k.id)} />)}
        </div>
        {/* charts grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginTop: 16 }}>
          <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 14, boxShadow: 'var(--shadow-sm)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Curva S de avanço acumulado</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Badge tone="info" dot>Em dia</Badge><WidgetMenu item={{ id: 'w-scurve', label: 'Curva S', widget: true }} onAction={onKpiAction} pinned={(homeKpis || []).includes('w-scurve')} /></div>
            </div>
            <SCurve height={230} />
          </div>
          <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 14, boxShadow: 'var(--shadow-sm)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Avanço por disciplina</span>
              <WidgetMenu item={{ id: 'w-disciplina', label: 'Avanço por disciplina', widget: true }} onAction={onKpiAction} />
            </div>
            <DisciplineBars />
          </div>
        </div>
        {/* table */}
        <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 14, boxShadow: 'var(--shadow-sm)', marginTop: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="boxes" size={18} style={{ color: 'var(--color-accent-text)' }} />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Ativos em comissionamento</span>
            <WidgetMenu item={{ id: 'w-ativos', label: 'Ativos em comissionamento', widget: true }} onAction={onKpiAction} />
          </div>
          <DataTable density={density} rows={ASSETS} columns={[
            { key: 'tag', label: 'TAG do ativo', render: (r) => <span className="font-mono" style={{ fontWeight: 500 }}>{r.tag}</span> },
            { key: 'type', label: 'Tipo', render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>{r.type}</span> },
            { key: 'area', label: 'Área', render: (r) => <span className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>{r.area}</span> },
            { key: 'prog', label: 'Avanço', render: (r) => <Progress value={r.prog} /> },
            { key: 'status', label: 'Status', render: (r) => <Badge tone={r.tone} dot>{r.status}</Badge> },
          ]} />
        </div>
      </div>
    </div>
  );
}

function DisciplineBars() {
  const data = [
    { label: 'Instrumentação', v: 88, tone: 'var(--color-primary)' },
    { label: 'Elétrica', v: 74, tone: 'var(--color-primary)' },
    { label: 'Mecânica', v: 92, tone: 'var(--color-success)' },
    { label: 'Tubulação', v: 61, tone: 'var(--color-warning)' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {data.map((d) => (
        <div key={d.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12.5 }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>{d.label}</span>
            <span className="font-mono" style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{d.v}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 9999, background: 'var(--color-bg-subtle)', overflow: 'hidden' }}>
            <div style={{ width: `${d.v}%`, height: '100%', background: d.tone, borderRadius: 9999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- shared bits ---------------------------------------------------------
function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0, flex: '1 1 auto' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.01em' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
function PrimaryBtn({ icon, children, onClick }) {
  const [h, setH] = useStateLB(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: '#fff', background: h ? 'var(--cta-dark)' : 'var(--cta)', boxShadow: 'var(--shadow-xs)', transition: 'background 120ms ease', whiteSpace: 'nowrap', flexShrink: 0 }}>
      {icon && <Icon name={icon} size={18} />}{children}
    </button>
  );
}

function SecondaryBtn({ icon, children, onClick }) {
  const [h, setH] = useStateLB(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 14px', borderRadius: 9, border: '1px solid var(--color-border-strong)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', background: h ? 'var(--color-bg-subtle)' : 'var(--color-bg-surface)', transition: 'background 120ms ease', whiteSpace: 'nowrap', flexShrink: 0 }}>
      {icon && <Icon name={icon} size={18} />}{children}
    </button>
  );
}

Object.assign(window, { DashboardLibrary, SavedDashboardView, PageHeader, PrimaryBtn, SecondaryBtn, Thumb, DisciplineBars, AvatarStack, GroupSection });
