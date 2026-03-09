# 📡 Documentação da API — Sistema de Gestão de Frota 17º GB

> **Base URL:** `http://localhost:8000/api/v1`
> **Documentação interativa:** `http://localhost:8000/docs` (Swagger UI) | `http://localhost:8000/redoc`

---

## 🔐 Autenticação

A API utiliza **JWT Bearer Token**. Para autenticar:

### 1. Obter token de acesso

```http
POST /api/v1/usuarios/login
Content-Type: application/json

{
  "email": "admin@17gb.sp.gov.br",
  "password": "sua_senha"
}
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 2. Usar o token nas requisições

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Expiração:** 30 minutos (configurável via `ACCESS_TOKEN_EXPIRE_MINUTES`)

---

## 🏥 Health Checks

| Método | Endpoint  | Descrição              |
|--------|-----------|------------------------|
| GET    | `/health` | Liveness probe simples |
| GET    | `/status` | Readiness probe detalhado |

**Exemplo `/status`:**
```json
{
  "status": "running",
  "service": "motomec17gb-frota",
  "version": "1.0.0",
  "debug": false,
  "google_sheets_id": "1q6wy9..."
}
```

---

## 🚒 Frota (`/api/v1/frota`)

Gerenciamento das viaturas da frota do 17º GB.

| Método | Endpoint                  | Descrição                         |
|--------|---------------------------|-----------------------------------|
| GET    | `/frota/`                 | Listar todas as viaturas          |
| GET    | `/frota/{id}`             | Buscar viatura por ID             |
| POST   | `/frota/`                 | Cadastrar nova viatura            |
| PUT    | `/frota/{id}`             | Atualizar dados da viatura        |
| DELETE | `/frota/{id}`             | Remover viatura                   |
| GET    | `/frota/{id}/resumo`      | Resumo completo da viatura        |

### Parâmetros de filtro (GET `/frota/`)
| Parâmetro | Tipo   | Descrição                                 |
|-----------|--------|-------------------------------------------|
| `status`  | string | `operacional`, `manutencao` ou `inativo`  |
| `unidade` | string | Filtrar por unidade do 17º GB             |

### Exemplo — Cadastrar Viatura
```http
POST /api/v1/frota/
Authorization: Bearer {token}
Content-Type: application/json

{
  "placa": "ABC-1234",
  "prefixo": "AB-01",
  "modelo": "Sprinter CDI",
  "marca": "Mercedes-Benz",
  "ano": 2020,
  "unidade": "17ºGB-1ºSGB",
  "status": "operacional",
  "km_atual": 45000
}
```

**Resposta (201 Created):**
```json
{
  "id": 1,
  "placa": "ABC-1234",
  "prefixo": "AB-01",
  "modelo": "Sprinter CDI",
  "marca": "Mercedes-Benz",
  "ano": 2020,
  "valor_fipe": null,
  "unidade": "17ºGB-1ºSGB",
  "status": "operacional",
  "km_atual": 45000,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00"
}
```

---

## 🔧 Manutenção (`/api/v1/manutencao`)

Controle de manutenções preventivas e corretivas.

| Método | Endpoint                          | Descrição                           |
|--------|-----------------------------------|-------------------------------------|
| GET    | `/manutencao/`                    | Listar todas as manutenções         |
| GET    | `/manutencao/pendentes`           | Listar manutenções pendentes        |
| GET    | `/manutencao/vencidas`            | Listar manutenções vencidas         |
| GET    | `/manutencao/viatura/{viatura_id}`| Manutenções de uma viatura          |
| GET    | `/manutencao/{id}`                | Buscar manutenção por ID            |
| POST   | `/manutencao/`                    | Registrar nova manutenção           |
| PUT    | `/manutencao/{id}`                | Atualizar manutenção                |

### Tipos de manutenção
`oleo` | `pneu` | `bateria` | `inspecao` | `geral`

### Exemplo — Registrar Manutenção
```http
POST /api/v1/manutencao/
Authorization: Bearer {token}
Content-Type: application/json

{
  "viatura_id": 1,
  "tipo": "oleo",
  "km_proximo": 50000,
  "data_proximo": "2024-03-01",
  "status": "pendente",
  "data_ultima": "2024-01-01",
  "observacoes": "Troca de óleo 5W30 sintético"
}
```

---

## ⛽ Abastecimento (`/api/v1/abastecimento`)

Registro e controle de abastecimentos.

| Método | Endpoint                              | Descrição                            |
|--------|---------------------------------------|--------------------------------------|
| GET    | `/abastecimento/`                     | Listar abastecimentos                |
| GET    | `/abastecimento/relatorio`            | Relatório de consumo                 |
| GET    | `/abastecimento/viatura/{viatura_id}` | Abastecimentos de uma viatura        |
| GET    | `/abastecimento/{id}`                 | Buscar abastecimento por ID          |
| POST   | `/abastecimento/`                     | Registrar abastecimento              |

### Exemplo — Registrar Abastecimento
```http
POST /api/v1/abastecimento/
Authorization: Bearer {token}
Content-Type: application/json

