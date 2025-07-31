# 🏠 THE CAVE - Sistema de Gerenciamento de Contribuições

<div align="center">
  <img src="public/THE CAVE text.png" alt="THE CAVE" width="300"/>
  
  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![shadcn/ui](https://img.shields.io/badge/shadcn/ui-0.0.1-000000?style=for-the-badge)](https://ui.shadcn.com/)
</div>

## 📋 Descrição

**THE CAVE** é uma aplicação web moderna para gerenciamento de contribuições e compras compartilhadas. O sistema utiliza inteligência artificial (Google Gemini) para sugerir quem deve contribuir com produtos específicos, baseado no histórico de compras e padrões de contribuição dos usuários.

## ✨ Funcionalidades Principais

### 🔐 **Sistema de Autenticação**
- Login seguro com JWT
- Diferentes níveis de acesso (usuário/admin)
- Proteção de rotas

### 🛒 **Gerenciamento de Produtos**
- Cadastro de produtos com categorias
- Imagens de produtos
- Sistema de preços

### 💰 **Sistema de Compras**
- Registro de contribuições
- Histórico de compras
- Visualização de quem contribuiu com o quê

### 🤖 **IA para Sugestões**
- Integração com Google Gemini AI
- Sugestões inteligentes de contribuição
- Análise de padrões de compra

### 👨‍💼 **Painel Administrativo**
- Gerenciamento completo de produtos
- Edição e exclusão de produtos
- Controle de acesso administrativo

### 📱 **Interface Responsiva**
- Design mobile-first
- Componentes modernos com shadcn/ui
- Experiência de usuário otimizada

## 🛠️ Tecnologias Utilizadas

### **Frontend**
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework de estilização
- **shadcn/ui** - Biblioteca de componentes
- **Lucide React** - Ícones

### **Backend**
- **Next.js API Routes** - API REST
- **Prisma ORM** - Gerenciamento de banco de dados
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação

### **IA e Integrações**
- **Google Generative AI (Gemini)** - Sugestões inteligentes
- **bcryptjs** - Criptografia de senhas

## 🚀 Como Executar

### **Pré-requisitos**
- Node.js 18+ 
- PostgreSQL
- Conta Google Cloud (para Gemini AI)

### **1. Clone o Repositório**
```bash
git clone https://github.com/Befelixp/web-cave.git
cd the-cave
```

### **2. Instale as Dependências**
```bash
npm install
```

### **3. Configure as Variáveis de Ambiente**
Crie um arquivo `.env.local` na raiz do projeto:

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/the_cave"

# JWT
JWT_SECRET="sua-chave-secreta-jwt"

# Google Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY="sua-chave-api-gemini"
```

### **4. Configure o Banco de Dados**
```bash
# Execute as migrações
npx prisma migrate dev

# (Opcional) Execute o seed
npx prisma db seed
```

### **5. Execute o Projeto**
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) para ver a aplicação.

## 📁 Estrutura do Projeto

```
web-cave/
├── app/                          # App Router (Next.js 14)
│   ├── api/                      # API Routes
│   │   ├── ask-gemini/          # Endpoint da IA
│   │   ├── login/               # Autenticação
│   │   ├── products/            # CRUD de produtos
│   │   └── purchases/           # Gerenciamento de compras
│   ├── admin/                   # Painel administrativo
│   │   └── products/           # Gerenciamento de produtos
│   ├── ask-cave/               # Página de sugestões da IA
│   ├── login/                  # Página de login
│   └── profile/                # Perfis de usuário
├── components/                  # Componentes React
│   ├── ui/                     # Componentes shadcn/ui
│   ├── auth-guard.tsx          # Proteção de rotas
│   ├── navbar.tsx              # Navegação
│   └── fab.tsx                 # Botão flutuante
├── contexts/                   # Contextos React
│   └── AuthContext.tsx         # Contexto de autenticação
├── hooks/                      # Hooks customizados
│   └── useAdmin.ts             # Hook para verificação de admin
├── lib/                        # Utilitários
│   ├── prisma.ts               # Cliente Prisma
│   └── utils.ts                # Funções utilitárias
├── prisma/                     # Configuração do banco
│   ├── schema.prisma           # Schema do banco
│   └── migrations/             # Migrações
└── public/                     # Arquivos estáticos
```

## 🔧 Funcionalidades Detalhadas

### **Sistema de Sugestões da IA**
- Analisa histórico de compras
- Considera padrões de contribuição
- Gera sugestões personalizadas
- Fornece justificativas para as sugestões

### **Gerenciamento de Produtos**
- **Criar**: Adicionar novos produtos
- **Listar**: Visualizar todos os produtos
- **Editar**: Modificar informações (apenas admins)
- **Excluir**: Remover produtos (apenas admins, sem compras associadas)

### **Sistema de Compras**
- Registro de contribuições
- Histórico detalhado
- Relacionamento entre usuários e produtos
- Proteção contra exclusão de produtos com histórico

## 🔐 Segurança

- **Autenticação JWT** com expiração
- **Criptografia de senhas** com bcrypt
- **Proteção de rotas** por nível de acesso
- **Validação de dados** em todas as operações
- **Proteção contra exclusão** de dados importantes

## 📱 Responsividade

- **Mobile-first** design
- **Componentes adaptativos** para diferentes telas
- **Navegação otimizada** para dispositivos móveis
- **Interface intuitiva** em todos os dispositivos

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Bernardo** - [GitHub](https://github.com/Befelixp)

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org/) - Framework React
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Google Gemini](https://ai.google.dev/) - IA para sugestões
- [Prisma](https://www.prisma.io/) - ORM para Node.js

---

<div align="center">
  <p>Feito com ❤️ para gerenciar a Cave de forma inteligente</p>
</div>
