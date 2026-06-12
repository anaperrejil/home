// MERIS Home — document viewer + report preview panes (adapted from the modals)
const { useState: useStateDP } = React;

// ============================================================
// Shared metadata sidebar pieces
// ============================================================
function MetaTabs({ tabs, active, onPick }) {
  return (
    <div style={{ display: 'flex', gap: 2, padding: '0 0 2px', borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }} className="strip-scroll">
      {tabs.map((t) => {
        const on = active === t;
        return (
          <button key={t} onClick={() => onPick(t)}
            style={{ flexShrink: 0, padding: '8px 10px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: on ? 600 : 500, color: on ? 'var(--ai-text)' : 'var(--color-text-secondary)', borderBottom: `2px solid ${on ? 'var(--ai)' : 'transparent'}`, marginBottom: -2, whiteSpace: 'nowrap' }}>
            {t}
          </button>
        );
      })}
    </div>
  );
}
function MetaSectionTitle({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', margin: '4px 0 2px' }}>{children}</div>;
}
function MetaRow({ label, value, mono, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, padding: '5px 0' }}>
      <span style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{label}</span>
      <span className={mono ? 'font-mono' : ''} style={{ fontSize: 12.5, fontWeight: 500, color: accent ? 'var(--color-text-link)' : 'var(--color-text-primary)', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}
function FooterActions({ items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 16px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', flexShrink: 0 }}>
      {items.map((it, i) => <MiniBtn key={i} icon={it.icon}>{it.label}</MiniBtn>)}
    </div>
  );
}

// ============================================================
// Document viewer pane (image 2)
// ============================================================
function DocPreviewBlock({ density, menuItems, style, variant }) {
  const [tab, setTab] = useStateDP('Relatórios IA');
  const [zoom, setZoom] = useStateDP(110);
  const [page, setPage] = useStateDP(2);
  return (
    <BlockShell icon="file-text" title="DE-5400.00-4710-800-TYS-118" subtitle="Diagrama de malhas SDCD" accent="info" density={density} menuItems={menuItems} variant={variant} style={{ height: '100%', ...style }} flush>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
            <ToolBtn icon="chevron-up" onClick={() => setPage((p) => Math.max(1, p - 1))} />
            <span className="font-mono" style={{ fontSize: 12.5, minWidth: 28, textAlign: 'center', color: 'var(--color-text-primary)' }}>{page}</span>
            <ToolBtn icon="chevron-down" onClick={() => setPage((p) => p + 1)} />
            <div style={{ width: 1, height: 18, background: 'var(--color-border)', margin: '0 6px' }} />
            <ToolBtn icon="zoom-out" onClick={() => setZoom((z) => Math.max(50, z - 10))} />
            <span className="font-mono" style={{ fontSize: 12.5, minWidth: 44, textAlign: 'center', color: 'var(--color-text-primary)' }}>{zoom}%</span>
            <ToolBtn icon="zoom-in" onClick={() => setZoom((z) => Math.min(200, z + 10))} />
            <div style={{ flex: 1 }} />
            <MiniBtn icon="external-link">Abrir documento</MiniBtn>
          </div>
          <div className="sb-scroll" style={{ flex: 1, minHeight: 0, overflow: 'auto', background: '#EEF1F5', padding: 18, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
              <DrawingSheet />
            </div>
          </div>
        </main>
      </div>
    </BlockShell>
  );
}
function ToolBtn({ icon, onClick }) {
  const [h, setH] = useStateDP(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: h ? 'var(--color-bg-surface)' : 'transparent', color: 'var(--color-text-secondary)', transition: 'background 120ms ease' }}>
      <Icon name={icon} size={16} />
    </button>
  );
}

// A Petrobras-style technical drawing sheet (title block + revision index).
function DrawingSheet() {
  const cell = { border: '1px solid #1F2937', padding: '1px 3px', fontSize: 6.5, lineHeight: 1.25, color: '#0F172A' };
  const head = { ...cell, fontWeight: 700, background: '#F1F5F9', textAlign: 'center' };
  return (
    <div style={{ width: 760, background: '#fff', border: '1px solid #1F2937', boxShadow: 'var(--shadow-md)', padding: 10, fontFamily: 'var(--font-sans)' }}>
      {/* top approval strip */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1F2937', paddingBottom: 4, marginBottom: 6, fontSize: 6.5, color: '#475569', justifyContent: 'space-between' }}>
        <span>APROVAÇÃO · R.MACENA · R.MACENA · R.LARATTA · K.WANSAN</span>
        <span>AS INFORMAÇÕES DESTE DOCUMENTO SÃO PROPRIEDADE DA PETROBRAS</span>
      </div>
      {/* two columns: revision index + reference drawings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 6 }}>
        <div>
          <div style={head}>ÍNDICE DE REVISÃO DE FOLHAS</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <tbody>
              {Array.from({ length: 7 }).map((_, r) => (
                <tr key={r}>
                  {Array.from({ length: 8 }).map((__, c) => (
                    <React.Fragment key={c}>
                      <td className="font-mono" style={{ ...cell, textAlign: 'center', width: '4%' }}>{211 + r + c * 7}</td>
                      <td className="font-mono" style={{ ...cell, textAlign: 'center', width: '8.5%' }}>D</td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div style={head}>DESENHOS DE REFERÊNCIA</div>
          <div style={{ ...cell, fontSize: 6, lineHeight: 1.5, height: '100%' }}>
            N-1882 - REV. D - CRITÉRIOS PARA ELABORAÇÃO DE PROJETOS<br />
            N-0381 - REV. L - EXECUÇÃO DE DESENHOS E DOCUMENTOS<br />
            ET-5400.00-4700-PDV-001 - CRITÉRIO DE PROJETOS<br />
            I-DE-5400.00-4710-800-TYS-521 - GCT-SDCD-4710-001<br />
            DE-5400.00-4710-800-TYS-114 - DIAGRAMA DE INTERLIGAÇÃO<br />
            LI-5400.00-4710-861-TYS-103 - LISTA DE ENTRADAS E SAÍDAS<br />
            FLUXOGRAMA DE ENGENHARIA - VER FOLHA DE NOTAS
          </div>
        </div>
      </div>
      {/* revision description */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6, tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td style={{ ...head, width: '8%' }}>REV.</td>
            <td style={head}>DESCRIÇÃO</td>
            <td style={{ ...head, width: '34%' }}>ABREVIATURAS</td>
          </tr>
          {[['0', 'EMISSÃO ORIGINAL - PARA INFORMAÇÃO'], ['A', 'LIBERADO PARA CONSTRUÇÃO'], ['B', 'REVISADO CONFORME DOCUMENTAÇÃO SDCD EMERSON'], ['C', 'REVISADO CONFORME INDICADO'], ['D', 'REVISADO ONDE INDICADO - LIBERADO PARA CONSTRUÇÃO']].map((r) => (
            <tr key={r[0]}>
              <td className="font-mono" style={{ ...cell, textAlign: 'center' }}>{r[0]}</td>
              <td style={cell}>{r[1]}</td>
              <td style={cell}>{r[0] === '0' ? 'SDCD - SIST. DIGITAL DE CONTROLE' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* title block */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 0.7fr', gap: 0, marginTop: 6, border: '1px solid #1F2937' }}>
        <div style={{ ...cell, borderTop: 'none', borderLeft: 'none' }}>
          <div style={{ fontWeight: 700, fontSize: 9, letterSpacing: '0.05em' }}>PETROBRAS</div>
          <div style={{ fontSize: 6, color: '#475569', marginTop: 2 }}>TOYO SETAL EMPREENDIMENTOS LTDA</div>
          <div style={{ fontSize: 6, color: '#475569' }}>RESP. TÉCNICO: ANTÔNIO CARLOS MANZANO GARCIA</div>
        </div>
        <div style={{ ...cell, borderTop: 'none' }}>
          <div style={{ fontSize: 6, color: '#475569' }}>TÍTULO</div>
          <div style={{ fontWeight: 700, fontSize: 8 }}>DIAGRAMA DE MALHAS - SDCD</div>
          <div style={{ fontSize: 6, color: '#475569', marginTop: 3 }}>U-4710 - UNIDADE DE GERAÇÃO DE HIDROGÊNIO I</div>
        </div>
        <div style={{ ...cell, borderTop: 'none', borderRight: 'none' }}>
          <div style={{ fontSize: 6, color: '#475569' }}>Nº</div>
          <div className="font-mono" style={{ fontWeight: 700, fontSize: 7 }}>DE-5400.00-4710-800-TYS-118</div>
          <div style={{ fontSize: 6, color: '#475569', marginTop: 3 }}>FOLHA 2 de 286 · REV. D1</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Report preview pane (image 1)
// ============================================================
function ReportPreviewBlock({ density, menuItems, style, variant }) {
  const [tab, setTab] = useStateDP('Propriedades');
  return (
    <BlockShell icon="file-text" title="Pré-visualização do relatório" subtitle="HC2 Lista de Inspeção Inicial (Visual) · Manta de Revestimento" accent="accent" density={density} menuItems={menuItems} variant={variant} style={{ height: '100%', ...style }} flush>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '7px 12px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
          <div style={{ flex: 1 }} />
          <MiniBtn icon="external-link">Abrir relatório</MiniBtn>
        </div>
        <main className="sb-scroll" style={{ flex: 1, minWidth: 0, overflow: 'auto', background: '#EEF1F5', padding: 20, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
          <RirSheet />
        </main>
      </div>
    </BlockShell>
  );
}

function RirSheet() {
  const bd = '1px solid #1F2937';
  const cell = { border: bd, padding: '4px 6px', fontSize: 9, color: '#0F172A', verticalAlign: 'top' };
  const sec = { ...cell, fontWeight: 700, background: '#E2E8F0' };
  const input = { border: bd, padding: '4px 6px', background: '#F8FAFC' };
  const fields = ['Marca', 'Tipo do material', 'Densidade (kg/m³)', 'Espessura (mm)', 'Comprimento (mm)', 'Largura (mm)', 'Quantidades (caixa)', 'Localização (AREA)', 'Lote', 'Tipo'];
  return (
    <div style={{ width: 600, background: '#fff', border: bd, boxShadow: 'var(--shadow-md)', padding: 14, fontFamily: 'var(--font-sans)' }}>
      {/* header */}
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td rowSpan={2} style={{ ...cell, width: '22%', textAlign: 'center', fontWeight: 700, color: '#94A3B8' }}>PETROBRAS</td>
            <td style={{ ...cell, fontWeight: 700 }}>RIR-13</td>
            <td style={cell}>CÓDIGO: LV-REC-004</td>
            <td style={cell}>PAGE: 1 / 1</td>
          </tr>
          <tr>
            <td style={cell}>PROJETO: UGH</td>
            <td style={cell}>CLIENT: PETROBRAS</td>
            <td style={cell}>REV.: 0</td>
          </tr>
          <tr><td colSpan={3} style={sec}>TITLE: RELATÓRIO DE INSPEÇÃO DE RECEBIMENTO</td><td style={sec}>Date: —</td></tr>
          <tr><td colSpan={4} style={cell}>ITEM VERIFICADO: Teste 1</td></tr>
        </tbody>
      </table>
      {/* rastreabilidade */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6, tableLayout: 'fixed' }}>
        <tbody>
          <tr><td colSpan={2} style={sec}>RASTREABILIDADE</td></tr>
          {fields.map((f) => (
            <tr key={f}>
              <td style={{ ...cell, width: '46%' }}>{f}:</td>
              <td style={input}></td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* inspeção */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6, tableLayout: 'fixed' }}>
        <tbody>
          <tr><td colSpan={6} style={sec}>INSPEÇÃO</td></tr>
          <tr>
            <td style={{ ...cell, width: '8%', fontWeight: 600 }}>ITEM</td>
            <td style={{ ...cell, fontWeight: 600 }}>Description</td>
            <td style={{ ...cell, width: '8%', fontWeight: 600, textAlign: 'center' }}>Sim</td>
            <td style={{ ...cell, width: '8%', fontWeight: 600, textAlign: 'center' }}>N/A</td>
            <td style={{ ...cell, width: '8%', fontWeight: 600, textAlign: 'center' }}>Não</td>
            <td style={{ ...cell, width: '24%', fontWeight: 600 }}>Comentários</td>
          </tr>
          {[['1', 'Está íntegro?'], ['2', 'Apto para fazer a próxima inspeção (inspeção qualitativa completa)?']].map((r) => (
            <tr key={r[0]}>
              <td className="font-mono" style={{ ...cell, textAlign: 'center' }}>{r[0]}</td>
              <td style={cell}>{r[1]}</td>
              <td style={{ ...cell, textAlign: 'center' }}>○</td>
              <td style={{ ...cell, textAlign: 'center' }}>○</td>
              <td style={{ ...cell, textAlign: 'center' }}>○</td>
              <td style={cell}></td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* observations */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6, tableLayout: 'fixed' }}>
        <tbody>
          <tr><td colSpan={2} style={sec}>Observations</td></tr>
          <tr><td style={{ ...cell, width: '46%' }}>Observations - HC2:</td><td style={input}></td></tr>
          <tr><td style={cell}>Observations - Fiscalização:</td><td style={input}></td></tr>
        </tbody>
      </table>
      {/* status */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6 }}>
        <tbody>
          <tr><td style={{ ...sec, textAlign: 'center' }}>STATUS</td></tr>
          <tr><td style={{ ...cell, textAlign: 'center', padding: '8px' }}>☐ Approved&nbsp;&nbsp;&nbsp;&nbsp;☐ Rejected</td></tr>
        </tbody>
      </table>
    </div>
  );
}

Object.assign(window, { DocPreviewBlock, ReportPreviewBlock, DrawingSheet, RirSheet });
