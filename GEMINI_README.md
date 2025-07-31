# Pergunte à Cave - Integração com Gemini AI

Esta funcionalidade usa o Google Gemini AI para analisar padrões de contribuição comunitária e sugerir quem deveria contribuir com o próximo produto para a Cave.

## 🚀 Como Funciona

1. **Seleção de Produto**: O usuário seleciona um produto que precisa ser contribuído para a Cave
2. **Análise de Dados**: O sistema analisa o histórico de contribuições dos usuários
3. **IA Inteligente**: O Gemini AI analisa padrões e sugere quem deveria contribuir baseado em:
   - **Equidade comunitária** (prioridade máxima)
   - Quem menos contribuiu recentemente
   - Quem não contribui há mais tempo
   - Quem tem menos contribuições totais
   - Interesse na categoria (fator secundário)
4. **Mensagem Assertiva**: O Gemini gera uma sugestão direta e assertiva, como alguém cansado de sempre os mesmos contribuírem

## ⚙️ Configuração

### 1. Obter API Key do Gemini

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

### 2. Configurar Variável de Ambiente

Adicione a API key ao seu arquivo `.env`:

```bash
GEMINI_API_KEY=sua_api_key_aqui
```

### 3. Instalar Dependência

```bash
npm install @google/generative-ai
```

## 📊 Análise de Contribuições

O sistema analisa os seguintes aspectos para promover equidade:

### **Estatísticas por Usuário:**
- Total de contribuições
- Contribuições nos últimos 30 dias
- Categorias que mais contribuiu (top 3)
- Valor médio das contribuições
- Data da última contribuição
- Dias desde a última contribuição

### **Critérios de Prioridade (em ordem):**
1. **Quem menos contribuiu recentemente** (últimos 30 dias)
2. **Quem não contribui há mais tempo** (dias desde última contribuição)
3. **Quem tem menos contribuições totais**
4. **Quem tem interesse na categoria** (fator secundário)
5. **Equidade geral na comunidade**

## 🎯 Exemplo de Uso

### Cenário:
- Produto: "Café Premium" (categoria: bebidas)
- Histórico: João contribuiu 3 vezes este mês, Maria contribuiu 0 vezes

### Análise do Gemini:
```
João (@joao):
- Total de contribuições: 5
- Contribuições recentes: 3 (últimos 30 dias)
- Categorias que mais contribuiu: bebidas (3x), snacks (2x)
- Valor médio: R$ 25,00
- Última contribuição: 15/01/2024
- Dias desde última contribuição: 5 dias

Maria (@maria):
- Total de contribuições: 3
- Contribuições recentes: 0 (últimos 30 dias)
- Categorias que mais contribuiu: roupas (2x), bebidas (1x)
- Valor médio: R$ 50,00
- Última contribuição: 20/12/2023
- Dias desde última contribuição: 25 dias
```

### Sugestão:
```
Cave sugere que Maria contribua
Motivo: Chega de moleza! Hora da Maria contribuir! Ela não contribui há 25 dias 
e não contribuiu nenhuma vez nos últimos 30 dias, enquanto o João já contribuiu 
3 vezes este mês. Não dá mais pra empurrar com a barriga! 💪
```

## 🔧 API Endpoint

### POST `/api/ask-gemini`

**Request Body:**
```json
{
  "productId": 1,
  "productName": "iPhone 15",
  "productCategory": "eletrônicos",
  "purchases": [...]
}
```

**Response:**
```json
{
  "suggestedUser": {
    "id": 2,
    "name": "Maria Silva",
    "username": "maria123",
    "image": "https://..."
  },
  "reason": "Chega de moleza! Hora da Maria contribuir! Ela não contribui há 25 dias e não contribuiu nenhuma vez nos últimos 30 dias, enquanto o João já contribuiu 3 vezes este mês. Não dá mais pra empurrar com a barriga! 💪"
}
```

## 🛡️ Segurança

- **API Key**: Armazenada em variáveis de ambiente
- **Validação**: Verificação de dados de entrada
- **Fallback**: Sistema de backup caso o Gemini falhe
- **Rate Limiting**: Controle de requisições (implementar se necessário)

## 🎨 Interface

### Características:
- **Seleção Intuitiva**: Dropdown com produtos e categorias
- **Visualização**: Preview do produto selecionado
- **Loading State**: Indicador durante consulta ao Gemini
- **Resultado Visual**: Card com sugestão e confiança
- **Histórico**: Lista das compras usadas na análise

### Componentes:
- `Select` para escolha do produto
- `ProductImage` para visualização
- `Avatar` para usuário sugerido
- `Gradient Background` para destaque da sugestão

## 🔄 Fluxo de Dados

1. **Frontend** → Seleciona produto que precisa ser contribuído
2. **Frontend** → Busca histórico de contribuições
3. **Frontend** → Envia dados para `/api/ask-gemini`
4. **Backend** → Analisa padrões de contribuição
5. **Backend** → Cria prompt para Gemini focando em equidade
6. **Gemini** → Analisa e sugere quem deveria contribuir
7. **Backend** → Processa resposta
8. **Frontend** → Exibe sugestão de contribuição

## 🐛 Troubleshooting

### Erro: "API Key não configurada"
- Verifique se `GEMINI_API_KEY` está no `.env`
- Reinicie o servidor após adicionar a variável

### Erro: "Erro ao processar consulta com IA"
- Verifique se a API key é válida
- Confirme conectividade com internet
- Verifique logs do servidor

### Sugestão não faz sentido
- Verifique se há dados suficientes no histórico
- O sistema usa fallback se o Gemini falhar
- Considere adicionar mais compras para melhor análise

## 📈 Melhorias Futuras

- **Cache**: Armazenar sugestões para produtos similares
- **Machine Learning**: Treinar modelo próprio
- **Múltiplas Sugestões**: Lista de top 3 candidatos
- **Filtros**: Permitir excluir usuários específicos
- **Histórico**: Salvar sugestões anteriores
- **Feedback**: Sistema de avaliação das sugestões

## 🔗 Links Úteis

- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) 