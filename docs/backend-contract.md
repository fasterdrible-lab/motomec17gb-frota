# Backend Contract - MOTOMEC 17GB Frota

Objetivo: definir a API que deve substituir gradualmente as leituras diretas de Google Sheets e os calculos de negocio no frontend.

## Principios

- Toda regra de negocio fica no backend.
- Frontend nao acessa planilhas, tokens, credenciais ou fontes externas diretamente.
- Frontend recebe dados autorizados, normalizados e prontos para exibicao.
- Erros usam formato padronizado.
- Endpoints exigem autenticacao, exceto login, cadastro permitido por politica e health check.

## Erro padrao

```json
{
  "detail": "Mensagem amigavel",
  "code": "ERROR_CODE",
  "requestId": "req-123"
}
```

Codigos HTTP:

- 400: entrada invalida.
- 401: nao autenticado.
- 403: sem permissao.
- 404: recurso nao encontrado.
- 409: conflito de regra de negocio.
- 422: validacao detalhada.
- 429: limite de uso.
- 500: erro interno.
- 502/503: fonte externa indisponivel.

## Health

### GET `/api/health`

Saida 200:

```json
{
  "status": "ok",
  "service": "motomec17gb-frota-api",
  "version": "0.1.0"
}
```

## Autenticacao

### POST `/api/auth/login`

Entrada: `application/x-www-form-urlencoded`

- `username`: email institucional.
- `password`: senha.

Saida 200:

