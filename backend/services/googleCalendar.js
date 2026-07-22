const { callAppsScript } = require('./appsScriptClient');

// Lista eventos (ocupados) da agenda num intervalo [timeMinISO, timeMaxISO).
// Lê a agenda inteira, então eventos criados manualmente pelo barbeiro também bloqueiam horários.
async function listEvents(timeMinISO, timeMaxISO) {
  const data = await callAppsScript('eventos', { desde: timeMinISO, ate: timeMaxISO });
  return (data.eventos || []).map((ev) => ({
    start: { dateTime: ev.inicio },
    end: { dateTime: ev.fim },
  }));
}

// Cria um novo evento (agendamento) na agenda do barbeiro.
async function createEvent({ dateStr, timeStr, durationMinutes, serviceName, customerName, customerPhone }) {
  const data = await callAppsScript(
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
