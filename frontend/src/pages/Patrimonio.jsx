import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

// ─── Dados: Patrimônio já cadastrado (Prefeitura / Estado) ───────────────────
const AMOSTRA_INICIAL = [
  { id: 1, nome: 'Extintor CO2 5kg',     quantidade: 4,  descricao: '5 kg pressurizado',    ambiente: 'Garagem',         conservacao: 'Bom',     numChapa: 'CH-0042', contaContabil: '1.2.3.001', valorAtual: 350.00,  categoria: 'ESTADO',     dataCadastro: '10/05/2026' },
  { id: 2, nome: 'Mangueira 40mm',        quantidade: 12, descricao: '15 metros cada',       ambiente: '2SGB',            conservacao: 'Regular', numChapa: 'CH-0043', contaContabil: '1.2.3.002', valorAtual: 180.00,  categoria: 'ESTADO',     dataCadastro: '12/05/2026' },
  { id: 5, nome: 'EPR Scott',             quantidade: 6,  descricao: 'Apare. respiração',    ambiente: '1SGB',            conservacao: 'Bom',     numChapa: 'CH-0051', contaContabil: '1.2.3.003', valorAtual: 2800.00, categoria: 'ESTADO',     dataCadastro: '01/06/2026' },
  { id: 9, nome: 'Viatura UR-17208',      quantidade: 1,  descricao: 'Veículo operacional',  ambiente: 'Garagem 1SGB',    conservacao: 'Bom',     numChapa: 'CH-0060', contaContabil: '1.2.2.001', valorAtual: 85000,   categoria: 'ESTADO',     dataCadastro: '05/06/2026' },
  { id: 3, nome: 'Cadeira de Escritório', quantidade: 8,  descricao: 'Giratória c/ braço',   ambiente: 'Administração',   conservacao: 'Bom',     numChapa: '',        contaContabil: '',          valorAtual: 0,       categoria: 'PREFEITURA', dataCadastro: '15/05/2026' },
  { id: 4, nome: 'Mesa de Reunião',       quantidade: 2,  descricao: '6 lugares',            ambiente: 'Sala de Reunião', conservacao: 'Bom',     numChapa: '',        contaContabil: '',          valorAtual: 0,       categoria: 'PREFEITURA', dataCadastro: '20/05/2026' },
  { id: 6, nome: 'Armário de Aço',        quantidade: 3,  descricao: '4 portas',             ambiente: 'Almoxarifado',    conservacao: 'Regular', numChapa: '',        contaContabil: '',          valorAtual: 0,       categoria: 'PREFEITURA', dataCadastro: '03/06/2026' },
  { id: 7, nome: 'Computador Desktop',    quantidade: 2,  descricao: 'Intel i5 / 8 GB RAM',  ambiente: 'Administração',   conservacao: 'Bom',     numChapa: '',        contaContabil: '',          valorAtual: 0,       categoria: 'PREFEITURA', dataCadastro: '05/06/2026' },
  { id: 8, nome: 'Impressora Laser',      quantidade: 1,  descricao: 'HP LaserJet M402dn',   ambiente: 'Secretaria',      conservacao: 'Regular', numChapa: '',        contaContabil: '',          valorAtual: 0,       categoria: 'PREFEITURA', dataCadastro: '08/06/2026' },
];

// ─── Dados: Processos de Inclusão — Viaturas ─────────────────────────────────
const AMOSTRA_VIATURAS_INCLUSAO = [
  { id: 'iv1', prefixo: 'UR-17220',  placa: 'REI-1234', modelo: 'Ranger',   marca: 'Ford',     ano: '2025', ambiente: '1SGB', statusProcesso: 'Em Análise',            dataCadastro: '02/06/2026' },
  { id: 'iv2', prefixo: 'ABS-17015', placa: 'RHN-5678', modelo: 'Sprinter', marca: 'Mercedes', ano: '2024', ambiente: '2SGB', statusProcesso: 'Documentação Pendente', dataCadastro: '05/06/2026' },
  { id: 'iv3', prefixo: 'VO-17003',  placa: 'RJT-9012', modelo: 'Agrale',   marca: 'Agrale',   ano: '2026', ambiente: '1SGB', statusProcesso: 'Aprovado',              dataCadastro: '08/06/2026' },
  { id: 'iv4', prefixo: 'UR-17221',  placa: 'RKW-3456', modelo: 'Toro',     marca: 'Fiat',     ano: '2025', ambiente: '2SGB', statusProcesso: 'Concluído',             dataCadastro: '10/06/2026' },
];

