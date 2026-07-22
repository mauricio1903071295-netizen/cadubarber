# Google Apps Script — ponte com a Google Agenda

Em vez de um projeto no Google Cloud Console com Service Account (que pode pedir cartão
de crédito em alguns fluxos), este projeto usa um **Google Apps Script publicado como
Web App**. Ele roda com a própria conta `cadubarber47@gmail.com` e não exige ativar
faturamento — é 100% gratuito.

O script é só uma "ponte" fina com a agenda: lista eventos crus e cria/cancela eventos.
Toda a lógica de horário de funcionamento, intervalo de almoço e duração de cada serviço
fica no backend Node (`backend/services/availability.js`), não no script.

## Como publicar

1. Acesse [script.google.com](https://script.google.com) logado com `cadubarber47@gmail.com`.
2. **Novo projeto**, apague o conteúdo padrão e cole o código abaixo.
3. Troque o valor de `API_TOKEN` por um segredo forte (não deixe o placeholder).
4. **Implantar → Nova implantação**:
   - Tipo: **App da Web**
   - Executar como: **Eu** (a própria conta)
   - Quem pode acessar: **Qualquer pessoa**
5. Copie a URL gerada (termina em `/exec`) — é o valor de `APPS_SCRIPT_URL`.
6. Para publicar alterações futuras no script **mantendo a mesma URL**: **Implantar →
   Gerenciar implantações → editar (lápis) → Nova versão → Implantar**. Criar uma "Nova
   implantação" do zero gera uma URL diferente.

## Código (`Code.gs`)

```javascript
// ===== CONFIGURACAO =====
var CALENDAR_ID = 'primary';
var API_TOKEN = 'TROQUE_ESSE_TOKEN_POR_ALGO_SECRETO';

function doGet(e) { return handleRequest(e, 'GET'); }
function doPost(e) { return handleRequest(e, 'POST'); }

function handleRequest(e, method) {
  try {
    var params = method === 'GET' ? e.parameter : JSON.parse(e.postData.contents);
    if (params.token !== API_TOKEN) return jsonResponse({ error: 'Token invalido' });

    var action = params.action;
    if (action === 'eventos') return jsonResponse(getEventos(params.desde, params.ate));
    if (action === 'criar_agendamento') return jsonResponse(criarAgendamento(params));
    if (action === 'cancelar_agendamento') return jsonResponse(cancelarAgendamento(params.eventId));
    return jsonResponse({ error: 'Acao desconhecida: ' + action });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// Retorna os eventos "crus" da agenda num intervalo. O calculo de horarios
// livres (respeitando dias de funcionamento, almoco e duracao de cada
// servico) fica no backend Node, nao aqui.
function getEventos(desde, ate) {
  var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  var inicio = new Date(desde);
  var fim = new Date(ate);
  var eventos = calendar.getEvents(inicio, fim);
  var lista = eventos.map(function (ev) {
    return {
      id: ev.getId(),
      titulo: ev.getTitle(),
      inicio: ev.getStartTime().toISOString(),
      fim: ev.getEndTime().toISOString(),
    };
  });
  return { eventos: lista };
}

function criarAgendamento(params) {
  var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  var duracao = parseInt(params.duracao, 10) || 30;
  var inicio = new Date(params.data + 'T' + params.hora + ':00');
  var fim = new Date(inicio.getTime() + duracao * 60000);
  var titulo = (params.servico || 'Atendimento') + ' - ' + (params.nome_cliente || 'Cliente');
  var descricao = 'Cliente: ' + (params.nome_cliente || '') +
    '\nTelefone: ' + (params.telefone_cliente || '') +
    '\nServico: ' + (params.servico || '');
  var evento = calendar.createEvent(titulo, inicio, fim, { description: descricao });
  return { sucesso: true, eventId: evento.getId(), inicio: inicio.toISOString(), fim: fim.toISOString() };
}

function cancelarAgendamento(eventId) {
  var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  var evento = calendar.getEventById(eventId);
  if (!evento) return { sucesso: false, erro: 'Evento nao encontrado' };
  evento.deleteEvent();
  return { sucesso: true };
}

function jsonResponse(obj) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
```

## ⚠️ Fuso horário do projeto

Projetos novos do Apps Script costumam vir com o fuso `America/Los_Angeles` por padrão,
mesmo em contas brasileiras. Como o script interpreta `data` + `hora` no fuso do
**projeto** (não da conta), isso faz os agendamentos caírem no horário errado.

Confirme/corrija antes de usar em produção:

1. No editor do Apps Script → ícone de engrenagem ⚙️ **Configurações do projeto**.
2. Marque **"Mostrar arquivo de manifesto 'appsscript.json' no editor"**.
3. Abra `appsscript.json` e garanta:
   ```json
   "timeZone": "America/Sao_Paulo"
   ```
4. Reimplante (Implantar → Gerenciar implantações → editar → Nova versão → Implantar).

## Contrato da API

Todas as requisições (GET com querystring ou POST com corpo JSON) precisam do campo
`token` igual ao `API_TOKEN` configurado no script.

- **`GET ?action=eventos&desde=<ISO>&ate=<ISO>`** → `{ eventos: [{ id, titulo, inicio, fim }] }`
- **`POST { action: 'criar_agendamento', data, hora, duracao, servico, nome_cliente, telefone_cliente }`**
  → `{ sucesso: true, eventId, inicio, fim }`
- **`POST { action: 'cancelar_agendamento', eventId }`** → `{ sucesso: true }` (não usado pelo MVP ainda)

`data` é `YYYY-MM-DD` e `hora` é `HH:mm`, sempre no fuso horário do script (o mesmo da
conta `cadubarber47@gmail.com`, que deve ser `America/Sao_Paulo`).
