/* App-wide constants — 17º GB Fleet Management System */

export const STATUS_VIATURA = [
  { value: 'operacional', label: 'Operacional' },
  { value: 'manutencao',  label: 'Em Manutenção' },
  { value: 'inativo',     label: 'Inativo' },
  { value: 'reserva',     label: 'Reserva' },
  { value: 'critico',     label: 'Crítico' },
];

export const CATEGORIAS_GASTO = [
  { value: 'combustivel',  label: 'Combustível'  },
  { value: 'manutencao',   label: 'Manutenção'   },
  { value: 'pneus',        label: 'Pneus'        },
  { value: 'lubrificantes',label: 'Lubrificantes'},
  { value: 'pecas',        label: 'Peças'        },
  { value: 'servicos',     label: 'Serviços'     },
  { value: 'licenciamento',label: 'Licenciamento'},
  { value: 'outros',       label: 'Outros'       },
];

export const TIPOS_MANUTENCAO = [
  { value: 'preventiva',   label: 'Preventiva'   },
  { value: 'corretiva',    label: 'Corretiva'    },
  { value: 'revisao',      label: 'Revisão'      },
  { value: 'troca_oleo',   label: 'Troca de Óleo'},
  { value: 'troca_pneus',  label: 'Troca de Pneus'},
  { value: 'funilaria',    label: 'Funilaria'    },
  { value: 'eletrica',     label: 'Elétrica'     },
  { value: 'outros',       label: 'Outros'       },
];

export const TIPOS_ALERTA = [
  { value: 'manutencao',   label: 'Manutenção'   },
  { value: 'documentacao', label: 'Documentação' },
  { value: 'combustivel',  label: 'Combustível'  },
  { value: 'vencimento',   label: 'Vencimento'   },
  { value: 'sistema',      label: 'Sistema'      },
  { value: 'outros',       label: 'Outros'       },
];

export const PRIORIDADES_ALERTA = [
  { value: 'critico', label: 'Crítico' },
  { value: 'urgente', label: 'Urgente' },
  { value: 'aviso',   label: 'Aviso'   },
  { value: 'info',    label: 'Info'    },
];

export const UNIDADES = [
  { value: '1SGB',   label: '1º SGB'   },
  { value: '2SGB',   label: '2º SGB'   },
  { value: 'Oficina',label: 'Oficina'  },
  { value: 'Admin',  label: 'Admin'    },
];

export const PERFIS_USUARIO = [
  { value: 'admin',     label: 'Administrador' },
  { value: 'oficial',   label: 'Oficial'       },
  { value: 'mecanico',  label: 'Mecânico'      },
  { value: 'operador',  label: 'Operador'      },
];

export const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
