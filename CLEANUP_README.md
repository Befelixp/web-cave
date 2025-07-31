# Limpeza Automática de Compras

Este sistema automaticamente remove compras com mais de 2 meses do banco de dados para manter o histórico limpo e otimizar a performance.

## Como Funciona

- **Período**: Compras com mais de 2 meses são automaticamente removidas
- **Segurança**: Sistema de logs detalhados para auditoria
- **Flexibilidade**: Modo de simulação para testar antes de executar

## Endpoints da API

### POST `/api/cleanup`
Executa a limpeza real das compras antigas.

**Resposta de sucesso:**
```json
{
  "success": true,
  "message": "Limpeza concluída. 5 compras antigas foram deletadas.",
  "deletedCount": 5,
  "cutoffDate": "2024-01-15T10:30:00.000Z"
}
```

### GET `/api/cleanup`
Verifica quais compras seriam deletadas (sem executar a limpeza).

**Resposta:**
```json
{
  "message": "Compras que seriam deletadas na próxima limpeza",
  "cutoffDate": "2024-01-15T10:30:00.000Z",
  "count": 3,
  "purchases": [...]
}
```

## Scripts Disponíveis

### Execução Manual

```bash
# Executar limpeza real
npm run cleanup

# Simular limpeza (não deleta nada)
npm run cleanup:dry-run
```

### Execução Direta

```bash
# Limpeza real
node scripts/cleanup-purchases.js

# Modo simulação
DRY_RUN=true node scripts/cleanup-purchases.js
```

## Configuração de Cron Job

### Linux/Mac (crontab)

```bash
# Editar crontab
crontab -e

# Executar limpeza diariamente às 2:00 AM
0 2 * * * cd /path/to/web-cave && npm run cleanup >> /var/log/cleanup.log 2>&1

# Executar limpeza semanalmente (domingo às 3:00 AM)
0 3 * * 0 cd /path/to/web-cave && npm run cleanup >> /var/log/cleanup.log 2>&1
```

### Windows (Task Scheduler)

1. Abrir "Agendador de Tarefas"
2. Criar nova tarefa básica
3. Configurar para executar diariamente
4. Ação: Iniciar programa
5. Programa: `npm`
6. Argumentos: `run cleanup`
7. Diretório inicial: `C:\path\to\web-cave`

### Vercel Cron Jobs

Se estiver usando Vercel, adicione no `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Variáveis de Ambiente

```bash
# URL da API de limpeza (padrão: http://localhost:3000/api/cleanup)
CLEANUP_URL=https://your-domain.com/api/cleanup

# Modo simulação (true/false)
DRY_RUN=true
```

## Logs

O sistema gera logs detalhados incluindo:

- Timestamp da execução
- Número de compras deletadas
- Detalhes de cada compra removida
- Erros e exceções

**Exemplo de log:**
```
[2024-03-15T02:00:00.000Z] Iniciando limpeza automática de compras...
[CLEANUP] Deletadas 3 compras antigas (anteriores a 2024-01-15T02:00:00.000Z)
[CLEANUP] Compras deletadas:
- João Silva (@joao) comprou iPhone 15 (Eletrônicos) em 2024-01-10T15:30:00.000Z
- Maria Santos (@maria) comprou MacBook Pro (Eletrônicos) em 2024-01-12T10:15:00.000Z
- Pedro Costa (@pedro) comprou AirPods (Acessórios) em 2024-01-14T09:45:00.000Z
[2024-03-15T02:00:01.234Z] Limpeza concluída.
```

## Monitoramento

### Verificar Status

```bash
# Verificar compras que seriam deletadas
curl http://localhost:3000/api/cleanup

# Executar limpeza via API
curl -X POST http://localhost:3000/api/cleanup
```

### Alertas

Configure alertas para:
- Falhas na execução do cron job
- Número alto de compras deletadas
- Erros na API de limpeza

## Segurança

- **Backup**: Sempre faça backup antes de executar limpezas em produção
- **Teste**: Use o modo `dry-run` antes de executar em produção
- **Logs**: Mantenha logs para auditoria
- **Permissões**: Restrinja acesso à API de limpeza

## Troubleshooting

### Erro de Conexão
```bash
# Verificar se a aplicação está rodando
curl http://localhost:3000/api/cleanup

# Verificar logs da aplicação
npm run dev
```

### Erro de Permissão
```bash
# Dar permissão de execução ao script
chmod +x scripts/cleanup-purchases.js
```

### Erro de Banco de Dados
- Verificar conexão com o banco
- Verificar permissões do usuário do banco
- Verificar se o Prisma está configurado corretamente 