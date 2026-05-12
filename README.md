# DriveDindo

Divisão inteligente de custos de veículo compartilhado.

## Stack

- **Mobile:** React Native + Expo + TypeScript
- **Backend:** Supabase (Auth, PostgreSQL, Realtime, Storage)
- **Estado:** Zustand
- **Cache de servidor:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod
- **Navegação:** Expo Router

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Preencher EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Configurar Supabase

1. Criar projeto em [supabase.com](https://supabase.com)
2. Executar a migration em `supabase/migrations/001_initial_schema.sql`
3. Copiar URL e anon key para o `.env`

### 4. Gerar types do banco

```bash
npm run supabase:types
```

### 5. Rodar o app

```bash
npm start
```

## Estrutura

```
src/
├── components/     # UI primitives e componentes compartilhados
├── features/       # Módulos por domínio (trips, expenses, balance...)
├── services/       # Camada de acesso ao Supabase (apenas I/O)
├── store/          # Zustand stores (auth, vehicle, sync offline)
├── hooks/          # Hooks transversais
├── lib/            # Cálculos financeiros, formatters, validators
├── types/          # TypeScript types
└── theme/          # Design system (cores, tipografia, espaçamento)
```

## Regras de Negócio Principais

- Divisão **proporcional ao uso real** (km rodados), não igualitária
- Saldos calculados **dinamicamente** — nunca armazenados
- Algoritmo de minimização de transferências (Splitwise-like)
- Detecção automática de km gaps (km sem responsável)
- Offline-first com fila de sincronização via Zustand persist
