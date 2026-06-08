// ============================================================
// RELATORIOS.gs — Módulo de Relatórios | MOTOMEC 17GB Frota
// ============================================================
//
// COMO USAR:
//   1. Extensões → Apps Script → Novo arquivo → Relatorios.gs
//   2. Cole todo este código.
//   3. No arquivo principal, dentro do onOpen() existente,
//      adicione ao final do menu:
//
//        adicionarMenuRelatorios_(ui, menu);
//
//      OU, se não houver onOpen(), este arquivo já define um.
//
// AJUSTE OBRIGATÓRIO:
//   Revise os blocos COL_* abaixo conforme as colunas reais
//   das suas abas antes de usar.
// ============================================================

// ─── Mapeamento de colunas (índice 1 = coluna A) ──────────

// ── FROTA: confirmado via screenshot 2026-06-03 ──────────
// A=PREFIXO, B=CÓDIGO, C=FIPE ESTIMADO, D=OPMCB, E=POSTO,
// F=PROPRIETARIO, G=PLACA, H=MARCA, I=MODELO, J=TIPO,
// K=ANO FABRICAÇÃO, L=ANO MODELO, ...
var REL_COL_FROTA = { PREFIXO: 1, PLACA: 7, MODELO: 9, MARCA: 8, FIPE: 3 };

// ── 1SGB: confirmado via screenshot 2026-06-03 ───────────
// A=VTR(prefixo), B=PLACA, C=KM ATUAL, D=VTR EM GARANTIA,
// E=PRÓX TROCA ÓLEO KM, F=PRÓX TROCA ÓLEO TEMPO,
// G=REVISÃO FREIO KM, H=DATA VENC BATERIA,
// I=STATUS ÓLEO KM, J=STATUS ÓLEO TEMPO,
// K=STATUS REVISÃO FREIO, L=STATUS BATERIA,
// M=DATA LAVAGEM, N=PNEUS KM PRÓX TROCA,
// O=KM TROCA EMBREAGEM, P=STATUS OPERACIONAL
var REL_COL_1SGB = {
  PREFIXO:   1,   // A — VTR (= PREFIXO)
  PLACA:     2,   // B — PLACA
  KM:        3,   // C — KM ATUAL
  OLEO_KM:   9,   // I — STATUS: ÓLEO KM
  OLEO_DATA: 10,  // J — STATUS: ÓLEO TEMPO
  FREIO:     11,  // K — STATUS: REVISÃO FREIO
  BATERIA:   12,  // L — STATUS: BATERIA
  STATUS:    16,  // P — STATUS OPERACIONAL
};

// ── 2SGB: confirmado via screenshot 2026-06-03 ───────────
// A=PREFIXO, B=PLACA, C=KM ATUAL,
// D=PRÓX TROCA ÓLEO KM, E=PRÓX TROCA ÓLEO TEMPO,
// F=REVISÃO FREIO KM, G=DATA VENC BATERIA,
// H=STATUS ÓLEO KM, I=STATUS ÓLEO TEMPO,
// J=STATUS REVISÃO FREIO, K=STATUS BATERIA,
// L=DATA LAVAGEM, M=PNEUS DATA TROCA,
// N=DATA TROCA EMBREAGEM, O=(vazia), P=STATUS OPERACIONAL
var REL_COL_2SGB = {
  PREFIXO:   1,   // A — PREFIXO
  PLACA:     2,   // B — PLACA
  KM:        3,   // C — KM ATUAL
  OLEO_KM:   8,   // H — STATUS: ÓLEO KM
  OLEO_DATA: 9,   // I — STATUS: ÓLEO TEMPO
  FREIO:     10,  // J — STATUS: REVISÃO FREIO
  BATERIA:   11,  // K — STATUS: BATERIA
  STATUS:    16,  // P — STATUS OPERACIONAL (coluna O vazia entre N e P)
};

// ── RIV_2026: confirmado via screenshot 2026-06-03 ───────
// A=VTR(prefixo), B=NEO, C=DATA, D=KM, E=SERVIÇOS, F=EMPRESA, G=VALOR
var REL_COL_RIV = { PREFIXO: 1, DATA: 3, DESCRICAO: 5, VALOR: 7 };

// ── ABAST. VTR: confirmado via screenshot 2026-06-03 ─────
// É um Google Form — colunas A-E são metadados do formulário:
// A=Carimbo, B=Email, C=Posto, D=Nome guerra, E=Unidade,
// F=PREFIXO DA VIATURA, G=CONFIRME A PLACA,
// H=DATA, I=HODÔMETRO (km), J=VOLUME (litros), K=VALOR TOTAL
var REL_COL_ABAST  = { PREFIXO: 6, PLACA: 7, DATA: 8, KM: 9, LITROS: 10, VALOR_TOTAL: 11, VALOR_LITRO: 12 };

// ── GASTOS: confirmado via screenshot 2026-06-03 ─────────
// A=PREFIXO, B=VALORFIPE, C=GASTOTOTAL(2026), D=%FIPE, E=STATUS
var REL_COL_GASTOS = { PREFIXO: 1, TOTAL: 3 };

