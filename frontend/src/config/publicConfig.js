function readPublicEnv(name, fallback = '') {
  return import.meta.env[name] || fallback;
}

const defaultApiUrl = import.meta.env.DEV ? 'http://localhost:8000' : '';

export const publicConfig = {
  apiUrl: readPublicEnv('VITE_API_URL', defaultApiUrl),
  frotaSheetId: readPublicEnv('VITE_FROTA_SHEET_ID'),
  tarefasGid: readPublicEnv('VITE_TAREFAS_GID'),
  logisticaSheetId: readPublicEnv('VITE_LOGISTICA_SHEET_ID'),
  logisticaGids: {
    EPR: readPublicEnv('VITE_LOGISTICA_GID_EPR'),
    COMPRESSOR: readPublicEnv('VITE_LOGISTICA_GID_COMPRESSOR'),
    EMBARCACOES: readPublicEnv('VITE_LOGISTICA_GID_EMBARCACOES'),
    CILINDROS: readPublicEnv('VITE_LOGISTICA_GID_CILINDROS'),
    MS_MA_MP_SS: readPublicEnv('VITE_LOGISTICA_GID_MS_MA_MP_SS'),
    DESENCARCERADORES: readPublicEnv('VITE_LOGISTICA_GID_DESENCARCERADORES'),
    EQUIP_DIVERSOS: readPublicEnv('VITE_LOGISTICA_GID_EQUIP_DIVERSOS'),
    PAS_DE_DEA: readPublicEnv('VITE_LOGISTICA_GID_PAS_DE_DEA'),
    REPAROS: readPublicEnv('VITE_LOGISTICA_GID_REPAROS'),
  },
};

export function requirePublicConfig(value, name) {
  if (!value) {
    throw new Error(`Configuração pública ausente: ${name}`);
  }
  return value;
}
