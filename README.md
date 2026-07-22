# Cadu Barber — App de Agendamento

App web de agendamento de horários para barbearia. Cliente escolhe um serviço, vê os horários livres com base na Google Agenda real do barbeiro e confirma o agendamento — que cria automaticamente um evento na agenda.

## Stack

- **Frontend:** React + Vite + TailwindCSS (`frontend/`)
- **Backend:** Node.js + Express (`backend/`), exposto na Vercel como função serverless (`api/index.js`)
- **Integração:** Google Agenda via Google Apps Script publicado como Web App (agenda da conta `cadubarber47@gmail.com`) — sem precisar de projeto no Google Cloud Console nem cartão de crédito
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
│   ├── services/
│   │   ├── googleCalendar.js  # chama o Apps Script para listar/criar eventos na Google Agenda
│   │   └── availability.js    # calcula horários livres cruzando agenda + horário de funcionamento
│   └── APPS_SCRIPT.md      # código do Apps Script e como publicá-lo
├── vercel.json
└── package.json            # workspace raiz (frontend + backend)
```

## Como funciona

1. Cliente escolhe um serviço na home.
2. O app busca na Google Agenda do barbeiro os eventos dos próximos dias (`GET /api/availability`) e calcula os horários livres, cruzando com o horário de funcionamento fixo (terça a sábado, 9h–19h, com intervalo de almoço 12h–13h) e a duração do serviço.
3. Cliente escolhe um horário, preenche nome e telefone e confirma (`POST /api/appointments`).
4. O backend reconfere a disponibilidade (evita conflito de última hora) e cria um evento na Google Agenda através do Apps Script.
5. Cliente vê a tela de confirmação com os detalhes.

Como o app lê a agenda inteira (não só os eventos que ele mesmo cria), qualquer evento que o barbeiro criar manualmente na Google Agenda também bloqueia o horário automaticamente.

O horário de funcionamento e a lista de serviços estão fixos em `backend/config/business.js` e `backend/config/services.js` — edite esses arquivos para ajustar.

## Configurando a integração com a Google Agenda (passo a passo)

Em vez de um projeto no Google Cloud Console com Service Account (que em alguns fluxos
pede cartão de crédito), usamos um **Google Apps Script publicado como Web App**,
rodando com a própria conta `cadubarber47@gmail.com`. É gratuito e não exige ativar
faturamento. O código completo do script e as instruções de publicação estão em
[`backend/APPS_SCRIPT.md`](backend/APPS_SCRIPT.md).

Resumo:

1. Publique o script (passo a passo em `backend/APPS_SCRIPT.md`) e copie a URL gerada
   (termina em `/exec`).
2. Defina um token secreto forte na constante `API_TOKEN` do script.
3. Preencha as variáveis de ambiente do backend.

Copie `backend/.env.example` para `backend/.env` e preencha:

```
APPS_SCRIPT_URL=https://script.google.com/macros/s/SEU_ID_AQUI/exec
APPS_SCRIPT_TOKEN=o-mesmo-token-definido-no-script
```

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
   - `APPS_SCRIPT_URL`
   - `APPS_SCRIPT_TOKEN`
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
