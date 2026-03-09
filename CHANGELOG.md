# 📋 Changelog — Sistema de Gestão de Frota 17º GB

Todas as mudanças notáveis neste projeto serão documentadas aqui.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [1.0.0] — 2024-01-XX

### Adicionado

#### Backend
- Arquitetura enterprise com **FastAPI** e **PostgreSQL**
- 8 modelos de dados com **SQLAlchemy ORM**:
  - `Viatura` — gerenciamento da frota de 57 viaturas
  - `Manutencao` — controle de manutenções preventivas e corretivas
  - `Abastecimento` — registro de abastecimentos
  - `Gasto` — controle financeiro de despesas
  - `Defeito` — registro de ocorrências de defeitos
  - `OrdemServico` — controle de ordens de serviço
  - `Alerta` — sistema de alertas automáticos
  - `Usuario` — autenticação e controle de acesso
- 7 routers REST com endpoints completos:
  - `/api/v1/frota` — CRUD completo + resumo por viatura
  - `/api/v1/manutencao` — com filtros de pendentes e vencidas
  - `/api/v1/abastecimento` — com relatório de consumo
  - `/api/v1/gastos` — com agrupamentos por viatura e categoria
  - `/api/v1/alertas` — com marcação de lido/resolvido
  - `/api/v1/relatorios` — diário, mensal, anual e status
  - `/api/v1/usuarios` — login JWT + CRUD
- Autenticação **JWT Bearer Token** com perfis Admin/Editor/Leitor
- Validação completa de dados com **Pydantic v2**
- Configuração via **Pydantic Settings** (variáveis de ambiente)
- Middleware de logging de requisições HTTP
- Health check endpoints (`/health` e `/status`)
- Documentação automática via Swagger UI (`/docs`) e ReDoc (`/redoc`)
- Migrações de banco de dados com **Alembic**
- Testes automatizados com **pytest** (testes de API, modelos e serviços)

#### Frontend
- Dashboard React profissional com **React 18**
- Interface responsiva com **Tailwind CSS**
- Servido em produção via **Nginx**
- Integração completa com a API REST

#### Integrações
- **Google Sheets API v4** — sincronização bidirecional com planilha da frota
- **API FIPE** — consulta automática de valores de mercado
- **Telegram Bot** — notificações de alertas e relatórios diários

#### Infraestrutura
- **Docker Compose** para desenvolvimento local com 3 serviços orquestrados
- **GitHub Actions** CI/CD:
  - Workflow de testes automatizados (push + PR)
  - Workflow de linting (flake8 + ESLint)
  - Workflow de deploy para Railway
- Dockerfiles otimizados para backend e frontend

#### Documentação
- `docs/API.md` — Documentação completa de todos os endpoints
- `docs/ARCHITECTURE.md` — Diagrama e descrição da arquitetura
- `docs/DEPLOYMENT.md` — Guia de implantação (Docker + Railway)
- `docs/DATABASE.md` — Esquema do banco com queries comuns
- `docs/TELEGRAM.md` — Configuração e comandos do bot
- `README.md` — Documentação principal do projeto
- `CHANGELOG.md` — Histórico de versões

### Migrado

- Sistema Flask/scripts → **FastAPI** estruturado
- Templates HTML Jinja2 → **React SPA** com componentes reutilizáveis
- Configuração por código → **Pydantic Settings** (variáveis de ambiente)
- Scripts Python avulsos (`src/`) → módulos integrados no backend
- Dados em planilha → **PostgreSQL** com ORM e migrações

---

## [0.2.0] — 2023-XX-XX

### Adicionado

- Integração com **Google Sheets API** para leitura e escrita de dados da frota
- Integração com **API FIPE** para consulta de preços de veículos
- **Bot Telegram** com notificações de alertas em tempo real
- Sistema de alertas automáticos para manutenção vencida
- Relatórios automáticos diários enviados via Telegram

### Melhorado

- Sistema de logging com rotação de arquivos
- Tratamento de erros nas integrações externas

---

## [0.1.0] — 2023-XX-XX

### Adicionado

- Estrutura inicial do projeto
- Scripts Python para leitura do Google Sheets (`src/google_sheets.py`)
- Módulo de configuração (`src/config.py`)
- Sistema básico de alertas (`src/alertas.py`)
- Módulo inicial da API FIPE (`src/fipe_api.py`)
- Bot Telegram básico (`src/telegram_bot.py`)
- Script principal de execução (`src/main.py`)
- Arquivo `.env.exemplo` com variáveis necessárias
- `.gitignore` configurado para Python
- `requirements.txt` com dependências iniciais
