// MERIS Home — assistente de conexão de fontes externas
// Porta a experiência do "Connector Studio" para a linguagem visual do MERIS:
// catálogo de conectores → wizard por etapas (form, teste, schema) → resumo com IA.
const { useState: useStateCN, useRef: useRefCN, useEffect: useEffectCN } = React;

// ---- catálogo de conectores ---------------------------------------------
const CONNECTOR_KINDS = [
  {
    kind: 'postgres', label: 'PostgreSQL', icon: 'database',
    desc: 'Banco relacional via conexão direta (read-only).',
    system: 'PostgreSQL', steps: ['Conexão', 'Testar', 'Schemas', 'Confirmar'],
    topic: 'operações e qualidade',
    suggestions: [
      'Quais NCs estão abertas há mais de 7 dias?',
      'Distribuição de defeitos por linha e turno',
      'Custo total de NCs do trimestre por fornecedor',
    ],
  },
  {
    kind: 'bigquery', label: 'BigQuery', icon: 'database',
    desc: 'Data warehouse do Google Cloud.',
    system: 'Google BigQuery', steps: ['Autenticação', 'Datasets', 'Confirmar'],
    topic: 'indicadores corporativos',
    suggestions: [
      'Avanço físico consolidado por área no último mês',
      'Custo realizado versus orçado por disciplina',
      'Evolução de homem-hora por semana',
    ],
  },
  {
    kind: 'snowflake', label: 'Snowflake', icon: 'layers',
    desc: 'Data warehouse analítico em nuvem.',
    system: 'Snowflake', steps: ['Conta', 'Credenciais', 'Schemas', 'Confirmar'],
    topic: 'data warehouse analítico',
    suggestions: [
      'Curva S consolidada dos últimos 12 meses',
      'Ranking de áreas por aderência ao plano',
      'Tendência de emissão documental por disciplina',
    ],
  },
  {
    kind: 'rest', label: 'API REST', icon: 'globe',
    desc: 'Endpoint HTTP/JSON com autenticação.',
    system: 'API REST', steps: ['Base e auth', 'Endpoints', 'Schema', 'Confirmar'],
    topic: 'sistemas integrados',
    suggestions: [
      'Pendências sincronizadas do sistema externo hoje',
      'Status das ordens de serviço em aberto',
      'Itens reprovados na última inspeção',
    ],
  },
  {
    kind: 'model3d', label: 'Modelo 3D', icon: 'boxes',
    desc: 'AVEVA E3D / PDMS ou AutoCAD Plant 3D.',
    system: 'Modelo 3D', steps: ['Plataforma', 'Origem', 'Projeto', 'Confirmar'],
    topic: 'estrutura, instrumentação e tubulação',
    suggestions: [
      'Quantas válvulas de bloqueio estão sem TAG no modelo?',
      'Lista de instrumentos da malha L-04',
      'Tubulações por especificação no nível +18 m',
    ],
  },
  {
    kind: 'json', label: 'Pacote JSON', icon: 'network',
    desc: 'Várias tabelas relacionadas em um pacote.',
    system: 'Pacote JSON', steps: ['Upload', 'Relações', 'Schema', 'Confirmar'],
    topic: 'NCs, atestados, equipamentos e fornecedores',
    suggestions: [
      'Quantas NCs por fornecedor cruzando com inspeções?',
      'Atestados pendentes por disciplina e sistema',
      'Equipamentos com mais eventos de manutenção e NCs',
    ],
  },
  {
    kind: 'csv', label: 'Planilha CSV', icon: 'table',
    desc: 'Arquivo .csv até 20 MB. Adição imediata.',
    system: 'CSV importado', steps: ['Upload', 'Colunas', 'Confirmar'],
    topic: 'a planilha importada',
    suggestions: [
      'Resuma as colunas e o que cada uma representa',
      'Quais TAGs estão sem data de conclusão?',
      'Distribuição de avanço por disciplina',
    ],
  },
];
const CONNECTOR_BY_KIND = {}; CONNECTOR_KINDS.forEach((c) => { CONNECTOR_BY_KIND[c.kind] = c; });

