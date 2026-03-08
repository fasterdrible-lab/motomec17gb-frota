# 🚗 Sistema de Gestão de Frota - MotoMec17GB

Sistema automatizado para gerenciar frota de veículos com alertas de manutenção, integração com Google Sheets e notificações via Telegram.

---

## 📋 Funcionalidades

✅ **Integração com Google Sheets** - Leitura e escrita de dados da frota  
✅ **API FIPE** - Consulta de preços e informações de veículos  
✅ **Alertas Inteligentes** - Monitoramento de manutenção (óleo, pneus, bateria, inspeção)  
✅ **Notificações Telegram** - Alertas em tempo real via bot  
✅ **Relatórios Automáticos** - Geração de relatórios diários da frota  
✅ **Logging Completo** - Rastreamento de todas as operações  

---

## 🔧 Pré-requisitos

- **Python 3.8+** ✅ (já instalado)
- **Git** ✅ (já instalado)
- **Conta Google** com Google Sheets API habilitada
- **Bot Telegram** com token configurado
- **Planilha Google Sheets** compartilhada

---

## 📥 Instalação

### 1️⃣ Clonar Repositório

```bash
git clone https://github.com/fasterdrible-lab/motomec17gb-frota.git
cd motomec17gb-frota
```

### 2️⃣ Criar Ambiente Virtual (Opcional mas Recomendado)

```bash
python -m venv venv
venv\Scripts\activate
```

### 3️⃣ Instalar Dependências

```bash
pip install -r requirements.txt
```

### 4️⃣ Configurar Credenciais

1. Coloque o arquivo `credentials.json` na pasta `config/`:
   ```
   config/
   └── credentials.json
   ```

2. Crie o arquivo `.env` na raiz do projeto:
   ```
   cp .env.example .env
   ```

3. Edite o arquivo `.env` e preencha:
   ```env
   GOOGLE_SHEETS_ID=seu_id_da_planilha
   TELEGRAM_BOT_TOKEN=seu_token_do_bot
   TELEGRAM_CHAT_ID=seu_chat_id
   ```

---

## 🚀 Como Usar

### Executar Teste Rápido

```bash
cd src
python main.py
```

Este comando irá:
- ✅ Testar conexão com Google Sheets
- ✅ Testar API FIPE
- ✅ Testar conexão com Telegram
- ✅ Executar um ciclo de verificação

### Iniciar Monitoramento Contínuo

No arquivo `src/main.py`, procure pela linha:

```python
# Descomentar a linha abaixo para monitoramento contínuo
# sistema.iniciar_monitoramento()
```

Descomente (remova o `#`):

```python
# Descomentar a linha abaixo para monitoramento contínuo
sistema.iniciar_monitoramento()
```

Depois execute:

```bash
python main.py
```

---

## 📊 Estrutura da Planilha Google Sheets

Crie uma planilha com as seguintes abas:

### Aba "Frota"

| ID | Modelo | Placa | KM Atual | Data Último Óleo | Data Última Inspeção | Data Bateria | KM Pneu |
|---|---|---|---|---|---|---|---|
| 1 | Toyota Corolla | ABC-1234 | 45000 | 2024-02-15 | 2024-03-01 | 2023-06-20 | 30000 |
| 2 | Honda Civic | XYZ-5678 | 62000 | 2024-01-20 | 2024-02-10 | 2023-05-15 | 50000 |

### Aba "Relatório"

Será atualizada automaticamente com:
- Total de Veículos
- Manutenções Pendentes
- Alertas Críticos
- Alertas Urgentes
- Veículos em Dia
- Última Atualização

---

## 🤖 Configuração do Telegram

### 1. Criar Bot no Telegram

1. Abra o Telegram
2. Procure por `@BotFather`
3. Envie `/start`
4. Envie `/newbot`
5. Escolha um nome para o bot
6. Copie o **TOKEN** fornecido

### 2. Obter Chat ID

1. Envie uma mensagem para seu bot
2. Acesse: `https://api.telegram.org/bot<SEU_TOKEN>/getUpdates`
3. Procure por `"chat":{"id":XXXXXX}`
4. Copie o **CHAT_ID**

### 3. Configurar no .env

```env
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_CHAT_ID=seu_chat_id_aqui
```

---

## 🔐 Credenciais Google

### 1. Criar Credenciais

1. Acesse: https://console.cloud.google.com
2. Crie um novo projeto
3. Ative a API do Google Sheets
4. Crie uma conta de serviço
5. Gere uma chave JSON
6. Salve como `config/credentials.json`

### 2. Compartilhar Planilha

1. Abra sua planilha no Google Sheets
2. Clique em "Compartilhar"
3. Cole o email da conta de serviço
4. Dê acesso de edição

---

## 📁 Estrutura do Projeto

```
motomec17gb-frota/
├── src/
│   ├── main.py              # Arquivo principal
│   ├── config.py            # Configurações
│   ├── google_sheets.py     # Integração Google Sheets
│   ├── fipe_api.py          # Integração FIPE API
│   ├── telegram_bot.py      # Bot Telegram
│   └── alertas.py           # Gerenciador de alertas
├── config/
│   └── credentials.json     # Credenciais Google (NÃO compartilhe!)
├── logs/
│   └── frota.log           # Logs da aplicação
├── .env                     # Variáveis de ambiente
├── .env.example            # Exemplo de .env
├── .gitignore              # Arquivos ignorados pelo Git
├── requirements.txt        # Dependências Python
└── README.md              # Este arquivo
```

---

## 🔔 Tipos de Alertas

### 🔴 Crítico
- Óleo: Vencido
- Pneus: Vencidos
- Bateria: Vencida
- Inspeção: Vencida

### 🟠 Urgente
- Óleo: Vence em até 7 dias
- Pneus: Vence em até 5.000 km
- Bateria: Vence em até 3 meses
- Inspeção: Vence em até 30 dias

### 🟡 Atenção
- Óleo: Vence em até 30 dias
- Pneus: Vence em até 10.000 km
- Bateria: Vence em até 24 meses
- Inspeção: Vence em até 365 dias

---

## 🐛 Troubleshooting

### Erro: "credentials.json não encontrado"
- Coloque o arquivo `credentials.json` na pasta `config/`
- Verifique o caminho: `config/credentials.json`

### Erro: "Token ou Chat ID do Telegram não configurados"
- Edite o arquivo `.env`
- Preenchaa `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`

### Erro: "Google Sheets API não autorizada"
- Verifique se a conta de serviço tem acesso à planilha
- Compartilhe a planilha com o email da conta de serviço

### Erro: "Módulo não encontrado"
- Execute: `pip install -r requirements.txt`
- Certifique-se que está no ambiente virtual

---

## 📝 Logs

Os logs são salvos em `logs/frota.log` e também aparecem no console.

Para alterar o nível de log, edite `.env`:

```env
LOG_LEVEL=DEBUG    # Mais detalhado
LOG_LEVEL=INFO     # Normal
LOG_LEVEL=WARNING  # Apenas avisos
```

---

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a seção **Troubleshooting**
2. Revise os logs em `logs/frota.log`
3. Abra uma issue no GitHub

---

## ✨ Autores

- **fasterdrible-lab** - Desenvolvimento inicial

---

**Última atualização:** 2026-03-08