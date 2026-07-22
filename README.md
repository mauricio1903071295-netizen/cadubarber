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
│       ├── api.js        # chamadas à API pública
│       ├── adminApi.js   # chamadas à API do painel admin (com senha)
│       ├── App.jsx        # fluxo do cliente (serviço → horário → dados → confirmação)
│       ├── AdminApp.jsx   # painel /admin do Cadu (serviços, horários, trava de agenda)
│       └── main.jsx       # roteamento simples: "/" → App, "/admin" → AdminApp
├── backend/
│   ├── app.js             # cria o app Express e monta as rotas
│   ├── server.js          # entrypoint local (npm run dev)
│   ├── config/
│   │   ├── business.js    # horário de funcionamento padrão + fuso (usado até o Cadu salvar algo no /admin)
│   │   ├── services.js    # lista de serviços padrão (nome, duração, preço)
│   │   └── env.js         # leitura de variáveis de ambiente
│   ├── routes/             # /api/services, /api/availability, /api/appointments, /api/admin
│   ├── services/
│   │   ├── appsScriptClient.js  # cliente HTTP genérico para o Apps Script
│   │   ├── googleCalendar.js    # listar/criar eventos na Google Agenda via Apps Script
│   │   ├── config.js            # busca/salva a configuração editável (serviços, horários, trava)
│   │   └── availability.js      # calcula horários livres cruzando agenda + configuração
│   └── APPS_SCRIPT.md      # código do Apps Script e como publicá-lo
├── vercel.json
└── package.json            # workspace raiz (frontend + backend)
```

## Como funciona

1. Cliente informa nome e telefone (com máscara) na home. O app busca na Google Agenda se já existe algum agendamento futuro com aquele telefone (`GET /api/appointments?phone=`); se existir, mostra os detalhes com opção de cancelar (`DELETE /api/appointments/:eventId`) em vez de seguir direto pro agendamento.
2. Cliente escolhe um serviço.
3. O app busca na Google Agenda do barbeiro os eventos dos próximos dias (`GET /api/availability`) e calcula os horários livres, cruzando com o horário de funcionamento configurado e a duração do serviço.
4. Cliente escolhe um horário e confirma na tela de revisão (`POST /api/appointments`) — nome e telefone já foram coletados no passo 1.
5. O backend reconfere a disponibilidade (evita conflito de última hora) e cria um evento na Google Agenda através do Apps Script.
6. Cliente vê a tela de confirmação com os detalhes e um botão para enviar a confirmação por WhatsApp (se o Cadu tiver cadastrado o número em `/admin`).

Como o app lê a agenda inteira (não só os eventos que ele mesmo cria), qualquer evento que o barbeiro criar manualmente na Google Agenda também bloqueia o horário automaticamente. A busca de agendamento por telefone nunca olha eventos passados, então não cresce com o tempo nem precisa de um banco de dados separado.

## Painel do barbeiro (`/admin`)

Em `SEU_DOMINIO/admin` o Cadu consegue, sem editar código:

- Editar serviços (nome, duração, preço) — adicionar/remover
- Editar o horário de funcionamento de cada dia da semana e o intervalo de almoço
- **Trancar a agenda** — desativa novos agendamentos temporariamente (ex: férias)
- Cadastrar o WhatsApp e o endereço da barbearia (usados no botão de confirmação que o cliente vê depois de agendar)

O acesso é protegido por uma senha única (variável `ADMIN_PASSWORD`), sem sistema de
login completo. Essa configuração é guardada no próprio Apps Script (`PropertiesService`,
veja `backend/APPS_SCRIPT.md`) — os arquivos `backend/config/business.js` e
`backend/config/services.js` viram só o **valor padrão** usado até o Cadu salvar algo
pela primeira vez no painel.

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
ADMIN_PASSWORD=senha-do-painel-admin-do-cadu
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
   - `ADMIN_PASSWORD`
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

- Envio automático da confirmação por WhatsApp (hoje é um link `wa.me` que o cliente/barbeiro precisa tocar pra enviar — automação de verdade exigiria a API oficial do WhatsApp, com verificação de empresa e custo).
- Login "de verdade" (Google) em vez da senha única do painel `/admin`, se o Cadu quiser dar acesso a mais gente no futuro.
