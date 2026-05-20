function readPublicEnv(name, fallback = '') {
  return process.env[name] || fallback;
}

export const publicConfig = {
  apiUrl: readPublicEnv('REACT_APP_API_URL', 'http://localhost:8000'),
  frotaSheetId: readPublicEnv('REACT_APP_FROTA_SHEET_ID'),
  tarefasGid: readPublicEnv('REACT_APP_TAREFAS_GID'),
  logisticaSheetId: readPublicEnv('REACT_APP_LOGISTICA_SHEET_ID'),
  logisticaGids: {
    EPR: readPublicEnv('REACT_APP_LOGISTICA_GID_EPR'),
    COMPRESSOR: readPublicEnv('REACT_APP_LOGISTICA_GID_COMPRESSOR'),
    EMBARCACOES: readPublicEnv('REACT_APP_LOGISTICA_GID_EMBARCACOES'),
    CILINDROS: readPublicEnv('REACT_APP_LOGISTICA_GID_CILINDROS'),
    MS_MA_MP_SS: readPublicEnv('REACT_APP_LOGISTICA_GID_MS_MA_MP_SS'),
    DESENCARCERADORES: readPublicEnv('REACT_APP_LOGISTICA_GID_DESENCARCERADORES'),
    EQUIP_DIVERSOS: readPublicEnv('REACT_APP_LOGISTICA_GID_EQUIP_DIVERSOS'),
    PAS_DE_DEA: readPublicEnv('REACT_APP_LOGISTICA_GID_PAS_DE_DEA'),
    REPAROS: readPublicEnv('REACT_APP_LOGISTICA_GID_REPAROS'),
  },
};

export function requirePublicConfig(value, name) {
  if (!value) {
    throw new Error(`Configuracao publica ausente: ${name}`);
  }
  return value;
}

