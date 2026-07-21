// MERIS Home — content blocks. Each block sits in a BlockShell with a discreet header.
const { useState: useStateBK, useRef: useRefBK, useEffect: useEffectBK } = React;

function Badge({ tone = 'neutral', children, dot }) {
  const map = {
    success: ['var(--color-success-bg)', 'var(--color-success-text)'],
    warning: ['var(--color-warning-bg)', 'var(--color-warning-text)'],
    danger:  ['var(--color-danger-bg)',  'var(--color-danger-text)'],
    info:    ['var(--color-info-bg)',    'var(--color-info-text)'],
    neutral: ['var(--color-neutral-bg)', 'var(--color-neutral-text)'],
    accent:  ['var(--color-accent-bg)',  'var(--color-accent-text)'],
    brand:   ['var(--color-brand-bg)',   'var(--color-brand-text)'],
  };
  const [bg, color] = map[tone] || map.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px',
      borderRadius: 9999, background: bg, color, fontSize: 12, fontWeight: 500,
      lineHeight: '16px', whiteSpace: 'nowrap',
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />}
      {children}
    </span>
  );
}

// ---- Block shell ---------------------------------------------------------
function PaneMenu({ items, size, iconSize }) {
  const [open, setOpen] = useStateBK(false);
  const [pos, setPos] = useStateBK({ top: 0, left: 0 });
  const ref = useRefBK(null);
  useEffectBK(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onScroll = () => setOpen(false);
    window.addEventListener('mousedown', close);
    window.addEventListener('scroll', onScroll, true);
    return () => { window.removeEventListener('mousedown', close); window.removeEventListener('scroll', onScroll, true); };
  }, [open]);
  const toggle = () => {
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      const w = 210;
      const estH = ((items || []).length * 34) + 12;
      let left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
      let top = r.bottom + 4;
      if (top + estH > window.innerHeight - 8) top = Math.max(8, r.top - estH - 4);
      setPos({ top, left });
    }
    setOpen((o) => !o);
  };
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <HdrIcon name="more-horizontal" title="Mais ações" onClick={toggle} size={iconSize} dim={size} />
      {open && items && items.length > 0 && (
        <div style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 85, width: 210, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', padding: 5 }}>
          {items.map((it, i) => it.divider ? (
            <div key={i} style={{ height: 1, background: 'var(--color-border)', margin: '5px 0' }} />
          ) : (
            <button key={i} disabled={it.disabled}
              onClick={() => { setOpen(false); it.onClick && it.onClick(); }}
              onMouseEnter={(e) => { if (!it.disabled) e.currentTarget.style.background = it.danger ? 'var(--color-danger-bg)' : 'var(--color-bg-subtle)'; }}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 9px', border: 'none', background: 'transparent', borderRadius: 7, cursor: it.disabled ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: it.disabled ? 'var(--color-text-tertiary)' : it.danger ? 'var(--color-danger)' : 'var(--color-text-primary)', textAlign: 'left', opacity: it.disabled ? 0.5 : 1 }}>
              {it.icon && <Icon name={it.icon} size={15} />}{it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BlockShell({ icon, title, subtitle, accent = 'info', children, density = 'comfortable', menuItems, style = {}, bodyStyle = {}, flush, variant = 'card' }) {
  const pad = density === 'compact' ? 14 : 18;
  const isPane = variant === 'pane';
  const accentColor = {
    info: 'var(--color-primary)', success: 'var(--color-success)', warning: 'var(--color-warning)',
    danger: 'var(--color-danger)', accent: 'var(--color-accent-text)', brand: 'var(--color-brand-text)',
  }[accent] || 'var(--color-primary)';
  const bodyPad = flush ? 0 : (isPane ? `${pad}px` : `0 ${pad}px ${pad}px`);
  return (
    <section style={{
      background: 'var(--color-bg-surface)',
      borderRadius: isPane ? 0 : 14,
      border: isPane ? 'none' : '1px solid var(--color-border)',
      boxShadow: isPane ? 'none' : 'var(--shadow-sm)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      minHeight: 0, minWidth: 0, width: isPane ? '100%' : undefined, ...style,
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: `${density === 'compact' ? 10 : 13}px ${pad}px`,
        flexShrink: 0, borderBottom: isPane ? '1px solid var(--color-border)' : 'none',
      }}>
        <span style={{ color: accentColor, display: 'flex' }}><Icon name={icon} size={18} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>}
        </div>
        <PaneMenu items={menuItems} />
      </header>
      <div style={{ flex: 1, minHeight: 0, overflow: flush ? undefined : 'auto', padding: bodyPad, ...bodyStyle }} className={flush ? undefined : 'sb-scroll'}>{children}</div>
    </section>
  );
}

function HdrIcon({ name, onClick, title, size, dim }) {
  const [h, setH] = useStateBK(false);
  const d = dim || 28;
  return (
    <button onClick={onClick} title={title} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: d, height: d, borderRadius: '50%', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        background: h ? 'var(--color-primary-light)' : 'transparent',
        color: h ? 'var(--color-primary)' : 'var(--color-text-tertiary)', transition: 'all 120ms ease',
      }}><Icon name={name} size={size || 16} /></button>
  );
}

// ---- KPI viz variants ----------------------------------------------------
const KPI_TONE = {
  success: 'var(--color-success)', info: 'var(--color-primary)',
  warning: 'var(--color-warning)', danger: 'var(--color-danger)',
};
function KpiGauge({ pct, color }) {
  const r = 26, c = Math.PI * r; // semicircle
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <svg viewBox="0 0 64 38" width="64" height="38" style={{ flexShrink: 0 }}>
      <path d="M6 34 A26 26 0 0 1 58 34" fill="none" stroke="var(--color-bg-subtle)" strokeWidth="6" strokeLinecap="round" />
      <path d="M6 34 A26 26 0 0 1 58 34" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
    </svg>
  );
}
function KpiSpark({ data, color }) {
  const w = 96, hgt = 30, n = data.length;
  const max = Math.max(...data), min = Math.min(...data);
  const x = (i) => (i / (n - 1)) * w;
  const y = (v) => hgt - 2 - ((v - min) / (max - min || 1)) * (hgt - 6);
  const pts = data.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const area = `M0,${hgt} ` + data.map((v, i) => `L${x(i)},${y(v)}`).join(' ') + ` L${w},${hgt} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${hgt}`} width="100%" height={hgt} preserveAspectRatio="none" style={{ display: 'block' }}>
      <path d={area} fill={color} opacity="0.1" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
function KpiBars({ data, color }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 30 }}>
      {data.map((v, i) => <div key={i} style={{ flex: 1, height: `${(v / max) * 100}%`, background: i === data.length - 1 ? color : color + '66', borderRadius: 2, minHeight: 3 }} />)}
    </div>
  );
}
function KpiProgress({ pct, color }) {
  return (
    <div style={{ height: 7, borderRadius: 9999, background: 'var(--color-bg-subtle)', overflow: 'hidden', marginTop: 2 }}>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', background: color, borderRadius: 9999 }} />
    </div>
  );
}