{
  "viatura_id": 1,
  "data": "2024-01-15",
  "km": 45200,
  "quantidade_litros": 60.5,
  "valor_total": 362.99,
  "posto": "Posto BR Avenida Central",
  "responsavel": "Sgt. João Silva"
}
```

---

## 💰 Gastos (`/api/v1/gastos`)

Controle financeiro de despesas da frota.

| Método | Endpoint                | Descrição                        |
|--------|-------------------------|----------------------------------|
| GET    | `/gastos/`              | Listar gastos                    |
| GET    | `/gastos/por-viatura`   | Gastos agrupados por viatura     |
| GET    | `/gastos/por-categoria` | Gastos agrupados por categoria   |
| GET    | `/gastos/{id}`          | Buscar gasto por ID              |
| POST   | `/gastos/`              | Registrar gasto                  |

### Categorias de gasto
`manutencao` | `combustivel` | `peca` | `servico` | `outro`

### Exemplo — Gastos por Categoria
**Resposta:**
```json
[
  {
    "categoria": "combustivel",
    "total": 12450.80,
    "quantidade": 45
  },
  {
    "categoria": "manutencao",
    "total": 8320.00,
    "quantidade": 12
  }
]
```

---

## 🚨 Alertas (`/api/v1/alertas`)

Sistema de alertas de manutenção e situações críticas.

| Método | Endpoint                      | Descrição                          |
|--------|-------------------------------|-------------------------------------|
| GET    | `/alertas/`                   | Listar todos os alertas             |
| GET    | `/alertas/nao-lidos`          | Listar alertas não lidos            |
| GET    | `/alertas/{id}`               | Buscar alerta por ID                |
| POST   | `/alertas/`                   | Criar alerta manual                 |
| PUT    | `/alertas/{id}/ler`           | Marcar alerta como lido             |
| PUT    | `/alertas/{id}/resolver`      | Marcar alerta como resolvido        |
| DELETE | `/alertas/{id}`               | Remover alerta                      |

### Tipos de alerta
| Tipo      | Descrição                              |
|-----------|----------------------------------------|
| `critico` | Viatura inoperante, situação crítica   |
| `urgente` | Ação necessária em menos de 24h       |
| `aviso`   | Atenção necessária em breve           |
| `info`    | Informação geral                       |

---

## 📊 Relatórios (`/api/v1/relatorios`)

Geração de relatórios gerenciais da frota.

| Método | Endpoint                   | Descrição                           |
|--------|----------------------------|-------------------------------------|
| GET    | `/relatorios/diario`       | Relatório diário da frota           |
| GET    | `/relatorios/mensal`       | Relatório mensal consolidado        |
| GET    | `/relatorios/anual`        | Relatório anual                     |
| GET    | `/relatorios/frota-status` | Status atual de toda a frota        |
| GET    | `/relatorios/gastos-resumo`| Resumo financeiro consolidado       |

### Exemplo — Relatório Diário
**Resposta:**
```json
{
  "data": "2024-01-15",
  "total_viaturas": 57,
  "operacionais": 48,
  "em_manutencao": 7,
  "inativas": 2,
  "alertas_pendentes": 5,
  "abastecimentos_hoje": 3,
  "custo_hoje": 1089.50
}
```

---

## 👥 Usuários (`/api/v1/usuarios`)

Gerenciamento de usuários e autenticação.

| Método | Endpoint              | Descrição                       |
|--------|-----------------------|---------------------------------|
| POST   | `/usuarios/login`     | Autenticar e obter token JWT    |
| GET    | `/usuarios/me`        | Dados do usuário autenticado    |
| GET    | `/usuarios/`          | Listar usuários (Admin)         |
| GET    | `/usuarios/{id}`      | Buscar usuário por ID           |
| POST   | `/usuarios/`          | Criar novo usuário (Admin)      |
| PUT    | `/usuarios/{id}`      | Atualizar usuário               |

### Perfis de acesso
| Cargo    | Permissões                                     |
|----------|------------------------------------------------|
| `Admin`  | Acesso total — CRUD em todos os recursos       |
| `Editor` | Leitura e escrita, sem gerenciar usuários      |
| `Leitor` | Apenas leitura                                 |

---

## ❌ Códigos de Erro

| Código | Significado               | Quando ocorre                          |
|--------|---------------------------|----------------------------------------|
| 400    | Bad Request               | Dados inválidos no corpo da requisição |
| 401    | Unauthorized              | Token ausente ou expirado              |
| 403    | Forbidden                 | Sem permissão para o recurso           |
| 404    | Not Found                 | Recurso não encontrado                 |
| 409    | Conflict                  | Recurso já existe (ex: placa duplicada)|
| 422    | Unprocessable Entity      | Erro de validação dos campos           |
| 500    | Internal Server Error     | Erro inesperado no servidor            |

### Formato padrão de erro
```json
{
  "detail": "Viatura com placa 'ABC-1234' já existe"
}
```

### Erro de validação (422)
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "placa"],
      "msg": "Field required",
      "input": {}
    }
  ]
}
```

---

## 📌 Paginação e Filtros

Endpoints de listagem aceitam parâmetros de query:

| Parâmetro | Tipo    | Padrão | Descrição              |
|-----------|---------|--------|------------------------|
| `skip`    | integer | 0      | Registros a pular      |
| `limit`   | integer | 100    | Máximo de registros    |

**Exemplo:**
```http
GET /api/v1/frota/?skip=0&limit=20&status=operacional
```