// ─── Dados: Processos de Inclusão — Materiais ────────────────────────────────
const AMOSTRA_MATERIAIS_INCLUSAO = [
  { id: 'im1', nome: 'Capacete de Combate',      quantidade: 10, categoria: 'ESTADO',     ambiente: '1SGB',          statusProcesso: 'Aprovado',              dataCadastro: '01/06/2026' },
  { id: 'im2', nome: 'Luva de Proteção Térmica', quantidade: 20, categoria: 'ESTADO',     ambiente: '2SGB',          statusProcesso: 'Em Análise',            dataCadastro: '04/06/2026' },
  { id: 'im3', nome: 'Cadeira Operacional',      quantidade: 4,  categoria: 'PREFEITURA', ambiente: 'Administração', statusProcesso: 'Documentação Pendente', dataCadastro: '07/06/2026' },
  { id: 'im4', nome: 'Extintor Pó Quím. 6kg',   quantidade: 8,  categoria: 'ESTADO',     ambiente: 'Garagem 2SGB',  statusProcesso: 'Reprovado',             dataCadastro: '09/06/2026' },
];

// ─── Dados: Processos de Exclusão — Viaturas ─────────────────────────────────
const AMOSTRA_VIATURAS_EXCLUSAO = [
  { id: 'ev1', prefixo: 'UR-17201',  placa: 'REA-2233', modelo: 'Transit',     marca: 'Ford',    ano: '2012', ambiente: '1SGB', statusProcesso: 'Aprovado',              dataCadastro: '01/06/2026' },
  { id: 'ev2', prefixo: 'ABS-17002', placa: 'RBX-4455', modelo: 'Boxer',       marca: 'Peugeot', ano: '2011', ambiente: '2SGB', statusProcesso: 'Em Análise',            dataCadastro: '03/06/2026' },
  { id: 'ev3', prefixo: 'VO-17001',  placa: 'RCC-6677', modelo: 'Iveco Daily', marca: 'Iveco',   ano: '2010', ambiente: '1SGB', statusProcesso: 'Documentação Pendente', dataCadastro: '06/06/2026' },
];

// ─── Dados: Processos de Exclusão — Materiais ────────────────────────────────
const AMOSTRA_MATERIAIS_EXCLUSAO = [
  { id: 'em1', nome: 'Mangueira 40mm (danificada)', quantidade: 3, categoria: 'ESTADO',     ambiente: '2SGB',          statusProcesso: 'Concluído',  dataCadastro: '30/05/2026' },
  { id: 'em2', nome: 'Cadeira Giratória (sucata)',   quantidade: 2, categoria: 'PREFEITURA', ambiente: 'Administração', statusProcesso: 'Aprovado',   dataCadastro: '02/06/2026' },
  { id: 'em3', nome: 'Extintor CO2 (vencido)',       quantidade: 1, categoria: 'ESTADO',     ambiente: 'Garagem',       statusProcesso: 'Em Análise', dataCadastro: '05/06/2026' },
];

// ─── Status do processo ───────────────────────────────────────────────────────
const STATUS_PROCESSO = ['Documentação Pendente', 'Em Análise', 'Aprovado', 'Concluído', 'Reprovado'];