// ---- source health dot + provenance footer ------------------------------
function SourceDot({ status, size = 7 }) {
  const tone = { ok: 'var(--color-success)', sync: 'var(--color-primary)', stale: 'var(--color-warning)', down: 'var(--color-text-tertiary)', pending: 'var(--color-primary)' }[status] || 'var(--color-text-tertiary)';
  return <span style={{ width: size, height: size, borderRadius: '50%', background: tone, flexShrink: 0, boxShadow: status === 'sync' ? `0 0 0 3px color-mix(in srgb, ${tone} 22%, transparent)` : 'none' }} />;
}

// ---- KPI card ------------------------------------------------------------
function KpiCard({ kpi, density, onRemove, onAction, pinned, source }) {
  const [h, setH] = useStateBK(false);
  const [vizOv, setVizOv] = useStateBK(null);
  const toneColor = {
    success: 'var(--color-success-text)', info: 'var(--color-info-text)',
    warning: 'var(--color-warning-text)', danger: 'var(--color-danger-text)',
  }[kpi.tone] || 'var(--color-text-secondary)';
  const accent = KPI_TONE[kpi.tone] || 'var(--color-primary)';
  const compact = density === 'compact';
  const VIZ_ORDER = ['stat', 'gauge', 'sparkline', 'bars', 'progress'];
  const viz = vizOv || kpi.viz || 'stat';
  const cycleViz = () => { const cur = VIZ_ORDER.indexOf(viz); setVizOv(VIZ_ORDER[(cur + 1) % VIZ_ORDER.length]); };
  const menuItems = onAction ? [
    { icon: 'message-square', label: 'Perguntar sobre', onClick: () => onAction('ask', kpi) },
    pinned
      ? { icon: 'pin', label: 'Remover da home', onClick: () => onAction('remove', kpi) }
      : { icon: 'pin', label: 'Fixar na home', onClick: () => onAction('pin', kpi) },
    { icon: 'share-2', label: 'Compartilhar', onClick: () => onAction('share', kpi) },
    { divider: true },
    { icon: 'trash-2', label: 'Deletar', danger: true, onClick: () => onAction('delete', kpi) },
  ] : null;
  const valueEl = (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span className="font-mono" style={{ fontSize: compact ? 22 : 26, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>{kpi.value}</span>
      {kpi.unit && <span className="font-mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-tertiary)' }}>{kpi.unit}</span>}
    </div>
  );
  const deltaEl = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: toneColor, fontWeight: 500 }}>
      <Icon name="trending-up" size={13} /><span>{kpi.delta}</span>
    </div>
  );
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      position: 'relative', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
      borderRadius: 12, padding: compact ? '12px 14px' : '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0,
    }}>
      {menuItems ? (
        <div style={{ position: 'absolute', top: 6, right: 6, opacity: h ? 1 : 0, transition: 'opacity 120ms ease' }}>
          <PaneMenu items={menuItems} size={22} iconSize={15} align="right" />
        </div>
      ) : onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} title="Remover do dashboard"
          style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer', background: h ? 'var(--color-bg-subtle)' : 'transparent', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: h ? 1 : 0, transition: 'opacity 120ms ease' }}>
          <Icon name="x" size={13} />
        </button>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Icon name={kpi.icon} size={15} style={{ color: 'var(--color-text-tertiary)' }} />
        <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kpi.label}</span>
      </div>

      {viz === 'gauge' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <KpiGauge pct={kpi.pct != null ? kpi.pct : parseFloat(String(kpi.value).replace(',', '.')) || 0} color={accent} />
          <div>{valueEl}{deltaEl}</div>
        </div>
      ) : viz === 'sparkline' ? (
        <div>{valueEl}<div style={{ margin: '6px 0 2px' }}><KpiSpark data={kpi.series || [3, 5, 4, 6, 7, 6, 8]} color={accent} /></div>{deltaEl}</div>
      ) : viz === 'bars' ? (
        <div>{valueEl}<div style={{ margin: '6px 0 2px' }}><KpiBars data={kpi.series || [4, 6, 5, 7, 8, 6]} color={accent} /></div>{deltaEl}</div>
      ) : viz === 'progress' ? (
        <div>{valueEl}<KpiProgress pct={kpi.pct != null ? kpi.pct : 50} color={accent} />{deltaEl}</div>
      ) : (
        <>{valueEl}{deltaEl}</>
      )}

      {source && (
        <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <SourceDot status={source.status} />
          <span title={`Fonte: ${source.name} · ${source.system}`} style={{ flex: 1, minWidth: 0, fontSize: 10.5, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {source.status === 'down' ? `${source.name} não conectada` : source.status === 'pending' ? `${source.name} solicitada` : source.status === 'stale' ? 'Fonte desatualizada' : `via ${source.name}`}{source.sync && source.sync !== '—' ? ` ${source.sync}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}

function KpiAddTile({ added, onAddKpi, onAddWidget }) {
  const [open, setOpen] = useStateBK(false);
  return (
    <div style={{ minWidth: 0 }}>
      <button onClick={() => setOpen(true)}
        style={{ width: '100%', height: '100%', minHeight: 92, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1.5px dashed var(--color-border-strong)', borderRadius: 12, background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, transition: 'all 120ms ease' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ai)'; e.currentTarget.style.background = 'var(--ai-bg)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.background = 'transparent'; }}>
        <Icon name="plus" size={18} />
        <span>Adicionar KPI</span>
      </button>
      {open && <AddToHomeModal added={added} onClose={() => setOpen(false)} onAddKpi={onAddKpi} onAddWidget={onAddWidget} />}
    </div>
  );
}

function AddToHomeModal({ added, onClose, onAddKpi, onAddWidget }) {
  const [q, setQ] = useStateBK('');
  const ql = q.trim().toLowerCase();
  const isAdded = (it) => it.alwaysOn || added.includes(it.id);
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onMouseDown={(e) => e.stopPropagation()} style={{ width: 'min(460px, 96vw)', maxHeight: '82vh', background: 'var(--color-bg-surface)', borderRadius: 14, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 20px 12px' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>Adicionar ao dashboard</div>
            <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>Selecione KPIs e visualizações</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={17} /></button>
        </div>
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 12px', borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
            <Icon name="search" size={16} style={{ color: 'var(--color-text-tertiary)' }} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar KPI…"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13.5, color: 'var(--color-text-primary)' }} />
          </div>
        </div>
        <div className="sb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
          {HOME_CATALOG.map((sec) => {
            const items = sec.items.filter((it) => !ql || it.title.toLowerCase().includes(ql) || it.desc.toLowerCase().includes(ql));
            if (!items.length) return null;
            return (
              <div key={sec.group} style={{ marginTop: 6 }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', padding: '8px 8px 4px' }}>{sec.group}</div>
                {items.map((it) => {
                  const done = isAdded(it);
                  return (
                    <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 8px', borderRadius: 9 }}>
                      <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={it.icon} size={17} /></span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>{it.title}</span>
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--color-text-tertiary)' }}>{it.desc}</span>
                      </span>
                      {done ? (
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-tertiary)', background: 'var(--color-bg-subtle)', borderRadius: 7, padding: '6px 10px', flexShrink: 0 }}>Adicionado</span>
                      ) : (
                        <button onClick={() => { it.type === 'widget' ? onAddWidget(it.id) : onAddKpi(it.id); }}
                          title="Adicionar" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border-strong)', background: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ai-bg)'; e.currentTarget.style.color = 'var(--ai-text)'; e.currentTarget.style.borderColor = 'var(--ai)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg-surface)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.borderColor = 'var(--color-border-strong)'; }}>
                          <Icon name="plus" size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---- S-curve chart -------------------------------------------------------
function SCurve({ height = 200, showLegend = true }) {
  const W = 560, H = height, padL = 34, padR = 12, padT = 14, padB = 26;
  const n = SCURVE.labels.length;
  const x = (i) => padL + (i / (n - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - v / 100) * (H - padT - padB);
  const lineFor = (arr) => arr.map((v, i) => v == null ? null : `${x(i)},${y(v)}`).filter(Boolean).join(' ');
  const realPts = SCURVE.realizado.map((v, i) => v == null ? null : [x(i), y(v)]).filter(Boolean);
  const areaPath = `M ${x(0)},${y(0)} ` + SCURVE.previsto.map((v, i) => `L ${x(i)},${y(v)}`).join(' ') + ` L ${x(n - 1)},${y(0)} Z`;
  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} preserveAspectRatio="xMidYMid meet">
        {[0, 25, 50, 75, 100].map((g) => (
          <g key={g}>
            <line x1={padL} x2={W - padR} y1={y(g)} y2={y(g)} stroke="var(--color-border)" strokeWidth="1" />
            <text x={padL - 6} y={y(g) + 3} textAnchor="end" fontSize="9" fill="var(--color-text-tertiary)" className="font-mono">{g}</text>
          </g>
        ))}
        <path d={areaPath} fill="var(--color-primary)" opacity="0.06" />
        {/* previsto (planned) — dashed */}
        <polyline points={lineFor(SCURVE.previsto)} fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.75" strokeDasharray="4 4" strokeLinejoin="round" strokeLinecap="round" />
        {/* realizado (actual) — solid accent */}
        <polyline points={lineFor(SCURVE.realizado)} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {realPts.map(([px, py], i) => <circle key={i} cx={px} cy={py} r="2.6" fill="var(--color-bg-surface)" stroke="var(--color-primary)" strokeWidth="1.75" />)}
        {SCURVE.labels.map((l, i) => <text key={l} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9.5" fill="var(--color-text-tertiary)">{l}</text>)}
      </svg>
      {showLegend && (
        <div style={{ display: 'flex', gap: 18, paddingLeft: 34, marginTop: 2 }}>
          <LegendItem color="var(--color-primary)" label="Realizado" />
          <LegendItem color="var(--color-text-tertiary)" label="Previsto" dashed />
        </div>
      )}
    </div>
  );
}
function LegendItem({ color, label, dashed }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-secondary)' }}>
      <span style={{ width: 16, height: 0, borderTop: `2px ${dashed ? 'dashed' : 'solid'} ${color}` }} />{label}
    </span>
  );
}

// ---- Dashboard block (the user's default dashboard) ---------------------
function DashboardBlock({ density, menuItems, kpiIds, widgets, onAddKpi, onRemoveKpi, onAddWidget, onRemoveWidget, onKpiAction, chartHeight = 190, variant, style, sources, pinnedDash }) {
  const pool = [...KPIS, ...KPIS_EXTRA];
  const byId = {}; pool.forEach((k) => { byId[k.id] = k; });
  const srcMap = {}; (sources || DATA_SOURCES).forEach((s) => { srcMap[s.id] = s; });
  const sourceFor = (id) => srcMap[KPI_SOURCE[id]] || srcMap.cortex;

  // dashboard salvo fixado na home — renderiza a composição dele no lugar do padrão
  if (pinnedDash) {
    const pinKpis = [...KPIS, KPIS_EXTRA[0]];
    return (
      <BlockShell icon="layout-dashboard" title={pinnedDash.name} subtitle="Dashboard salvo · atualizado automaticamente" accent="info" density={density} menuItems={menuItems} variant={variant} style={{ height: '100%', ...style }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 14 }}>
          {pinKpis.map((k) => <KpiCard key={k.id} kpi={k} density={density} source={sourceFor(k.id)} onAction={onKpiAction} pinned={(kpiIds || []).includes(k.id)} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, alignItems: 'start' }}>
          <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: '14px 14px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>Curva S de avanço acumulado</span>
              <Badge tone="info" dot>Em dia</Badge>
            </div>
            <SCurve height={chartHeight} />
          </div>
          <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 12 }}>Avanço por disciplina</div>
            <DisciplineBars />
          </div>
        </div>
      </BlockShell>
    );
  }
  const ids = kpiIds || KPIS.map((k) => k.id);
  const shown = ids.map((id) => byId[id]).filter(Boolean);
  const editable = !!onAddKpi;
  const widg = widgets || [];
  const added = [...ids, ...widg];
  const showScurve = !widgets || widg.includes('w-scurve');
  const widgetMenu = (id, label, pinned) => [
    { icon: 'message-square', label: 'Perguntar sobre', onClick: () => onKpiAction('ask', { id, label, widget: true }) },
    pinned
      ? { icon: 'pin', label: 'Remover da home', onClick: () => onKpiAction('remove', { id, label, widget: true }) }
      : { icon: 'pin', label: 'Fixar na home', onClick: () => onKpiAction('pin', { id, label, widget: true }) },
    { icon: 'share-2', label: 'Compartilhar', onClick: () => onKpiAction('share', { id, label, widget: true }) },
    { divider: true },
    { icon: 'trash-2', label: 'Deletar', danger: true, onClick: () => onKpiAction('delete', { id, label, widget: true }) },
  ];
  return (
    <BlockShell icon="layout-dashboard" title="Dashboard padrão" subtitle="Indicadores fixados · UGH Boaventura" accent="info" density={density} menuItems={menuItems} variant={variant} style={{ height: '100%', ...style }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(116px, 1fr))', gap: 12, marginBottom: 14 }}>
        {shown.map((k) => <KpiCard key={k.id} kpi={k} density={density} onAction={onKpiAction} pinned={ids.includes(k.id)} source={sourceFor(k.id)} />)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, alignItems: 'start' }}>
          {showScurve && (
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: '14px 14px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>Curva S de avanço acumulado</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Badge tone="info" dot>Em dia</Badge>
                  {onKpiAction && <PaneMenu size={24} iconSize={16} items={widgetMenu('w-scurve', 'Curva S', true)} />}
                </div>
              </div>
              <SCurve height={chartHeight} />
            </div>
          )}
          <DashWidget title="Feed do projeto" subtitle="UGH Boaventura · últimas 24h" icon="bell" menuItems={onKpiAction ? widgetMenu('w-feed', 'Feed do projeto', true) : undefined}>
            <ProjectFeed />
          </DashWidget>
        </div>
        {widg.includes('w-docs') && <DashWidget title="Documentos críticos esta semana" subtitle={`${CRIT_DOCS.length} itens · ordenado por SLA`} icon="file-text" onRemove={onRemoveWidget ? () => onRemoveWidget('w-docs') : undefined}>
          <DataTable density={density} rows={CRIT_DOCS} columns={[
            { key: 'tag', label: 'TAG', render: (r) => <span className="font-mono" style={{ fontWeight: 500 }}>{r.tag}</span> },
            { key: 'title', label: 'Título', render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>{r.title}</span> },
            { key: 'status', label: 'Status', render: (r) => <Badge tone={r.tone} dot>{r.status}</Badge> },
            { key: 'rev', label: 'Revisão', align: 'center', render: (r) => <span className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>Rev {r.rev}</span> },
          ]} />
        </DashWidget>}
        {widg.includes('w-feed') && <DashWidget title="Feed do projeto" subtitle="UGH Boaventura · últimas 24h" icon="bell" onRemove={onRemoveWidget ? () => onRemoveWidget('w-feed') : undefined}>
          <ProjectFeed />
        </DashWidget>}
      </div>
    </BlockShell>
  );
}
function DashWidget({ title, subtitle, icon, onRemove, menuItems, children }) {
  const [h, setH] = useStateBK(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ position: 'relative', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px' }}>
        <Icon name={icon} size={17} style={{ color: 'var(--color-text-tertiary)' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)' }}>{subtitle}</div>}
        </div>
        {menuItems ? <PaneMenu items={menuItems} size={24} iconSize={16} /> : onRemove && <button onClick={onRemove} title="Remover da home" style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', background: h ? 'var(--color-bg-subtle)' : 'transparent', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: h ? 1 : 0, transition: 'opacity 120ms ease' }}><Icon name="x" size={14} /></button>}
      </div>
      {children}
    </div>
  );
}
function ProjectFeed() {
  const toneColor = { danger: 'var(--color-danger)', accent: 'var(--color-accent-text)', success: 'var(--color-success)', warning: 'var(--color-warning)', info: 'var(--color-primary)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 14px 12px' }}>
      {PROJECT_FEED.map((f) => (
        <div key={f.id} style={{ display: 'flex', gap: 10, padding: '9px 0', borderTop: '1px solid var(--color-border)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: toneColor[f.tone], marginTop: 5, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.5 }}><strong style={{ fontWeight: 600 }}>{f.kind}</strong> {f.text}</div>
            <div style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{f.who} · {f.when}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Resumo do dia (bloco com feed) ---------------------------------------
function DailySummaryBlock({ density, menuItems, style, variant, onOpenInsight }) {
  const toneColor = { danger: 'var(--color-danger)', accent: 'var(--color-accent-text)', success: 'var(--color-success)', warning: 'var(--color-warning)', info: 'var(--color-primary)' };
  const date = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const stats = [
    { label: 'Atividades', value: '+96', tone: 'info' },
    { label: 'Avanço', value: '+3,1 pts', tone: 'success' },
    { label: 'Aprovações pendentes', value: '3', tone: 'warning' },
    { label: 'Alertas críticos', value: '1', tone: 'danger' },
  ];
  const FEED_ONTEM = [
    { id: 'y1', tone: 'success', kind: 'Aprovação', text: 'Folha de dados da Válvula VA-101 aprovada em réplica.', who: 'Paulo A.', when: 'ontem, 17:40' },
    { id: 'y2', tone: 'info',    kind: 'Documento', text: 'PID-4730-001 emitido em Rev. B.', who: 'Disciplina TU', when: 'ontem, 15:12' },
  ];
  const statTone = { info: ['var(--color-info-bg)', 'var(--color-info-text)'], success: ['var(--color-success-bg)', 'var(--color-success-text)'], warning: ['var(--color-warning-bg)', 'var(--color-warning-text)'], danger: ['var(--color-danger-bg)', 'var(--color-danger-text)'] };
  const group = (label, items) => (
    <div key={label}>
      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', margin: '14px 0 4px' }}>{label}</div>
      {items.map((f) => (
        <button key={f.id} onClick={() => onOpenInsight && onOpenInsight(f)} title="Perguntar sobre este item"
          onMouseEnter={(e) => { if (onOpenInsight) e.currentTarget.style.background = 'var(--color-bg-subtle)'; }} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          style={{ display: 'flex', gap: 10, width: '100%', textAlign: 'left', padding: '10px 8px', margin: '0 -8px', borderRadius: 8, borderBottom: '1px solid var(--color-border)', background: 'transparent', border: 'none', cursor: onOpenInsight ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'background 120ms ease' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: toneColor[f.tone], marginTop: 5, flexShrink: 0 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.5 }}><strong style={{ fontWeight: 600 }}>{f.kind}</strong> {f.text}</div>
            <div style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{f.who} {f.when}</div>
          </div>
          {onOpenInsight && <Icon name="message-square-plus" size={15} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0, alignSelf: 'center' }} />}
        </button>
      ))}
    </div>
  );
  return (
    <BlockShell icon="sparkles" title="Resumo do dia" subtitle={date} accent="info" density={density} menuItems={menuItems} variant={variant} style={{ height: '100%', ...style }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginBottom: 4 }}>
        {stats.map((st) => {
          const [bg, fg] = statTone[st.tone];
          return (
            <div key={st.label} style={{ background: bg, borderRadius: 10, padding: '9px 12px' }}>
              <div className="font-mono" style={{ fontSize: 17, fontWeight: 600, color: fg, lineHeight: 1 }}>{st.value}</div>
              <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: fg, opacity: 0.8, marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.label}</div>
            </div>
          );
        })}
      </div>
      {group('Hoje', PROJECT_FEED)}
      {group('Ontem', FEED_ONTEM)}
    </BlockShell>
  );
}

// ---- Documento gerado pelo agente (bloco de texto) -------------------------
function TextDocBlock({ density, menuItems, style, variant, doc, onToast }) {
  const d = doc || { title: 'Documento gerado', sections: [] };
  const copy = () => {
    const txt = d.title + '\n\n' + d.sections.map((sec) => sec.h + '\n' + sec.t).join('\n\n');
    try { navigator.clipboard.writeText(txt); } catch (e) {}
    onToast && onToast('Texto copiado');
  };
  return (
    <BlockShell icon="file-text" title={d.title} subtitle="Documento gerado, rascunho editável" accent="info" density={density} menuItems={menuItems} variant={variant} style={{ height: '100%', ...style }}>
      <div style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <MiniBtn icon="copy" onClick={copy}>Copiar texto</MiniBtn>
          <MiniBtn icon="download" onClick={() => onToast && onToast('Download iniciado: ' + d.title + '.docx')}>Baixar .docx</MiniBtn>
        </div>
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: '26px 28px', background: 'var(--color-bg-surface)' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>{d.title}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: '5px 0 16px' }}>UGH Boaventura · {new Date().toLocaleDateString('pt-BR')} · elaborado com o MERIS</div>
          {d.sections.map((sec, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 5 }}>{sec.h}</div>
              <div style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{sec.t}</div>
            </div>
          ))}
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--color-border)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Ana Beatriz · Gestora de projeto · UGH Boaventura
          </div>
        </div>
      </div>
    </BlockShell>
  );
}

// ---- Documentos para assinar (somente leitura na home) --------------------
function SignDocsBlock({ density, menuItems, style, variant, onToast }) {
  const cols = [
    { key: 'tag', label: 'Documento', render: (r) => (
      <span style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="font-mono" style={{ fontWeight: 500 }}>{r.tag}</span>
        <span style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)' }}>{r.title}</span>
      </span>
    ) },
    { key: 'kind', label: 'Tipo', render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>{r.kind}</span> },
    { key: 'who', label: 'Solicitante', render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>{r.who}</span> },
    { key: 'due', label: 'Prazo', render: (r) => <Badge tone={r.tone} dot>{r.due}</Badge> },
  ];
  return (
    <BlockShell icon="pencil" title="Documentos para assinar" subtitle={SIGN_DOCS.length + ' aguardando sua assinatura'} accent="warning" density={density} menuItems={menuItems} variant={variant} style={{ height: '100%', ...style }} flush>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }} className="sb-scroll">
          <DataTable columns={cols} rows={SIGN_DOCS} density={density} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)', flexShrink: 0 }}>
          <Icon name="lock" size={14} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 12, color: 'var(--color-text-tertiary)' }}>Visualização. A assinatura é feita na tela de relatórios.</span>
          <MiniBtn icon="external-link" onClick={() => onToast && onToast('Assinatura disponível na tela de relatórios do MERIS completo')}>Ir para relatórios</MiniBtn>
        </div>
      </div>
    </BlockShell>
  );
}

// ---- 3D plant viewer -----------------------------------------------------
function Viewer3D({ density, menuItems, style, variant, focusedTag }) {
  const focusItem = focusedTag && PLANT_TAGS.find((t) => t.id === focusedTag);
  return (
    <BlockShell icon="boxes" title="Viewer 3D da planta industrial" subtitle={focusItem ? `Focado · ${focusItem.code}` : 'Modelo federado · U-4730'} accent="accent" density={density} menuItems={menuItems} variant={variant} style={{ height: '100%', ...style }} flush>
      <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 200, background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2F7 100%)', overflow: 'hidden' }}>
        <PlantScene />
        {PLANT_TAGS.map((t) => <PlantTag key={t.id} tag={t} focused={focusedTag === t.id} dim={focusedTag && focusedTag !== t.id} />)}
        <div style={{ position: 'absolute', left: 12, bottom: 12, display: 'flex', gap: 6 }}>
          <ViewerChip>Isométrico</ViewerChip>
          {focusItem ? <ViewerChip>Focado: {focusItem.code}</ViewerChip> : <ViewerChip>{PLANT_TAGS.length} TAGs</ViewerChip>}
        </div>
      </div>
    </BlockShell>
  );
}
function ViewerChip({ children }) {
  return <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.82)', border: '1px solid var(--color-border)', borderRadius: 9999, padding: '3px 9px', backdropFilter: 'blur(2px)' }}>{children}</span>;
}
function PlantTag({ tag, focused, dim }) {
  const toneColor = {
    success: 'var(--color-success)', warning: 'var(--color-warning)',
    danger: 'var(--color-danger)', info: 'var(--color-primary)',
  }[tag.status];
  const pinColor = focused ? 'var(--ai)' : toneColor;
  return (
    <div style={{ position: 'absolute', left: `${tag.x}%`, top: `${tag.y}%`, transform: `translate(-50%,-100%) scale(${focused ? 1.08 : 1})`, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', opacity: dim ? 0.45 : 1, zIndex: focused ? 5 : 1, transition: 'opacity 120ms ease, transform 120ms ease' }}>
      <span className="font-mono" style={{ fontSize: 11, fontWeight: 600, color: focused ? '#fff' : 'var(--color-text-primary)', background: focused ? 'var(--ai)' : 'var(--color-bg-surface)', border: `1px solid ${focused ? 'var(--ai)' : 'var(--color-border)'}`, boxShadow: focused ? '0 0 0 4px color-mix(in srgb, var(--ai) 22%, transparent), var(--shadow-md)' : 'var(--shadow-md)', borderRadius: 7, padding: '3px 8px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: focused ? '#fff' : toneColor }} />{tag.code}
      </span>
      <span style={{ width: focused ? 2 : 1, height: 12, background: pinColor }} />
      <span style={{ width: focused ? 9 : 7, height: focused ? 9 : 7, borderRadius: '50%', background: pinColor, marginTop: -3, boxShadow: `0 0 0 3px ${focused ? 'color-mix(in srgb, var(--ai) 25%, transparent)' : toneColor + '22'}` }} />
    </div>
  );
}
// Stylized isometric industrial scene (abstract, blueprint-leaning).
function PlantScene() {
  return (
    <svg viewBox="0 0 400 300" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="tankF" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#CBD5E1"/><stop offset="0.5" stopColor="#E2E8F0"/><stop offset="1" stopColor="#B8C2D0"/></linearGradient>
        <linearGradient id="tankG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#93C5FD"/><stop offset="0.5" stopColor="#BFDBFE"/><stop offset="1" stopColor="#60A5FA"/></linearGradient>
      </defs>
      {/* ground iso grid */}
      <g stroke="#D2DAE5" strokeWidth="0.8" opacity="0.7">
        {[0,1,2,3,4,5,6].map(i => <line key={'a'+i} x1={40+i*52} y1={150} x2={40+i*52-90} y2={300} />)}
        {[0,1,2,3,4,5,6].map(i => <line key={'b'+i} x1={40+i*52} y1={150} x2={40+i*52+90} y2={300} />)}
      </g>
      {/* large storage tank (left) */}
      <g>
        <ellipse cx="92" cy="250" rx="44" ry="16" fill="#AEB9C8"/>
        <rect x="48" y="170" width="88" height="80" fill="url(#tankF)"/>
        <ellipse cx="92" cy="170" rx="44" ry="16" fill="#EEF2F7"/>
        <ellipse cx="92" cy="170" rx="44" ry="16" fill="none" stroke="#9AA7B8" strokeWidth="1"/>
        <line x1="48" y1="210" x2="136" y2="210" stroke="#9AA7B8" strokeWidth="0.8" opacity="0.6"/>
      </g>
      {/* vertical vessel (center) */}
      <g>
        <ellipse cx="210" cy="232" rx="22" ry="8" fill="#7C8BA1"/>
        <rect x="188" y="120" width="44" height="112" fill="url(#tankG)"/>
        <ellipse cx="210" cy="120" rx="22" ry="8" fill="#DBEAFE"/>
        <ellipse cx="210" cy="120" rx="22" ry="8" fill="none" stroke="#3B82F6" strokeWidth="1" opacity="0.5"/>
      </g>
      {/* compressor block (right) */}
      <g>
        <polygon points="288,210 340,196 340,250 288,264" fill="#C2CCDA"/>
        <polygon points="288,210 340,196 372,210 320,224" fill="#D8E0EA"/>
        <polygon points="320,224 372,210 372,264 320,278" fill="#A7B3C4"/>
      </g>
      {/* pipe rack */}
      <g stroke="#94A3B8" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85">
        <path d="M92 210 L150 240 L210 214" />
        <path d="M210 214 L270 240 L320 224" />
        <path d="M92 230 L160 262" stroke="#60A5FA" strokeWidth="2.5"/>
      </g>
      {/* support legs */}
      <g stroke="#8593A5" strokeWidth="2">
        <line x1="195" y1="232" x2="195" y2="250"/><line x1="225" y1="232" x2="225" y2="250"/>
      </g>
    </svg>
  );
}

// ---- Document / asset tables --------------------------------------------
function DataTable({ columns, rows, density }) {
  const rowH = density === 'compact' ? 34 : 40;
  return (
    <div style={{ overflow: 'auto', height: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>{columns.map((c) => (
            <th key={c.key} style={{ position: 'sticky', top: 0, background: 'var(--color-bg-subtle)', textAlign: c.align || 'left', padding: '0 12px', height: 36, fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{c.label}</th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="data-row" style={{ height: rowH }}>
              {columns.map((c) => (
                <td key={c.key} style={{ padding: '0 12px', borderBottom: '1px solid var(--color-border)', textAlign: c.align || 'left', whiteSpace: 'nowrap', color: 'var(--color-text-primary)' }}>{c.render(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocTableBlock({ density, menuItems, style, variant }) {
  const cols = [
    { key: 'tag', label: 'TAG / Documento', render: (r) => <span className="font-mono" style={{ fontWeight: 500 }}>{r.tag}</span> },
    { key: 'disc', label: 'Disciplina', render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>{r.disc}</span> },
    { key: 'rev', label: 'Rev', align: 'center', render: (r) => <span className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>{r.rev}</span> },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={r.tone} dot>{r.status}</Badge> },
  ];
  return (
    <BlockShell icon="file-text" title="Documentos técnicos" subtitle={`${DOCS.length} resultados · disciplina mista`} accent="info" density={density} menuItems={menuItems} variant={variant} style={{ height: '100%', ...style }} flush>
      <DataTable columns={cols} rows={DOCS} density={density} />
    </BlockShell>
  );
}

function AssetsTableBlock({ density, menuItems, style, variant }) {
  const cols = [
    { key: 'tag', label: 'TAG do ativo', render: (r) => <span className="font-mono" style={{ fontWeight: 500 }}>{r.tag}</span> },
    { key: 'type', label: 'Tipo', render: (r) => <span style={{ color: 'var(--color-text-secondary)' }}>{r.type}</span> },
    { key: 'area', label: 'Área', render: (r) => <span className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>{r.area}</span> },
    { key: 'prog', label: 'Avanço', align: 'left', render: (r) => <Progress value={r.prog} /> },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={r.tone} dot>{r.status}</Badge> },
  ];
  return (
    <BlockShell icon="boxes" title="Tabela de ativos" subtitle={`${ASSETS.length} ativos · comissionamento`} accent="accent" density={density} menuItems={menuItems} variant={variant} style={{ height: '100%', ...style }} flush>
      <DataTable columns={cols} rows={ASSETS} density={density} />
    </BlockShell>
  );
}
function Progress({ value }) {
  const tone = value === 100 ? 'var(--color-success)' : value >= 75 ? 'var(--color-primary)' : 'var(--color-warning)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 110 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 9999, background: 'var(--color-bg-subtle)', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: tone, borderRadius: 9999 }} />
      </div>
      <span className="font-mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)', width: 30, textAlign: 'right' }}>{value}%</span>
    </div>
  );
}

// ---- shared metadata + button helpers (used by DocPanes) ----------------
function Meta({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}>{label}</span>
      <span className={mono ? 'font-mono' : ''} style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{value}</span>
    </div>
  );
}
function MiniBtn({ icon, children, onClick }) {
  const [h, setH] = useStateBK(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', borderRadius: 7, border: '1px solid var(--color-border-strong)', background: h ? 'var(--color-bg-subtle)' : 'var(--color-bg-surface)', color: 'var(--color-text-primary)', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', transition: 'background 120ms ease' }}>
      {icon && <Icon name={icon} size={14} />}{children}
    </button>
  );
}

Object.assign(window, {
  Badge, BlockShell, KpiCard, SCurve, DashboardBlock, Viewer3D,
  DocTableBlock, AssetsTableBlock, DataTable, Progress, HdrIcon, MiniBtn, Meta, SourceDot, DailySummaryBlock, TextDocBlock, SignDocsBlock, ProjectFeed,
});
