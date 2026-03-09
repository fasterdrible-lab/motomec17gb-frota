# 🚗 MotoMec Frota — Sistema de Gestão de Frota

Sistema completo para gerenciamento de frota de veículos com backend **FastAPI**, frontend **React**, integração com **PostgreSQL**, **Google Sheets** e **Telegram Bot**.

---

## 🏗️ Arquitetura

```
motomec17gb-frota/
├── backend/                  # FastAPI (Python 3.11)
│   ├── app.py                # Aplicação principal
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── config/               # Settings e Database
│   ├── routers/              # Endpoints REST
│   ├── models/               # SQLAlchemy + Pydantic schemas
│   ├── services/             # FIPE, Google Sheets, Telegram
│   └── middleware/           # CORS
├── frontend/                 # React 18
│   ├── src/
│   │   ├── components/       # Dashboard, VehicleList, DriverList, etc.
│   │   ├── pages/            # Home, Vehicles, Drivers, Maintenance, Reports
│   │   ├── services/         # Axios API client + Auth
│   │   ├── styles/           # CSS variables e global
│   │   └── utils/            # Helpers
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml        # Orquestração completa
├── .env.example              # Template de variáveis de ambiente
└── src/                      # Código legado (mantido para referência)
```

---

## 🚀 Quick Start com Docker

### 1. Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) >= 24
- [Docker Compose](https://docs.docker.com/compose/install/) >= 2.20

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` e preencha suas credenciais.

### 3. (Opcional) Credenciais Google

Coloque o arquivo `credentials.json` da conta de serviço em `backend/config/credentials.json`.

### 4. Subir o sistema

```bash
docker-compose up --build
```

### 5. Acessar

| Serviço | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **API (backend)** | http://localhost:8000 |
| **Docs interativos (Swagger)** | http://localhost:8000/docs |
| **Health check** | http://localhost:8000/health |

---

## 🛠️ Desenvolvimento Local (sem Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

---

## 📋 Principais Endpoints da API

- `POST /auth/token` — Login (retorna JWT)
- `GET /vehicles` — Listar veículos
- `GET /drivers` — Listar motoristas
- `GET /maintenance/alerts` — Alertas pendentes
- `GET /fipe/brands/{type}` — Marcas FIPE
- `GET /sheets/vehicles` — Sincronizar do Google Sheets
- `GET /health` — Status da API

Documentação completa em http://localhost:8000/docs

---

## 🔧 Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL de conexão PostgreSQL |
| `SECRET_KEY` | Chave JWT (mude em produção!) |
| `GOOGLE_SHEETS_ID` | ID da planilha Google |
| `TELEGRAM_BOT_TOKEN` | Token do bot Telegram |
| `TELEGRAM_CHAT_ID` | Chat ID para notificações |
| `FIPE_API_URL` | URL da API FIPE |

---

## 📄 Licença

MIT — veja o arquivo LICENSE para detalhes.

---

**Última atualização:** 2026-03-09
