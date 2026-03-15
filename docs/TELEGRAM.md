# 🤖 Documentação do Bot Telegram — Sistema de Gestão de Frota 17º GB

---

## 📋 Visão Geral

O Bot Telegram é responsável por enviar notificações proativas e responder a comandos manuais, mantendo a equipe do 17º GB informada sobre o status da frota em tempo real, sem necessidade de acessar o sistema.

---

## ⚙️ Configuração — Criando o Bot

### 1. Criar o bot via @BotFather

1. Abra o Telegram e procure por **@BotFather**
2. Envie o comando `/newbot`
3. Informe o **nome** do bot (ex: `Frota 17GB`)
4. Informe o **username** do bot (ex: `frota17gb_bot` — deve terminar em `bot`)
5. Guarde o **token** fornecido (formato: `123456789:AABBCCdd...`)

### 2. Obter o Chat ID

#### Para chat pessoal:
1. Inicie uma conversa com o bot
2. Envie qualquer mensagem
3. Acesse: `https://api.telegram.org/bot{SEU_TOKEN}/getUpdates`
4. O `chat.id` aparecerá na resposta JSON

#### Para grupo:
1. Adicione o bot ao grupo
2. Envie uma mensagem no grupo
3. Acesse o mesmo endpoint acima
4. O `chat.id` será negativo para grupos (ex: `-1001234567890`)

### 3. Configurar no `.env`

```env
TELEGRAM_BOT_TOKEN=123456789:AABBCCddEEffGGhhIIjjKKllMMnnOOpp
TELEGRAM_CHAT_ID=-1001234567890
```

---

## 💬 Comandos Disponíveis

### `/status` — Status atual da frota

Retorna um resumo em tempo real de todas as viaturas.

**Exemplo de resposta:**
```
🚒 STATUS DA FROTA — 17º GB
📅 15/01/2024 às 09:30

✅ Operacionais: 48 viaturas
🔧 Em manutenção: 7 viaturas
⛔ Inativas: 2 viaturas
─────────────────────────
Total: 57 viaturas
🚨 Alertas pendentes: 5
```

---

### `/alertas` — Alertas críticos ativos

Lista os alertas não resolvidos ordenados por prioridade.

**Exemplo de resposta:**
```
🚨 ALERTAS ATIVOS — 17º GB

🔴 CRÍTICO (2)
• AB-01 (ABC-1234): Manutenção vencida — troca de óleo
• AB-05 (DEF-5678): Bateria com falha reportada

🟠 URGENTE (3)
• AB-12: Inspeção veicular vencida há 15 dias
• BC-03: Pneu traseiro esquerdo com desgaste crítico
• BC-07: Revisão periódica pendente

💛 AVISOS (2)
• CD-01: Troca de óleo em 500km
• CD-04: Revisão em 30 dias
```

---

### `/relatorio` — Relatório diário

Envia o relatório consolidado do dia.

**Exemplo de resposta:**
```
📊 RELATÓRIO DIÁRIO — 17º GB
📅 15/01/2024

🚒 FROTA
• Operacionais: 48/57 (84%)
• Em manutenção: 7
• Inativas: 2

⛽ ABASTECIMENTOS HOJE
• Quantidade: 5 viaturas
• Total litros: 280L
• Custo total: R$ 1.680,00

💰 GASTOS DO MÊS
• Combustível: R$ 12.450,80
• Manutenção: R$ 8.320,00
• Outros: R$ 1.540,00
• TOTAL: R$ 22.310,80

🔧 MANUTENÇÕES
• Pendentes: 12
• Vencidas: 3
• Realizadas hoje: 1

📋 ORDENS DE SERVIÇO
• Abertas: 5
• Em andamento: 3
• Concluídas hoje: 2
```

---

## 🔔 Notificações Automáticas

O sistema envia notificações automáticas nos seguintes eventos:

### Alertas de Manutenção

Verificados a cada `ALERT_CHECK_INTERVAL` horas (padrão: 1h):

| Tipo     | Condição                                     | Exemplo                              |
|----------|----------------------------------------------|--------------------------------------|
| 🔴 Crítico | Manutenção vencida há mais de 7 dias       | Troca de óleo vencida               |
| 🟠 Urgente | Manutenção vencida ou no limite de km      | Revisão pendente                    |
| 💛 Aviso  | Manutenção próxima (5 dias ou 500km)         | Troca de óleo em breve              |
| ℹ️ Info   | Viatura retornou de manutenção              | AB-01 operacional novamente         |

### Relatório Diário Automático

Enviado todos os dias às **07:00** (horário de Brasília):
```
📊 Bom dia! Relatório da frota do 17º GB...
```

### Exemplo de notificação de alerta
```
🚨 NOVO ALERTA — CRÍTICO

🚒 Viatura: AB-01 (ABC-1234)
📋 Tipo: Manutenção vencida
⚠️ Detalhe: Troca de óleo vencida há 15 dias
📍 Unidade: 17ºGB-1ºSGB
🕐 15/01/2024 às 08:45

Acesse o sistema para mais detalhes:
🔗 https://frota.17gb.sp.gov.br
```

---

## 🔧 Solução de Problemas

### Bot não envia mensagens

1. Verifique se o token está correto no `.env`
2. Verifique se o `TELEGRAM_CHAT_ID` está correto
3. Certifique-se que o bot foi adicionado ao grupo (se for grupo)
4. O bot deve ter permissão de enviar mensagens no grupo

### Chat ID negativo para grupos

IDs de grupos no Telegram são sempre negativos:
```
TELEGRAM_CHAT_ID=-1001234567890
```

### Testar a conexão manualmente

```bash
# Testar token
curl "https://api.telegram.org/bot{TOKEN}/getMe"

# Testar envio de mensagem
curl -X POST "https://api.telegram.org/bot{TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "{CHAT_ID}", "text": "Teste de conexão — Frota 17GB ✅"}'
```

### Ver logs do bot

```bash
# Via Docker
docker compose logs -f backend | grep -i telegram

# Arquivo de log
tail -f backend/logs/app.log | grep -i telegram
```

---

## 📱 Configuração do Grupo Telegram

**Recomendações para o grupo do 17º GB:**

1. Crie um grupo/canal privado: `🚒 Frota 17ºGB — Alertas`
2. Adicione o bot ao grupo
3. Promova o bot a **administrador** (necessário para enviar mensagens)
4. Configure as notificações do grupo para não silenciar alertas críticos
5. Use o Chat ID do grupo como `TELEGRAM_CHAT_ID`

**Permissões mínimas necessárias para o bot:**
- ✅ Enviar mensagens
- ✅ Enviar fotos e arquivos (para relatórios em PDF futuramente)