// ---- primitivas locais ---------------------------------------------------
function CnField(props) {
  return (
    <input {...props} style={{
      width: '100%', height: 38, padding: '0 12px', borderRadius: 9,
      border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)',
      fontSize: 13.5, color: 'var(--color-text-primary)', fontFamily: 'inherit', outline: 'none',
      ...(props.style || {}),
    }} />
  );
}
function CnLabel({ children, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-secondary)' }}>{children}</span>
      {sub && <span style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)', lineHeight: 1.45 }}>{sub}</span>}
    </div>
  );
}
function CnRow({ children, cols = 1 }) {
  return <div style={{ display: 'grid', gridTemplateColumns: cols === 1 ? '1fr' : `repeat(${cols}, 1fr)`, gap: 12, marginBottom: 16 }}>{children}</div>;
}
function GhostBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{ height: 36, padding: '0 14px', borderRadius: 9, border: '1px solid var(--color-border-strong)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>{children}</button>
  );
}
function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ height: 36, padding: '0 16px', borderRadius: 9, border: 'none', background: disabled ? 'var(--color-bg-subtle)' : 'var(--cta)', color: disabled ? 'var(--color-text-tertiary)' : '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, transition: 'background 120ms ease' }}>{children}</button>
  );
}
function CnNav({ onBack, onNext, nextLabel = 'Continuar', nextDisabled }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
      {onBack && <GhostBtn onClick={onBack}><Icon name="chevron-left" size={15} />Voltar</GhostBtn>}
      <PrimaryBtn onClick={onNext} disabled={nextDisabled}>{nextLabel}<Icon name="chevron-right" size={15} /></PrimaryBtn>
    </div>
  );
}
function AiNote({ children }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', background: 'var(--ai-bg)', border: '1px solid var(--ai)', borderRadius: 11, fontSize: 12.5, color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
      <span style={{ color: 'var(--ai-text)', display: 'flex', marginTop: 1, flexShrink: 0 }}><Icon name="sparkles" size={15} /></span>
      <span>{children}</span>
    </div>
  );
}
function Dropzone({ title, hint, icon = 'upload', onPick }) {
  const [over, setOver] = useStateCN(false);
  return (
    <button onClick={onPick}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onPick && onPick(); }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '40px 20px', borderRadius: 14, border: `1.5px dashed ${over ? 'var(--ai)' : 'var(--color-border-strong)'}`, background: over ? 'var(--ai-bg)' : 'var(--color-bg-subtle)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 120ms ease' }}>
      <span style={{ width: 46, height: 46, borderRadius: 999, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={21} /></span>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</span>
      <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{hint}</span>
    </button>
  );
}
function AuthCard({ active, onClick, title, sub, icon }) {
  return (
    <button onClick={onClick} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 7, padding: '14px 16px', background: active ? 'var(--ai-bg)' : 'var(--color-bg-subtle)', border: `1px solid ${active ? 'var(--ai)' : 'var(--color-border)'}`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 120ms ease' }}>
      <span style={{ color: active ? 'var(--ai-text)' : 'var(--color-text-tertiary)', display: 'flex' }}><Icon name={icon} size={17} /></span>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: active ? 'var(--ai-text)' : 'var(--color-text-primary)' }}>{title}</span>
      <span style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)', lineHeight: 1.45 }}>{sub}</span>
    </button>
  );
}
function Pills({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map((o) => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{ padding: '7px 13px', borderRadius: 9999, background: value === o.v ? 'var(--color-text-primary)' : 'transparent', color: value === o.v ? 'var(--color-bg-surface)' : 'var(--color-text-secondary)', border: `1px solid ${value === o.v ? 'var(--color-text-primary)' : 'var(--color-border)'}`, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>{o.l}</button>
      ))}
    </div>
  );
}

// Simula uma detecção/teste: spinner por ~750ms e então mostra o conteúdo.
function SimResult({ label, children, deps }) {
  const [loading, setLoading] = useStateCN(true);
  useEffectCN(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 750);
    return () => clearTimeout(t);
  }, deps || []);
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '34px 18px', background: 'var(--color-bg-subtle)', border: '1px dashed var(--color-border-strong)', borderRadius: 12, color: 'var(--color-text-tertiary)' }}>
        <span className="cn-spin" style={{ display: 'flex', color: 'var(--ai-text)' }}><Icon name="refresh-cw" size={19} /></span>
        <div style={{ fontSize: 12.5 }}>{label}</div>
      </div>
    );
  }
  return children;
}

