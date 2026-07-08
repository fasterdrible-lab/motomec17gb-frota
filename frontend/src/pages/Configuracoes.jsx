import React, { useCallback, useEffect, useState } from 'react';
import { deleteUsuario, getMe, getUsuarios, updateUsuario } from '../services/api';

const statusLabels = {
  pendente: 'Aguardando liberação',
  ativo: 'Ativo',
  inativo: 'Inativo',
};

function getApiError(error, fallback) {
  return error?.response?.data?.detail || fallback;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// ═══════════════════════════════════════════════════════════════════════════
// MANUAL DO USUÁRIO
// ═══════════════════════════════════════════════════════════════════════════
const SECOES_MANUAL = [
  {
    id: 'motomec', icone: '📊', titulo: 'MOTOMEC — Gestão de Frota',
    cor: '#1a237e', corFundo: '#e8eaf6',
    topicos: [
      {
        icone: '🏠', titulo: 'Dashboard',
        desc: 'Visão geral da frota em tempo real. Exibe o total de viaturas, quantidade operando, em manutenção ou baixadas, alertas críticos (óleo, freio, bateria, lavagem) e os últimos abastecimentos. Os dados são atualizados automaticamente via Google Sheets.',
      },
      {
        icone: '🚗', titulo: 'Frota',
        desc: 'Listagem completa de todas as viaturas do 17GB. Para cada viatura são exibidos: prefixo, placa, modelo, marca, ano, SGB, KM atual, status operacional e alertas de manutenção pendentes. Clique em uma viatura para ver seus detalhes.',
      },
      {
        icone: '🔧', titulo: 'Manutenção',
        desc: 'Consulte e registre manutenções por viatura. Selecione o prefixo para ver o histórico completo (troca de óleo, revisão de freio, bateria, pneu e embreagem) com KM programados e datas de vencimento. O status de cada item é calculado automaticamente.',
      },
      {
        icone: '⚠️', titulo: 'Alertas',
        desc: 'Central de alertas automáticos gerados pelo sistema. Exibe viaturas com revisões vencidas ou próximas do vencimento, lavagens atrasadas e baixadas há muito tempo. Cada alerta indica o tipo, a viatura e a urgência.',
      },
      {
        icone: '💰', titulo: 'Gastos',
        desc: 'Painel financeiro por viatura. Mostra o valor FIPE estimado, gasto total acumulado em 2026 e o percentual do gasto sobre o valor do veículo. Viaturas com gasto acima de 50% do FIPE são destacadas com alerta.',
      },
      {
        icone: '📋', titulo: 'Tarefas',
        desc: 'Acompanhe tarefas pendentes e finalizadas por viatura. As tarefas são importadas diretamente da planilha Google Sheets. O status PENDENTE ou FINALIZADA é exibido com badge colorido.',
      },
      {
        icone: '⛽', titulo: 'Abastecimentos',
        desc: 'Registro completo de todos os abastecimentos realizados. Exibe data, viatura (prefixo + placa), hodômetro, volume em litros e valor total. Os dados são provenientes do formulário Google Forms integrado à planilha.',
      },
      {
        icone: '📄', titulo: 'Relatório MOTOMEC',
        desc: 'Geração de relatórios consolidados da frota. Disponível em formato visual com tabelas e gráficos para exportação. Inclui resumo por viatura, histórico de manutenções e indicadores de desempenho.',
      },
    ],
  },
  {
    id: 'logistica', icone: '🚒', titulo: 'LOGÍSTICA — Materiais e Patrimônio',
    cor: '#b71c1c', corFundo: '#ffebee',
    topicos: [
      {
        icone: '📊', titulo: 'Painel de Logística',
        desc: 'Visão macro de todos os materiais operacionais do 17GB. Exibe 6 KPIs (total, operando, baixados, TH vencendo, embarcações, compressores) e 4 cards de acompanhamento: PAS DE DEA solicitadas, Reparos em andamento, Alertas prioritários e Disponibilidade Geral (%). Abaixo está a tabela Resumo por Categoria com percentual de disponibilidade por tipo de material.',
      },
      {
        icone: '📦', titulo: 'Materiais Operacionais',
        desc: 'Detalhamento completo dos equipamentos por categoria: EPR, Compressor, Embarcações, Cilíndros, MS/MA/MP/SS, Desencarceradores e Equip. Diversos. Clique em um card de categoria para expandir e ver: cards analíticos (Status, Por SGB, Por Tipo, Por Marca, Por Localização) e a tabela completa com busca e filtro por status. A tabela só exibe resultados após clicar em "Pesquisar".',
      },
      {
        icone: '🫀', titulo: 'PAS/DEA',
        desc: 'Controle de solicitações de PAS (Primeiros Socorros) e desfibriladores DEA. Cada registro mostra viatura/equipamento, tipo de solicitação, data e situação atual.',
      },
      {
        icone: '🛠️', titulo: 'Reparos',
        desc: 'Registro de reparos em andamento e histórico de manutenções no grupamento. Cada registro mostra viatura/equipamento, tipo de reparo, data e situação atual.',
      },
      {
        icone: '🏛️', titulo: 'Patrimônio — Mat. Prefeitura',
        desc: 'Listagem dos materiais cedidos pela Prefeitura ao 17GB. Exibe card com total de materiais e quantidade de unidades. Possui pesquisa por Descrição, Ambiente e Estado de Conservação. Cada item mostra nome, quantidade, descrição, ambiente e badge de conservação (Bom / Regular / Ruim).',
      },
      {
        icone: '🏛️', titulo: 'Patrimônio — Mat. Estado',
        desc: 'Materiais cedidos pelo Estado. Além da listagem, exibe dois cards: Total de Materiais e Valor Total Estimado. Pesquisa por 6 campos: Ambiente, Nº Chapa, Descrição, Conta Contábil, Valor Atual e Estado de Conservação. Tabela inclui colunas de Nº Chapa, Conta Contábil e Valor Atual.',
      },
      {
        icone: '➕', titulo: 'Patrimônio — Inclusão',
        desc: 'Gerenciamento de processos de inclusão de Viaturas e Materiais ao patrimônio. Dois cards de totais (Total Viaturas e Total Materiais em processo). Sub-abas internas VIATURAS e MATERIAIS com tabela de acompanhamento e coluna "Status do Processo": Documentação Pendente, Em Análise, Aprovado, Concluído ou Reprovado. Botão "Adicionar" abre formulário inline.',
      },
      {
        icone: '🗑️', titulo: 'Patrimônio — Exclusão',
        desc: 'Gerenciamento de processos de exclusão de Viaturas e Materiais do patrimônio. Mesma estrutura da Inclusão: dois cards de totais (vermelho para Viaturas, azul para Materiais), sub-abas VIATURAS e MATERIAIS, tabela com Status do Processo e formulário de registro.',
      },
      {
        icone: '📄', titulo: 'Relatório LOGÍSTICA',
        desc: 'Relatório consolidado de todos os módulos de logística. Geração de documento com disponibilidade por categoria, alertas, reparos e status do patrimônio.',
      },
    ],
  },
  {
    id: 'configuracoes', icone: '⚙️', titulo: 'Configurações do Sistema',
    cor: '#37474f', corFundo: '#eceff1',
    topicos: [
      {
        icone: '👥', titulo: 'Gerenciamento de Usuários',
        desc: 'Disponível apenas para Administradores. Permite visualizar todos os usuários cadastrados, filtrar por status (Aguardando liberação / Ativo / Inativo), liberar acesso a novos usuários, alterar perfil (Administrador / Operador / Visualizador), redefinir senhas e excluir contas. O administrador não pode excluir ou inativar a própria conta.',
      },
      {
        icone: '🔐', titulo: 'Perfis de Acesso',
        desc: 'O sistema possui três perfis: Administrador (acesso total, incluindo Configurações e gerenciamento de usuários), Operador (acesso a todas as telas de operação) e Visualizador (apenas leitura dos dados). O perfil é definido pelo administrador ao liberar o acesso.',
      },
      {
        icone: '🔌', titulo: 'Integrações',
        desc: 'O sistema integra com: Google Sheets (fonte principal de dados de frota e logística via GViz API), API FIPE (valores estimados de veículos) e Telegram Bot (notificações automáticas de alertas críticos). O status de cada integração é exibido nesta seção.',
      },
      {
        icone: '📖', titulo: 'Manual do Usuário',
        desc: 'Este manual. Documenta todas as funcionalidades do sistema por módulo. Navegue pelas abas (MOTOMEC, LOGÍSTICA, CONFIGURAÇÕES) para ver a descrição detalhada de cada tela e recurso disponível.',
      },
    ],
  },
  {
    id: 'geral', icone: '💡', titulo: 'Dicas Gerais de Uso',
    cor: '#e65100', corFundo: '#fff3e0',
    topicos: [
      {
        icone: '🔙', titulo: 'Botão Voltar',
        desc: 'Todas as telas (exceto o Dashboard) possuem o botão Voltar (←) no cabeçalho vermelho, ao lado do botão de menu. Use-o para retornar à tela anterior sem perder o contexto da navegação.',
      },
      {
        icone: '☰', titulo: 'Menu Lateral',
        desc: 'O menu lateral é acessado pelo ícone ≡ no cabeçalho. Dentro dele: MOTOMEC (expansível com todos os módulos de frota), LOGÍSTICA (expansível com Patrimônio em sub-menu), e CONFIGURAÇÕES. O menu pode ser fechado pelo ícone ‹ dentro do próprio painel.',
      },
      {
        icone: '🔄', titulo: 'Atualização de Dados',
        desc: 'Os dados são carregados automaticamente ao abrir cada tela e atualizados a cada 5 minutos. Use o botão "⟳ Atualizar" no canto superior direito das telas de Logística e Frota para forçar uma nova leitura imediata das planilhas.',
      },
      {
        icone: '🔍', titulo: 'Pesquisa e Filtros',
        desc: 'Nas tabelas de Materiais Operacionais, a pesquisa é ativada somente ao clicar em "Pesquisar" ou pressionar Enter — os dados não ficam expostos por padrão. Nas telas de Patrimônio (Mat. Prefeitura e Mat. Estado), a filtragem ocorre em tempo real enquanto você digita.',
      },
      {
        icone: '📱', titulo: 'Compatibilidade',
        desc: 'O sistema é otimizado para uso em computadores desktop e notebooks. Em dispositivos móveis a visualização é funcional, porém recomenda-se o uso em tela larga para melhor experiência, especialmente nas tabelas de materiais e relatórios.',
      },
    ],
  },
];

function ManualUsuario() {
  const [abaAtiva, setAbaAtiva] = useState('motomec');
  const [topicoAberto, setTopicoAberto] = useState(null);
  const secao = SECOES_MANUAL.find(s => s.id === abaAtiva);

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden', marginTop: 24 }}>
      {/* Cabeçalho */}
      <div style={{ background: 'linear-gradient(135deg, #1a237e, #283593)', padding: '20px 24px', color: '#fff' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 4 }}>📖 Manual do Usuário</div>
        <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Sistema MOTOMEC 17GB — 17º Grupamento de Bombeiros · CBMESP</div>
      </div>

      {/* Abas de módulo */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e0e0e0', overflowX: 'auto', background: '#fafafa' }}>
        {SECOES_MANUAL.map(s => (
          <button key={s.id} onClick={() => { setAbaAtiva(s.id); setTopicoAberto(null); }} style={{
            padding: '12px 20px', border: 'none', borderBottom: `3px solid ${abaAtiva === s.id ? s.cor : 'transparent'}`,
            background: abaAtiva === s.id ? s.corFundo : 'transparent',
            color: abaAtiva === s.id ? s.cor : '#666',
            fontWeight: abaAtiva === s.id ? 700 : 500,
            fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap',
            transition: 'all 0.15s',
          }}>
            {s.icone} {s.titulo.split(' — ')[0]}
          </button>
        ))}
      </div>

      {/* Conteúdo da aba */}
      {secao && (
        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: secao.cor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            {secao.icone} {secao.titulo}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {secao.topicos.map((t, i) => {
              const aberto = topicoAberto === i;
              return (
                <div key={i} style={{ border: `1px solid ${aberto ? secao.cor : '#e5e7eb'}`, borderRadius: 8, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                  <button
                    onClick={() => setTopicoAberto(aberto ? null : i)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '13px 18px', border: 'none', cursor: 'pointer', textAlign: 'left',
                      background: aberto ? secao.corFundo : '#fff', transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.2rem' }}>{t.icone}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: aberto ? secao.cor : '#333' }}>{t.titulo}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#999', flexShrink: 0 }}>{aberto ? '▲' : '▼'}</span>
                  </button>
                  {aberto && (
                    <div style={{ padding: '0 18px 16px 48px', background: secao.corFundo }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#444', lineHeight: 1.7 }}>{t.desc}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rodapé */}
      <div style={{ background: '#f5f5f5', padding: '12px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: '0.75rem', color: '#888' }}>Sistema v2.0 · 17GB CBMESP · Desenvolvido para Gestão Operacional</span>
        <span style={{ fontSize: '0.75rem', color: '#aaa' }}>Atualizado em jun/2026</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÕES
// ═══════════════════════════════════════════════════════════════════════════
function Configuracoes() {
  const [currentUser, setCurrentUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loadingCurrentUser, setLoadingCurrentUser] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionId, setActionId] = useState(null);

  const isAdmin = currentUser?.perfil === 'admin';

  const showSuccess = (message) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const loadUsuarios = useCallback(async (filter) => {
    setLoadingUsers(true);
    try {
      const res = await getUsuarios(filter || '');
      setUsuarios(res.data || []);
      setError('');
    } catch (e) {
      setError(getApiError(e, 'Erro ao carregar usuários.'));
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const user = await getMe();
        setCurrentUser(user);
      } catch (e) {
        setError(getApiError(e, 'Não foi possível validar seu usuário.'));
      } finally {
        setLoadingCurrentUser(false);
      }
    }

    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadUsuarios();
    }
  }, [isAdmin, loadUsuarios]);

  const runUserAction = async (userId, action, successMessage) => {
    setActionId(userId);
    setError('');
    try {
      await action();
      showSuccess(successMessage);
      await loadUsuarios();
    } catch (e) {
      setError(getApiError(e, 'Não foi possível concluir a ação.'));
    } finally {
      setActionId(null);
    }
  };

  const handleLiberar = (user) => {
    runUserAction(
      user.id,
      () => updateUsuario(user.id, { status: 'ativo' }),
      'Usuário liberado com sucesso.'
    );
  };

  const handlePerfilChange = (user, perfil) => {
    runUserAction(
      user.id,
      () => updateUsuario(user.id, { perfil }),
      'Perfil atualizado com sucesso.'
    );
  };

  const handleInativar = (user) => {
    if (!window.confirm(`Inativar o usuário ${user.nome}?`)) return;
    runUserAction(
      user.id,
      () => updateUsuario(user.id, { status: 'inativo' }),
      'Usuário inativado com sucesso.'
    );
  };

  const handleResetSenha = (user) => {
    const novaSenha = window.prompt(`Nova senha para ${user.nome} (mínimo 6 caracteres):`);
    if (novaSenha === null) return;

    if (novaSenha.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    runUserAction(
      user.id,
      () => updateUsuario(user.id, { password: novaSenha }),
      'Senha redefinida com sucesso.'
    );
  };

  const handleExcluir = (user) => {
    if (user.id === currentUser?.id) {
      setError('Administrador não pode excluir a própria conta.');
      return;
    }

    if (!window.confirm(`Excluir definitivamente o usuário ${user.nome}?`)) return;
    runUserAction(
      user.id,
      () => deleteUsuario(user.id),
      'Usuário excluído com sucesso.'
    );
  };

  const renderUserManagement = () => {
    const visibleUsuarios = statusFilter
      ? usuarios.filter(user => user.status === statusFilter)
      : usuarios;

    const statusCounts = usuarios.reduce((acc, user) => {
      acc[user.status] = (acc[user.status] || 0) + 1;
      return acc;
    }, {});

    if (loadingCurrentUser) {
      return <div className="loading">Validando permissões...</div>;
    }

    if (!isAdmin) {
      return (
        <div className="empty-state" style={{ textAlign: 'left' }}>
          Gerenciamento de usuários disponível apenas para administradores.
        </div>
      );
    }

    return (
      <>
        <div className="filter-bar" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filtrar usuários por status"
            >
              <option value="">Todos os status ({usuarios.length})</option>
              <option value="pendente">Aguardando liberação ({statusCounts.pendente || 0})</option>
              <option value="ativo">Ativos ({statusCounts.ativo || 0})</option>
              <option value="inativo">Inativos ({statusCounts.inativo || 0})</option>
            </select>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
              Sua conta ativa/admin aparece em Ativos, não em Aguardando liberação.
            </span>
          </div>
          <button className="btn-small" type="button" onClick={() => loadUsuarios()}>
            Atualizar
          </button>
        </div>

        {loadingUsers ? (
          <div className="loading">Carregando usuários...</div>
        ) : visibleUsuarios.length === 0 ? (
          <div className="empty-state">
            {statusFilter === 'pendente'
              ? 'Nenhum usuário aguardando liberação no momento.'
              : 'Nenhum usuário encontrado para o filtro selecionado.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Data de cadastro</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsuarios.map(user => (
                  <tr key={user.id}>
                    <td>{user.nome}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        className="form-control"
                        value={user.perfil}
                        onChange={(e) => handlePerfilChange(user, e.target.value)}
                        disabled={actionId === user.id || user.id === currentUser?.id}
                        aria-label={`Alterar perfil de ${user.nome}`}
                        title={user.id === currentUser?.id ? 'Não é permitido remover o próprio perfil admin' : 'Alterar perfil'}
                      >
                        <option value="admin">Administrador</option>
                        <option value="operador">Operador</option>
                        <option value="visualizador">Visualizador</option>
                      </select>
                    </td>
                    <td>
                      <span className={`user-status-badge user-status-${user.status}`}>
                        {statusLabels[user.status] || user.status}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="user-actions">
                        {user.status === 'pendente' && (
                          <button
                            className="btn-small"
                            type="button"
                            onClick={() => handleLiberar(user)}
                            disabled={actionId === user.id}
                          >
                            Liberar acesso
                          </button>
                        )}
                        {user.status !== 'inativo' && (
                          <button
                            className="btn-small"
                            type="button"
                            onClick={() => handleInativar(user)}
                            disabled={actionId === user.id || user.id === currentUser?.id}
                            title={user.id === currentUser?.id ? 'Não é permitido inativar a própria conta' : 'Inativar usuário'}
                          >
                            Inativar
                          </button>
                        )}
                        <button
                          className="btn-small"
                          type="button"
                          onClick={() => handleResetSenha(user)}
                          disabled={actionId === user.id}
                          title="Redefinir senha do usuário"
                        >
                          Redefinir senha
                        </button>
                        <button
                          className="btn-small btn-small-danger"
                          type="button"
                          onClick={() => handleExcluir(user)}
                          disabled={actionId === user.id || user.id === currentUser?.id}
                          title={user.id === currentUser?.id ? 'Não é permitido excluir a própria conta' : 'Excluir usuário'}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  return (
    <div>
      <h1 className="page-title">Configurações do Sistema</h1>

      {error && <div className="error-msg">{error}</div>}
      {successMsg && <div className="success-msg">{successMsg}</div>}

      <div className="card mb-20">
        <div className="section-header">
          <h3 className="section-title">Gerenciamento de Usuários</h3>
        </div>
        {renderUserManagement()}
      </div>

      <ManualUsuario />
    </div>
  );
}

export default Configuracoes;