```json
{
  "access_token": "jwt",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### GET `/api/auth/me`

Saida 200:

```json
{
  "id": 1,
  "nome": "Usuario",
  "email": "usuario@cbmesp.sp.gov.br",
  "cargo": "Sd BM",
  "unidade": "17GB",
  "perfil": "operador"
}
```

Regras de acesso:

- Usuario `pendente` recebe 403 `USER_PENDING` no login.
- Usuario `inativo` recebe 403 `USER_INACTIVE` no login e nas rotas protegidas.
- O backend revalida status e perfil do usuario a cada rota protegida, evitando confiar apenas no JWT antigo.

## Dashboard

### GET `/api/dashboard/macro`

Substitui `getDashboardMacro` e os calculos de cards no frontend.

Saida 200:

```json
{
  "frota": { "total": 0, "operando": 0, "baixadas": 0, "reserva": 0 },
  "totalAlertas": 0,
  "tarefasPendentes": 0,
  "gastoTotal": 0,
  "manutencoesRealizadas": 0,
  "viaturaTopGasto": { "prefixo": "", "valor": 0 },
  "viaturasMaisVelha": { "prefixo": "", "ano": "" },
  "tiposViatura": { "ABS": 0 },
  "os": { "total": 0, "aberta": 0, "fechada": 0, "andamento": 0 },
  "abastecimentos": {
    "total": 0,
    "gastoTotal": 0,
    "ultimoData": "",
    "ultimoPrefixo": "",
    "ultimoValor": 0
  },
  "fcd": { "total": 0, "hoje": 0 },
  "sincronizadoEm": "2026-05-19T00:00:00.000Z"
}
```

Regras no backend:

- Ler fontes externas com timeout.
- Normalizar status de frota.
- Calcular alertas, gastos, OS, abastecimentos e FCD.
- Retornar `warnings` quando houver dados parciais seguros.

## Frota

### GET `/api/frota`

Query opcional:

- `q`: busca textual.
- `tipo`: tipo/prefixo.
- `status`: `operando`, `baixada`, `reserva`.

Saida 200:

```json
[
  {
    "id": "ABS-001",
    "prefixo": "ABS-001",
    "placa": "ABC1D23",
    "codigoFipe": "",
    "fipeEstimado": 0,
    "opmcb": "",
    "posto": "",
    "proprietario": "",
    "marca": "",
    "modelo": "",
    "tipo": "ABS",
    "anoFab": 2020,
    "anoModelo": 2021,
    "kmAtual": 0,
    "status": "operando",
    "sgb": "1SGB"
  }
]
```

### GET `/api/frota/status-operacional`

Saida 200:

```json
{ "total": 0, "operando": 0, "baixadas": 0, "reserva": 0 }
```

## Manutencao

### GET `/api/manutencao`

Query opcional:

- `status`: `vencida`, `pendente`, `todas`.
- `prefixo`: prefixo da viatura.

Saida 200:

```json
[
  {
    "id": "man-1",
    "prefixo": "ABS-001",
    "tipo": "Oleo Motor",
    "status": "pendente",
    "detalhe": "Faltam 1200 km",
    "kmAtual": 10000,
    "kmLimite": 11200,
    "origem": "km"
  }
]
```

## Alertas

### GET `/api/alertas`

Saida 200:

```json
[
  {
    "id": "alerta-1",
    "prefixo": "ABS-001",
    "tipo": "Bateria",
    "nivel": "critico",
    "descricao": "Bateria vencida",
    "lido": false,
    "criadoEm": "2026-05-19T00:00:00.000Z"
  }
]
```

### PUT `/api/alertas/{id}/marcar-lido`

Saida 200:

```json
{ "id": "alerta-1", "lido": true }
```

## Tarefas

### GET `/api/tarefas`

Query opcional:

- `status`: `pendente`, `andamento`, `concluida`.

Saida 200:

```json
[
  {
    "id": "tar-1",
    "prefixo": "ABS-001",
    "placa": "",
    "titulo": "Verificar pneu",
    "descricao": "",
    "responsavel": "",
    "status": "pendente",
    "prioridade": "normal",
    "dataInicio": "2026-05-19",
    "dataFim": null
  }
]
```

## Abastecimentos

### GET `/api/abastecimentos`

Query opcional:

- `prefixo`
- `combustivel`
- `dataInicio`
- `dataFim`

Saida 200:

```json
[
  {
    "id": "abast-1",
    "data": "2026-05-19",
    "prefixo": "ABS-001",
    "placa": "",
    "km": 10000,
    "litros": 40.5,
    "valorTotal": 250.75,
    "posto": "",
    "combustivel": "Gasolina",
    "responsavel": "",
    "unidade": "",
    "obs": ""
  }
]
```

## Gastos

### GET `/api/gastos/por-viatura`

Saida 200:

```json
{
  "viaturas": [
    {
      "prefixo": "ABS-001",
      "placa": "",
      "totalGasto": 0,
      "qtdServicos": 0,
      "servicos": []
    }
  ],
  "listaGastos": [],
  "totalGeral": 0
}
```

## Relatorios

### GET `/api/relatorios/dados`

Saida 200:

```json
{
  "frotaStatus": {},
  "manutencoes": [],
  "alertas": [],
  "tarefas": [],
  "geradoEm": "2026-05-19T00:00:00.000Z"
}
```

## Logistica

### GET `/api/logistica/materiais-operacionais`

Saida 200:

```json
{
  "abas": [
    {
      "aba": "EPR",
      "icone": "",
      "rows": [],
      "op": 0,
      "bx": 0,
      "total": 0
    }
  ],
  "totais": { "total": 0, "op": 0, "bx": 0 },
  "thVencendo": 0
}
```

## Usuarios

### GET `/api/usuarios`

Restricao: perfil administrativo.

Query:

- `status`: opcional, aceita `pendente`, `ativo` ou `inativo`.

Resposta:

```json
[
  {
    "id": 1,
    "nome": "Admin Teste",
    "email": "admin@cbmesp.sp.gov.br",
    "cargo": "Comandante",
    "unidade": "17GB",
    "perfil": "admin",
    "status": "ativo",
    "createdAt": "2026-05-19T12:00:00.000Z"
  }
]
```

### POST `/api/usuarios`

Restricao: cadastro publico previo. O usuario sempre nasce com `status: "pendente"` e `perfil: "operador"`.

Entrada:

```json
{
  "nome": "Usuario",
  "email": "usuario@cbmesp.sp.gov.br",
  "password": "senha",
  "cargo": "",
  "unidade": "17GB"
}
```

Resposta 201:

```json
{
  "detail": "Cadastro recebido. Aguarde a liberacao de um administrador.",
  "user": {
    "id": 3,
    "nome": "Usuario",
    "email": "usuario@cbmesp.sp.gov.br",
    "cargo": "",
    "unidade": "17GB",
    "perfil": "operador",
    "status": "pendente",
    "createdAt": "2026-05-21T12:00:00.000Z"
  }
}
```

### PUT `/api/usuarios/{id}`

Restricao: perfil administrativo.

Entrada parcial:

```json
{
  "perfil": "visualizador",
  "status": "ativo"
}
```

### DELETE `/api/usuarios/{id}`

Restricao: perfil administrativo. Nao permite excluir a propria conta.

## Persistencia sugerida

Tabelas futuras:

- `users`
- `vehicles`
- `maintenance_events`
- `alerts`
- `tasks`
- `fuelings`
- `expenses`
- `logistics_assets`
- `sync_runs`
- `audit_logs`

Sincronizacao:

- `sync_runs` registra inicio, fim, fonte, status, contagens e erros.
- Dados vindos de planilha devem manter `source_ref` para rastreabilidade.

