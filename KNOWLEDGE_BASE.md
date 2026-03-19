# 📚 Base de Conhecimento — Deploy Railway + Docker + Uvicorn

> Projeto: `motomec17gb-frota`
> Data: 2026-03-19
> Status final: ✅ Online

---

## 🧩 Contexto do Problema

Durante o deploy do backend Python (FastAPI + Uvicorn) no Railway usando Dockerfile, o serviço falhava repetidamente com o erro:

```
Error: Invalid value for '--port': '$PORT' is not a valid integer.
```

O Railway injeta a variável de ambiente `$PORT` automaticamente em cada container. O uvicorn recebia a string literal `$PORT` em vez do número inteiro da porta — ou seja, a variável **nunca estava sendo expandida**.

---

## 🔍 Investigação — Linha do Tempo

### Tentativa 1 — Suspeita de cache
- **Hipótese:** O Railway estava usando uma imagem antiga em cache.
- **Resultado:** ❌ Não resolveu. O problema não era cache.

### Tentativa 2 — Identificação do `railway.json`
- **Descoberta:** O arquivo `backend/railway.json` tinha um `startCommand` hardcoded:
  ```json
  "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
  ```
- **Problema:** O `railway.json` tem **prioridade máxima** sobre o Dockerfile. Ele sempre sobrescreve o `CMD` do Dockerfile.
- **Ação:** Alterado `${PORT:-8000}` → `$PORT`
- **Resultado:** ❌ Não resolveu. Novo erro apareceu.

### Tentativa 3 — JSON inválido com `\n` literais
- **Erro:** `Failed to parse JSON file backend/railway.json: invalid character '\' looking for beginning of object key string`
- **Causa:** O arquivo foi salvo com `\n` literais no conteúdo em vez de quebras de linha reais, tornando o JSON inválido.
- **Ação:** Reescrito o arquivo com formatação JSON correta (quebras de linha reais).
- **Resultado:** ❌ JSON corrigido, mas o erro de `$PORT` persistiu.

### Tentativa 4 — Formato do CMD no Dockerfile
- **Descoberta:** O `CMD` do Dockerfile estava em formato shell simples:
  ```dockerfile
  CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
- **Ação:** Alterado para formato exec com shell explícito:
  ```dockerfile
  CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
  ```
- **Resultado:** ❌ Ainda não resolveu, pois o `startCommand` do `railway.json` continuava sobrescrevendo o CMD.

### ✅ Tentativa 5 — Remoção do `startCommand` do `railway.json`
- **Causa raiz confirmada:** O Railway executa o `startCommand` do `railway.json` **sem passar por um shell**, então `$PORT` nunca é expandido — chega como string literal para o uvicorn.
- **Ação:** Removido completamente o campo `startCommand` do `railway.json`.
- **Resultado:** ✅ **Serviço Online!**

---

## 🎯 Causa Raiz

O Railway executa o `startCommand` definido no `railway.json` **diretamente, sem shell intermediário**. Isso significa que variáveis de ambiente como `$PORT` **não são expandidas** antes de serem passadas ao processo.

| Fonte do comando | Execução via shell? | `$PORT` expandido? |
|---|---|---|
| `startCommand` no `railway.json` | ❌ Não | ❌ Não |
| `CMD` no Dockerfile (formato shell) | ✅ Sim (`/bin/sh -c`) | ✅ Sim |
| `CMD ["sh", "-c", "..."]` no Dockerfile | ✅ Sim (explícito) | ✅ Sim |
| `CMD ["uvicorn", ..., "$PORT"]` no Dockerfile | ❌ Não | ❌ Não |

---

## ✅ Configuração Final Correta

### `backend/railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3,
    "healthcheckPath": "/health"
  }
}
```
> ⚠️ **Sem `startCommand`** — deixa o Dockerfile assumir o controle.

### `backend/Dockerfile`
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
```
> ✅ `CMD` com `sh -c` garante expansão de variáveis de ambiente.

---

## 📐 Regras de Ouro — Railway + Docker

