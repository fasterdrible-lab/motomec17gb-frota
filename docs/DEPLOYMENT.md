# 🚀 Guia de Implantação — Sistema de Gestão de Frota 17º GB

---

## ✅ Pré-requisitos

### Para desenvolvimento local
| Ferramenta   | Versão mínima | Download                          |
|--------------|---------------|-----------------------------------|
| Docker       | 24.x          | https://docs.docker.com/get-docker |
| Docker Compose| 2.x          | Incluso no Docker Desktop         |
| Git          | 2.x           | https://git-scm.com               |

### Para instalação manual
| Ferramenta   | Versão mínima |
|--------------|---------------|
| Python       | 3.11+         |
| Node.js      | 18.x+         |
| PostgreSQL   | 14.x+         |

---

## 🐳 Desenvolvimento Local com Docker

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/motomec17gb-frota.git
cd motomec17gb-frota
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.exemplo .env
```

Edite o arquivo `.env` com suas configurações:

```env
GOOGLE_SHEETS_ID=seu_id_da_planilha
GOOGLE_CREDENTIALS_PATH=config/credentials.json
TELEGRAM_BOT_TOKEN=seu_token_bot
TELEGRAM_CHAT_ID=seu_chat_id
SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
```

### 3. Adicionar credenciais do Google

Coloque o arquivo `credentials.json` da conta de serviço do Google em:
```
config/credentials.json
```

### 4. Iniciar todos os serviços

```bash
docker compose up -d
```

### 5. Verificar os serviços

```bash
# Ver status dos containers
docker compose ps

# Acompanhar logs
docker compose logs -f

# Logs apenas do backend
docker compose logs -f backend
```

### 6. Acessar a aplicação

| Serviço              | URL                          |
|----------------------|------------------------------|
| Frontend             | http://localhost:3000        |
| Backend (API)        | http://localhost:8000        |
| Swagger UI           | http://localhost:8000/docs   |
| ReDoc                | http://localhost:8000/redoc  |
| Health Check         | http://localhost:8000/health |

### 7. Parar os serviços

```bash
docker compose down

# Parar e remover volumes (apaga o banco de dados)
docker compose down -v
```

---

## ⚙️ Configuração do Ambiente

### Variáveis de ambiente obrigatórias

| Variável                  | Descrição                                      | Exemplo                          |
|---------------------------|------------------------------------------------|----------------------------------|
| `DATABASE_URL`            | URL de conexão PostgreSQL                      | `postgresql://user:pass@host:5432/db` |
| `GOOGLE_SHEETS_ID`        | ID da planilha Google Sheets                   | `1q6wy9iO4aRDKMB...`             |
| `GOOGLE_CREDENTIALS_PATH` | Caminho do JSON de credenciais Google          | `config/credentials.json`        |
| `SECRET_KEY`              | Chave secreta para JWT (mínimo 32 caracteres)  | `openssl rand -hex 32`           |

### Variáveis opcionais

| Variável                      | Padrão                                  | Descrição                       |
|-------------------------------|-----------------------------------------|---------------------------------|
| `TELEGRAM_BOT_TOKEN`          | `""`                                    | Token do bot Telegram           |
| `TELEGRAM_CHAT_ID`            | `""`                                    | ID do chat para notificações    |
| `FIPE_API_URL`                | `https://parallelum.com.br/fipe/api/v1` | URL base da API FIPE            |
| `ALGORITHM`                   | `HS256`                                 | Algoritmo JWT                   |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30`                                    | Expiração do token JWT          |
| `ALERT_CHECK_INTERVAL`        | `1`                                     | Intervalo de alertas (horas)    |
| `DEBUG`                       | `true`                                  | Modo debug                      |

### Gerar SECRET_KEY segura

```bash
python -c "import secrets; print(secrets.token_hex(32))"
# ou
openssl rand -hex 32
```

---

## 🛠️ Instalação Manual (sem Docker)

### Backend

```bash
# 1. Entrar no diretório
cd backend

