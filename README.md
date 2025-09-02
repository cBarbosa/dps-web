# DPS Web: Sistema Inteligente de Declaração Pessoal de Saúde

![Next.js](https://img.shields.io/badge/Next.js-14.2.14-black)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC)

Um sistema web abrangente para gerenciamento de Declarações Pessoais de Saúde (DPS) e processos de subscrição imobiliária, desenvolvido para simplificar e automatizar fluxos de trabalho de seguros e aquisição de propriedades.

## 📋 Visão Geral

O **DPS Web** é uma plataforma digital moderna que oferece:

### 🏥 Módulo DPS (Declaração Pessoal de Saúde)
- **Gestão de Declarações**: Sistema completo para criação, preenchimento e revisão de DPS
- **Fluxo de Aprovação**: Workflow baseado em papéis (Vendedor → Médico → Supervisor)
- **Busca Inteligente**: Pesquisa por CPF com resultados tabulares
- **Validações Automatizadas**: Validação em tempo real de dados e documentos

### 🏢 Módulo de Ofertas Imobiliárias
- **Gestão de Ofertas**: Criação e acompanhamento de ofertas de propriedades
- **Perfil de Cliente**: Avaliação de risco e determinação de elegibilidade
- **Workflow de Aprovação**: Processo de aprovação multi-etapas
- **Gestão Documental**: Gerenciamento e verificação de documentos

## 🏗️ Arquitetura do Sistema

### Arquitetura Geral
```
┌─────────────────┐      ┌───────────────┐      ┌───────────────────┐
│                 │      │               │      │                   │
│  Next.js Client │<─────│  Next.js API  │<─────│  Serviços Backend │
│  (React SPA)    │─────>│  (Server)     │─────>│  (REST API)       │
│                 │      │               │      │                   │
└─────────────────┘      └───────────────┘      └───────────────────┘
```

### Frontend
- **App Router**: Estrutura baseada no Next.js 14 App Router
- **Server Components**: Renderização no servidor para melhor performance
- **Client Components**: Componentes interativos com estado do cliente
- **Route Groups**: Organização por área (logged-area, login-area)

### Segurança
- **Autenticação**: NextAuth.js com JWT tokens
- **Autorização**: Controle de acesso baseado em papéis (RBAC)
- **Middleware**: Proteção de rotas e validação de sessão
- **Validação**: Valibot para validação de formulários

### Papéis do Sistema
- **👤 Vendedor**: Agentes de venda que iniciam formulários DPS
- **🏢 Oferta**: Especialistas em gestão de ofertas imobiliárias  
- **👨‍⚕️ Médico**: Revisores médicos para declarações de saúde
- **👔 Supervisor**: Supervisores de processo para workflows de aprovação

## 🛠️ Stack Tecnológico

### Frontend Core
```json
{
  "framework": "Next.js 14.2.14",
  "runtime": "React 18",
  "language": "TypeScript 5",
  "styling": "Tailwind CSS 3.4.1"
}
```

### UI/UX
- **Design System**: Radix UI primitives com shadcn/ui
- **Componentes**: 
  - `@radix-ui/react-*` - Componentes acessíveis
  - `lucide-react` - Ícones modernos
  - `tailwindcss-animate` - Animações fluidas
- **Layout**: Responsivo com Tailwind CSS + CSS Grid/Flexbox

### Formulários & Validação
- **React Hook Form** 7.53.0 - Gerenciamento de formulários performático
- **Valibot** 1.0.0-beta - Validação de esquemas TypeScript-first
- **Máscaras**: `react-input-mask` para formatação de inputs

### Estado & Dados
- **Fetching**: Redaxios (axios wrapper) para requisições HTTP
- **Estado Local**: React Context API + useState/useReducer
- **Notificações**: `react-hot-toast` para feedback do usuário
- **Tabelas**: `@tanstack/react-table` para manipulação de dados

### Utilitários
- **Datas**: `date-fns` para manipulação de datas
- **Cookies**: `js-cookie` para gestão de cookies
- **CPF**: `validar-cpf` para validação de documentos brasileiros
- **Carousels**: `embla-carousel-react` para componentes deslizantes

## 📁 Estrutura do Projeto

```
src/
├── app/                          # App Router do Next.js
│   ├── (logged-area)/           # Área autenticada
│   │   ├── dps/                 # Módulo DPS
│   │   │   ├── fill-out/        # Preenchimento de formulários
│   │   │   ├── subscription/    # Gestão de subscrições
│   │   │   ├── subscription-med/# Revisão médica
│   │   │   ├── subscription-sup/# Supervisão
│   │   │   ├── details/         # Detalhes de DPS
│   │   │   └── actions.ts       # Server Actions
│   │   ├── (oferta)/           # Módulo de Ofertas
│   │   │   ├── offer/          # Gestão de ofertas
│   │   │   ├── home/           # Dashboard de ofertas
│   │   │   └── actions.ts      # Server Actions
│   │   ├── dashboard/          # Dashboard principal
│   │   └── settings/           # Configurações
│   ├── (login-area)/           # Área de autenticação
│   ├── api/                    # API Routes
│   └── external/               # Páginas externas
├── components/                  # Componentes reutilizáveis
│   ├── ui/                     # Componentes base (shadcn/ui)
│   └── [feature]/              # Componentes específicos
├── lib/                        # Bibliotecas e utilitários
├── hooks/                      # Custom React Hooks
├── constants/                  # Constantes da aplicação
└── middleware.ts              # Middleware de autenticação
```

## 🎯 Funcionalidades Principais

### Módulo DPS

#### Formulário de DPS
O formulário é organizado em 4 seções principais:

1. **📊 Dados da Operação**
   - Número da Operação
   - Número de Participantes
   - Valor Total da Operação (R$)

2. **👤 Dados do Proponente**
   - CPF (validação automática)
   - Data de Nascimento
   - Nome Completo e Nome Social
   - Atividade Profissional
   - Contatos (E-mail e Telefone)
   - Sexo
   - % Participação (calculado automaticamente)
   - Valor da Participação no Financiamento (R$)

3. **🏗️ Dados do Produto**
   - Produto
   - Prazo
   - Capital MIP
   - Capital DFI
   - Tipo de Imóvel

4. **📍 Dados de Endereço**
   - CEP (busca automática de endereço)
   - Endereço Completo
   - Número, Complemento
   - Bairro, Cidade, Estado

#### Ações Disponíveis
- **💾 Salvar**: Salva os dados do formulário
- **👥 Salvar e Add Coparticipação**: Salva e abre modal para registro de coparticipantes

### Workflow de Aprovação
```
Vendedor → Médico → Supervisor → Aprovado
    ↓        ↓         ↓
  Criação  Revisão   Aprovação
           Médica    Final
```

## 🚀 Executando o Projeto

### Pré-requisitos
- Node.js 18+ 
- npm, yarn, pnpm ou bun
- Git

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd dps-web
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis (exemplo):

```bash
# NextAuth
NEXTAUTH_SECRET="coloque_um_valor_seguro_aqui"
# Necessário em produção/preview (ex.: Vercel)
# NEXTAUTH_URL="https://seu-dominio.com"

# Provedor Google (opcional)
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."

# Backend API base (use a origem certa; se incluir /api aqui, o frontend comporá /api/v1/...)
NEXT_PUBLIC_API_BASE_URL="https://dps-devapi.azurewebsites.net/api"

# Debug opcional de autenticação
# DEBUG_AUTH="0"
```

4. **Execute o servidor de desenvolvimento**
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

5. **Acesse a aplicação**
```
http://localhost:3000
```

## 📝 Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # Linting do código
```

## 🔧 Configuração

### Tailwind CSS
O projeto utiliza um sistema de design customizado com:
- **Cores**: Paleta personalizada incluindo cores do Bradesco
- **Componentes**: Base do shadcn/ui
- **Animações**: Animações customizadas com `tailwindcss-animate`
- **Tema**: Suporte a modo escuro

### Autenticação
Configurado com NextAuth.js para:
- Login por credenciais (Credentials Provider) contra o backend (`/v1/Auth` concatenado a `NEXT_PUBLIC_API_BASE_URL`)
- Suporte opcional a Google (Google Provider) – desativado na UI por padrão; ver documentação em `BACKEND_GOOGLE_SSO.md`
- Sessões baseadas em JWT
- Proteção de rotas via middleware (RBAC no frontend)

## 📊 Monitoramento & Performance

- **Otimização de Fonts**: Next.js font optimization com Geist
- **Server Components**: Renderização no servidor para melhor performance
- **Code Splitting**: Carregamento lazy de componentes
- **Bundle Analysis**: Análise de bundle para otimização

## 🚀 Deploy

### Vercel (Recomendado)
```bash
vercel --prod
```

### Build Manual
```bash
npm run build
npm run start
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add: nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é proprietário e confidencial.

## 🆘 Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contato com a equipe de desenvolvimento.

---


**DPS Web** - Sistema Inteligente de Declaração Pessoal de Saúde © 2024