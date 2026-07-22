# Cadu Barber — App de Agendamento

App web de agendamento de horários para barbearia. Cliente escolhe um serviço, vê os horários livres com base na Google Agenda real do barbeiro e confirma o agendamento — que cria automaticamente um evento na agenda.

## Stack

- **Frontend:** React + Vite + TailwindCSS (`frontend/`)
- **Backend:** Node.js + Express (`backend/`), exposto na Vercel como função serverless (`api/index.js`)
- **Integração:** Google Calendar API via Service Account (agenda da conta `cadubarber47@gmail.com`)
- **Hospedagem:** Vercel (free tier) — frontend estático + funções serverless

## Estrutura de pastas

```
cadubarber-agendamento/
├── api/
│   └── index.js         # entrypoint serverless da Vercel (reaproveita backend/app.js)
├── frontend/             # React + Vite + Tailwind
│   └── src/
│       ├── components/   # ServiceList, ScheduleList, BookingForm, Confirmation
│       ├── api.js        # chamadas à API
│       └── App.jsx        # fluxo do cliente (serviço → horário → dados → confirmação)
├── backend/
│   ├── app.js             # cria o app Express e monta as rotas
│   ├── server.js          # entrypoint local (npm run dev)
│   ├── config/
│   │   ├── business.js    # horário de funcionamento fixo + fuso
│   │   ├── services.js    # lista de serviços (nome, duração, preço)
│   │   └── env.js         # leitura de variáveis de ambiente
│   ├── routes/             # /api/services, /api/availability, /api/appointments
│   └── services/
│       ├── googleCalendar.js  # listar/criar eventos na Google Agenda
│       └── availability.js    # calcula horários livres cruzando agenda + horário de funcionamento
├── vercel.json
└── package.json            # workspace raiz (frontend + backend)
```

## Como funciona

1. Cliente escolhe um serviço na home.
2. O app busca na Google Agenda do barbeiro os eventos dos próximos dias (`GET /api/availability`) e calcula os horários livres, cruzando com o horário de funcionamento fixo (terça a sábado, 9h–19h, com intervalo de almoço 12h–13h) e a duração do serviço.
3. Cliente escolhe um horário, preenche nome e telefone e confirma (`POST /api/appointments`).
4. O backend reconfere a disponibilidade (evita conflito de última hora) e cria um evento na Google Agenda via Service Account.
5. Cliente vê a tela de confirmação com os detalhes.

Como o app lê a agenda inteira (não só os eventos que ele mesmo cria), qualquer evento que o barbeiro criar manualmente na Google Agenda também bloqueia o horário automaticamente.

O horário de funcionamento e a lista de serviços estão fixos em `backend/config/business.js` e `backend/config/services.js` — edite esses arquivos para ajustar.

## Configurando a Google Calendar API (passo a passo)

Vamos usar uma **Service Account** (conta de serviço) em vez de OAuth de usuário final — assim o backend acessa a agenda diretamente, sem exigir login do barbeiro no app.

### 1. Criar o projeto no Google Cloud Console