// ── TAREFAS: confirmado via screenshot 2026-06-03 ────────
// A=PREFIXO, B=PLACA, C=DESCRIÇÃO, D=RESPONSÁVEL, E=STATUS
// Status válidos: PENDENTE, FINALIZADA (não CONCLUIDA)
var REL_COL_TAREF = {
  DESCRICAO: 3,   // C — DESCRIÇÃO
  STATUS:    5,   // E — STATUS
};

// ─── Menu ─────────────────────────────────────────────────

/**
 * Chame esta função de dentro do onOpen() principal:
 *   adicionarMenuRelatorios_(ui, menu);
 */
function adicionarMenuRelatorios_(ui, menu) {
  menu.addSeparator().addSubMenu(
    ui.createMenu('📊 Relatórios')
      .addItem('📋 Relatório da Frota',                    'menuRelatorioFrota')
      .addItem('🔧 Relatório de Manutenções por Viatura',  'menuRelatorioManutencao')
      .addItem('⛽ Relatório de Abastecimento por Viatura','menuRelatorioAbastecimento')
      .addItem('📈 Relatório Executivo',                   'menuRelatorioExecutivo')
  );
}

// Se não houver onOpen() no projeto, descomente abaixo:
// function onOpen() {
//   var ui = SpreadsheetApp.getUi();
//   var menu = ui.createMenu('🚀 FROTA');
//   adicionarMenuRelatorios_(ui, menu);
//   menu.addToUi();
// }

// ─── Entrypoints do menu ──────────────────────────────────

function menuRelatorioFrota() {
  var ui = SpreadsheetApp.getUi();
  if (!_relValidarAbas_(['FROTA', '1SGB', '2SGB', 'GASTOS'])) return;
  try {
    var aba = _gerarRelatorioFrota_(SpreadsheetApp.getActiveSpreadsheet());
    _relOfereceExcel_(aba, 'relatorio_frota');
  } catch (e) {
    ui.alert('❌ Erro ao gerar relatório: ' + e.message);
  }
}

function menuRelatorioManutencao() {
  var ui = SpreadsheetApp.getUi();
  if (!_relValidarAbas_(['RIV_2026'])) return;

  var rPref = ui.prompt('🔧 Manutenções por Viatura',
    'Informe o prefixo da viatura:', ui.ButtonSet.OK_CANCEL);
  if (rPref.getSelectedButton() !== ui.Button.OK) return;
  var prefixo = rPref.getResponseText().trim().toUpperCase();
  if (!prefixo) { ui.alert('Prefixo não informado.'); return; }

  var rIni = ui.prompt('📅 Data inicial (DD/MM/AAAA)',
    'Deixe em branco para sem limite:', ui.ButtonSet.OK_CANCEL);
  if (rIni.getSelectedButton() !== ui.Button.OK) return;

  var rFim = ui.prompt('📅 Data final (DD/MM/AAAA)',
    'Deixe em branco para hoje:', ui.ButtonSet.OK_CANCEL);
  if (rFim.getSelectedButton() !== ui.Button.OK) return;

  try {
    var aba = _gerarRelatorioManutencao_(
      SpreadsheetApp.getActiveSpreadsheet(),
      prefixo,
      _relParseDataInput_(rIni.getResponseText()),
      _relParseDataInput_(rFim.getResponseText()) || new Date()
    );
    _relOfereceExcel_(aba, 'relatorio_manutencao_' + prefixo);
  } catch (e) {
    ui.alert('❌ Erro: ' + e.message);
  }
}

function menuRelatorioAbastecimento() {
  var ui = SpreadsheetApp.getUi();
  if (!_relValidarAbas_(['ABAST. VTR'])) return;

  var rId = ui.prompt('⛽ Abastecimento por Viatura',
    'Informe o prefixo ou placa:', ui.ButtonSet.OK_CANCEL);
  if (rId.getSelectedButton() !== ui.Button.OK) return;
  var id = rId.getResponseText().trim().toUpperCase();
  if (!id) { ui.alert('Identificador não informado.'); return; }

  var rIni = ui.prompt('📅 Data inicial (DD/MM/AAAA)',
    'Deixe em branco para sem limite:', ui.ButtonSet.OK_CANCEL);
  if (rIni.getSelectedButton() !== ui.Button.OK) return;

  var rFim = ui.prompt('📅 Data final (DD/MM/AAAA)',
    'Deixe em branco para hoje:', ui.ButtonSet.OK_CANCEL);
  if (rFim.getSelectedButton() !== ui.Button.OK) return;

  try {
    var aba = _gerarRelatorioAbastecimento_(
      SpreadsheetApp.getActiveSpreadsheet(),
      id,
      _relParseDataInput_(rIni.getResponseText()),
      _relParseDataInput_(rFim.getResponseText()) || new Date()
    );
    _relOfereceExcel_(aba, 'relatorio_abastecimento_' + id);
  } catch (e) {
    ui.alert('❌ Erro: ' + e.message);
  }
}

function menuRelatorioExecutivo() {
  var ui = SpreadsheetApp.getUi();
  var abas = ['FROTA', '1SGB', '2SGB', 'ABAST. VTR', 'RIV_2026', 'GASTOS', 'TAREFAS'];
  if (!_relValidarAbas_(abas)) return;

  var resp = ui.alert('📈 Relatório Executivo',
    'Gerar relatório executivo consolidado?\nIsso pode levar alguns segundos.',
    ui.ButtonSet.OK_CANCEL);
  if (resp !== ui.Button.OK) return;

  try {
    var ss  = SpreadsheetApp.getActiveSpreadsheet();
    var aba = _gerarRelatorioExecutivo_(ss);
    _relOfereceExportacaoExecutivo_(aba, 'relatorio_executivo');
  } catch (e) {
    ui.alert('❌ Erro: ' + e.message);
  }
}