// Tabela de schema detectado (coluna / tipo / amostra)
function SchemaTable({ rows }) {
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead>
          <tr style={{ background: 'var(--color-bg-subtle)' }}>
            {['Coluna', 'Tipo detectado', 'Amostra'].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '9px 12px', fontSize: 10.5, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
              <td className="font-mono" style={{ padding: '9px 12px', color: 'var(--color-text-primary)', fontWeight: 500 }}>{r[0]}</td>
              <td style={{ padding: '9px 12px' }}>
                <span style={{ display: 'inline-flex', padding: '2px 8px', background: 'var(--ai-bg)', color: 'var(--ai-text)', borderRadius: 9999, fontSize: 11, fontWeight: 600 }}>{r[1]}</span>
              </td>
              <td className="font-mono" style={{ padding: '9px 12px', color: 'var(--color-text-tertiary)', fontSize: 11.5 }}>{r[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Picker de schemas/datasets/módulos com checkbox
function CheckList({ items }) {
  const [on, setOn] = useStateCN(() => items.filter((i) => i.checked).map((i) => i.name));
  const toggle = (n) => setOn((s) => s.includes(n) ? s.filter((x) => x !== n) : [...s, n]);
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
      {items.map((s, i) => {
        const checked = on.includes(s.name);
        return (
          <label key={s.name} onClick={() => toggle(s.name)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--color-border)', cursor: 'pointer', background: checked ? 'var(--ai-bg)' : 'transparent', transition: 'background 120ms ease' }}>
            <span style={{ width: 18, height: 18, borderRadius: 5, marginTop: 1, flexShrink: 0, border: `1.5px solid ${checked ? 'var(--cta)' : 'var(--color-border-strong)'}`, background: checked ? 'var(--cta)' : 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{checked && <Icon name="check" size={13} />}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="font-mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{s.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{s.desc}</div>
            </div>
          </label>
        );
      })}
    </div>
  );
}

function TestOk({ rows, title = 'Conexão estabelecida com sucesso' }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '16px 18px', background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', borderRadius: 12 }}>
      <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--color-success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="check" size={16} /></span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-success-text)', marginBottom: 8 }}>{title}</div>
        <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ padding: '3px 10px 3px 0', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{r[0]}</td>
                <td className="font-mono" style={{ padding: '3px 0', color: 'var(--color-text-primary)', fontSize: 12 }}>{r[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Stepper --------------------------------------------------------------
function CnStepper({ steps, step }) {
  return (
    <div style={{ display: 'flex', padding: '14px 24px', gap: 4, borderBottom: '1px solid var(--color-border)' }}>
      {steps.map((s, i) => {
        const idx = i + 1, done = step > idx, cur = step === idx;
        return (
          <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 22, height: 22, borderRadius: 999, flexShrink: 0, background: done ? 'var(--cta)' : cur ? 'var(--color-text-primary)' : 'var(--color-bg-subtle)', color: done || cur ? '#fff' : 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{done ? <Icon name="check" size={12} /> : idx}</span>
            <span style={{ fontSize: 12, color: step >= idx ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)', fontWeight: cur ? 600 : 400, whiteSpace: 'nowrap' }}>{s}</span>
            {idx < steps.length && <span style={{ flex: 1, height: 1, background: done ? 'var(--cta)' : 'var(--color-border)' }} />}
          </div>
        );
      })}
    </div>
  );
}

// ---- Steps por conector ---------------------------------------------------
function PostgresSteps({ step, setStep, onName }) {
  if (step === 1) return (
    <>
      <AiNote>As credenciais ficam criptografadas no cofre do MERIS. Recomendamos um usuário <strong>somente leitura</strong>.</AiNote>
      <CnRow><CnLabel sub="identifica a fonte na lista (ex: prod-replica)">Nome amigável</CnLabel><CnField placeholder="prod-replica" onChange={(e) => onName && onName(e.target.value)} /></CnRow>
      <CnRow cols={2}>
        <div><CnLabel sub="hostname ou IP">Host</CnLabel><CnField placeholder="db.interno.empresa.com" /></div>
        <div><CnLabel sub="padrão 5432">Porta</CnLabel><CnField placeholder="5432" defaultValue="5432" /></div>
      </CnRow>
      <CnRow><CnLabel>Database</CnLabel><CnField placeholder="nome_do_banco" /></CnRow>
      <CnRow cols={2}>
        <div><CnLabel>Usuário</CnLabel><CnField placeholder="usuario_readonly" /></div>
        <div><CnLabel>Senha</CnLabel><CnField type="password" placeholder="••••••••••" /></div>
      </CnRow>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--color-text-secondary)' }}><input type="checkbox" defaultChecked style={{ accentColor: 'var(--cta)' }} /> Exigir SSL/TLS (recomendado)</label>
      <CnNav onNext={() => setStep(2)} nextLabel="Testar conexão" />
    </>
  );
  if (step === 2) return (
    <>
      <SimResult label="Testando conexão e medindo latência…">
        <TestOk rows={[['Servidor', 'PostgreSQL 15.4'], ['Latência', '118 ms'], ['Tabelas visíveis', '42'], ['Permissão', 'SELECT (read-only)']]} />
      </SimResult>
      <CnNav onBack={() => setStep(1)} onNext={() => setStep(3)} />
    </>
  );
  if (step === 3) return (
    <>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Marque os schemas que o MERIS vai indexar para consultas do agente.</div>
      <CheckList items={[
        { name: 'public', desc: '18 tabelas · cadastros e catálogos', checked: true },
        { name: 'qualidade', desc: '11 tabelas · NCs, inspeções e disposições', checked: true },
        { name: 'operacoes', desc: '9 tabelas · ordens de serviço e apontamentos', checked: false },
        { name: 'staging', desc: '4 tabelas · áreas temporárias de carga', checked: false },
      ]} />
      <CnNav onBack={() => setStep(2)} onNext={() => setStep(4)} />
    </>
  );
  return null;
}

function BigQuerySteps({ step, setStep }) {
  const [auth, setAuth] = useStateCN('oauth');
  if (step === 1) return (
    <>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>Escolha como o MERIS vai autenticar no Google Cloud.</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <AuthCard active={auth === 'oauth'} onClick={() => setAuth('oauth')} title="OAuth (Google Sign-In)" sub="Recomendado para times pequenos. Autorize com sua conta Google." icon="globe" />
        <AuthCard active={auth === 'sa'} onClick={() => setAuth('sa')} title="Service Account (JSON)" sub="Para produção. Cole o JSON de uma SA com BigQuery Data Viewer." icon="lock" />
      </div>
      {auth === 'oauth' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 12 }}>
          <span style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="globe" size={18} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>Continuar com Google</div>
            <div style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>Abre uma janela do Google · escopo: BigQuery read-only</div>
          </div>
          <PrimaryBtn onClick={() => setStep(2)}>Autorizar</PrimaryBtn>
        </div>
      ) : (
        <div><CnLabel sub="cole o JSON exportado do GCP IAM — armazenado só como hash + cofre">Service Account JSON</CnLabel>
          <textarea placeholder={'{\n  "type": "service_account",\n  "project_id": "...",\n  ...\n}'} style={{ width: '100%', minHeight: 140, padding: 12, borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--color-text-primary)', outline: 'none', resize: 'vertical' }} /></div>
      )}
      <CnNav onNext={() => setStep(2)} nextLabel="Validar e continuar" />
    </>
  );
  if (step === 2) return (
    <>
      <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)', marginBottom: 12 }}>Só a metadata é puxada — as queries continuam rodando no BigQuery.</div>
      <SimResult label="Listando datasets do projeto…">
        <CheckList items={[
          { name: 'obra_boaventura', desc: '14 tabelas · avanço, custo e HH', checked: true },
          { name: 'qualidade_corp', desc: '8 tabelas · NCs e auditorias', checked: true },
          { name: 'suprimentos', desc: '6 tabelas · contratos e fornecedores', checked: false },
        ]} />
      </SimResult>
      <CnNav onBack={() => setStep(1)} onNext={() => setStep(3)} />
    </>
  );
  return null;
}

function SnowflakeSteps({ step, setStep }) {
  if (step === 1) return (
    <>
      <CnRow><CnLabel sub="formato: <org>-<account>.snowflakecomputing.com">Account identifier</CnLabel><CnField placeholder="empresa-prod.us-east-1" /></CnRow>
      <CnRow cols={2}>
        <div><CnLabel sub="warehouse de compute">Warehouse</CnLabel><CnField placeholder="ANALYTICS_WH" /></div>
        <div><CnLabel sub="role com acesso de leitura">Role</CnLabel><CnField placeholder="READER_ROLE" /></div>
      </CnRow>
      <CnRow><CnLabel sub="banco padrão (pode trocar depois)">Database</CnLabel><CnField placeholder="ANALYTICS" /></CnRow>
      <CnNav onNext={() => setStep(2)} />
    </>
  );
  if (step === 2) return (
    <>
      <AiNote>O Snowflake recomenda <strong>key-pair</strong> em produção. Aceita usuário/senha para desenvolvimento.</AiNote>
      <CnRow><CnLabel>Usuário</CnLabel><CnField placeholder="USUARIO" /></CnRow>
      <CnRow><CnLabel sub="ou cole a private key (PKCS8) para key-pair auth">Senha</CnLabel><CnField type="password" placeholder="••••••••••" /></CnRow>
      <CnNav onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="Testar e continuar" />
    </>
  );
  if (step === 3) return (
    <>
      <SimResult label="Validando credenciais e listando schemas…">
        <>
          <div style={{ marginBottom: 12 }}><TestOk title="Warehouse ativo" rows={[['Edição', 'Enterprise'], ['Região', 'us-east-1'], ['Latência', '143 ms']]} /></div>
          <CheckList items={[
            { name: 'ANALYTICS.PUBLIC', desc: '22 tabelas · marts consolidados', checked: true },
            { name: 'ANALYTICS.STAGING', desc: '15 tabelas · cargas intermediárias', checked: false },
          ]} />
        </>
      </SimResult>
      <CnNav onBack={() => setStep(2)} onNext={() => setStep(4)} />
    </>
  );
  return null;
}

function RestSteps({ step, setStep }) {
  const [auth, setAuth] = useStateCN('bearer');
  if (step === 1) return (
    <>
      <CnRow><CnLabel sub="ex: https://api.fornecedor.com ou base REST">Base URL</CnLabel><CnField placeholder="https://api.fornecedor.com" /></CnRow>
      <CnRow><CnLabel>Autenticação</CnLabel>
        <Pills value={auth} onChange={setAuth} options={[{ v: 'none', l: 'Nenhuma' }, { v: 'bearer', l: 'Bearer token' }, { v: 'apikey', l: 'API key (header)' }, { v: 'basic', l: 'Basic auth' }]} />
      </CnRow>
      {auth === 'bearer' && <CnRow><CnLabel sub="injetado como Authorization: Bearer <token>">Token</CnLabel><CnField type="password" placeholder="••••••••" /></CnRow>}
      {auth === 'apikey' && <CnRow cols={2}><CnField placeholder="X-API-Key" defaultValue="X-API-Key" /><CnField type="password" placeholder="••••••••" /></CnRow>}
      {auth === 'basic' && <CnRow cols={2}><CnField placeholder="usuário" /><CnField type="password" placeholder="senha" /></CnRow>}
      <CnNav onNext={() => setStep(2)} />
    </>
  );
  if (step === 2) return (
    <>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>O MERIS detecta endpoints automaticamente via OpenAPI ou introspecção.</div>
      <SimResult label="Lendo a base e mapeando endpoints…">
        <CheckList items={[
          { name: 'GET /ordens', desc: 'Ordens de serviço · ~3.200 registros', checked: true },
          { name: 'GET /inspecoes', desc: 'Inspeções e resultados · ~1.870 registros', checked: true },
          { name: 'GET /fornecedores', desc: 'Cadastro de fornecedores · ~140 registros', checked: false },
        ]} />
      </SimResult>
      <CnNav onBack={() => setStep(1)} onNext={() => setStep(3)} />
    </>
  );
  if (step === 3) return (
    <>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Schema inferido a partir das primeiras 100 respostas reais.</div>
      <SimResult label="Inferindo schema a partir do sample…">
        <SchemaTable rows={[['id', 'string', 'OS-2401'], ['status', 'enum', 'aberta'], ['disciplina', 'string', 'elétrica'], ['abertura', 'datetime', '2026-06-12T09:20'], ['valor', 'number', '12480.50']]} />
      </SimResult>
      <CnNav onBack={() => setStep(2)} onNext={() => setStep(4)} />
    </>
  );
  return null;
}

function Model3DSteps({ step, setStep }) {
  const [platform, setPlatform] = useStateCN('e3d');
  const [origin, setOrigin] = useStateCN('cloud');
  if (step === 1) return (
    <>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>Qual plataforma gerou o modelo? O MERIS usa isso para extrair TAGs, equipamentos e instrumentação.</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <AuthCard active={platform === 'e3d'} onClick={() => setPlatform('e3d')} title="AVEVA E3D / PDMS" sub="Importa via API do AVEVA Connect ou arquivos .pmd / .dgn / .rvm." icon="boxes" />
        <AuthCard active={platform === 'plant3d'} onClick={() => setPlatform('plant3d')} title="AutoCAD Plant 3D" sub="Plant 3D / Navisworks via Autodesk Construction Cloud ou .dwg / .nwd." icon="layers" />
      </div>
      <CnLabel>Origem do modelo</CnLabel>
      <Pills value={origin} onChange={setOrigin} options={[{ v: 'cloud', l: platform === 'e3d' ? 'AVEVA Connect (nuvem)' : 'Autodesk BIM 360 (nuvem)' }, { v: 'file', l: 'Upload de arquivo' }]} />
      <CnNav onNext={() => setStep(2)} />
    </>
  );
  if (step === 2) {
    if (origin === 'cloud') return (
      <>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>Autorize o MERIS a ler {platform === 'e3d' ? 'o AVEVA Connect' : 'o Autodesk Construction Cloud'}. Escopo somente leitura.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', background: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', borderRadius: 12, marginBottom: 16 }}>
          <span style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={platform === 'e3d' ? 'boxes' : 'layers'} size={18} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>Continuar com {platform === 'e3d' ? 'AVEVA Connect' : 'Autodesk'}</div>
            <div style={{ fontSize: 11.5, color: 'var(--color-text-tertiary)', marginTop: 2 }}>Escopo: model.read · metadata.read · sem escrita</div>
          </div>
          <PrimaryBtn onClick={() => setStep(3)}>Autorizar</PrimaryBtn>
        </div>
        <CnNav onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="Buscar projetos" />
      </>
    );
    return (
      <>
        <Dropzone title={`Arraste o modelo ${platform === 'e3d' ? '(.pmd, .dgn, .rvm)' : '(.dwg, .nwd, .nwc)'}`} hint="Até 2 GB · processamento em background · gera índice de TAGs e atributos" onPick={() => setStep(3)} />
        <CnNav onBack={() => setStep(1)} onNext={() => setStep(3)} />
      </>
    );
  }
  if (step === 3) return (
    <>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Selecione o projeto e os elementos que o MERIS vai indexar.</div>
      <SimResult label="Indexando elementos do modelo…">
        <CheckList items={[
          { name: 'UGH Boaventura · Unidade 4730', desc: 'Equipamentos e instrumentação · 8.410 elementos', checked: true },
          { name: 'Tubulação e suportes', desc: 'Linhas, specs e suportes · 12.270 elementos', checked: true },
          { name: 'Estrutura metálica', desc: 'Perfis e conexões · 5.140 elementos', checked: false },
        ]} />
      </SimResult>
      <CnNav onBack={() => setStep(2)} onNext={() => setStep(4)} />
    </>
  );
  return null;
}

function JsonSteps({ step, setStep, onPick }) {
  if (step === 1) return (
    <>
      <AiNote>Arraste a pasta ou os arquivos <span className="font-mono">.json</span>. O MERIS detecta as chaves estrangeiras (<span className="font-mono">_id</span>, <span className="font-mono">fk_*</span>, <span className="font-mono">_ref</span>) e valida com os valores reais.</AiNote>
      <Dropzone icon="network" title="Arraste os arquivos JSON ou clique para selecionar" hint="Vários arquivos · cada um vira uma tabela relacionável" onPick={() => { onPick && onPick(); setStep(2); }} />
      <CnNav onNext={() => setStep(2)} />
    </>
  );
  if (step === 2) return (
    <>
      <SimResult label="Detectando relações entre as tabelas…">
        <>
          <AiNote><strong>3 relações</strong> detectadas com alta confiança entre 4 tabelas — combinei nomes de campos com validação dos valores reais (≥95% dos IDs existentes na tabela alvo).</AiNote>
          <RelTable rows={[
            { from: 'ncs.fornecedor_id', to: 'fornecedores.id', conf: 'alta', match: '482/482 (100%)' },
            { from: 'inspecoes.equipamento_id', to: 'equipamentos.id', conf: 'alta', match: '1.204/1.210 (99%)' },
            { from: 'atestados.disciplina_id', to: 'disciplinas.id', conf: 'alta', match: '96/98 (98%)' },
          ]} />
        </>
      </SimResult>
      <CnNav onBack={() => setStep(1)} onNext={() => setStep(3)} />
    </>
  );
  if (step === 3) return (
    <>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>4 tabelas indexadas como base relacional.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {[['ncs', '482 reg · 14 campos', 2], ['inspecoes', '1.210 reg · 9 campos', 1], ['equipamentos', '640 reg · 11 campos', 1], ['fornecedores', '140 reg · 7 campos', 1]].map((t) => (
          <div key={t[0]} style={{ padding: '11px 13px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="table" size={13} style={{ color: 'var(--color-text-tertiary)' }} /><span className="font-mono" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>{t[0]}</span></div>
            <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--color-text-tertiary)', marginTop: 5 }}>{t[1]}</div>
            <div style={{ fontSize: 10.5, color: 'var(--ai-text)', marginTop: 5, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="link-2" size={10} />{t[2]} {t[2] === 1 ? 'relação' : 'relações'}</div>
          </div>
        ))}
      </div>
      <CnNav onBack={() => setStep(2)} onNext={() => setStep(4)} />
    </>
  );
  return null;
}
function RelTable({ rows }) {
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead><tr style={{ background: 'var(--color-bg-subtle)' }}>
          {['Relação', 'Valores que batem', 'Confiança'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '9px 12px', fontSize: 10.5, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--color-border)' }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
              <td className="font-mono" style={{ padding: '9px 12px', color: 'var(--color-text-primary)' }}>{r.from} <span style={{ color: 'var(--ai-text)' }}>→</span> {r.to}</td>
              <td className="font-mono" style={{ padding: '9px 12px', color: 'var(--color-text-secondary)', fontSize: 11.5 }}>{r.match}</td>
              <td style={{ padding: '9px 12px' }}><Badge tone="success" dot>{r.conf}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CsvSteps({ step, setStep, onPick }) {
  if (step === 1) return (
    <>
      <Dropzone title="Arraste um CSV ou clique para selecionar" hint="Até 20 MB · UTF-8 · vírgula, ponto-e-vírgula ou tab" onPick={() => { onPick && onPick(); setStep(2); }} />
      <CnNav onNext={() => setStep(2)} />
    </>
  );
  if (step === 2) return (
    <>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>O MERIS detectou os tipos automaticamente. Confira a amostra:</div>
      <SimResult label="Lendo o arquivo e detectando colunas…">
        <SchemaTable rows={[['tag', 'string', 'TQ-07-1102'], ['disciplina', 'string', 'instrumentação'], ['avanco_pct', 'number', '72.5'], ['data_conclusao', 'date', '2026-07-18'], ['responsavel', 'string', 'Rafael L.']]} />
      </SimResult>
      <CnNav onBack={() => setStep(1)} onNext={() => setStep(3)} />
    </>
  );
  return null;
}

// ---- Resumo final ---------------------------------------------------------
function SummaryStep({ meta, name, onBack, onComplete }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '16px 18px', background: 'var(--ai-bg)', border: '1px solid var(--ai)', borderRadius: 12 }}>
        <span style={{ color: 'var(--ai-text)', display: 'flex', marginTop: 2, flexShrink: 0 }}><Icon name="sparkles" size={17} /></span>
        <div style={{ flex: 1, fontSize: 13.5, color: 'var(--color-text-primary)', lineHeight: 1.55 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Pronto para perguntar.</div>
          <div style={{ color: 'var(--color-text-secondary)' }}>O MERIS analisou o conteúdo e identificou que essa fonte é sobre <strong>{meta.topic}</strong>. Algumas perguntas que você já pode fazer:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {meta.suggestions.map((q, i) => (
              <button key={i} onClick={() => onComplete(q)}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ai)'; e.currentTarget.style.background = 'var(--color-bg-surface)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-bg-surface)'; }}
                style={{ textAlign: 'left', padding: '9px 12px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 9, fontSize: 12.5, color: 'var(--color-text-secondary)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 9, transition: 'border-color 120ms ease' }}>
                <Icon name="message-square" size={14} style={{ color: 'var(--ai-text)', flexShrink: 0 }} />“{q}”
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Fonte: <span className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>{name}</span></span>
        <div style={{ display: 'flex', gap: 8 }}>
          <GhostBtn onClick={onBack}><Icon name="chevron-left" size={15} />Voltar</GhostBtn>
          <PrimaryBtn onClick={() => onComplete(null)}><Icon name="check" size={15} />Conectar fonte</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

// ---- Catálogo (picker) ----------------------------------------------------
function ConnectorPicker({ onPick }) {
  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }} className="sb-scroll">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Escolha o tipo de fonte</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {CONNECTOR_KINDS.map((c) => (
            <button key={c.kind} onClick={() => onPick(c.kind)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ai)'; e.currentTarget.style.background = 'var(--ai-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-bg-surface)'; }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 120ms ease' }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--color-bg-subtle)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={c.icon} size={19} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.label}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 3, lineHeight: 1.45 }}>{c.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Modal principal ------------------------------------------------------
function ConnectorModal({ onClose, onComplete, initialKind = null }) {
  const [kind, setKind] = useStateCN(typeof initialKind === 'string' ? initialKind : null);
  const [step, setStep] = useStateCN(1);
  const [name, setName] = useStateCN('');
  const meta = kind ? CONNECTOR_BY_KIND[kind] : null;
  const lastStep = meta ? meta.steps.length : 0;
  const reset = () => { setKind(null); setStep(1); setName(''); };
  const defaultName = meta ? (name || `${meta.label} · ${meta.system}`) : '';

  const finish = (question) => {
    onComplete && onComplete({ kind, label: meta.label, system: meta.system, icon: meta.icon, name: defaultName, question });
  };

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onMouseDown={(e) => e.stopPropagation()} style={{ width: 'min(840px, 96vw)', height: 'min(640px, 92vh)', background: 'var(--color-bg-surface)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 22px', borderBottom: '1px solid var(--color-border)' }}>
          {kind && <button onClick={reset} title="Voltar ao catálogo" style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="chevron-left" size={18} /></button>}
          <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--ai-bg)', color: 'var(--ai-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={kind ? meta.icon : 'database'} size={17} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>{kind ? `Conectar fonte · ${meta.label}` : 'Conectar fonte externa'}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{kind ? `Passo ${step} de ${lastStep}` : 'Bancos, data warehouses, APIs, modelos 3D e planilhas'}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={18} /></button>
        </div>

        {!kind && <ConnectorPicker onPick={(k) => { setKind(k); setStep(1); }} />}

        {kind && (
          <>
            <CnStepper steps={meta.steps} step={step} />
            <div className="sb-scroll" style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              <div style={{ maxWidth: 680, margin: '0 auto' }}>
                {step < lastStep && kind === 'postgres' && <PostgresSteps step={step} setStep={setStep} onName={setName} />}
                {step < lastStep && kind === 'bigquery' && <BigQuerySteps step={step} setStep={setStep} />}
                {step < lastStep && kind === 'snowflake' && <SnowflakeSteps step={step} setStep={setStep} />}
                {step < lastStep && kind === 'rest' && <RestSteps step={step} setStep={setStep} />}
                {step < lastStep && kind === 'model3d' && <Model3DSteps step={step} setStep={setStep} />}
                {step < lastStep && kind === 'json' && <JsonSteps step={step} setStep={setStep} />}
                {step < lastStep && kind === 'csv' && <CsvSteps step={step} setStep={setStep} />}
                {step === lastStep && <SummaryStep meta={meta} name={defaultName} onBack={() => setStep(lastStep - 1)} onComplete={finish} />}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { CONNECTOR_KINDS, CONNECTOR_BY_KIND, ConnectorModal });
