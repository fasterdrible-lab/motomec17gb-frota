import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any
import gspread
from google.oauth2.service_account import Credentials
from app.database import SessionLocal
from app.models import Viatura, Manutencao, Alerta
import os
import json

logger = logging.getLogger(__name__)

SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
SYNC_INTERVAL = 300  # 5 minutos


async def get_google_sheets_client():
    """Autentica e retorna cliente do Google Sheets"""
    try:
        creds_path = os.path.join(os.path.dirname(__file__), '../../config/credentials.json')
        
        creds = Credentials.from_service_account_file(
            creds_path,
            scopes=SCOPES
        )
        
        client = gspread.authorize(creds)
        return client
    except Exception as e:
        logger.error(f"Erro ao autenticar Google Sheets: {e}")
        return None


async def sync_viaturas_from_sheets():
    """Sincroniza viaturas da planilha com banco de dados"""
    try:
        client = await get_google_sheets_client()
        if not client:
            return False
        
        spreadsheet = client.open_by_key('1q6wy9iO4aRDKMBPzxR9cISE7pCmUuIaYSRBdhUNlM4Q')
        worksheet = spreadsheet.worksheet('Viaturas')
        
        records = worksheet.get_all_records()
        logger.info(f"Lidos {len(records)} registros da planilha")
        
        db = SessionLocal()
        try:
            for record in records:
                placa = record.get('Placa', '').strip()
                if not placa:
                    continue
                
                viatura = db.query(Viatura).filter(Viatura.placa == placa).first()
                
                if viatura:
                    viatura.modelo = record.get('Modelo', '')
                    viatura.ano = int(record.get('Ano', 2024)) if record.get('Ano') else 2024
                    viatura.km = float(record.get('KM', 0)) if record.get('KM') else 0
                    viatura.status = record.get('Status', 'Operando')
                    viatura.data_atualizacao = datetime.now()
                    db.commit()
                else:
                    nova_viatura = Viatura(
                        placa=placa,
                        modelo=record.get('Modelo', ''),
                        ano=int(record.get('Ano', 2024)) if record.get('Ano') else 2024,
                        km=float(record.get('KM', 0)) if record.get('KM') else 0,
                        status=record.get('Status', 'Operando'),
                        data_criacao=datetime.now()
                    )
                    db.add(nova_viatura)
                    db.commit()
            
            logger.info("Sincronização de viaturas concluída com sucesso")
            return True
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Erro ao sincronizar viaturas: {e}")
        return False


async def start_sync_task():
    """Inicia task assíncrona de sincronização periódica"""
    logger.info("Iniciando serviço de sincronização Google Sheets")
    
    while True:
        try:
            logger.info("Sincronizando com Google Sheets...")
            await sync_viaturas_from_sheets()
            logger.info(f"Próxima sincronização em {SYNC_INTERVAL} segundos")
            await asyncio.sleep(SYNC_INTERVAL)
        except asyncio.CancelledError:
            logger.info("Serviço de sincronização encerrado")
            break
        except Exception as e:
            logger.error(f"Erro no serviço de sincronização: {e}")
            await asyncio.sleep(SYNC_INTERVAL)