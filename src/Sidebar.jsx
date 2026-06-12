// MERIS Home — Claude-style sidebar. Expanded 260px / collapsed 64px rail.
const { useState: useStateSB, useRef: useRefSB, useEffect: useEffectSB } = React;

function NavItem({ icon, label, active, collapsed, onClick, accent, disabled, badge }) {
  const [hover, setHover] = useStateSB(false);
  const bg = active ? 'var(--ai-bg)' : (hover && !disabled) ? 'rgba(15,23,42,0.05)' : 'transparent';
  const color = disabled ? 'var(--color-text-tertiary)' : active ? 'var(--ai-text)' : 'var(--color-text-secondary)';
  return (
    <button
      onClick={disabled ? undefined : onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      title={collapsed ? label : (disabled ? 'Em breve' : undefined)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: collapsed ? '0' : '0 10px', height: 34,
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: bg, color, border: 'none', borderRadius: 8,
        cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 14,
        fontWeight: active ? 600 : 500, transition: 'background 120ms ease',
        textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', opacity: disabled ? 0.55 : 1,
      }}
    >
      <Icon name={icon} size={18} />
      {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{label}</span>}
      {!collapsed && badge && <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', background: 'var(--color-danger)', borderRadius: 9999, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{badge}</span>}
      {!collapsed && active && accent}
    </button>
  );
}

function ChatRow({ title, collapsed, active, onClick, onRename, onDelete, onShare, onFav, fav, concluded }) {
  const [hover, setHover] = useStateSB(false);
  const [menuOpen, setMenuOpen] = useStateSB(false);
  const [confirming, setConfirming] = useStateSB(false);
  const [editing, setEditing] = useStateSB(false);
  const [draft, setDraft] = useStateSB(title);
  const rowRef = useRefSB(null);
  const inputRef = useRefSB(null);

  useEffectSB(() => {
    if (!menuOpen && !confirming) return;
    const h = (e) => { if (rowRef.current && !rowRef.current.contains(e.target)) { setMenuOpen(false); setConfirming(false); } };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [menuOpen, confirming]);

  useEffectSB(() => { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [editing]);

  if (collapsed) return null;

  const startRename = () => { setMenuOpen(false); setDraft(title); setEditing(true); };
  const commit = () => { const v = draft.trim(); if (v && v !== title) onRename(v); setEditing(false); };

  if (editing) {
    return (
      <div ref={rowRef} style={{ padding: '0 4px' }}>
        <input
          ref={inputRef} value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); else if (e.key === 'Escape') setEditing(false); }}
          onBlur={commit}
          style={{ width: '100%', height: 30, padding: '0 8px', borderRadius: 7, border: '1px solid var(--ai)', outline: 'none', boxShadow: '0 0 0 3px color-mix(in srgb, var(--ai) 16%, transparent)', fontFamily: 'inherit', fontSize: 13.5, color: 'var(--color-text-primary)', background: 'var(--color-bg-surface)' }}
        />
      </div>
    );
  }

  return (
    <div ref={rowRef} style={{ position: 'relative' }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); }}>
      <button
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left',
          padding: '0 6px 0 10px', height: 30,
          background: active ? 'var(--ai-bg)' : (hover || menuOpen) ? 'rgba(15,23,42,0.05)' : 'transparent',
          color: active ? 'var(--ai-text)' : 'var(--color-text-secondary)',
          border: 'none', borderRadius: 7, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 13.5, fontWeight: active ? 500 : 400,
          transition: 'background 120ms ease',
        }}
      >
        <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        {(hover || menuOpen) && (
          <span
            role="button" tabIndex={0} title="Mais ações"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); setConfirming(false); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, flexShrink: 0, marginLeft: 4, color: 'var(--color-text-tertiary)', background: menuOpen ? 'rgba(15,23,42,0.08)' : 'transparent' }}
          >
            <Icon name="more-horizontal" size={15} />
          </span>
        )}
      </button>

      {menuOpen && !confirming && (
        <div style={{ position: 'absolute', top: 30, right: 4, zIndex: 50, minWidth: 168, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', padding: 5 }}>
          <MenuRow icon="star" label={fav ? 'Remover dos favoritos' : 'Favoritar'} onClick={() => { setMenuOpen(false); onFav && onFav(); }} />
          <MenuRow icon="share-2" label="Compartilhar" onClick={() => { setMenuOpen(false); onShare && onShare(); }} />
          <MenuRow icon="pencil" label="Renomear" onClick={startRename} />
          <MenuRow icon="trash-2" label="Excluir" danger onClick={() => setConfirming(true)} />
        </div>
      )}

      {confirming && (
        <div style={{ position: 'absolute', top: 30, right: 4, zIndex: 50, width: 232, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', padding: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Excluir conversa?</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.45, marginBottom: 10 }}>Esta ação não pode ser desfeita.</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { setConfirming(false); setMenuOpen(false); }}
              style={{ height: 30, padding: '0 12px', borderRadius: 7, border: '1px solid var(--color-border-strong)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={() => { setConfirming(false); setMenuOpen(false); onDelete(); }}
              style={{ height: 30, padding: '0 12px', borderRadius: 7, border: 'none', background: 'var(--color-danger)', color: '#fff', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Excluir</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuRow({ icon, label, danger, onClick }) {
  return (
    <button onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.background = danger ? 'var(--color-danger-bg)' : 'var(--color-bg-subtle)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 9px', border: 'none', background: 'transparent', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: danger ? 'var(--color-danger)' : 'var(--color-text-primary)', textAlign: 'left' }}>
      <Icon name={icon} size={15} />{label}
    </button>
  );
}

// ---- primeiro nível: rail de módulos do MERIS -----------------------------
const MODULES = [
  { id: 'home',     icon: 'home',      label: 'Home' },
  { id: 'ged',      icon: 'folder',    label: 'GED Documentos' },
  { id: 'eng',      icon: 'network',   label: 'Engenharia' },
  { id: 'comm',     icon: 'hard-hat',  label: 'Comissionamento' },
  { id: 'plan',     icon: 'table',     label: 'Planejamento 6WLA' },
  { id: 'gestao',   icon: 'gauge',     label: 'Gestão' },
  { id: 'viewer',   icon: 'boxes',     label: 'Viewer 3D' },
  { id: 'rel',      icon: 'file-text', label: 'Relatórios' },
];

function RailBtn({ icon, label, active, onClick, size = 19 }) {
  const [h, setHover] = useStateSB(false);
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
      <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{
          width: 38, height: 38, borderRadius: 9, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: active ? 'var(--ai-bg)' : h ? 'var(--color-bg-subtle)' : 'transparent',
          color: active ? 'var(--ai-text)' : 'var(--color-text-tertiary)',
          transition: 'background 120ms ease, color 120ms ease',
        }}>
        <Icon name={icon} size={size} />
      </button>
      {h && (
        <span style={{ position: 'absolute', left: 'calc(100% + 10px)', top: '50%', transform: 'translateY(-50%)', zIndex: 90, padding: '5px 10px', borderRadius: 7, background: 'var(--color-text-primary)', color: '#fff', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', boxShadow: 'var(--shadow-md)', pointerEvents: 'none' }}>{label}</span>
      )}
    </div>
  );
}

function ModuleRail({ activeModule = 'home', onHome, onModule }) {
  return (
    <nav style={{
      width: 56, flexShrink: 0, height: '100%', overflow: 'visible',
      background: 'var(--color-bg-surface)', borderRight: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 12px', gap: 4,
    }}>
      <div style={{ marginBottom: 10 }}><MerisMark size={32} radius={8} /></div>
      {MODULES.map((m) => (
        <RailBtn key={m.id} icon={m.icon} label={m.label} active={activeModule === m.id}
          onClick={() => (m.id === 'home' ? onHome() : onModule(m))} />
      ))}
      <div style={{ flex: 1 }} />
      <RailBtn icon="life-buoy" label="Suporte" onClick={() => onModule({ id: 'suporte', label: 'Suporte' })} />
      <RailBtn icon="help-circle" label="Ajuda" onClick={() => onModule({ id: 'ajuda', label: 'Ajuda' })} />
      <RailBtn icon="settings" label="Configurações" onClick={() => onModule({ id: 'config', label: 'Configurações' })} />
      <div title="Ana Beatriz · Gestora de projeto" style={{ marginTop: 6, width: 32, height: 32, borderRadius: '50%', background: 'var(--ai)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, cursor: 'default' }}>AB</div>
    </nav>
  );
}

function Sidebar({ collapsed, onToggle, activeNav, onNav, activeChat, onSelectChat, chats, onRenameChat, onDeleteChat, onShareChat, onFavChat, sourceAlert }) {
  const [query, setQuery] = useStateSB('');
  const q = query.trim().toLowerCase();
  const filtered = {};
  let totalMatches = 0;
  Object.entries(chats).forEach(([group, list]) => {
    const m = q ? list.filter((c) => c.title.toLowerCase().includes(q)) : list;
    filtered[group] = m; totalMatches += m.length;
  });
  return (
    <aside style={{
      width: collapsed ? 64 : 260, flexShrink: 0,
      background: 'var(--color-bg-surface)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 160ms ease', height: '100%', overflow: 'hidden',
    }}>
      {/* Header: Início + toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', height: 56, flexShrink: 0,
        padding: collapsed ? 0 : '0 12px 0 16px',
        justifyContent: collapsed ? 'center' : 'space-between',
      }}>
        {!collapsed && (
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--color-text-primary)' }}>Início</span>
        )}
        <IconBtn name={collapsed ? 'panel-left' : 'panel-left-close'} onClick={onToggle} title={collapsed ? 'Expandir' : 'Recolher'} />
      </div>

      {/* Scrollable nav */}
      <div className="sb-scroll" style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '4px 12px' : '4px 12px 12px' }}>
        {!collapsed && <SectionLabel>Workspace</SectionLabel>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavItem icon="home" label="Home" collapsed={collapsed} active={activeNav === 'home'} onClick={() => onNav('home')} />
          <NavItem icon="layout-dashboard" label="Meus dashboards" collapsed={collapsed} active={activeNav === 'dashboards'} onClick={() => onNav('dashboards')} />
          <NavItem icon="users" label="Chats compartilhados" collapsed={collapsed} active={activeNav === 'shared'} onClick={() => onNav('shared')} />
          <NavItem icon="gauge" label="Central de controle" collapsed={collapsed} active={activeNav === 'sources'} onClick={() => onNav('sources')} />
        </div>

        <div style={{ height: 1, background: 'var(--color-border)', margin: '14px 2px 12px' }} />

        {!collapsed && <SectionLabel>Seus chats</SectionLabel>}

        <div style={{ display: 'flex', justifyContent: collapsed ? 'center' : 'stretch' }}>
          <button
            onClick={() => onNav('new-chat')}
            title={collapsed ? 'Novo chat' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              justifyContent: collapsed ? 'center' : 'flex-start',
              width: collapsed ? 40 : '100%', height: 34, padding: collapsed ? 0 : '0 10px',
              background: 'transparent', color: 'var(--color-text-secondary)',
              border: 'none',
              borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 14, fontWeight: 500,
              transition: 'background 120ms ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(15,23,42,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Icon name="plus" size={18} />
            {!collapsed && <span>Novo chat</span>}
          </button>
        </div>

        {!collapsed && (
          <div style={{ padding: '10px 0 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 11px', borderRadius: 9, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
              <Icon name="search" size={15} style={{ color: 'var(--color-text-tertiary)' }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar conversa…" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13, color: 'var(--color-text-primary)' }} />
              {query && (
                <button onClick={() => setQuery('')} title="Limpar" style={{ width: 18, height: 18, border: 'none', borderRadius: 5, cursor: 'pointer', background: 'transparent', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
                  <Icon name="x" size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        {!collapsed && (
          <>
            {q && totalMatches === 0 && (
              <div style={{ marginTop: 18, padding: '0 10px', fontSize: 12.5, color: 'var(--color-text-tertiary)' }}>Nenhuma conversa encontrada para “{query.trim()}”.</div>
            )}
            {(() => {
              const favs = [];
              const rest = {};
              Object.entries(filtered).forEach(([g, list]) => {
                list.forEach((c) => { if (c.fav) favs.push(c); });
                rest[g] = list.filter((c) => !c.fav);
              });
              const renderRow = (c) => (
                <ChatRow key={c.id} title={c.title} active={activeChat === c.id} concluded={c.concluded} fav={c.fav} onClick={() => onSelectChat(c.id)} onRename={(t) => onRenameChat(c.id, t)} onDelete={() => onDeleteChat(c.id)} onShare={() => onShareChat && onShareChat(c.id)} onFav={() => onFavChat && onFavChat(c.id)} />
              );
              return (
                <>
                  {favs.length > 0 && (
                    <div style={{ marginTop: 18 }}>
                      <SectionLabel plain>Favoritos</SectionLabel>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{favs.map(renderRow)}</div>
                    </div>
                  )}
                  {Object.entries(rest).map(([group, list]) => list.length > 0 && (
                    <div key={group} style={{ marginTop: 18 }}>
                      <SectionLabel plain>{group}</SectionLabel>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{list.map(renderRow)}</div>
                    </div>
                  ))}
                </>
              );
            })()}
          </>
        )}
        {collapsed && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <NavItem icon="message-square" label="Chats recentes" collapsed onClick={() => onNav('home')} />
          </div>
        )}
      </div>
    </aside>
  );
}

function SectionLabel({ children, plain }) {
  return (
    <div style={{
      fontSize: plain ? 12 : 11, fontWeight: 600, letterSpacing: plain ? 0 : '0.06em', textTransform: plain ? 'none' : 'uppercase',
      color: 'var(--color-text-tertiary)', padding: '0 10px', marginBottom: 6, userSelect: 'none',
    }}>{children}</div>
  );
}

function IconBtn({ name, onClick, title, size = 18 }) {
  const [hover, setHover] = useStateSB(false);
  return (
    <button
      onClick={onClick} title={title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hover ? 'rgba(15,23,42,0.06)' : 'transparent', border: 'none',
        borderRadius: 8, cursor: 'pointer', color: 'var(--color-text-secondary)',
        transition: 'background 120ms ease', flexShrink: 0,
      }}
    ><Icon name={name} size={size} /></button>
  );
}

Object.assign(window, { Sidebar, NavItem, SectionLabel, IconBtn, ModuleRail });