const COR_STATUS = {
  'Documentação Pendente': { bg: '#fff3e0', color: '#e65100', borda: '#ffb74d' },
  'Em Análise':            { bg: '#e3f2fd', color: '#1565c0', borda: '#90caf9' },
  'Aprovado':              { bg: '#e8f5e9', color: '#2e7d32', borda: '#81c784' },
  'Concluído':             { bg: '#e0f2f1', color: '#004d40', borda: '#80cbc4' },
  'Reprovado':             { bg: '#ffebee', color: '#c62828', borda: '#ef9a9a' },
};

const COR_CONSERVACAO = {
  Bom:     { bg: '#e8f5e9', color: '#2e7d32' },
  Regular: { bg: '#fff8e1', color: '#f57f17' },
  Ruim:    { bg: '#ffebee', color: '#c62828' },
};

// ─── Paletas de cores por modo ────────────────────────────────────────────────
const CORES_INCLUSAO = {
  label:                'inclusão',
  primario:             '#1a237e',
  secundario:           '#6a1b9a',
  cardViaturas:         '#1565c0',
  cardMateriais:        '#6a1b9a',
  sombraViaturas:       'rgba(21,101,192,0.2)',
  sombraMateriais:      'rgba(106,27,154,0.2)',
  headerViaturas:       '#e3f2fd',
  headerMateriais:      '#f3e5f5',
  bordaHeaderViaturas:  '#90caf9',
  bordaHeaderMateriais: '#ce93d8',
  listraLinha:          '#f8fbff',
  botaoAdd:             '#43a047',
};

const CORES_EXCLUSAO = {
  label:                'exclusão',
  primario:             '#b71c1c',
  secundario:           '#0288d1',
  cardViaturas:         '#b71c1c',
  cardMateriais:        '#0288d1',
  sombraViaturas:       'rgba(183,28,28,0.2)',
  sombraMateriais:      'rgba(2,136,209,0.2)',
  headerViaturas:       '#ffebee',
  headerMateriais:      '#e1f5fe',
  bordaHeaderViaturas:  '#ef9a9a',
  bordaHeaderMateriais: '#81d4fa',
  listraLinha:          '#fffcfa',
  botaoAdd:             '#e53935',
};

// ─── Formulários vazios ───────────────────────────────────────────────────────
const FORM_VIATURA_VAZIO  = { prefixo: '', placa: '', modelo: '', marca: '', ano: '', ambiente: '', statusProcesso: 'Documentação Pendente' };
const FORM_MATERIAL_VAZIO = { nome: '', quantidade: '', categoria: 'ESTADO', ambiente: '', statusProcesso: 'Documentação Pendente' };

