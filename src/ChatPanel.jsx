// MERIS Home — conversational chat panel (welcome + thread + composer)
const { useState: useStateCP, useRef: useRefCP, useEffect: useEffectCP } = React;

function greetingLabel() {
  const h = new Date().getHours();
  if (h < 5) return 'Boa madrugada';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}
function dateLabel() {
  const d = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return d.replace(/-feira/, '-feira').replace(' de ', ', ').toUpperCase();
}
function StarterCard({ starter, onClick }) {
  const [h, setH] = useStateCP(false);
  const tones = {
    info: ['var(--color-info-bg)', 'var(--color-info-text)'],
    discovery: ['var(--color-discovery-bg)', 'var(--color-discovery-text)'],
    success: ['var(--color-success-bg)', 'var(--color-success-text)'],
    warning: ['var(--color-warning-bg)', 'var(--color-warning-text)'],
  };
  const [bg, fg] = ['var(--color-info-bg)', 'var(--color-info-text)'];
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 11, textAlign: 'left', padding: '13px 14px', background: 'var(--color-bg-surface)', cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${h ? 'var(--ai)' : 'var(--color-border)'}`, borderRadius: 12, boxShadow: h ? 'var(--shadow-md)' : 'var(--shadow-sm)', transition: 'all 120ms ease', width: '100%' }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={starter.icon} size={18} /></span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2, lineHeight: 1.3 }}>{starter.title}</span>
        <span style={{ display: 'block', fontSize: 12.5, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{starter.desc}</span>
      </span>
    </button>
  );
}

function SkillCard({ skill, onClick, density }) {
  const [h, setH] = useStateCP(false);
  return (
    <button
      onClick={() => onClick(skill)}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 11, textAlign: 'left',
        padding: density === 'compact' ? '12px 13px' : '14px 15px',
        background: 'var(--color-bg-surface)', cursor: 'pointer', fontFamily: 'inherit',
        border: `1px solid ${h ? 'var(--ai)' : 'var(--color-border)'}`, borderRadius: 12,
        boxShadow: h ? 'var(--shadow-md)' : 'var(--shadow-sm)', transition: 'all 120ms ease', width: '100%',
      }}
    >
      <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--ai-bg)', color: 'var(--ai-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={skill.icon} size={18} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>{skill.title}</span>
        <span style={{ display: 'block', fontSize: 12.5, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{skill.desc}</span>
      </span>
    </button>
  );
}

function Composer({ onSend, density, placeholder = 'Pergunte ao MERIS ou descreva um painel para gerar…', markRef, onClearMark, onQuickAction, onSkill, onConnect }) {
  const [val, setVal] = useStateCP('');
  const [attachments, setAttachments] = useStateCP([]);
  const [gedOpen, setGedOpen] = useStateCP(false);
  const [dataSource, setDataSource] = useStateCP(null); // null = Automático (o agente escolhe)
  const taRef = useRefCP(null);
  const fileRef = useRefCP(null);
  const submit = () => {
    const v = val.trim();
    if (!v && !attachments.length) return;
    onSend(v || 'Analisar os arquivos anexados', attachments.length ? attachments : null);
    setVal(''); setAttachments([]);
    if (taRef.current) taRef.current.style.height = 'auto';
  };
  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } };
  const grow = (e) => { setVal(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'; };
  useEffectCP(() => { if (markRef && taRef.current) taRef.current.focus(); }, [markRef]);

  const addAttachment = (att) => setAttachments((a) => a.some((x) => x.id === att.id) ? a : [...a, att]);
  const removeAttachment = (id) => setAttachments((a) => a.filter((x) => x.id !== id));
  const onFiles = (e) => {
    const files = [...(e.target.files || [])];
    files.forEach((f) => addAttachment({ id: 'local-' + f.name + f.size, name: f.name, source: 'local', size: humanSize(f.size) }));
    e.target.value = '';
  };

  return (
    <div style={{
      border: `1px solid ${markRef ? 'var(--ai)' : 'var(--color-border)'}`, borderRadius: 16, background: 'var(--color-bg-surface)',
      boxShadow: 'var(--shadow-md)', padding: markRef || attachments.length ? '8px 10px' : '10px 10px 8px 14px',
      display: 'flex', flexDirection: 'column', gap: 6, transition: 'border-color 120ms ease',
    }}>
      {markRef && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px 6px 11px', borderRadius: 10, background: 'var(--ai-bg)', marginBottom: 2 }}>
          <Icon name="message-square-plus" size={15} style={{ color: 'var(--ai-text)' }} />
          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--ai-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Comentando: {markRef.label}</span>
          <button onClick={onClearMark} title="Remover marcação" style={{ width: 22, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--ai-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={14} />
          </button>
        </div>
      )}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '2px 2px 4px' }}>
          {attachments.map((a) => <AttachmentChip key={a.id} att={a} onRemove={() => removeAttachment(a.id)} />)}
        </div>
      )}
      <textarea
        ref={taRef} value={val} onChange={grow} onKeyDown={onKey} rows={1} maxLength={4000}
        placeholder={markRef ? `Comente sobre ${markRef.label}…` : placeholder}
        style={{
          border: 'none', outline: 'none', resize: 'none', width: '100%', background: 'transparent',
          fontFamily: 'inherit', fontSize: 14.5, lineHeight: 1.5, color: 'var(--color-text-primary)',
          maxHeight: 140, padding: markRef || attachments.length ? '2px 4px' : '4px 0',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 0 }}>
          <AttachMenu onPickGed={() => setGedOpen(true)} onPickLocal={() => fileRef.current && fileRef.current.click()} />
          <SkillsChip onSkill={onSkill} />
          <SourceChip selected={dataSource} onSelect={setDataSource} onConnect={onConnect} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)' }}>{val.length} / 4000</span>
          <button
            onClick={submit} title="Enviar"
            style={{
              width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: (val.trim() || attachments.length) ? 'var(--cta)' : 'var(--color-bg-subtle)',
              color: (val.trim() || attachments.length) ? '#fff' : 'var(--color-text-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 120ms ease',
            }}
          ><Icon name="arrow-up" size={18} /></button>
        </div>
      </div>
      <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={onFiles} />
      {gedOpen && <GedPicker onClose={() => setGedOpen(false)} onSelect={(f) => { addAttachment({ id: f.id, name: f.name, source: 'ged', meta: f.disc + ' · Rev. ' + f.rev }); setGedOpen(false); }} />}
    </div>
  );
}

function humanSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';
}

function AttachmentChip({ att, onRemove }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 6px 5px 9px', borderRadius: 9, background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', maxWidth: 240 }}>
      <Icon name={att.source === 'ged' ? 'database' : 'file-text'} size={14} style={{ color: att.source === 'ged' ? 'var(--ai-text)' : 'var(--color-text-tertiary)', flexShrink: 0 }} />
      <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.name}</span>
        {(att.meta || att.size) && <span style={{ fontSize: 10.5, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.meta || att.size}</span>}
      </span>
      <button onClick={onRemove} title="Remover anexo" style={{ width: 18, height: 18, borderRadius: 5, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="x" size={13} />
      </button>
    </span>
  );
}

function AttachMenu({ onPickGed, onPickLocal }) {
  const [open, setOpen] = useStateCP(false);
  const ref = useRefCP(null);
  useEffectCP(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [open]);
  const opt = (icon, title, desc, onClick) => (
    <button onClick={() => { setOpen(false); onClick(); }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', border: 'none', background: 'transparent', borderRadius: 9, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
      <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={16} /></span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</span>
        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--color-text-tertiary)' }}>{desc}</span>
      </span>
    </button>
  );
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <QuickChip icon="paperclip" label="Anexar" onClick={() => setOpen((o) => !o)} />
      {open && (
        <div style={{ position: 'absolute', bottom: 40, left: 0, zIndex: 40, width: 268, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', padding: 6 }}>
          {opt('database', 'Do GED', 'Documentos do projeto', onPickGed)}
          {opt('upload', 'Do meu computador', 'Enviar um arquivo local', onPickLocal)}
        </div>
      )}
    </div>
  );
}

function GedPicker({ onClose, onSelect }) {
  const [q, setQ] = useStateCP('');
  const list = GED_FILES.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()) || f.disc.toLowerCase().includes(q.toLowerCase()));
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onMouseDown={(e) => e.stopPropagation()} style={{ width: 'min(560px, 96vw)', maxHeight: '80vh', background: 'var(--color-bg-surface)', borderRadius: 14, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--ai-bg)', color: 'var(--ai-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="database" size={16} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>Anexar do GED</div>
            <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)' }}>Selecionar documento do projeto</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={17} /></button>
        </div>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 12px', borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
            <Icon name="search" size={16} style={{ color: 'var(--color-text-tertiary)' }} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou disciplina…"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13.5, color: 'var(--color-text-primary)' }} />
          </div>
        </div>
        <div className="sb-scroll" style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {list.length === 0 && <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: 'var(--color-text-tertiary)' }}>Nenhum documento encontrado</div>}
          {list.map((f) => (
            <button key={f.id} onClick={() => onSelect(f)}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', borderRadius: 9, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
              <Icon name="file-text" size={18} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="font-mono" style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--color-text-tertiary)' }}>{f.disc} · Rev. {f.rev} · {f.size} · {f.date}</span>
              </span>
              <Icon name="plus" size={16} style={{ color: 'var(--ai-text)', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
function ComposerIcon({ name, title }) {
  const [h, setH] = useStateCP(false);
  return (
    <button title={title} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: h ? 'var(--color-bg-subtle)' : 'transparent', color: 'var(--color-text-tertiary)', transition: 'background 120ms ease' }}>
      <Icon name={name} size={17} />
    </button>
  );
}

function QuickChip({ icon, label, onClick }) {
  const [h, setH] = useStateCP(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 11px', borderRadius: 8, border: `1px solid ${h ? 'var(--ai)' : 'var(--color-border)'}`, background: h ? 'var(--ai-bg)' : 'var(--color-bg-surface)', color: h ? 'var(--ai-text)' : 'var(--color-text-secondary)', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', transition: 'all 120ms ease', whiteSpace: 'nowrap' }}>
      <Icon name={icon} size={15} />{label}
    </button>
  );
}

function SkillsChip({ onSkill }) {
  const [open, setOpen] = useStateCP(false);
  const ref = useRefCP(null);
  useEffectCP(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <QuickChip icon="sparkles" label="Skills" onClick={() => setOpen((o) => !o)} />
      {open && (
        <div style={{ position: 'absolute', bottom: 40, left: 0, zIndex: 40, width: 290, maxHeight: 340, overflowY: 'auto', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', padding: 6 }} className="sb-scroll">
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', padding: '6px 8px 4px' }}>Skills sugeridas</div>
          {SUGGESTED_SKILLS.map((s) => (
            <button key={s.id} onClick={() => { setOpen(false); onSkill && onSkill(s); }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', padding: '9px 10px', border: 'none', background: 'transparent', borderRadius: 9, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={s.icon} size={15} /></span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{s.title}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.35 }}>{s.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Seletor de fonte de dados do chat: "Automático" (o agente escolhe) ou uma fonte específica
function SourceChip({ selected, onSelect, onConnect }) {
  const [open, setOpen] = useStateCP(false);
  const [pos, setPos] = useStateCP(null); // { left, top|bottom } em coordenadas de viewport (fixed)
  const ref = useRefCP(null);
  const btnRef = useRefCP(null);
  useEffectCP(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [open]);
  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const spaceAbove = r.top;
      // abre para cima se couber, senão para baixo — sempre em coordenadas fixas (sem clipping)
      if (spaceAbove > 380) setPos({ left: r.left, bottom: window.innerHeight - r.top + 8 });
      else setPos({ left: r.left, top: r.bottom + 8 });
    }
    setOpen((o) => !o);
  };
  const list = (typeof DATA_SOURCES !== 'undefined' ? DATA_SOURCES : []);
  const label = selected ? selected.name : 'Automático';
  const row = (icon, title, desc, isOn, onClick) => (
    <button onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'} onMouseLeave={(e) => e.currentTarget.style.background = isOn ? 'var(--ai-bg)' : 'transparent'}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', border: 'none', background: isOn ? 'var(--ai-bg)' : 'transparent', borderRadius: 9, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
      <span style={{ width: 28, height: 28, borderRadius: 8, background: isOn ? 'var(--ai-bg)' : 'var(--color-bg-subtle)', color: isOn ? 'var(--ai-text)' : 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={15} /></span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        {desc && <span style={{ display: 'block', fontSize: 11.5, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{desc}</span>}
      </span>
      {isOn && <Icon name="check" size={15} style={{ color: 'var(--ai-text)', flexShrink: 0 }} />}
    </button>
  );
  return (
    <div style={{ position: 'relative' }}>
      <button ref={btnRef} onClick={toggle}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px', borderRadius: 8, border: `1px solid ${selected ? 'var(--ai)' : 'var(--color-border)'}`, background: selected ? 'var(--ai-bg)' : 'var(--color-bg-surface)', color: selected ? 'var(--ai-text)' : 'var(--color-text-secondary)', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', transition: 'all 120ms ease', whiteSpace: 'nowrap', maxWidth: 220 }}>
        <Icon name={selected ? (selected.icon || 'database') : 'database'} size={15} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Fonte: {label}</span>
        <Icon name="chevron-down" size={14} style={{ opacity: 0.7, flexShrink: 0 }} />
      </button>
      {open && pos && (
        <div ref={ref} style={{ position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom, zIndex: 90, width: 320, maxHeight: 360, overflowY: 'auto', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', padding: 6 }} className="sb-scroll">
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', padding: '6px 8px 4px' }}>Fonte de dados</div>
          {row('sparkles', 'Automático', 'O agente escolhe a fonte que melhor responde', !selected, () => { onSelect(null); setOpen(false); })}
          <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 8px' }} />
          {list.map((s) => row(s.icon || 'database', s.name, s.system, selected && selected.id === s.id, () => { onSelect(s); setOpen(false); }))}
        </div>
      )}
    </div>
  );
}

function TagChip({ part, active, onTagClick }) {
  const [h, setH] = useStateCP(false);
  const label = part.tag;
  // SLA chip: amber/red, no cube, not navigable
  if (part.sla) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 8px', borderRadius: 9999, background: 'var(--color-warning-bg)', color: 'var(--color-warning-text)', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'baseline' }}>
        <Icon name="alert-triangle" size={11} />{label}
      </span>
    );
  }
  const isDoc = part.kind === 'doc';
  const tip = isDoc ? 'Abrir documento' : 'Ver no 3D';
  return (
    <span style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'baseline' }}>
      <button
        onClick={() => onTagClick && onTagClick(part)}
        onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 8px', borderRadius: 9999,
          background: active ? 'var(--ai)' : 'var(--ai-bg)', color: active ? '#fff' : 'var(--ai-text)',
          border: active ? '1px solid var(--ai)' : '1px solid color-mix(in srgb, var(--ai) 28%, transparent)',
          fontSize: 12.5, fontWeight: active ? 600 : 500, fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap', cursor: 'pointer', transition: 'background 120ms ease, color 120ms ease',
          boxShadow: active ? '0 0 0 3px color-mix(in srgb, var(--ai) 18%, transparent)' : 'none',
        }}>
        <Icon name={isDoc ? 'file-text' : 'boxes'} size={11} />{label}
      </button>
      {h && (
        <span style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', zIndex: 30, padding: '4px 8px', borderRadius: 6, background: 'var(--color-text-primary)', color: '#fff', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', boxShadow: 'var(--shadow-md)', pointerEvents: 'none' }}>{tip}</span>
      )}
    </span>
  );
}

function RefCard({ title }) {
  return (
    <div style={{ borderLeft: '2px solid var(--ai)', background: 'var(--color-bg-subtle)', borderRadius: 8, padding: '9px 12px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: 3 }}>Referência</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{title}</div>
    </div>
  );
}

// Checklist of information the user must provide for the agent to act.
function Checklist({ title, items }) {
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {title && <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {(items || []).map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
            <span style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${it.done ? 'var(--color-success)' : 'var(--color-border-strong)'}`, background: it.done ? 'var(--color-success)' : 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{it.done && <Icon name="check" size={12} />}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>{it.label}</span>
              {it.hint && <span style={{ display: 'block', fontSize: 11.5, color: it.done ? 'var(--color-text-tertiary)' : 'var(--color-warning-text)', marginTop: 1 }}>{it.hint}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Interactive "Base de dados" selector — reflects each source's healthcheck.
function DbField({ value = 'cortex', onAction }) {
  const [open, setOpen] = useStateCP(false);
  const [sel, setSel] = useStateCP(value);
  const [requested, setRequested] = useStateCP(false);
  const ref = useRefCP(null);
  useEffectCP(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [open]);
  const src = SOURCE_BY_ID[sel] || SOURCE_BY_ID.cortex;
  const status = requested ? 'pending' : src.status;
  const st = SOURCE_STATUS[status];
  const canRequest = status === 'down' && src.kind === 'software';
  const subtitle = status === 'ok' ? `Conectada · sincronizada ${src.sync && src.sync !== '—' ? src.sync : 'agora'}`
    : status === 'pending' ? 'Solicitada · aguardando conexão pela equipe'
    : status === 'stale' ? `Desatualizada · última sincronização ${src.sync}`
    : status === 'down' ? (src.kind === 'software' ? 'Integração de software · conexão feita pela equipe' : 'Não conectada')
    : st.label;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>Base de dados</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div ref={ref} style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
          <button onClick={() => setOpen((o) => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', height: 38, padding: '0 11px', borderRadius: 9, border: '1px solid var(--color-border-strong)', background: 'var(--color-bg-surface)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
            <Icon name={src.icon} size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{src.name}</span>
            <SourceDot status={status} />
            <Icon name="chevron-down" size={15} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
          </button>
          {open && (
            <div style={{ position: 'absolute', top: 42, left: 0, right: 0, zIndex: 50, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', padding: 5, maxHeight: 260, overflowY: 'auto' }} className="sb-scroll">
              {DATA_SOURCES.map((s) => (
                <button key={s.id} onClick={() => { setSel(s.id); setOpen(false); }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 9px', border: 'none', background: 'transparent', borderRadius: 7, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <Icon name={s.icon} size={15} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--color-text-tertiary)' }}>{s.system} · {SOURCE_STATUS[s.id === sel && requested ? 'pending' : s.status].label}</span>
                  </span>
                  <SourceDot status={s.id === sel && requested ? 'pending' : s.status} />
                </button>
              ))}
            </div>
          )}
        </div>
        {canRequest && (
          <button onClick={() => { setRequested(true); onAction && onAction('request-' + src.id); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 13px', borderRadius: 9, border: 'none', background: 'var(--cta)', color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
            <Icon name="user-plus" size={15} />Solicitar conexão
          </button>
        )}
        {status === 'pending' && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 13px', borderRadius: 9, background: 'var(--color-info-bg)', color: 'var(--color-info-text)', fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>
            <Icon name="check" size={15} />Solicitada
          </span>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: status === 'stale' ? 'var(--color-warning-text)' : 'var(--color-text-tertiary)' }}>
        {subtitle}
      </div>
    </div>
  );
}

// Callout — e.g. "Sei fazer, mas falta a base de dados".
function Callout({ tone = 'warning', icon, title, text, action, onAction }) {
  const map = {
    warning: ['var(--color-warning-bg)', 'var(--color-warning-text)'],
    danger:  ['var(--color-danger-bg)',  'var(--color-danger-text)'],
    info:    ['var(--color-info-bg)',    'var(--color-info-text)'],
  };
  const [bg, fg] = map[tone] || map.warning;
  return (
    <div style={{ border: `1px solid color-mix(in srgb, ${fg} 28%, transparent)`, background: bg, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 11 }}>
      <Icon name={icon || 'alert-triangle'} size={18} style={{ color: fg, flexShrink: 0, marginTop: 1 }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        {title && <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 3 }}>{title}</div>}
        {text && <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>{text}</div>}
        {action && (
          <button onClick={() => onAction && onAction(action.kind)}
            style={{ marginTop: 11, display: 'inline-flex', alignItems: 'center', gap: 7, height: 34, padding: '0 13px', borderRadius: 8, border: 'none', background: fg, color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Icon name={action.icon || 'database'} size={15} />{action.label}
          </button>
        )}
      </div>
    </div>
  );
}

// Snapshot do item citado (KPI ou widget) renderizado dentro do chat.
function KpiSnapshot({ id, widget, label }) {
  const kpi = !widget && [...KPIS, ...KPIS_EXTRA].find((k) => k.id === id);
  const source = kpi ? (SOURCE_BY_ID[KPI_SOURCE[kpi.id]] || SOURCE_BY_ID.cortex) : null;
  return (
    <div style={{ maxWidth: 300 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: 7 }}>
        <Icon name="maximize-2" size={12} /> Snapshot citado
      </div>
      {kpi ? (
        <KpiCard kpi={kpi} density="compact" source={source} />
      ) : widget && id === 'w-scurve' ? (
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: '12px 12px 6px', background: 'var(--color-bg-surface)' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>{label}</div>
          <SCurve height={120} showLegend={false} />
        </div>
      ) : widget && id === 'w-disciplina' ? (
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 14, background: 'var(--color-bg-surface)' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 10 }}>{label}</div>
          <DisciplineBars />
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--color-border)', borderRadius: 12, padding: '12px 14px', background: 'var(--color-bg-surface)' }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="layout-dashboard" size={16} /></span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{label}</span>
        </div>
      )}
    </div>
  );
}

function RichParts({ parts, activeFocus, onTagClick }) {
  return (
    <span>
      {parts.map((p, i) => {
        if (typeof p === 'string') return <React.Fragment key={i}>{p}</React.Fragment>;
        if (p.sla) return <span key={i} style={{ color: 'var(--color-danger-text)', fontWeight: 500, whiteSpace: 'nowrap' }}>{p.tag}</span>;
        if (p.tag) return <TagChip key={i} part={p} active={p.focus && activeFocus === p.focus} onTagClick={onTagClick} />;
        if (p.b) return <strong key={i} style={{ fontWeight: 600 }}>{p.b}</strong>;
        return null;
      })}
    </span>
  );
}

function RichMessage({ rich, onAction, activeFocus, onTagClick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rich.title && <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>{rich.title}</div>}
      {rich.badges && rich.badges.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {rich.badges.map((b, i) => (
            <Badge key={i} tone={b.tone}>{b.icon && <Icon name={b.icon} size={12} />}{b.label}</Badge>
          ))}
        </div>
      )}
      {rich.blocks.map((blk, i) => {
        if (blk.type === 'p') return <p key={i} style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-primary)' }}><RichParts parts={blk.parts} activeFocus={activeFocus} onTagClick={onTagClick} /></p>;
        if (blk.type === 'list') return (
          <ul key={i} style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {blk.items.map((parts, j) => (
              <li key={j} style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-text-primary)' }}>
                <RichParts parts={parts} activeFocus={activeFocus} onTagClick={onTagClick} />
              </li>
            ))}
          </ul>
        );
        if (blk.type === 'refs') return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {blk.items.map((it, j) => <RefCard key={j} title={it} />)}
          </div>
        );
        if (blk.type === 'kpi-snap') return <KpiSnapshot key={i} id={blk.id} widget={blk.widget} label={blk.label} />;
        if (blk.type === 'checklist') return <Checklist key={i} title={blk.title} items={blk.items} />;
        if (blk.type === 'dbfield') return <DbField key={i} value={blk.value} onAction={onAction} />;
        if (blk.type === 'callout') return <Callout key={i} tone={blk.tone} icon={blk.icon} title={blk.title} text={blk.text} action={blk.action} onAction={onAction} />;
        if (blk.type === 'action') return (
          <button key={i} onClick={() => onAction && onAction(blk.kind)}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ai-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg-surface)'; }}
            style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', borderRadius: 9, border: '1px solid var(--ai)', background: 'var(--color-bg-surface)', color: 'var(--ai-text)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', transition: 'background 120ms ease' }}>
            <Icon name={blk.icon} size={16} />{blk.label}
          </button>
        );
        return null;
      })}
    </div>
  );
}

