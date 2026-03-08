import logging
import requests
from config import FIPE_API_URL

logger = logging.getLogger(__name__)

class FIPEApi:
    def __init__(self):
        """Inicializa a API FIPE (Parallelum)"""
        self.base_url = FIPE_API_URL
        logger.info(f"✅ FIPE API inicializada: {self.base_url}")

    def get_marcas(self, tipo='carros'):
        """Obtém lista de marcas de veículos
        
        Args:
            tipo: 'carros', 'motos' ou 'caminhoes'
        
        Returns:
            Lista de marcas com código e nome
        """
        try:
            url = f"{self.base_url}/{tipo}/marcas"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            logger.info(f"✅ {len(response.json())} marcas obtidas")
            return response.json()
        except requests.RequestException as e:
            logger.error(f"❌ Erro ao obter marcas: {e}")
            return []

    def get_modelos(self, tipo, marca_id):
        """Obtém modelos de uma marca
        
        Args:
            tipo: 'carros', 'motos' ou 'caminhoes'
            marca_id: ID da marca
        
        Returns:
            Lista de modelos
        """
        try:
            url = f"{self.base_url}/{tipo}/marcas/{marca_id}/modelos"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            logger.info(f"✅ Modelos obtidos para marca {marca_id}")
            return response.json()
        except requests.RequestException as e:
            logger.error(f"❌ Erro ao obter modelos: {e}")
            return []

    def get_anos(self, tipo, marca_id, modelo_id):
        """Obtém anos de fabricação de um modelo
        
        Args:
            tipo: 'carros', 'motos' ou 'caminhoes'
            marca_id: ID da marca
            modelo_id: ID do modelo
        
        Returns:
            Lista de anos
        """
        try:
            url = f"{self.base_url}/{tipo}/marcas/{marca_id}/modelos/{modelo_id}/anos"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            logger.info(f"✅ Anos obtidos para modelo {modelo_id}")
            return response.json()
        except requests.RequestException as e:
            logger.error(f"❌ Erro ao obter anos: {e}")
            return []

    def get_preco(self, tipo, marca_id, modelo_id, ano):
        """Obtém preço FIPE de um veículo
        
        Args:
            tipo: 'carros', 'motos' ou 'caminhoes'
            marca_id: ID da marca
            modelo_id: ID do modelo
            ano: Ano de fabricação
        
        Returns:
            Dicionário com dados do veículo e preço
        """
        try:
            url = f"{self.base_url}/{tipo}/marcas/{marca_id}/modelos/{modelo_id}/anos/{ano}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            dados = response.json()
            logger.info(f"✅ Preço obtido: {dados.get('Valor', 'N/A')}")
            return dados
        except requests.RequestException as e:
            logger.error(f"❌ Erro ao obter preço: {e}")
            return {}

    def buscar_veiculo_completo(self, marca, modelo, ano, tipo='carros'):
        """Busca informações completas de um veículo
        
        Args:
            marca: Nome da marca
            modelo: Nome do modelo
            ano: Ano de fabricação
            tipo: 'carros', 'motos' ou 'caminhoes'
        
        Returns:
            Dicionário com dados do veículo
        """
        try:
            # Obter todas as marcas
            marcas = self.get_marcas(tipo)
            marca_obj = next((m for m in marcas if m.get('nome', '').lower() == marca.lower()), None)
            
            if not marca_obj:
                logger.warning(f"⚠️ Marca '{marca}' não encontrada")
                return {}
            
            marca_id = marca_obj.get('codigo')
            
            # Obter modelos
            modelos = self.get_modelos(tipo, marca_id)
            modelo_obj = next((m for m in modelos.get('modelos', []) if m.get('nome', '').lower() == modelo.lower()), None)
            
            if not modelo_obj:
                logger.warning(f"⚠️ Modelo '{modelo}' não encontrado")
                return {}
            
            modelo_id = modelo_obj.get('codigo')
            
            # Obter preço
            preco = self.get_preco(tipo, marca_id, modelo_id, ano)
            
            return preco
        except Exception as e:
            logger.error(f"❌ Erro ao buscar veículo completo: {e}")
            return {}