// ─── Utils ────────────────────────────────────────────────────────────────────
function gerarId()            { return Date.now() + Math.random(); }
function hoje()               { return new Date().toLocaleDateString('pt-BR'); }
function inclui(campo, busca) { return String(campo ?? '').toLowerCase().includes(busca.toLowerCase()); }
function fmtMoeda(v)          { return v ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'; }

// ─── Badges ───────────────────────────────────────────────────────────────────
function BadgeConservacao({ valor }) {
  if (!valor) return <span style={{ color: '#bbb' }}>—</span>;
  const c = COR_CONSERVACAO[valor] || { bg: '#f5f5f5', color: '#555' };
  return <span style={{ background: c.bg, color: c.color, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{valor}</span>;
}

function BadgeStatus({ valor }) {
  if (!valor) return <span style={{ color: '#bbb' }}>—</span>;
  const c = COR_STATUS[valor] || { bg: '#f5f5f5', color: '#555', borda: '#ccc' };
  return <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.borda}`, borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{valor}</span>;
}

function BadgeCategoria({ valor }) {
  const pref = valor === 'PREFEITURA';
  return <span style={{ background: pref ? '#e3f2fd' : '#f3e5f5', color: pref ? '#1565c0' : '#6a1b9a', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{valor}</span>;
}

// ─── Componentes de layout ────────────────────────────────────────────────────
function CampoBusca({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || ''}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
    </div>
  );
}

function Th({ children, color = '#1a237e', border = '#c5cae9' }) {
  return <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color, borderBottom: `1px solid ${border}`, whiteSpace: 'nowrap' }}>{children}</th>;
}
function Td({ children, center, muted, nowrap }) {
  return <td style={{ padding: '10px 16px', textAlign: center ? 'center' : 'left', fontWeight: center ? 700 : 400, color: muted ? '#888' : '#555', whiteSpace: nowrap ? 'nowrap' : 'normal' }}>{children}</td>;
}
function TabelaWrapper({ children, label }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'auto' }}>
      {label && <div style={{ padding: '12px 20px 8px', fontSize: 12, color: '#888' }}>{label}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>{children}</table>
    </div>
  );
}
function Empty({ msg, sub }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '48px 24px', textAlign: 'center', color: '#999', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
      <div style={{ fontWeight: 600 }}>{msg}</div>
      {sub && <div style={{ fontSize: 13, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
function CampoForm({ label, required, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}{required && <span style={{ color: '#e53935', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}
const inputStyle  = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const selectStyle = { ...inputStyle, background: '#fff', cursor: 'pointer' };

// ═════════════════════════════════════════════════════════════════════════════
// VIEW: MATERIAIS PREFEITURA
// ═════════════════════════════════════════════════════════════════════════════
function ViewPrefeitura({ itens }) {
  const base = itens.filter(i => i.categoria === 'PREFEITURA');
  const [bDesc, setBDesc] = useState('');
  const [bAmb,  setBAmb]  = useState('');
  const [bCons, setBCons] = useState('');

  const visiveis = base.filter(i => inclui(i.descricao, bDesc) && inclui(i.ambiente, bAmb) && inclui(i.conservacao, bCons));
  const totalQtd = base.reduce((s, i) => s + i.quantidade, 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#1a237e', color: '#fff', borderRadius: 12, padding: '18px 28px', minWidth: 160, boxShadow: '0 2px 8px rgba(26,35,126,0.18)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total de Materiais</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4 }}>{base.length}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{totalQtd} unidades</div>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
        <CampoBusca label="Descrição"             value={bDesc} onChange={setBDesc} placeholder="Ex: giratória..." />
        <CampoBusca label="Ambiente"              value={bAmb}  onChange={setBAmb}  placeholder="Ex: administração..." />
        <CampoBusca label="Estado de Conservação" value={bCons} onChange={setBCons} placeholder="Ex: Bom, Regular..." />
      </div>
      {visiveis.length === 0 ? <Empty msg="Nenhum material encontrado." sub="Ajuste os filtros." /> : (
        <TabelaWrapper label={`Exibindo ${visiveis.length} de ${base.length} itens`}>
          <thead>
            <tr style={{ background: '#e8eaf6' }}>
              {['Nome', 'Qtd', 'Descrição', 'Ambiente', 'Conservação', 'Cadastro'].map(h => <Th key={h}>{h}</Th>)}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((item, idx) => (
              <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafbff', borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '10px 16px', fontWeight: 600, color: '#1a237e' }}>{item.nome}</td>
                <Td center>{item.quantidade}</Td>
                <Td>{item.descricao || '—'}</Td>
                <Td>{item.ambiente  || '—'}</Td>
                <td style={{ padding: '10px 16px' }}><BadgeConservacao valor={item.conservacao} /></td>
                <Td muted nowrap>{item.dataCadastro}</Td>
              </tr>
            ))}
          </tbody>
        </TabelaWrapper>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// VIEW: MATERIAIS ESTADO
// ═════════════════════════════════════════════════════════════════════════════
function ViewEstado({ itens }) {
  const base = itens.filter(i => i.categoria === 'ESTADO');
  const [bAmb,   setBAmb]   = useState('');
  const [bChapa, setBChapa] = useState('');
  const [bDesc,  setBDesc]  = useState('');
  const [bConta, setBConta] = useState('');
  const [bValor, setBValor] = useState('');
  const [bCons,  setBCons]  = useState('');

  const visiveis = base.filter(i =>
    inclui(i.ambiente, bAmb) && inclui(i.numChapa, bChapa) && inclui(i.descricao, bDesc) &&
    inclui(i.contaContabil, bConta) && inclui(i.valorAtual, bValor) && inclui(i.conservacao, bCons)
  );
  const totalQtd   = base.reduce((s, i) => s + i.quantidade, 0);
  const totalValor = base.reduce((s, i) => s + (Number(i.valorAtual) || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ background: '#4a148c', color: '#fff', borderRadius: 12, padding: '18px 28px', minWidth: 160, boxShadow: '0 2px 8px rgba(74,20,140,0.18)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total de Materiais</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4 }}>{base.length}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{totalQtd} unidades</div>
        </div>
        <div style={{ background: '#1b5e20', color: '#fff', borderRadius: 12, padding: '18px 28px', minWidth: 180, boxShadow: '0 2px 8px rgba(27,94,32,0.18)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Valor Total Estimado</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{fmtMoeda(totalValor)}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>soma dos valores atuais</div>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        <CampoBusca label="Ambiente"              value={bAmb}   onChange={setBAmb}   placeholder="Ex: garagem..." />
        <CampoBusca label="Nº Chapa"              value={bChapa} onChange={setBChapa} placeholder="Ex: CH-0042..." />
        <CampoBusca label="Descrição"             value={bDesc}  onChange={setBDesc}  placeholder="Ex: 15 metros..." />
        <CampoBusca label="Conta Contábil"        value={bConta} onChange={setBConta} placeholder="Ex: 1.2.3.001..." />
        <CampoBusca label="Valor Atual"           value={bValor} onChange={setBValor} placeholder="Ex: 350..." />
        <CampoBusca label="Estado de Conservação" value={bCons}  onChange={setBCons}  placeholder="Ex: Bom..." />
      </div>
      {visiveis.length === 0 ? <Empty msg="Nenhum material encontrado." sub="Ajuste os filtros." /> : (
        <TabelaWrapper label={`Exibindo ${visiveis.length} de ${base.length} itens`}>
          <thead>
            <tr style={{ background: '#f3e5f5' }}>
              {['Nome', 'Qtd', 'Nº Chapa', 'Descrição', 'Ambiente', 'Conta Contábil', 'Valor Atual', 'Conservação', 'Cadastro'].map(h => (
                <Th key={h} color="#4a148c" border="#ce93d8">{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((item, idx) => (
              <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fdf8ff', borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '10px 16px', fontWeight: 600, color: '#4a148c' }}>{item.nome}</td>
                <Td center>{item.quantidade}</Td>
                <Td muted>{item.numChapa      || '—'}</Td>
                <Td>{item.descricao           || '—'}</Td>
                <Td>{item.ambiente            || '—'}</Td>
                <Td muted>{item.contaContabil || '—'}</Td>
                <Td nowrap>{item.valorAtual ? fmtMoeda(item.valorAtual) : '—'}</Td>
                <td style={{ padding: '10px 16px' }}><BadgeConservacao valor={item.conservacao} /></td>
                <Td muted nowrap>{item.dataCadastro}</Td>
              </tr>
            ))}
          </tbody>
        </TabelaWrapper>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// VIEW: PROCESSO (Inclusão e Exclusão compartilham a mesma estrutura)
// ═════════════════════════════════════════════════════════════════════════════
function ViewProcesso({ viaturas, materiais, onAddViatura, onAddMaterial, cores }) {
  const [subTab,       setSubTab]       = useState('viaturas');
  const [showForm,     setShowForm]     = useState(false);
  const [formViatura,  setFormViatura]  = useState(FORM_VIATURA_VAZIO);
  const [formMaterial, setFormMaterial] = useState(FORM_MATERIAL_VAZIO);
  const [erro,         setErro]         = useState('');
  const [sucesso,      setSucesso]      = useState('');

  function changeV(k, v) { setFormViatura(f  => ({ ...f, [k]: v })); setErro(''); setSucesso(''); }
  function changeM(k, v) { setFormMaterial(f => ({ ...f, [k]: v })); setErro(''); setSucesso(''); }

  function submitViatura(e) {
    e.preventDefault();
    if (!formViatura.prefixo.trim()) { setErro('Informe o prefixo da viatura.'); return; }
    onAddViatura({ id: gerarId(), ...formViatura, dataCadastro: hoje() });
    setFormViatura(FORM_VIATURA_VAZIO);
    setSucesso('Viatura registrada no processo.'); setShowForm(false);
  }
  function submitMaterial(e) {
    e.preventDefault();
    if (!formMaterial.nome.trim()) { setErro('Informe o nome do material.'); return; }
    if (!formMaterial.quantidade || Number(formMaterial.quantidade) <= 0) { setErro('Quantidade inválida.'); return; }
    onAddMaterial({ id: gerarId(), ...formMaterial, quantidade: Number(formMaterial.quantidade), dataCadastro: hoje() });
    setFormMaterial(FORM_MATERIAL_VAZIO);
    setSucesso('Material registrado no processo.'); setShowForm(false);
  }

  const subTabStyle = key => ({
    padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: 13,
    background: subTab === key ? cores.primario : '#f0f0f0',
    color:      subTab === key ? '#fff' : '#555',
    transition: 'all 0.15s',
  });

  return (
    <div>
      {/* Cards de totais */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ background: cores.cardViaturas, color: '#fff', borderRadius: 12, padding: '18px 28px', minWidth: 160, boxShadow: `0 2px 8px ${cores.sombraViaturas}`, cursor: 'pointer' }}
          onClick={() => { setSubTab('viaturas'); setShowForm(false); }}>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Viaturas</div>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 4 }}>{viaturas.length}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>em processo de {cores.label}</div>
        </div>
        <div style={{ background: cores.cardMateriais, color: '#fff', borderRadius: 12, padding: '18px 28px', minWidth: 160, boxShadow: `0 2px 8px ${cores.sombraMateriais}`, cursor: 'pointer' }}
          onClick={() => { setSubTab('materiais'); setShowForm(false); }}>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Materiais</div>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 4 }}>{materiais.length}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>em processo de {cores.label}</div>
        </div>
      </div>

      {/* Sub-tabs + botão adicionar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={subTabStyle('viaturas')}  onClick={() => { setSubTab('viaturas');  setShowForm(false); setErro(''); setSucesso(''); }}>🚗 Viaturas</button>
          <button style={subTabStyle('materiais')} onClick={() => { setSubTab('materiais'); setShowForm(false); setErro(''); setSucesso(''); }}>📦 Materiais</button>
        </div>
        <button onClick={() => { setShowForm(f => !f); setErro(''); setSucesso(''); }}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: showForm ? '#e0e0e0' : cores.botaoAdd, color: showForm ? '#333' : '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {showForm ? '✕ Cancelar' : `➕ Adicionar ${subTab === 'viaturas' ? 'Viatura' : 'Material'}`}
        </button>
      </div>

      {/* Feedback */}
      {erro    && <div style={{ background: '#fff3f3', border: '1px solid #e53935', borderRadius: 8, padding: '10px 14px', color: '#c62828', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{erro}</div>}
      {sucesso && <div style={{ background: '#f0fff4', border: '1px solid #43a047', borderRadius: 8, padding: '10px 14px', color: '#2e7d32', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{sucesso}</div>}

      {/* Formulário Viatura */}
      {showForm && subTab === 'viaturas' && (
        <form onSubmit={submitViatura} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          <CampoForm label="Prefixo" required><input style={inputStyle} value={formViatura.prefixo}        onChange={e => changeV('prefixo', e.target.value)}        placeholder="Ex: UR-17220" /></CampoForm>
          <CampoForm label="Placa">           <input style={inputStyle} value={formViatura.placa}           onChange={e => changeV('placa', e.target.value)}           placeholder="Ex: REI-1234" /></CampoForm>
          <CampoForm label="Modelo">          <input style={inputStyle} value={formViatura.modelo}          onChange={e => changeV('modelo', e.target.value)}          placeholder="Ex: Ranger" /></CampoForm>
          <CampoForm label="Marca">           <input style={inputStyle} value={formViatura.marca}           onChange={e => changeV('marca', e.target.value)}           placeholder="Ex: Ford" /></CampoForm>
          <CampoForm label="Ano">             <input style={inputStyle} value={formViatura.ano}             onChange={e => changeV('ano', e.target.value)}             placeholder="Ex: 2025" /></CampoForm>
          <CampoForm label="Ambiente">        <input style={inputStyle} value={formViatura.ambiente}        onChange={e => changeV('ambiente', e.target.value)}        placeholder="Ex: 1SGB" /></CampoForm>
          <CampoForm label="Status do Processo">
            <select style={selectStyle} value={formViatura.statusProcesso} onChange={e => changeV('statusProcesso', e.target.value)}>
              {STATUS_PROCESSO.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </CampoForm>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" style={{ width: '100%', padding: 11, background: cores.primario, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Salvar Viatura
            </button>
          </div>
        </form>
      )}

      {/* Formulário Material */}
      {showForm && subTab === 'materiais' && (
        <form onSubmit={submitMaterial} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          <CampoForm label="Nome do Material" required><input style={inputStyle} value={formMaterial.nome}       onChange={e => changeM('nome', e.target.value)}       placeholder="Ex: Capacete" /></CampoForm>
          <CampoForm label="Quantidade" required>       <input style={inputStyle} value={formMaterial.quantidade} onChange={e => changeM('quantidade', e.target.value)} placeholder="Ex: 10" type="number" /></CampoForm>
          <CampoForm label="Ambiente">                  <input style={inputStyle} value={formMaterial.ambiente}   onChange={e => changeM('ambiente', e.target.value)}   placeholder="Ex: 2SGB" /></CampoForm>
          <CampoForm label="Categoria">
            <select style={selectStyle} value={formMaterial.categoria} onChange={e => changeM('categoria', e.target.value)}>
              <option value="ESTADO">ESTADO</option>
              <option value="PREFEITURA">PREFEITURA</option>
            </select>
          </CampoForm>
          <CampoForm label="Status do Processo">
            <select style={selectStyle} value={formMaterial.statusProcesso} onChange={e => changeM('statusProcesso', e.target.value)}>
              {STATUS_PROCESSO.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </CampoForm>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" style={{ width: '100%', padding: 11, background: cores.secundario, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Salvar Material
            </button>
          </div>
        </form>
      )}

      {/* Tabela Viaturas */}
      {subTab === 'viaturas' && (
        viaturas.length === 0
          ? <Empty msg="Nenhuma viatura neste processo." sub='Use "Adicionar Viatura" para registrar.' />
          : (
            <TabelaWrapper label={`${viaturas.length} viatura${viaturas.length !== 1 ? 's' : ''} em processo`}>
              <thead>
                <tr style={{ background: cores.headerViaturas }}>
                  {['Prefixo', 'Placa', 'Modelo', 'Marca', 'Ano', 'Ambiente', 'Status do Processo', 'Cadastro'].map(h => (
                    <Th key={h} color={cores.cardViaturas} border={cores.bordaHeaderViaturas}>{h}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {viaturas.map((v, idx) => (
                  <tr key={v.id} style={{ background: idx % 2 === 0 ? '#fff' : cores.listraLinha, borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 700, color: cores.cardViaturas }}>{v.prefixo}</td>
                    <Td>{v.placa  || '—'}</Td>
                    <Td>{v.modelo || '—'}</Td>
                    <Td>{v.marca  || '—'}</Td>
                    <Td center>{v.ano || '—'}</Td>
                    <Td>{v.ambiente || '—'}</Td>
                    <td style={{ padding: '10px 16px' }}><BadgeStatus valor={v.statusProcesso} /></td>
                    <Td muted nowrap>{v.dataCadastro}</Td>
                  </tr>
                ))}
              </tbody>
            </TabelaWrapper>
          )
      )}

      {/* Tabela Materiais */}
      {subTab === 'materiais' && (
        materiais.length === 0
          ? <Empty msg="Nenhum material neste processo." sub='Use "Adicionar Material" para registrar.' />
          : (
            <TabelaWrapper label={`${materiais.length} material${materiais.length !== 1 ? 'is' : ''} em processo`}>
              <thead>
                <tr style={{ background: cores.headerMateriais }}>
                  {['Nome', 'Qtd', 'Categoria', 'Ambiente', 'Status do Processo', 'Cadastro'].map(h => (
                    <Th key={h} color={cores.cardMateriais} border={cores.bordaHeaderMateriais}>{h}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materiais.map((m, idx) => (
                  <tr key={m.id} style={{ background: idx % 2 === 0 ? '#fff' : cores.listraLinha, borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: cores.cardMateriais }}>{m.nome}</td>
                    <Td center>{m.quantidade}</Td>
                    <td style={{ padding: '10px 16px' }}><BadgeCategoria valor={m.categoria} /></td>
                    <Td>{m.ambiente || '—'}</Td>
                    <td style={{ padding: '10px 16px' }}><BadgeStatus valor={m.statusProcesso} /></td>
                    <Td muted nowrap>{m.dataCadastro}</Td>
                  </tr>
                ))}
              </tbody>
            </TabelaWrapper>
          )
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENTE RAIZ
// ═════════════════════════════════════════════════════════════════════════════
export default function Patrimonio() {
  const { modo } = useParams();
  const modoAtivo = modo || 'prefeitura';

  const [itens,             setItens]             = useState(AMOSTRA_INICIAL);
  const [viaturasInclusao,  setViaturasInclusao]  = useState(AMOSTRA_VIATURAS_INCLUSAO);
  const [materiaisInclusao, setMateriaisInclusao] = useState(AMOSTRA_MATERIAIS_INCLUSAO);
  const [viaturasExclusao,  setViaturasExclusao]  = useState(AMOSTRA_VIATURAS_EXCLUSAO);
  const [materiaisExclusao, setMateriaisExclusao] = useState(AMOSTRA_MATERIAIS_EXCLUSAO);

  const SUBTITULOS = {
    prefeitura: 'Materiais cedidos pela Prefeitura',
    estado:     'Materiais cedidos pelo Estado',
    inclusao:   'Processos de inclusão de Viaturas e Materiais',
    exclusao:   'Processos de exclusão de Viaturas e Materiais',
  };

  return (
    <div style={{ padding: 24, background: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, color: '#1a237e', fontWeight: 700 }}>🏛️ Patrimônio — 17GB</h2>
        <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>{SUBTITULOS[modoAtivo]}</p>
      </div>

      {modoAtivo === 'prefeitura' && <ViewPrefeitura itens={itens} />}
      {modoAtivo === 'estado'     && <ViewEstado     itens={itens} />}

      {modoAtivo === 'inclusao' && (
        <ViewProcesso
          viaturas={viaturasInclusao}
          materiais={materiaisInclusao}
          onAddViatura={v  => setViaturasInclusao(p  => [...p, v])}
          onAddMaterial={m => setMateriaisInclusao(p => [...p, m])}
          cores={CORES_INCLUSAO}
        />
      )}

      {modoAtivo === 'exclusao' && (
        <ViewProcesso
          viaturas={viaturasExclusao}
          materiais={materiaisExclusao}
          onAddViatura={v  => setViaturasExclusao(p  => [...p, v])}
          onAddMaterial={m => setMateriaisExclusao(p => [...p, m])}
          cores={CORES_EXCLUSAO}
        />
      )}
    </div>
  );
}