# 2. Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Configurar banco de dados PostgreSQL
# Crie o banco manualmente:
createdb -U postgres motomec17gb

# 5. Configurar .env (na raiz do projeto)
export DATABASE_URL=postgresql://postgres:senha@localhost:5432/motomec17gb

# 6. Executar migrações
alembic upgrade head

# 7. Iniciar o servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
# 1. Entrar no diretório
cd frontend

# 2. Instalar dependências
npm install

# 3. Configurar variável de ambiente
echo "REACT_APP_API_URL=http://localhost:8000" > .env.local

# 4. Iniciar em modo desenvolvimento
npm start
```

---

## 🚂 Deploy no Railway

### Pré-requisitos
- Conta no [Railway](https://railway.app)
- [Railway CLI](https://docs.railway.app/develop/cli) instalado
- Repositório no GitHub

### Passo a passo

#### 1. Instalar o Railway CLI
```bash
npm install -g @railway/cli
railway login
```

#### 2. Criar novo projeto
```bash
railway init
```

#### 3. Adicionar PostgreSQL
No painel do Railway:
1. Clique em **New Service** → **Database** → **PostgreSQL**
2. Anote a `DATABASE_URL` gerada automaticamente

#### 4. Configurar variáveis de ambiente no Railway
```bash
railway variables set SECRET_KEY=$(openssl rand -hex 32)
railway variables set GOOGLE_SHEETS_ID=seu_id
railway variables set TELEGRAM_BOT_TOKEN=seu_token
railway variables set TELEGRAM_CHAT_ID=seu_chat_id
railway variables set DEBUG=false
```

#### 5. Deploy do backend
```bash
cd backend
railway up
```

#### 6. Deploy do frontend
```bash
cd frontend
railway up
```

#### 7. Configurar domínio personalizado (opcional)
No painel Railway: **Settings** → **Domains** → **Add Domain**

---

## 🗃️ Migrações do Banco de Dados

### Verificar status das migrações
```bash
cd backend
alembic current
alembic history
```

### Aplicar migrações pendentes
```bash
alembic upgrade head
```

### Criar nova migração
```bash
alembic revision --autogenerate -m "descricao_da_mudanca"
alembic upgrade head
```

### Reverter migração
```bash
# Reverter uma migração
alembic downgrade -1

# Reverter para o início
alembic downgrade base
```

### No Docker
```bash
docker compose exec backend alembic upgrade head
```

---

## 📊 Monitoramento e Logs

### Logs via Docker

```bash
# Todos os serviços
docker compose logs -f

# Apenas backend
docker compose logs -f backend

# Últimas 100 linhas
docker compose logs --tail=100 backend

# Logs com timestamp
docker compose logs -f -t backend
```

### Logs do sistema (arquivo)

Os logs são gravados em `backend/logs/`:
```bash
tail -f backend/logs/app.log
```

### Health checks

```bash
# Verificar liveness
curl http://localhost:8000/health

# Verificar readiness
curl http://localhost:8000/status
```

### Monitoramento do banco de dados

```bash
# Conectar ao PostgreSQL via Docker
docker compose exec postgres psql -U motomec -d motomec17gb

# Verificar conexões ativas
SELECT count(*) FROM pg_stat_activity;

# Verificar tamanho do banco
SELECT pg_size_pretty(pg_database_size('motomec17gb'));
```

---

## 🔒 Segurança em Produção

1. **Nunca use `DEBUG=true` em produção**
2. **Gere um `SECRET_KEY` único e forte** (mínimo 32 bytes aleatórios)
3. **Restrinja o CORS** para apenas os domínios necessários
4. **Use HTTPS** (Railway fornece automaticamente via Let's Encrypt)
5. **Não comite o `.env`** — use variáveis de ambiente do Railway/CI
6. **Senhas do banco** devem ser fortes e únicas por ambiente
