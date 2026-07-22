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

// Busca agendamentos futuros (a partir de sinceDateStr, "YYYY-MM-DD") cuja
// descrição contenha o telefone informado.
async function findAppointmentsByPhone(phone, sinceDateStr) {
  const data = await callAppsScript('buscar_agendamentos', { telefone: phone, desde: sinceDateStr });
  return (data.agendamentos || []).map((a) => ({
    eventId: a.id,
    title: a.titulo,
    start: a.inicio,
    end: a.fim,
  }));
}

// Cancela um agendamento existente na agenda do barbeiro.
async function cancelEvent(eventId) {
  const data = await callAppsScript('cancelar_agendamento', { eventId }, 'POST');
  if (!data.sucesso) {
    throw new Error(data.erro || 'Erro ao cancelar agendamento');
  }
  return data;
}

module.exports = { listEvents, createEvent, findAppointmentsByPhone, cancelEvent };
