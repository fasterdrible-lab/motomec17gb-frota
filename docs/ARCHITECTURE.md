# 🏗️ Arquitetura do Sistema — Gestão de Frota 17º GB

---

## 📐 Visão Geral

O sistema é uma aplicação web full-stack com arquitetura em três camadas (frontend, backend, banco de dados), projetada para gerenciar a frota de 57 viaturas do 17º Grupamento de Bombeiros do Estado de São Paulo.

```
┌─────────────────────────────────────────────────────────────────┐
│                     USUÁRIO (Navegador)                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP / HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND — React SPA                          │
│              (Nginx + React 18 + Tailwind CSS)                  │
│                     Porta: 3000 / 80                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API (JSON)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND — FastAPI (Python)                     │
│                     Porta: 8000                                 │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌────────────────┐   │
│  │  Frota   │ │Manutencao│ │Abastecim. │ │    Gastos      │   │
│  └──────────┘ └──────────┘ └───────────┘ └────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐                       │
│  │ Alertas  │ │Relatórios│ │ Usuários  │                       │
│  └──────────┘ └──────────┘ └───────────┘                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              SQLAlchemy ORM + Alembic                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────┬─────────────┬────────────────┬───────────────────┘
               │             │                │
               ▼             ▼                ▼
   ┌───────────────┐  ┌──────────────┐  ┌────────────────┐
   │  PostgreSQL   │  │Google Sheets │  │   Telegram     │
   │  (Principal)  │  │  (Planilha)  │  │     Bot        │
   │   Porta: 5432 │  │   API v4     │  │  Notificações  │
   └───────────────┘  └──────────────┘  └────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   API FIPE       │
                    │ (Preços veículos)│
                    └──────────────────┘
```

---

## 🖥️ Backend — FastAPI

### Estrutura de Diretórios

```
backend/
├── app/
│   ├── api/                  # Routers FastAPI (endpoints REST)
│   │   ├── frota.py          # CRUD de viaturas
│   │   ├── manutencao.py     # Controle de manutenções
│   │   ├── abastecimento.py  # Registro de abastecimentos
│   │   ├── gastos.py         # Controle financeiro
│   │   ├── alertas.py        # Sistema de alertas
│   │   ├── relatorios.py     # Geração de relatórios
│   │   └── usuarios.py       # Autenticação e usuários
│   ├── models/               # Modelos SQLAlchemy (ORM)
│   │   ├── frota.py          # Modelo Viatura
│   │   ├── manutencao.py     # Modelo Manutencao
│   │   ├── abastecimento.py  # Modelo Abastecimento
│   │   ├── gastos.py         # Modelo Gasto
│   │   ├── defeitos.py       # Modelo Defeito
│   │   ├── ordens_servico.py # Modelo OrdemServico
│   │   ├── alertas.py        # Modelo Alerta
│   │   └── usuarios.py       # Modelo Usuario
│   ├── schemas/              # Schemas Pydantic (validação)
│   │   ├── frota_schema.py
│   │   ├── manutencao_schema.py
│   │   ├── abastecimento_schema.py
│   │   ├── gastos_schema.py
│   │   ├── alertas_schema.py
│   │   └── usuarios_schema.py
│   ├── services/             # Lógica de negócio
│   │   ├── alertas_service.py
│   │   ├── manutencao_service.py
│   │   ├── gastos_service.py
│   │   └── relatorio_service.py
│   ├── integrations/         # Integrações externas
│   │   ├── google_sheets.py  # Google Sheets API
│   │   ├── telegram_bot.py   # Telegram Bot API
│   │   └── fipe_api.py       # API FIPE
│   ├── middleware/           # Middlewares personalizados
│   │   └── logging.py        # Log de requisições HTTP
│   ├── config.py             # Configurações (Pydantic Settings)
│   ├── database.py           # Conexão e sessão do banco
│   └── main.py               # Entrypoint da aplicação
├── tests/                    # Testes automatizados
├── database/                 # Migrations Alembic
├── Dockerfile
├── requirements.txt
└── run.py
```

### Padrão Arquitetural

O backend segue o padrão **Router → Service → Repository (ORM)**:

```
Request → Router (validação via Pydantic)
        → Service (lógica de negócio)
        → Model/ORM (acesso ao banco)
        → Response (serialização Pydantic)
```

