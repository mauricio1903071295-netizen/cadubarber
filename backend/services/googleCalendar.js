const env = require('../config/env');

// Chama o Google Apps Script Web App que expõe a agenda do barbeiro
// (veja backend/APPS_SCRIPT.md para o código do script).
async function callScript(action, params, method = 'GET') {
  let res;

  if (method === 'GET') {
    const url = new URL(env.appsScriptUrl);
    url.searchParams.set('token', env.appsScriptToken);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    res = await fetch(url.toString());
  } else {
    res = await fetch(env.appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: env.appsScriptToken, action, ...params }),
    });
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

// Lista eventos (ocupados) da agenda num intervalo [timeMinISO, timeMaxISO).
// Lê a agenda inteira, então eventos criados manualmente pelo barbeiro também bloqueiam horários.
async function listEvents(timeMinISO, timeMaxISO) {
  const data = await callScript('eventos', { desde: timeMinISO, ate: timeMaxISO });
  return (data.eventos || []).map((ev) => ({
    start: { dateTime: ev.inicio },
    end: { dateTime: ev.fim },
  }));
}

// Cria um novo evento (agendamento) na agenda do barbeiro.
async function createEvent({ dateStr, timeStr, durationMinutes, serviceName, customerName, customerPhone }) {
  const data = await callScript(
    'criar_agendamento',
    {
      data: dateStr,
      hora: timeStr,
      duracao: durationMinutes,
      servico: serviceName,
      nome_cliente: customerName,
      telefone_cliente: customerPhone,
    },
    'POST',
  );

  if (!data.sucesso) {
    throw new Error(data.erro || 'Erro ao criar agendamento');
  }
  return data;
}

module.exports = { listEvents, createEvent };