### 1. Prioridade de configuração no Railway
```
railway.json startCommand  >  Dockerfile CMD  >  Dockerfile ENTRYPOINT
```
O `railway.json` sempre ganha. Se existir `startCommand`, ele sobrescreve tudo.

### 2. Expansão de variáveis de ambiente
- **`startCommand` no `railway.json`:** executado sem shell → `$PORT` NÃO é expandido
- **`CMD` no Dockerfile em formato shell:** executado via `/bin/sh -c` → `$PORT` É expandido
- **`CMD` no Dockerfile em formato exec com shell:** shell explícito → `$PORT` É expandido
- **`CMD` no Dockerfile em formato exec sem shell:** sem expansão → `$PORT` NÃO é expandido

### 3. Formatos do CMD no Dockerfile

| Formato | Sintaxe | Shell? | Expansão de variáveis |
|---|---|---|---|
| Shell form | `CMD uvicorn ... --port $PORT` | ✅ `/bin/sh -c` | ✅ Sim |
| Exec form com shell | `CMD ["sh", "-c", "uvicorn ... --port $PORT"]` | ✅ Explícito | ✅ Sim |
| Exec form puro | `CMD ["uvicorn", "--port", "$PORT"]` | ❌ | ❌ Não |

### 4. Validação de JSON
- Sempre verificar se o `railway.json` tem formatação válida
- `\n` literais no conteúdo causam erro de parse: `invalid character '\'`
- Usar ferramentas como [jsonlint.com](https://jsonlint.com) para validar antes de commitar

### 5. Variáveis de ambiente no Railway
- O Railway injeta `$PORT` automaticamente — nunca defina uma porta fixa
- Evite fallbacks como `${PORT:-8000}` pois mascaram erros de configuração
- Use sempre `$PORT` diretamente

---

## 🚨 Erros Comuns e Soluções

| Erro | Causa | Solução |
|---|---|---|
| `'$PORT' is not a valid integer` | `startCommand` no `railway.json` sem shell | Remover `startCommand` ou usar `sh -c "..."` |
| `'$PORT' is not a valid integer` | `CMD` exec form sem shell no Dockerfile | Usar `CMD ["sh", "-c", "... $PORT"]` |
| `invalid character '\' looking for beginning of object key string` | JSON salvo com `\n` literais | Reescrever o arquivo com quebras de linha reais |
| Deploy usa configuração antiga | `startCommand` no `railway.json` sobrescrevendo Dockerfile | Verificar e limpar o `railway.json` |

---

## 🔧 Checklist de Deploy Railway + Dockerfile

- [ ] `railway.json` não tem `startCommand` (ou usa `sh -c` explicitamente)
- [ ] `railway.json` é JSON válido (sem `\n` literais, sem vírgulas extras)
- [ ] `Dockerfile` usa `CMD ["sh", "-c", "... $PORT"]` ou formato shell simples
- [ ] Não há porta fixa hardcoded (sem `--port 8000`)
- [ ] `ENV PORT=8000` no Dockerfile serve apenas como fallback local
- [ ] `EXPOSE` é declarativo apenas (não vincula a porta de fato)

---

## 📁 Commits de Referência

| Commit | Mudança |
|---|---|
| [a71137e](https://github.com/fasterdrible-lab/motomec17gb-frota/commit/a71137e4b5a5508a38d940f8ab0e1edaf60a8b25) | `${PORT:-8000}` → `$PORT` no `railway.json` |
| [2d6448c](https://github.com/fasterdrible-lab/motomec17gb-frota/commit/2d6448c6632d0283fe31275eeb9a646e45d63eaf) | JSON reescrito com formatação correta |
| [95e99c6](https://github.com/fasterdrible-lab/motomec17gb-frota/commit/95e99c65b2a8471d7c3b5dbb406f80e2ef72da6e) | Dockerfile CMD alterado para `[{"sh", "-c", "..."}]` |
| [d7324d6](https://github.com/fasterdrible-lab/motomec17gb-frota/commit/d7324d623dfbaaef98e563e2f49592fd1f2f9c97) | ✅ **Remoção do `startCommand`** — correção definitiva |

---

*Documento gerado em 2026-03-19 | Projeto: motomec17gb-frota | Autor: fasterdrible-lab*