1. Acesse [console.cloud.google.com](https://console.cloud.google.com) **logado com a conta `cadubarber47@gmail.com`**.
2. No topo, clique no seletor de projetos → **Novo projeto**.
3. Dê um nome (ex: `cadubarber-agendamento`) e clique em **Criar**.
4. Aguarde a criação e selecione o projeto novo no seletor.

### 2. Ativar a Google Calendar API

1. No menu lateral, vá em **APIs e serviços → Biblioteca**.
2. Busque por **Google Calendar API**.
3. Clique nela e depois em **Ativar**.

### 3. Criar a Service Account

1. Vá em **APIs e serviços → Credenciais**.
2. Clique em **Criar credenciais → Conta de serviço**.
3. Dê um nome (ex: `cadubarber-agenda`) e clique em **Criar e continuar**.
4. Nas permissões do projeto, pode pular (não precisa de papel no projeto) e clicar em **Concluir**.
5. Na lista de contas de serviço, clique na que você criou.
6. Vá na aba **Chaves → Adicionar chave → Criar nova chave**, formato **JSON**, e confirme.
7. Um arquivo `.json` será baixado — **guarde-o em local seguro e nunca o versione no git**. Ele contém dois campos importantes: `client_email` e `private_key`.

### 4. Compartilhar a Google Agenda com a Service Account

1. No Google Agenda (com a conta `cadubarber47@gmail.com` logada), abra as configurações da agenda que o barbeiro usa (pode ser a agenda principal).
2. Em **Compartilhar com pessoas específicas**, clique em **Adicionar pessoas**.
3. Cole o `client_email` da service account (algo como `cadubarber-agenda@SEU-PROJETO.iam.gserviceaccount.com`).
4. Defina a permissão como **"Fazer alterações nos eventos"** (necessário para criar agendamentos).
5. Salve.
6. Copie também o **ID da agenda** (em Configurações da agenda → "Integrar agenda" → "ID da agenda"). Se for a agenda principal da conta, o ID é o próprio e-mail: `cadubarber47@gmail.com`.

### 5. Preencher as variáveis de ambiente

Copie `backend/.env.example` para `backend/.env` e preencha:

```
GOOGLE_CLIENT_EMAIL=cadubarber-agenda@SEU-PROJETO.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUACHAVEAQUI\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=cadubarber47@gmail.com
```

`GOOGLE_PRIVATE_KEY` é o campo `private_key` do JSON baixado — copie exatamente como está (com as aspas e os `\n` literais).

## Rodando localmente

Pré-requisito: Node.js 18+.

```bash
npm install                 # instala frontend e backend (workspaces)
cp backend/.env.example backend/.env
# edite backend/.env com suas credenciais reais

npm run dev:backend         # sobe a API em http://localhost:3001
npm run dev:frontend        # em outro terminal, sobe o frontend em http://localhost:5173
```

O Vite já está configurado para redirecionar chamadas `/api/*` para `http://localhost:3001` em desenvolvimento (`frontend/vite.config.js`).

## Deploy na Vercel (free tier)

1. Suba o repositório para o GitHub (veja seção seguinte).
2. Em [vercel.com](https://vercel.com), clique em **Add New → Project** e importe o repositório.
3. A Vercel deve detectar o `vercel.json` na raiz automaticamente:
   - **Build Command:** `npm run build:frontend`
   - **Output Directory:** `frontend/dist`
   - A função serverless em `api/index.js` é publicada automaticamente em `/api/*`.
4. Em **Settings → Environment Variables**, adicione (para os ambientes Production e Preview):
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` (cole a chave completa; a Vercel aceita quebras de linha reais ou `\n` — o código já converte `\n` literais)
   - `GOOGLE_CALENDAR_ID`
   - `FRONTEND_URL` (opcional; pode deixar `*` já que frontend e API ficam no mesmo domínio)
5. Clique em **Deploy**.

Depois do primeiro deploy, qualquer push na branch de produção gera um novo deploy automaticamente.

## Repositório remoto (GitHub)

Este projeto começou como um repositório Git local. Para publicar no GitHub, você pode:

```bash
gh repo create cadubarber-agendamento --private --source=. --remote=origin
git push -u origin <nome-da-branch>
```

ou criar o repositório manualmente pelo site do GitHub e rodar:

```bash
git remote add origin <url-do-repositorio>
git push -u origin <nome-da-branch>
```

## Próximos passos (fora do MVP)

- Horário de funcionamento configurável por um painel do barbeiro (hoje é fixo em `backend/config/business.js`).
- Autenticação simples para o barbeiro gerenciar serviços sem editar código.
- Notificação por WhatsApp/SMS ao cliente e ao barbeiro na confirmação.
- Cancelamento/reagendamento pelo cliente.