function TypingBubble() {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ marginTop: 1 }}><MerisMark size={26} /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 28, padding: '0 13px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 14, boxShadow: 'var(--shadow-xs)' }}>
        <span className="typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="typing-dot" style={{ animationDelay: '160ms' }} />
        <span className="typing-dot" style={{ animationDelay: '320ms' }} />
      </div>
    </div>
  );
}

function Message({ msg, onAction, activeFocus, onTagClick }) {
  if (msg.role === 'user') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--color-text-tertiary)' }}>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--ai)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>AB</span>
          <span><span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Ana Beatriz</span>{msg.time ? ` · ${msg.time}` : ''}</span>
        </div>
        {msg.ref && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 9999, background: 'var(--ai-bg)', color: 'var(--ai-text)', fontSize: 12, fontWeight: 600 }}>
            <Icon name="message-square-plus" size={13} />{msg.ref}
          </div>
        )}
        {msg.atts && msg.atts.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
            {msg.atts.map((a) => (
              <span key={a.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 9, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                <Icon name={a.source === 'ged' ? 'database' : 'file-text'} size={13} style={{ color: a.source === 'ged' ? 'var(--ai-text)' : 'var(--color-text-tertiary)' }} />{a.name}
              </span>
            ))}
          </div>
        )}
        <div style={{ maxWidth: '84%', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 14, borderTopRightRadius: 5, padding: '9px 14px', fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>{msg.text}</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <MerisMark size={26} />
        <span style={{ fontSize: 13.5 }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>@meris</span>
          {msg.agent && <span style={{ color: 'var(--color-text-tertiary)' }}> {msg.agent}</span>}
        </span>
      </div>
      {msg.rich ? (
        <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 14, boxShadow: 'var(--shadow-xs)', padding: '16px 18px' }}>
          <RichMessage rich={msg.rich} onAction={onAction} activeFocus={activeFocus} onTagClick={onTagClick} />
        </div>
      ) : (
        <div style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.7, paddingLeft: 35 }}>{msg.text}</div>
      )}
      {msg.note && (
        <div style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 7, padding: '6px 11px', borderRadius: 9, background: 'var(--ai-bg)', color: 'var(--ai-text)', fontSize: 12.5, fontWeight: 500 }}>
          <Icon name="sparkles" size={14} />{msg.note}
        </div>
      )}
      {msg.time && <div style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)', paddingLeft: 2 }}>{msg.time}</div>}
    </div>
  );
}