// ─── Relatório 1: Frota ───────────────────────────────────

function _gerarRelatorioFrota_(ss) {
  var nomeAba = 'REL_FROTA_' + _relSufixoData_();
  _relRemoverAba_(ss, nomeAba);
  var rel = ss.insertSheet(nomeAba);

  var frota       = _relLerFrota_(ss);
  var gastosPorVt = _relLerGastos_(ss);

  var totalVt      = frota.length;
  var totalOp      = frota.filter(function(v){ return _relNorm_(v.status) === 'OPERANDO'; }).length;
  var totalBaixado = frota.filter(function(v){ return _relNorm_(v.status) === 'BAIXADO';  }).length;
  var totalReserva = frota.filter(function(v){ return _relNorm_(v.status) === 'RESERVA';  }).length;
  var custoTotal   = frota.reduce(function(a, v){ return a + (gastosPorVt[v.prefixo] || 0); }, 0);
  var fipeTotal    = frota.reduce(function(a, v){ return a + (v.fipe || 0); }, 0);
  var pctMedio     = fipeTotal > 0 ? custoTotal / fipeTotal * 100 : 0;

  // Cabeçalho e resumo
  _relEscreverTitulo_(rel, 1, 12, '📋 RELATÓRIO DA FROTA — 17º Grupamento de Bombeiros');
  var resumo = [
    ['Gerado em:', Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'), '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['▶ RESUMO', '', '', '', '', '', '', '', '', '', '', ''],
    ['Total de viaturas', totalVt, '', 'Custo total manutenção', _relFmtR$(custoTotal), '', '', '', '', '', '', ''],
    ['Operando',          totalOp, '', 'Valor total FIPE',        _relFmtR$(fipeTotal),  '', '', '', '', '', '', ''],
    ['Baixadas',          totalBaixado, '', '% médio custo/FIPE', _relFmtPct_(pctMedio), '', '', '', '', '', '', ''],
    ['Reserva',           totalReserva, '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
  ];
  rel.getRange(2, 1, resumo.length, 12).setValues(resumo);

  var startRow = 2 + resumo.length;
  var cab = [['Prefixo','Placa','KM Atual','Status','Valor FIPE','Gasto Manutenção','% Custo/FIPE','Óleo KM','Óleo Tempo','Freio','Bateria','Unidade']];
  rel.getRange(startRow, 1, 1, 12).setValues(cab);
  _relEstilizarCab_(rel, startRow, 12);

  var linhas = frota.map(function(v) {
    var g   = gastosPorVt[v.prefixo] || 0;
    var pct = v.fipe > 0 ? g / v.fipe * 100 : 0;
    var al  = v.alertas || {};
    return [v.prefixo, v.placa, v.km || '', v.status,
            _relFmtR$(v.fipe), _relFmtR$(g), _relFmtPct_(pct),
            al.oleoKm || '', al.oleoData || '', al.freio || '', al.bateria || '', v.unidade || ''];
  });

  if (linhas.length > 0) {
    rel.getRange(startRow + 1, 1, linhas.length, 12).setValues(linhas);
    _relColorirStatusColuna_(rel, startRow + 1, linhas.length, 4); // coluna status
  }

  rel.autoResizeColumns(1, 12);
  ss.setActiveSheet(rel);
  return rel;
}

// ─── Relatório 2: Manutenções por Viatura ─────────────────

function _gerarRelatorioManutencao_(ss, prefixo, dtIni, dtFim) {
  var nomeAba = 'REL_MAN_' + prefixo + '_' + _relSufixoData_();
  _relRemoverAba_(ss, nomeAba);
  var rel = ss.insertSheet(nomeAba);

  var dados = _relGetAba_(ss, 'RIV_2026').getDataRange().getValues();
  var linhas = [];

  for (var i = 1; i < dados.length; i++) {
    var row  = dados[i];
    var pref = _relNorm_(String(row[REL_COL_RIV.PREFIXO - 1] || ''));
    if (pref !== prefixo) continue;

    var data  = _relParseData_(row[REL_COL_RIV.DATA      - 1]);
    var descr = String(row[REL_COL_RIV.DESCRICAO - 1] || '');
    var valor = _relParseMoeda_(row[REL_COL_RIV.VALOR     - 1]);

    if (dtIni && data && data < dtIni) continue;
    if (dtFim && data && data > _relFimDia_(dtFim)) continue;
    if (data || descr || valor) {
      linhas.push({ data: data, dataFmt: data ? _relFmtData_(data) : '', descricao: descr, valor: valor });
    }
  }

  linhas.sort(function(a, b){ return (a.data || 0) - (b.data || 0); });

  _relEscreverTitulo_(rel, 1, 3, '🔧 RELATÓRIO DE MANUTENÇÕES — Viatura: ' + prefixo);

  if (linhas.length === 0) {
    rel.getRange(2, 1).setValue('Nenhuma manutenção encontrada para "' + prefixo + '"' +
      (dtIni ? ' no período de ' + _relFmtData_(dtIni) + ' a ' + _relFmtData_(dtFim) : '') + '.');
    ss.setActiveSheet(rel);
    return rel;
  }

  var totalGasto = linhas.reduce(function(a, l){ return a + l.valor; }, 0);
  var media      = totalGasto / linhas.length;
  var periodo    = (dtIni ? _relFmtData_(dtIni) : 'Sem limite') + ' a ' +
                   (dtFim ? _relFmtData_(dtFim) : 'hoje');

  var resumo = [
    ['Período:', periodo, ''],
    ['Gerado em:', Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'), ''],
    ['', '', ''],
    ['Total de manutenções:', linhas.length, ''],
    ['Total gasto:', _relFmtR$(totalGasto), ''],
    ['Média por manutenção:', _relFmtR$(media), ''],
    ['', '', ''],
  ];
  rel.getRange(2, 1, resumo.length, 3).setValues(resumo);

  var startRow = 2 + resumo.length;
  rel.getRange(startRow, 1, 1, 3).setValues([['Data', 'Descrição / Serviço', 'Valor']]);
  _relEstilizarCab_(rel, startRow, 3);

  var tab = linhas.map(function(l){ return [l.dataFmt, l.descricao, _relFmtR$(l.valor)]; });
  rel.getRange(startRow + 1, 1, tab.length, 3).setValues(tab);

  // Linha de total
  var totRow = startRow + 1 + tab.length;
  rel.getRange(totRow, 1, 1, 3).setValues([['TOTAL', '', _relFmtR$(totalGasto)]])
    .setFontWeight('bold').setBackground('#f0f0f0');

  rel.autoResizeColumns(1, 3);
  ss.setActiveSheet(rel);
  return rel;
}

// ─── Relatório 3: Abastecimento por Viatura ───────────────

function _gerarRelatorioAbastecimento_(ss, identificador, dtIni, dtFim) {
  var nomeAba = 'REL_ABAST_' + identificador + '_' + _relSufixoData_();
  _relRemoverAba_(ss, nomeAba);
  var rel = ss.insertSheet(nomeAba);

  var dados  = _relGetAba_(ss, 'ABAST. VTR').getDataRange().getValues();
  var linhas = [];

  for (var i = 1; i < dados.length; i++) {
    var row   = dados[i];
    var pref  = _relNorm_(String(row[REL_COL_ABAST.PREFIXO - 1] || ''));
    var placa = _relNorm_(String(row[REL_COL_ABAST.PLACA   - 1] || ''));
    if (pref !== identificador && placa !== identificador) continue;

    var data  = _relParseData_(row[REL_COL_ABAST.DATA        - 1]);
    if (dtIni && data && data < dtIni)           continue;
    if (dtFim && data && data > _relFimDia_(dtFim)) continue;

    var km         = _relParseKm_(row[REL_COL_ABAST.KM          - 1]);
    var litros     = _relParseMoeda_(row[REL_COL_ABAST.LITROS     - 1]);
    var valorTotal = _relParseMoeda_(row[REL_COL_ABAST.VALOR_TOTAL - 1]);
    var valorLitro = _relParseMoeda_(row[REL_COL_ABAST.VALOR_LITRO - 1]);

    linhas.push({ prefixo: pref, placa: placa,
                  data: data, dataFmt: data ? _relFmtData_(data) : '',
                  km: km, litros: litros, valorTotal: valorTotal, valorLitro: valorLitro });
  }

  linhas.sort(function(a, b){ return (a.data || 0) - (b.data || 0); });

  _relEscreverTitulo_(rel, 1, 7, '⛽ RELATÓRIO DE ABASTECIMENTO — Viatura: ' + identificador);

  if (linhas.length === 0) {
    rel.getRange(2, 1).setValue('Nenhum abastecimento encontrado para "' + identificador + '"' +
      (dtIni ? ' no período informado' : '') + '.');
    ss.setActiveSheet(rel);
    return rel;
  }

  var ultimoAbast = linhas[linhas.length - 1].dataFmt;
  var maiorKm     = Math.max.apply(null, linhas.map(function(l){ return l.km || 0; }));
  var periodo     = (dtIni ? _relFmtData_(dtIni) : 'Sem limite') + ' a ' +
                    (dtFim ? _relFmtData_(dtFim)  : 'hoje');

  var resumo = [
    ['Período:', periodo, '', '', '', '', ''],
    ['Gerado em:', Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'), '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['Total de abastecimentos:', linhas.length, '', '', '', '', ''],
    ['Último abastecimento:', ultimoAbast, '', '', '', '', ''],
    ['Maior KM registrado:', maiorKm, '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
  ];
  rel.getRange(2, 1, resumo.length, 7).setValues(resumo);

  var startRow = 2 + resumo.length;
  rel.getRange(startRow, 1, 1, 7)
    .setValues([['Prefixo','Placa','Data','KM','Litros','Valor Total','R$/Litro']]);
  _relEstilizarCab_(rel, startRow, 7);

  var tab = linhas.map(function(l, idx) {
    var intervalo = '';
    if (idx > 0 && linhas[idx-1].data && l.data) {
      intervalo = Math.round((l.data - linhas[idx-1].data) / 86400000) + ' dias';
    }
    _ = intervalo; // reservado para uso futuro na coluna
    return [l.prefixo, l.placa, l.dataFmt,
            l.km   || '',
            l.litros     > 0 ? l.litros     : '',
            l.valorTotal > 0 ? _relFmtR$(l.valorTotal) : '',
            l.valorLitro > 0 ? _relFmtR$(l.valorLitro) : ''];
  });
  rel.getRange(startRow + 1, 1, tab.length, 7).setValues(tab);

  rel.autoResizeColumns(1, 7);
  ss.setActiveSheet(rel);
  return rel;
}

// ─── Relatório 4: Executivo ───────────────────────────────

function _gerarRelatorioExecutivo_(ss) {
  var nomeAba = 'REL_EXECUTIVO_' + _relSufixoData_();
  _relRemoverAba_(ss, nomeAba);
  var rel = ss.insertSheet(nomeAba);

  var frota       = _relLerFrota_(ss);
  var gastosPorVt = _relLerGastos_(ss);
  var abastDados  = _relLerAbastecimentos_(ss);
  var tarefas     = _relLerTarefas_(ss);
  var hoje        = new Date();
  var limite30    = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Frota
  var totalVt      = frota.length;
  var totalOp      = frota.filter(function(v){ return _relNorm_(v.status) === 'OPERANDO'; }).length;
  var totalBaixado = frota.filter(function(v){ return _relNorm_(v.status) === 'BAIXADO';  }).length;
  var totalReserva = frota.filter(function(v){ return _relNorm_(v.status) === 'RESERVA';  }).length;
  var custoTotal   = frota.reduce(function(a, v){ return a + (gastosPorVt[v.prefixo] || 0); }, 0);
  var fipeTotal    = frota.reduce(function(a, v){ return a + (v.fipe || 0); }, 0);
  var pctMedio     = fipeTotal > 0 ? custoTotal / fipeTotal * 100 : 0;

  // Alertas consolidados
  var als = { oleoKmV:0, oleoKmA:0, oleoTpV:0, oleoTpA:0,
              freioV:0, freioA:0, batV:0, batA:0,
              lavV:0, lavA:0, pneuV:0, pneuA:0, embrV:0, embrA:0 };
  var totalAlertas = 0;
  frota.forEach(function(v) {
    var al = v.alertas || {};
    function _cnt(campo, kV, kA) {
      var s = _relNorm_(al[campo] || '');
      if (s === 'VENCIDO')   { als[kV]++; totalAlertas++; }
      else if (s === 'A VENCER') { als[kA]++; totalAlertas++; }
    }
    _cnt('oleoKm',   'oleoKmV', 'oleoKmA');
    _cnt('oleoData', 'oleoTpV', 'oleoTpA');
    _cnt('freio',    'freioV',  'freioA');
    _cnt('bateria',  'batV',    'batA');
    _cnt('lavagem',  'lavV',    'lavA');
    _cnt('pneu',     'pneuV',   'pneuA');
    _cnt('embreagem','embrV',   'embrA');
  });

  // Abastecimento
  var ultPorVt = {};
  abastDados.forEach(function(a) {
    if (!ultPorVt[a.prefixo] || a.data > ultPorVt[a.prefixo]) ultPorVt[a.prefixo] = a.data;
  });
  var semAbast30 = frota.filter(function(v) {
    var u = ultPorVt[v.prefixo];
    return !u || u < limite30;
  });
  var ultAbastGeral = abastDados.length > 0
    ? _relFmtData_(abastDados.reduce(function(a,b){ return a.data > b.data ? a : b; }).data)
    : 'N/D';

  // Tarefas
  var totTarefas  = tarefas.length;
  var pendentes   = tarefas.filter(function(t){ return _relNorm_(t.status) === 'PENDENTE'; }).length;
  var emAndamento = tarefas.filter(function(t){ return _relNorm_(t.status) === 'EM ANDAMENTO'; }).length;
  var concluidas  = tarefas.filter(function(t){
    var s = _relNorm_(t.status);
    return s === 'CONCLUIDA' || s === 'CONCLUIDO' || s === 'FINALIZADA' || s === 'FINALIZADO'; }).length;

  // Rankings
  var rankCusto = frota.slice().sort(function(a, b) {
    return (gastosPorVt[b.prefixo]||0) - (gastosPorVt[a.prefixo]||0); }).slice(0, 10);
  var rankKm = frota.slice().sort(function(a, b) {
    return (b.km||0) - (a.km||0); }).slice(0, 10);
  var rankPct = frota.slice().sort(function(a, b) {
    var pb = b.fipe > 0 ? (gastosPorVt[b.prefixo]||0)/b.fipe : 0;
    var pa = a.fipe > 0 ? (gastosPorVt[a.prefixo]||0)/a.fipe : 0;
    return pb - pa; }).slice(0, 10);
  var vtVencida = frota.filter(function(v) {
    var al = v.alertas || {};
    return Object.keys(al).some(function(k){ return _relNorm_(al[k]||'') === 'VENCIDO'; });
  });

  // Escritor linha a linha
  var row = 1;
  var TZ  = Session.getScriptTimeZone();

  function blk(cor, texto, cols) {
    cols = cols || 8;
    rel.getRange(row, 1, 1, cols).merge()
      .setValue(texto)
      .setBackground(cor).setFontColor('white').setFontWeight('bold')
      .setFontSize(11).setHorizontalAlignment('center');
    row++;
  }
  function par(label, valor) {
    rel.getRange(row, 1).setValue(label).setFontWeight('bold');
    rel.getRange(row, 2).setValue(valor);
    row++;
  }
  function cab(colunas) {
    rel.getRange(row, 1, 1, colunas.length).setValues([colunas])
      .setBackground('#2c3e50').setFontColor('white').setFontWeight('bold');
    row++;
  }
  function lin(valores) {
    rel.getRange(row, 1, 1, valores.length).setValues([valores]);
    row++;
  }
  function esp() { row++; }

  blk('#CC1F1F', '📈 RELATÓRIO EXECUTIVO — 17º Grupamento de Bombeiros');
  par('Gerado em:', Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm'));
  esp();

  blk('#1a3c5e', '🚗 FROTA');
  par('Total de veículos', totalVt);
  par('Operando', totalOp);
  par('Baixados', totalBaixado);
  par('Reserva', totalReserva);
  par('Custo total', _relFmtR$(custoTotal));
  par('Valor total FIPE', _relFmtR$(fipeTotal));
  par('% médio custo/FIPE', _relFmtPct_(pctMedio));
  esp();

  blk('#1a3c5e', '⛽ ABASTECIMENTO');
  par('Total de registros', abastDados.length);
  par('Último abastecimento', ultAbastGeral);
  par('Viaturas sem abast. há +30 dias', semAbast30.length);
  esp();

  blk('#1a3c5e', '🔧 MANUTENÇÃO — ALERTAS');
  par('Total de alertas', totalAlertas);
  cab(['Item', 'Vencido', 'A Vencer']);
  lin(['Óleo por KM',    als.oleoKmV, als.oleoKmA]);
  lin(['Óleo por Tempo', als.oleoTpV, als.oleoTpA]);
  lin(['Freio',          als.freioV,  als.freioA]);
  lin(['Bateria',        als.batV,    als.batA]);
  lin(['Lavagem',        als.lavV,    als.lavA]);
  lin(['Pneu',           als.pneuV,   als.pneuA]);
  lin(['Embreagem',      als.embrV,   als.embrA]);
  esp();

  blk('#1a3c5e', '📋 TAREFAS');
  par('Total', totTarefas);
  par('Pendentes', pendentes);
  par('Em andamento', emAndamento);
  par('Concluídas', concluidas);
  esp();

  blk('#1a3c5e', '🏆 TOP 10 — Maior custo de manutenção');
  cab(['Prefixo','Placa','Status','KM','Gasto','% FIPE','Unidade']);
  rankCusto.forEach(function(v) {
    var g = gastosPorVt[v.prefixo]||0;
    var p = v.fipe > 0 ? g/v.fipe*100 : 0;
    lin([v.prefixo, v.placa, v.status, v.km||'', _relFmtR$(g), _relFmtPct_(p), v.unidade||'']);
  });
  esp();

  blk('#1a3c5e', '🏆 TOP 10 — Maior KM atual');
  cab(['Prefixo','Placa','Status','KM','Unidade']);
  rankKm.forEach(function(v) {
    lin([v.prefixo, v.placa, v.status, v.km||'', v.unidade||'']);
  });
  esp();

  blk('#1a3c5e', '🏆 TOP 10 — Maior % gasto sobre FIPE');
  cab(['Prefixo','Placa','FIPE','Gasto','% FIPE']);
  rankPct.forEach(function(v) {
    var g = gastosPorVt[v.prefixo]||0;
    var p = v.fipe > 0 ? g/v.fipe*100 : 0;
    lin([v.prefixo, v.placa, _relFmtR$(v.fipe||0), _relFmtR$(g), _relFmtPct_(p)]);
  });
  esp();

  blk('#8B0000', '⚠️ Viaturas com manutenção vencida');
  cab(['Prefixo','Placa','Status','Alertas vencidos','Unidade']);
  vtVencida.forEach(function(v) {
    var al  = v.alertas || {};
    var vencidos = Object.keys(al).filter(function(k){
      return _relNorm_(al[k]||'') === 'VENCIDO'; }).join(', ');
    lin([v.prefixo, v.placa, v.status, vencidos, v.unidade||'']);
  });
  esp();

  blk('#8B0000', '⛽ Viaturas sem abastecimento há +30 dias');
  cab(['Prefixo','Placa','Status','Último Abastecimento','Unidade']);
  semAbast30.forEach(function(v) {
    var u = ultPorVt[v.prefixo];
    lin([v.prefixo, v.placa, v.status,
         u ? _relFmtData_(u) : 'Nunca registrado', v.unidade||'']);
  });

  rel.autoResizeColumns(1, 8);
  ss.setActiveSheet(rel);
  return rel;
}

// ─── Leitores de dados ────────────────────────────────────

function _relLerFrota_(ss) {
  var dFrota = _relGetAba_(ss, 'FROTA').getDataRange().getValues();
  var d1     = _relGetAba_(ss, '1SGB').getDataRange().getValues();
  var d2     = _relGetAba_(ss, '2SGB').getDataRange().getValues();

  var sgbMap = {};

  // 1SGB usa REL_COL_1SGB (tem coluna extra VTR EM GARANTIA em D)
  for (var i = 1; i < d1.length; i++) {
    var r1  = d1[i];
    var p1  = _relNorm_(String(r1[REL_COL_1SGB.PREFIXO - 1] || ''));
    if (!p1) continue;
    sgbMap[p1] = {
      km:      _relParseKm_(r1[REL_COL_1SGB.KM     - 1]),
      status:  _relNorm_(String(r1[REL_COL_1SGB.STATUS  - 1] || '')),
      unidade: '1SGB',
      alertas: {
        oleoKm:  String(r1[REL_COL_1SGB.OLEO_KM  - 1] || ''),
        oleoData:String(r1[REL_COL_1SGB.OLEO_DATA - 1] || ''),
        freio:   String(r1[REL_COL_1SGB.FREIO     - 1] || ''),
        bateria: String(r1[REL_COL_1SGB.BATERIA   - 1] || ''),
      },
    };
  }

  // 2SGB usa REL_COL_2SGB (sem a coluna extra)
  for (var j = 1; j < d2.length; j++) {
    var r2  = d2[j];
    var p2  = _relNorm_(String(r2[REL_COL_2SGB.PREFIXO - 1] || ''));
    if (!p2) continue;
    sgbMap[p2] = {
      km:      _relParseKm_(r2[REL_COL_2SGB.KM     - 1]),
      status:  _relNorm_(String(r2[REL_COL_2SGB.STATUS  - 1] || '')),
      unidade: '2SGB',
      alertas: {
        oleoKm:  String(r2[REL_COL_2SGB.OLEO_KM  - 1] || ''),
        oleoData:String(r2[REL_COL_2SGB.OLEO_DATA - 1] || ''),
        freio:   String(r2[REL_COL_2SGB.FREIO     - 1] || ''),
        bateria: String(r2[REL_COL_2SGB.BATERIA   - 1] || ''),
      },
    };
  }

  var resultado = [];
  for (var i = 1; i < dFrota.length; i++) {
    var row  = dFrota[i];
    var pref = _relNorm_(String(row[REL_COL_FROTA.PREFIXO - 1] || ''));
    if (!pref) continue;
    var sgb  = sgbMap[pref] || {};
    resultado.push({
      prefixo: pref,
      placa:   _relNorm_(String(row[REL_COL_FROTA.PLACA  - 1] || '')),
      modelo:  String(row[REL_COL_FROTA.MODELO - 1] || ''),
      marca:   String(row[REL_COL_FROTA.MARCA  - 1] || ''),
      fipe:    _relParseMoeda_(row[REL_COL_FROTA.FIPE    - 1]),
      km:      sgb.km      || 0,
      status:  sgb.status  || '',
      unidade: sgb.unidade || '',
      alertas: sgb.alertas || {},
    });
  }
  return resultado;
}

function _relLerGastos_(ss) {
  var dados = _relGetAba_(ss, 'GASTOS').getDataRange().getValues();
  var mapa  = {};
  for (var i = 1; i < dados.length; i++) {
    var pref = _relNorm_(String(dados[i][REL_COL_GASTOS.PREFIXO - 1] || ''));
    var val  = _relParseMoeda_(dados[i][REL_COL_GASTOS.TOTAL    - 1]);
    if (pref) mapa[pref] = (mapa[pref] || 0) + val;
  }
  return mapa;
}

function _relLerAbastecimentos_(ss) {
  var dados  = _relGetAba_(ss, 'ABAST. VTR').getDataRange().getValues();
  var lista  = [];
  for (var i = 1; i < dados.length; i++) {
    var row  = dados[i];
    var pref = _relNorm_(String(row[REL_COL_ABAST.PREFIXO - 1] || ''));
    var data = _relParseData_(row[REL_COL_ABAST.DATA      - 1]);
    if (pref && data) lista.push({ prefixo: pref, data: data });
  }
  return lista;
}

function _relLerTarefas_(ss) {
  var dados = _relGetAba_(ss, 'TAREFAS').getDataRange().getValues();
  var lista = [];
  for (var i = 1; i < dados.length; i++) {
    var s = String(dados[i][REL_COL_TAREF.STATUS - 1] || '');
    if (s) lista.push({ status: s });
  }
  return lista;
}

// ─── Exportação ───────────────────────────────────────────

function _relOfereceExcel_(sheet, baseName) {
  var ui   = SpreadsheetApp.getUi();
  var resp = ui.alert('✅ Relatório gerado!',
    'Aba "' + sheet.getName() + '" criada.\n\nExportar para Excel (.xlsx)?',
    ui.ButtonSet.YES_NO);
  if (resp === ui.Button.YES) _relExportarExcel_(sheet, baseName);
}

function _relOfereceExportacaoExecutivo_(sheet, baseName) {
  var ui   = SpreadsheetApp.getUi();
  ui.alert('✅ Relatório Executivo gerado!',
    'Aba "' + sheet.getName() + '" criada com sucesso.', ui.ButtonSet.OK);
  var r = ui.alert('Exportar', 'Exportar como:\nSIM → Excel (.xlsx)\nNÃO → PDF', ui.ButtonSet.YES_NO);
  if (r === ui.Button.YES) {
    _relExportarExcel_(sheet, baseName);
  } else {
    _relExportarPDF_(sheet, baseName);
  }
}

function _relExportarExcel_(sheet, baseName) {
  var ui   = SpreadsheetApp.getUi();
  var nome = baseName + '_' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd') + '.xlsx';
  try {
    var ss   = sheet.getParent();
    var url  = 'https://docs.google.com/spreadsheets/d/' + ss.getId() +
               '/export?format=xlsx&gid=' + sheet.getSheetId() +
               '&access_token=' + ScriptApp.getOAuthToken();
    var blob = UrlFetchApp.fetch(url).getBlob().setName(nome);
    var file = DriveApp.createFile(blob);
    ui.alert('📥 Excel salvo no Drive!', 'Arquivo: ' + nome + '\n\nLink:\n' + file.getUrl(), ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('❌ Erro ao exportar Excel', e.message, ui.ButtonSet.OK);
  }
}

function _relExportarPDF_(sheet, baseName) {
  var ui   = SpreadsheetApp.getUi();
  var nome = baseName + '_' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd') + '.pdf';
  try {
    var ss  = sheet.getParent();
    var url = 'https://docs.google.com/spreadsheets/d/' + ss.getId() +
              '/export?format=pdf&gid=' + sheet.getSheetId() +
              '&size=A4&portrait=false&fitw=true&gridlines=false' +
              '&access_token=' + ScriptApp.getOAuthToken();
    var blob = UrlFetchApp.fetch(url).getBlob().setName(nome);
    var file = DriveApp.createFile(blob);
    ui.alert('📥 PDF salvo no Drive!', 'Arquivo: ' + nome + '\n\nLink:\n' + file.getUrl(), ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('❌ Erro ao exportar PDF', e.message, ui.ButtonSet.OK);
  }
}

// ─── Validação ────────────────────────────────────────────

function _relValidarAbas_(nomes) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var faltando = nomes.filter(function(n) { return !ss.getSheetByName(n); });
  if (faltando.length > 0) {
    SpreadsheetApp.getUi().alert('⚠️ Abas não encontradas',
      'Necessárias mas ausentes:\n\n• ' + faltando.join('\n• '), SpreadsheetApp.getUi().ButtonSet.OK);
    return false;
  }
  return true;
}

// ─── Utilitários internos ─────────────────────────────────

function _relGetAba_(ss, nome) {
  // Tenta reutilizar getAba() do projeto, se disponível
  try { if (typeof getAba === 'function') return getAba(nome); } catch(e) {}
  var aba = ss.getSheetByName(nome);
  if (!aba) throw new Error('Aba "' + nome + '" não encontrada.');
  return aba;
}

function _relNorm_(s) {
  return String(s || '').trim().toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function _relParseKm_(val) {
  try { if (typeof _parseKm === 'function') return _parseKm(val); } catch(e) {}
  if (!val) return 0;
  return parseInt(String(val).replace(/\D/g, ''), 10) || 0;
}

function _relParseMoeda_(val) {
  try { if (typeof _parseMoeda === 'function') return _parseMoeda(val); } catch(e) {}
  if (!val) return 0;
  var s = String(val).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(s) || 0;
}

function _relParseData_(val) {
  try { if (typeof _parseData === 'function') return _parseData(val); } catch(e) {}
  if (!val) return null;
  if (val instanceof Date) return isNaN(val) ? null : val;
  var s = String(val).trim();
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
  var d = new Date(s);
  return isNaN(d) ? null : d;
}

function _relParseDataInput_(str) {
  if (!str || !str.trim()) return null;
  return _relParseData_(str.trim());
}

function _relFmtData_(date) {
  try { if (typeof _fmtData === 'function') return _fmtData(date); } catch(e) {}
  if (!date) return '';
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

function _relFimDia_(date) {
  var d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function _relSufixoData_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd');
}

function _relFmtR$(val) {
  val = val || 0;
  return 'R$ ' + val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function _relFmtPct_(val) {
  val = val || 0;
  return val.toFixed(2).replace('.', ',') + '%';
}

function _relRemoverAba_(ss, nome) {
  var aba = ss.getSheetByName(nome);
  if (aba) ss.deleteSheet(aba);
}

function _relEstilizarCab_(sheet, linha, numCols) {
  sheet.getRange(linha, 1, 1, numCols)
    .setBackground('#2c3e50').setFontColor('white')
    .setFontWeight('bold').setHorizontalAlignment('center');
}

function _relEscreverTitulo_(sheet, linha, numCols, texto) {
  sheet.getRange(linha, 1, 1, numCols).merge()
    .setValue(texto)
    .setBackground('#CC1F1F').setFontColor('white')
    .setFontWeight('bold').setFontSize(12)
    .setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setRowHeight ? null : null; // compatibilidade
  try { sheet.setRowHeight(linha, 30); } catch(e) {}
}

function _relColorirStatusColuna_(sheet, startRow, numRows, coluna) {
  for (var i = 0; i < numRows; i++) {
    var cell = sheet.getRange(startRow + i, coluna);
    var s    = _relNorm_(cell.getValue() || '');
    if (s === 'BAIXADO')  cell.setBackground('#ffcccc').setFontColor('#990000');
    else if (s === 'OPERANDO') cell.setBackground('#ccffcc').setFontColor('#006600');
    else if (s === 'RESERVA')  cell.setBackground('#fff3cc').setFontColor('#7a5c00');
  }
}
