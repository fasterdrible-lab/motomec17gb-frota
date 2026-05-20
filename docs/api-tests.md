# Testes de API - MOTOMEC 17GB Frota Backend

## Status: ✅ FASE 1 COMPLETA

### Endpoints Testados

#### 1. POST /api/auth/login ✅

**Objetivo:** Autenticar usuário e retornar JWT

**Teste de Sucesso:**
```
POST http://localhost:8000/api/auth/login
Content-Type: application/x-www-form-urlencoded

username=admin@cbmesp.sp.gov.br&password=admin123
```

**Resposta 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Teste com Operador:**
```
username=operador@cbmesp.sp.gov.br&password=operador123
```

**Resposta 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Cenários de Erro:**

- **Credenciais inválidas:**
```
POST /api/auth/login
username=admin@cbmesp.sp.gov.br&password=wrongpassword

Response 401:
{
  "detail": "Email ou senha incorretos.",
  "code": "INVALID_CREDENTIALS"
}
```

- **Campo faltando:**
```
POST /api/auth/login
username=admin@cbmesp.sp.gov.br

Response 400:
{
  "detail": "Email e senha sao obrigatorios.",
  "code": "MISSING_CREDENTIALS"
}
```

---

#### 2. GET /api/auth/me ✅

**Objetivo:** Retornar dados do usuário autenticado

**Teste de Sucesso:**
```
GET http://localhost:8000/api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta 200:**
```json
{
  "id": 2,
  "nome": "Operador Teste",
  "email": "operador@cbmesp.sp.gov.br",
  "cargo": "Sd BM",
  "unidade": "17GB",
  "perfil": "operador"
}
```

**Cenários de Erro:**

- **Sem token:**
```
GET /api/auth/me

Response 401:
{
  "detail": "Token nao fornecido.",
  "code": "UNAUTHORIZED"
}
```

- **Token inválido:**
```
GET /api/auth/me
Authorization: Bearer invalid-token-123

Response 401:
{
  "detail": "Token invalido.",
  "code": "UNAUTHORIZED"
}
```

- **Token expirado:**
```
GET /api/auth/me
Authorization: Bearer eyJ...expires...

Response 401:
{
  "detail": "Token expirado.",
  "code": "UNAUTHORIZED"
}
```

---

### Usuários Mock para Testes

| Email | Senha | Perfil | Cargo | Unidade |
|-------|-------|--------|-------|---------|
| admin@cbmesp.sp.gov.br | admin123 | admin | Comandante | 17GB |
| operador@cbmesp.sp.gov.br | operador123 | operador | Sd BM | 17GB |

---

### Como Testar com Postman/curl

**1. Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@cbmesp.sp.gov.br&password=admin123"
```

**2. Copiar token da resposta e testar /me:**
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer TOKEN_AQUI"
```

---

### Próximos Passos (Fase 2)

- [ ] Integrar Google Sheets no backend
- [ ] Implementar `/api/dashboard/macro`
- [ ] Implementar `/api/frota`
- [ ] Implementar `/api/tarefas`
- [ ] Atualizar frontend para usar novos endpoints