### Tecnologias do Backend

| Tecnologia          | Versão  | Uso                              |
|---------------------|---------|----------------------------------|
| FastAPI             | 0.100+  | Framework web assíncrono         |
| SQLAlchemy          | 2.x     | ORM para acesso ao banco         |
| Pydantic v2         | 2.x     | Validação e serialização         |
| Pydantic Settings   | 2.x     | Configuração por variáveis       |
| Alembic             | 1.x     | Migrações do banco de dados      |
| python-jose         | 3.x     | Geração e validação de JWT       |
| passlib             | 1.x     | Hash de senhas (bcrypt)          |
| httpx               | 0.24+   | Cliente HTTP assíncrono          |

---

## ⚛️ Frontend — React

### Estrutura de Diretórios

```
frontend/
├── src/
│   ├── components/       # Componentes reutilizáveis
│   ├── pages/            # Páginas da aplicação
│   ├── services/         # Chamadas à API REST
│   ├── hooks/            # Custom React Hooks
│   ├── context/          # Contextos globais (Auth, Theme)
│   └── utils/            # Utilitários
├── public/
├── nginx.conf            # Configuração do servidor web
├── Dockerfile
└── package.json
```

### Tecnologias do Frontend

| Tecnologia      | Uso                                  |
|-----------------|--------------------------------------|
| React 18        | Framework UI                         |
| React Router    | Roteamento SPA                       |
| Axios / Fetch   | Requisições HTTP para o backend      |
| Tailwind CSS    | Estilização utilitária               |
| Nginx           | Servidor web em produção             |

---

## 🗄️ Banco de Dados — PostgreSQL

O banco possui **8 tabelas principais** com relacionamentos bem definidos:

```
viaturas (central)
    ├── manutencoes
    ├── abastecimentos
    ├── gastos
    ├── defeitos
    ├── ordens_servico
    └── alertas (opcional — nullable viatura_id)

usuarios (independente)
```

Para o esquema detalhado, consulte [DATABASE.md](./DATABASE.md).

---

## 🔗 Integrações Externas

### Google Sheets

- **Biblioteca:** `gspread` + `google-auth`
- **Autenticação:** Conta de serviço Google (JSON credentials)
- **Fluxo:** Sistema lê/escreve dados da planilha de controle de frota existente
- **Configuração:** `GOOGLE_SHEETS_ID` + `GOOGLE_CREDENTIALS_PATH`

```
Backend → gspread → Google Sheets API v4 → Planilha do 17º GB
```

### API FIPE

- **URL Base:** `https://parallelum.com.br/fipe/api/v1`
- **Uso:** Consulta de valores de mercado das viaturas
- **Integração:** Atualização automática do campo `valor_fipe` nas viaturas

```
Backend → httpx → API FIPE → Valor de Mercado
```

### Telegram Bot

- **Biblioteca:** `python-telegram-bot`
- **Autenticação:** Token via `@BotFather`
- **Funcionalidades:**
  - Notificação automática de alertas críticos
  - Relatório diário da frota
  - Comandos manuais (`/status`, `/alertas`, `/relatorio`)

```
Backend → Telegram Bot API → Chat/Grupo do 17º GB
```

---

## 🔄 Fluxo de Dados

### Criação de Alerta Automático

```
1. Timer periódico (ALERT_CHECK_INTERVAL horas)
       ↓
2. AlertasService verifica manutenções vencidas
       ↓
3. Compara km_atual vs km_proximo (ou data atual vs data_proximo)
       ↓
4. Cria registro na tabela "alertas" (PostgreSQL)
       ↓
5. Envia notificação via Telegram Bot
       ↓
6. Frontend exibe alerta no dashboard em tempo real
```

### Sincronização com Google Sheets

```
1. Dados inseridos via API REST (frontend)
       ↓
2. Backend persiste no PostgreSQL
       ↓
3. Integration service sincroniza com Google Sheets
       ↓
4. Planilha atualizada para acesso off-line
```

---

## 🔐 Segurança

- **Autenticação:** JWT Bearer Tokens (HS256)
- **Senhas:** Hash bcrypt via passlib
- **CORS:** Configurado via FastAPI middleware
- **Validação:** Pydantic v2 em todos os endpoints
- **Autorização:** Perfis Admin / Editor / Leitor
