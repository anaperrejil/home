// MERIS — modal de compartilhamento de chat
const { useState: useStateSH, useRef: useRefSH, useEffect: useEffectSH } = React;

const ACCESS_OPTS = [
  { id: 'pode-ver', label: 'Pode ver' },
  { id: 'pode-comentar', label: 'Pode comentar' },
  { id: 'pode-editar', label: 'Pode editar' },
];
const ACCESS_LABEL = { 'pode-ver': 'Pode ver', 'pode-comentar': 'Pode comentar', 'pode-editar': 'Pode editar' };

function Avatar({ user, size = 32 }) {
  const initials = user.name.split(' ').slice(0, 2).map((p) => p[0]).join('');
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: user.color || 'var(--ai)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600 }}>{initials}</span>
  );
}

function AccessSelect({ value, onChange, onRemove }) {
  const [open, setOpen] = useStateSH(false);
  const ref = useRefSH(null);
  useEffectSH(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen((o) => !o)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 9px', borderRadius: 7, border: '1px solid transparent', background: open ? 'var(--color-bg-subtle)' : 'transparent', color: 'var(--color-text-secondary)', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = 'var(--color-bg-subtle)'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent'; }}>
        {ACCESS_LABEL[value]} <Icon name="chevron-down" size={14} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 34, right: 0, zIndex: 60, minWidth: 184, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', padding: 5 }}>
          {ACCESS_OPTS.map((o) => (
            <button key={o.id} onClick={() => { setOpen(false); onChange(o.id); }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 9px', border: 'none', background: 'transparent', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: 'var(--color-text-primary)', textAlign: 'left' }}>
              <span style={{ width: 15, display: 'flex' }}>{value === o.id && <Icon name="check" size={14} style={{ color: 'var(--ai-text)' }} />}</span>
              {o.label}
            </button>
          ))}
          {onRemove && (
            <>
              <div style={{ height: 1, background: 'var(--color-border)', margin: '5px 0' }} />
              <button onClick={() => { setOpen(false); onRemove(); }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-danger-bg)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 9px', border: 'none', background: 'transparent', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: 'var(--color-danger)', textAlign: 'left' }}>
                <span style={{ width: 15, display: 'flex' }}><Icon name="x" size={14} /></span>Remover acesso
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// mode: 'chat' (compartilhar conversa) | 'card' (compartilhar card → novo chat) | 'dashboard' (compartilhar dashboard)
function ShareModal({ mode = 'chat', title, cardLabel, presetMembers, groupCount, onClose, onConfirm }) {
  const byId = {}; TEAM.forEach((u) => { byId[u.id] = u; });
  const meId = 'u-ana';
  // estado: lista de { userId, access }. Dono fixo.
  const initial = mode === 'chat'
    ? [{ userId: 'u-ana', access: 'dono' }, { userId: 'u-kalil', access: 'pode-editar' }, { userId: 'u-carlos', access: 'pode-comentar' }]
    : (mode === 'dashboard' || mode === 'group')
      ? [{ userId: 'u-ana', access: 'dono' }, ...((presetMembers || []).filter((id) => id !== 'u-ana').map((id) => ({ userId: id, access: 'pode-ver' })))]
      : [{ userId: 'u-ana', access: 'dono' }];
  const [members, setMembers] = useStateSH(initial);
  const [linkAccess, setLinkAccess] = useStateSH('pode-ver');
  const [linkOn, setLinkOn] = useStateSH(mode === 'chat');
  const [copied, setCopied] = useStateSH(false);
  const [query, setQuery] = useStateSH('');
  const [pickerOpen, setPickerOpen] = useStateSH(false);
  const pickerRef = useRefSH(null);

  useEffectSH(() => {
    if (!pickerOpen) return;
    const h = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false); };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [pickerOpen]);

  const memberIds = members.map((m) => m.userId);
  const candidates = TEAM.filter((u) => !memberIds.includes(u.id) && (u.name.toLowerCase().includes(query.toLowerCase()) || u.role.toLowerCase().includes(query.toLowerCase())));

  const addMember = (id) => { setMembers((m) => [...m, { userId: id, access: 'pode-comentar' }]); setQuery(''); setPickerOpen(false); };
  const setAccess = (id, access) => setMembers((m) => m.map((x) => x.userId === id ? { ...x, access } : x));
  const removeMember = (id) => setMembers((m) => m.filter((x) => x.userId !== id));

  const copyLink = () => { setCopied(true); setTimeout(() => setCopied(false), 1800); };

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onMouseDown={(e) => e.stopPropagation()} style={{ width: 'min(520px, 96vw)', background: 'var(--color-bg-surface)', borderRadius: 14, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '18px 20px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--ai-bg)', color: 'var(--ai-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="share-2" size={17} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>{mode === 'card' ? (cardLabel ? 'Criar chat sobre o indicador' : 'Criar chat compartilhado') : mode === 'dashboard' ? 'Compartilhar dashboard' : mode === 'group' ? 'Compartilhar grupo' : 'Compartilhar conversa'}</div>
            <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="x" size={17} /></button>
        </div>

        <div style={{ flex: 1, overflow: 'visible', padding: '16px 20px' }}>
          {mode === 'group' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 10, background: 'var(--ai-bg)', marginBottom: 16 }}>
              <Icon name="folder" size={16} style={{ color: 'var(--ai-text)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--ai-text)', lineHeight: 1.4 }}>Compartilha automaticamente <strong style={{ fontWeight: 600 }}>{groupCount} {groupCount === 1 ? 'dashboard' : 'dashboards'}</strong> deste grupo com as pessoas selecionadas. Dashboards adicionados depois herdam o acesso.</span>
            </div>
          )}
          {mode === 'card' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 10, background: 'var(--ai-bg)', marginBottom: 16 }}>
              <Icon name="message-square-plus" size={16} style={{ color: 'var(--ai-text)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--ai-text)', lineHeight: 1.4 }}>{cardLabel ? <>Inicia uma nova conversa sobre <strong style={{ fontWeight: 600 }}>{cardLabel}</strong> e compartilha com as pessoas selecionadas.</> : 'Inicia uma nova conversa compartilhada com as pessoas selecionadas. Mencione @meris para acionar o agente.'}</span>
            </div>
          )}

          {/* add people */}
          <div ref={pickerRef} style={{ position: 'relative', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, padding: '0 12px', borderRadius: 10, border: `1px solid ${pickerOpen ? 'var(--ai)' : 'var(--color-border)'}`, background: 'var(--color-bg-surface)', boxShadow: pickerOpen ? '0 0 0 3px color-mix(in srgb, var(--ai) 14%, transparent)' : 'none', transition: 'all 120ms ease' }}>
              <Icon name="user-plus" size={17} style={{ color: 'var(--color-text-tertiary)' }} />
              <input value={query} onChange={(e) => { setQuery(e.target.value); setPickerOpen(true); }} onFocus={() => setPickerOpen(true)}
                placeholder="Adicionar pessoas por nome ou e-mail"
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 14, color: 'var(--color-text-primary)' }} />
            </div>
            {pickerOpen && candidates.length > 0 && (
              <div className="sb-scroll" style={{ position: 'absolute', top: 46, left: 0, right: 0, zIndex: 60, maxHeight: 240, overflowY: 'auto', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', padding: 6 }}>
                {candidates.map((u) => (
                  <button key={u.id} onClick={() => addMember(u.id)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 9px', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                    <Avatar user={u} size={30} />
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: 'var(--color-text-primary)' }}>{u.name}</span>
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--color-text-tertiary)' }}>{u.role}</span>
                    </span>
                    <Icon name="plus" size={16} style={{ color: 'var(--ai-text)' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* members with access */}
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>Com acesso · {members.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {members.map((m) => {
              const u = byId[m.userId];
              const isOwner = m.access === 'dono';
              return (
                <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 0' }}>
                  <Avatar user={u} size={34} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: 'var(--color-text-primary)' }}>{u.name}{u.id === meId && <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}> (você)</span>}</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--color-text-tertiary)' }}>{u.email}</span>
                  </span>
                  {isOwner
                    ? <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)', fontWeight: 500, padding: '0 9px', flexShrink: 0 }}>Proprietária</span>
                    : <AccessSelect value={m.access} onChange={(a) => setAccess(m.userId, a)} onRemove={() => removeMember(m.userId)} />}
                </div>
              );
            })}
          </div>

          {/* link sharing */}
          <div style={{ marginTop: 18, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ width: 34, height: 34, borderRadius: '50%', background: linkOn ? 'var(--color-success-bg)' : 'var(--color-bg-subtle)', color: linkOn ? 'var(--color-success-text)' : 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={linkOn ? 'globe' : 'lock'} size={17} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: 'var(--color-text-primary)' }}>{linkOn ? 'Qualquer pessoa do projeto com o link' : 'Acesso restrito'}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--color-text-tertiary)' }}>{linkOn ? 'No UGH Boaventura' : 'Apenas pessoas adicionadas acima'}</span>
              </span>
              {linkOn && <AccessSelect value={linkAccess} onChange={setLinkAccess} />}
              <Toggle on={linkOn} onChange={() => setLinkOn((v) => !v)} />
            </div>
          </div>
        </div>

        {/* footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--color-border)' }}>
          {mode === 'card' ? (
            <>
              <button onClick={onClose}
                style={{ height: 38, padding: '0 14px', borderRadius: 9, border: '1px solid var(--color-border-strong)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => onConfirm({ members, linkOn, linkAccess })}
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 38, padding: '0 18px', borderRadius: 9, border: 'none', background: 'var(--cta)', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-xs)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cta-dark)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--cta)'}>
                <Icon name="message-square-plus" size={16} />Criar chat{members.length > 1 ? ` · ${members.length}` : ''}
              </button>
            </>
          ) : (
            <>
              <button onClick={copyLink} disabled={!linkOn}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 9, border: '1px solid var(--color-border-strong)', background: 'var(--color-bg-surface)', color: linkOn ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500, cursor: linkOn ? 'pointer' : 'default', opacity: linkOn ? 1 : 0.5 }}>
                <Icon name={copied ? 'check' : 'link-2'} size={16} style={copied ? { color: 'var(--color-success-text)' } : undefined} />{copied ? 'Link copiado' : 'Copiar link'}
              </button>
              <button onClick={() => onConfirm({ members, linkOn, linkAccess })}
                style={{ height: 38, padding: '0 18px', borderRadius: 9, border: 'none', background: 'var(--cta)', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-xs)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--cta-dark)'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--cta)'}>
                {(mode === 'dashboard' || mode === 'group') ? 'Compartilhar' : 'Concluir'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={onChange} role="switch" aria-checked={on}
      style={{ width: 40, height: 23, borderRadius: 9999, border: 'none', cursor: 'pointer', background: on ? 'var(--cta)' : 'var(--color-border-strong)', position: 'relative', flexShrink: 0, transition: 'background 120ms ease', padding: 0 }}>
      <span style={{ position: 'absolute', top: 2.5, left: on ? 19.5 : 2.5, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 140ms ease', boxShadow: 'var(--shadow-sm)' }} />
    </button>
  );
}

Object.assign(window, { ShareModal, Avatar });
