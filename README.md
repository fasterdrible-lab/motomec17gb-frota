# 🚒 Sistema de Gestão de Frota — 17º GB

> Sistema enterprise para gerenciamento da frota de **57 viaturas** do 17º Grupamento de Bombeiros do Estado de São Paulo.

[![Deploy](https://github.com/seu-usuario/motomec17gb-frota/actions/workflows/deploy.yml/badge.svg)](https://github.com/seu-usuario/motomec17gb-frota/actions/workflows/deploy.yml)
[![Tests](https://github.com/seu-usuario/motomec17gb-frota/actions/workflows/test.yml/badge.svg)](https://github.com/seu-usuario/motomec17gb-frota/actions/workflows/test.yml)

---

## 📋 Funcionalidades

| Módulo              | Descrição                                                       |
|---------------------|-----------------------------------------------------------------|
| 🚒 **Frota**        | Cadastro e controle de todas as viaturas                        |
| 🔧 **Manutenção**   | Controle preventivo e corretivo com alertas automáticos         |
| ⛽ **Abastecimento** | Registro de abastecimentos e relatório de consumo               |
| 💰 **Gastos**       | Controle financeiro com relatórios por viatura e categoria      |
| 🚨 **Alertas**      | Alertas automáticos de manutenção vencida                       |
| 📊 **Relatórios**   | Relatórios diários, mensais e anuais                            |
| 👥 **Usuários**     | Autenticação JWT com perfis Admin/Editor/Leitor                 |
| �� **Telegram**     | Notificações em tempo real via bot                              |
| 📄 **Google Sheets**| Sincronização bidirecional com planilha da frota                |
| 🚗 **FIPE**         | Consulta automática de valores de mercado                       |

---

## 🏗️ Arquitetura

```
┌─────────────────┐     REST API      ┌──────────────────┐
│  React Frontend │ ◄────────────────► │  FastAPI Backend │
│  (Nginx / :3000)│                   │     (:8000)      │
└─────────────────┘                   └────────┬─────────┘
                                               │
                          ┌────────────────────┼─────────────────────┐
                          │                    │                     │
                    ┌─────▼──────┐   ┌─────────▼────┐   ┌──────────▼────┐
                    │ PostgreSQL │   │Google Sheets │   │   Telegram    │
                    │  (:5432)   │   │   API v4     │   │     Bot       │
                    └────────────┘   └──────────────┘   └───────────────┘
```

Para detalhes completos, consulte [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🚀 Início Rápido com Docker

### Pré-requisitos
- [Docker](https://docs.docker.com/get-docker/) 24.x+
- [Docker Compose](https://docs.docker.com/compose/) 2.x+

### 1. Clonar e configurar

```bash
git clone https://github.com/seu-usuario/motomec17gb-frota.git
cd motomec17gb-frota
cp .env.exemplo .env
```

Edite o `.env` com suas configurações (Google Sheets, Telegram, etc.).

### 2. Subir os serviços

```bash
docker compose up -d
```

### 3. Acessar

| Serviço          | URL                        |
|------------------|----------------------------|
| 🖥️ Frontend      | http://localhost:3000       |
| 📡 API           | http://localhost:8000       |
| 📚 Swagger UI    | http://localhost:8000/docs  |
| ❤️ Health Check  | http://localhost:8000/health|

---

## 🛠️ Instalação Manual

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Linux/Mac
# venv\Scripts\activate    # Windows

pip install -r requirements.txt

# Configurar banco e executar migrações
export DATABASE_URL=postgresql://user:pass@localhost:5432/motomec17gb
alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --reload --port 8000
```

### Frontend (React)

```bash
cd frontend
npm install
echo "REACT_APP_API_URL=http://localhost:8000" > .env.local
npm start
```

---

## ⚙️ Configuração

Copie `.env.exemplo` para `.env` e preencha as variáveis:

```env
# Banco de dados
DATABASE_URL=postgresql://motomec:senha@localhost:5432/motomec17gb

# Google Sheets
GOOGLE_SHEETS_ID=seu_id_da_planilha
GOOGLE_CREDENTIALS_PATH=config/credentials.json

# Telegram Bot
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_CHAT_ID=seu_chat_id_aqui

# JWT (gere com: openssl rand -hex 32)
SECRET_KEY=sua_chave_secreta_aqui

# App
DEBUG=true
```

---

## 📡 Endpoints da API

Prefixo base: `/api/v1`

| Router            | Prefixo                  | Principais endpoints                |
|-------------------|--------------------------|-------------------------------------|
| 🚒 Frota          | `/frota`                 | CRUD + `/resumo`                    |
| 🔧 Manutenção     | `/manutencao`            | CRUD + `/pendentes` + `/vencidas`   |
| ⛽ Abastecimento  | `/abastecimento`         | CRUD + `/relatorio`                 |
| 💰 Gastos         | `/gastos`                | CRUD + `/por-viatura` + `/por-categoria` |
| 🚨 Alertas        | `/alertas`               | CRUD + `/nao-lidos` + `/ler` + `/resolver` |
| 📊 Relatórios     | `/relatorios`            | `/diario` + `/mensal` + `/anual`    |
| 👥 Usuários       | `/usuarios`              | `/login` + `/me` + CRUD             |

Documentação completa: [docs/API.md](docs/API.md)

---

## 📁 Estrutura do Projeto

```
motomec17gb-frota/
├── backend/                 # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/             # Routers (endpoints)
│   │   ├── models/          # Modelos SQLAlchemy
│   │   ├── schemas/         # Validação Pydantic
│   │   ├── services/        # Lógica de negócio
│   │   ├── integrations/    # Google Sheets, FIPE, Telegram
│   │   └── middleware/      # Logging
│   ├── tests/               # Testes pytest
│   └── Dockerfile
├── frontend/                # React + Tailwind CSS + Nginx
│   └── Dockerfile
├── src/                     # Scripts Python originais (legado)
├── config/                  # Credenciais Google (não commitado)
├── docs/                    # Documentação técnica
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   └── TELEGRAM.md
├── .github/workflows/       # GitHub Actions CI/CD
│   ├── deploy.yml
│   ├── test.yml
│   └── lint.yml
├── docker-compose.yml
├── .env.exemplo
└── CHANGELOG.md
```

---

## 🤖 Bot Telegram

Configure um bot com o @BotFather e adicione o token no `.env`. O bot suporta:

- `/status` — Status atual da frota
- `/alertas` — Alertas críticos ativos
- `/relatorio` — Relatório diário consolidado
- Notificações automáticas de manutenção vencida

Consulte [docs/TELEGRAM.md](docs/TELEGRAM.md) para o guia completo.

---

## 🧪 Testes

```bash
# Backend
cd backend
pytest tests/ -v

# Com cobertura
pytest tests/ -v --cov=app --cov-report=term-missing
```

---

## 🚂 Deploy

O projeto é implantado no **Railway**. O GitHub Actions executa automaticamente:

1. ✅ Testes (`pytest`) em todo push/PR
2. 🔍 Linting (`flake8` + `ESLint`) em PRs
3. 🚀 Deploy automático para Railway em push na branch `main`

Guia completo: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 📚 Documentação

| Documento                            | Conteúdo                              |
|--------------------------------------|---------------------------------------|
| [docs/API.md](docs/API.md)           | Todos os endpoints com exemplos       |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura e tecnologias   |
| [docs/DATABASE.md](docs/DATABASE.md) | Esquema do banco e queries            |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploy local e em produção       |
| [docs/TELEGRAM.md](docs/TELEGRAM.md) | Configuração do bot                  |
| [CHANGELOG.md](CHANGELOG.md)         | Histórico de versões                 |

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: adiciona minha feature'`
4. Push para a branch: `git push origin feature/minha-feature`
5. Abra um Pull Request

Os testes e linting são executados automaticamente no PR via GitHub Actions.

---

## 📄 Licença

Este projeto é propriedade do **17º Grupamento de Bombeiros — Corpo de Bombeiros do Estado de São Paulo**.

---

<div align="center">
  <strong>🚒 17º Grupamento de Bombeiros — SP</strong><br>
  Sistema de Gestão de Frota v1.0.0
</div>