function ChatPanel({ variant = 'welcome', messages = [], onSend, onSkill, showSkills = true, density = 'comfortable', narrow = false, align = 'center', markRef, onClearMark, onQuickAction, onAction, activeFocus, onTagClick, thinking, sharedHint, onConnect }) {
  const scrollRef = useRefCP(null);
  useEffectCP(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages.length, thinking]);

  if (variant === 'welcome') {
    return (
      <div className="sb-scroll" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start', padding: align === 'center' ? '24px 32px' : '52px 28px 28px' }}>
        <div style={{ width: '100%', maxWidth: align === 'center' ? 620 : 540 }}>
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: 8 }}>{dateLabel()}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>{greetingLabel()}, Ana.</span>
            </div>
            <p style={{ fontSize: 15, color: 'var(--color-text-secondary)', lineHeight: 1.55, margin: 0, maxWidth: 540 }}>
              3 documentos aguardam aprovação e a curva S de comissionamento segue 2,1 pts acima do previsto. Por onde começar?
            </p>
          </div>
          <div style={{ marginBottom: 20 }}><Composer onSend={onSend} density={density} onQuickAction={onQuickAction} onSkill={onSkill} onConnect={onConnect} /></div>
          {showSkills && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', marginBottom: 12 }}>
                <Icon name="sparkles" size={13} style={{ color: 'var(--ai-text)' }} /> Sugestões para começar
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {STARTERS.map((s) => <StarterCard key={s.id} starter={s} onClick={() => onSend(s.prompt)} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // thread variant
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div ref={scrollRef} className="sb-scroll" style={{ flex: 1, overflowY: 'auto', padding: narrow ? '24px 22px' : '28px 32px' }}>
        <div style={{ maxWidth: narrow ? 560 : 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {messages.map((m, i) => <Message key={i} msg={m} onAction={onAction} activeFocus={activeFocus} onTagClick={onTagClick} />)}
          {thinking && <TypingBubble />}
        </div>
      </div>
      <div style={{ padding: narrow ? '0 22px 16px' : '0 32px 18px', flexShrink: 0 }}>
        <div style={{ maxWidth: narrow ? 560 : 760, margin: '0 auto' }}>
          {sharedHint && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', marginBottom: 9, fontSize: 12, color: 'var(--color-text-tertiary)' }}>
              <Icon name="users" size={13} /> Conversa em grupo · mencione <strong style={{ fontWeight: 600, color: 'var(--ai-text)' }}>@meris</strong> para acionar o agente
            </div>
          )}
          <Composer onSend={onSend} density={density} placeholder={sharedHint ? 'Escreva para a equipe, ou mencione @meris…' : 'Continue a conversa, ou peça para abrir uma TAG…'} markRef={markRef} onClearMark={onClearMark} onQuickAction={onQuickAction} onSkill={onSkill} onConnect={onConnect} />
          <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--color-text-tertiary)', marginTop: 10 }}>MERIS pode produzir respostas incorretas. Sempre verifique com a fonte original.</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ChatPanel, Composer, SkillCard, Message });
