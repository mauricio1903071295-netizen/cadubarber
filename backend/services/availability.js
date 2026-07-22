const { fromZonedTime } = require('date-fns-tz');
const { getConfig } = require('./config');
const { listEvents } = require('./googleCalendar');

function findService(config, id) {
  return config.services.find((s) => s.id === id);
}

// Dia da semana (0 = domingo ... 6 = sábado) de uma data "YYYY-MM-DD".
// Calculado em UTC para não depender do fuso do servidor: o dia da semana
// de uma data de calendário é o mesmo em qualquer fuso.
function getDayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function timeStrToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTimeStr(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function getTodayDateStrInTZ(timeZone) {
  // Locale en-CA formata como YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

function addDaysToDateStr(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// Calcula os horários livres de um dia específico a partir dos eventos já
// carregados da Google Agenda (evita repetir chamadas à API por dia).
function computeSlotsForDate(dateStr, service, busyEvents, config) {
  const dayOfWeek = getDayOfWeek(dateStr);
  const hours = config.workingHours[dayOfWeek];
  if (!hours) return [];

  const openMin = timeStrToMinutes(hours.start);
  const closeMin = timeStrToMinutes(hours.end);
  const lunchStartMin = config.lunchBreak ? timeStrToMinutes(config.lunchBreak.start) : null;
  const lunchEndMin = config.lunchBreak ? timeStrToMinutes(config.lunchBreak.end) : null;

  const busyPeriods = busyEvents
    .filter((e) => e.start?.dateTime && e.end?.dateTime) // ignora eventos de dia inteiro
    .map((e) => ({ start: new Date(e.start.dateTime), end: new Date(e.end.dateTime) }));

  const now = new Date();
  const slots = [];

  for (
    let startMin = openMin;
    startMin + service.durationMinutes <= closeMin;
    startMin += config.slotIntervalMinutes
  ) {
    const endMin = startMin + service.durationMinutes;

    if (lunchStartMin !== null && rangesOverlap(startMin, endMin, lunchStartMin, lunchEndMin)) {
      continue;
    }

    const slotStartUtc = fromZonedTime(`${dateStr}T${minutesToTimeStr(startMin)}:00`, config.timezone);
    const slotEndUtc = new Date(slotStartUtc.getTime() + service.durationMinutes * 60000);

    if (slotStartUtc <= now) continue; // não oferece horários que já passaram

    const conflict = busyPeriods.some((b) => rangesOverlap(slotStartUtc, slotEndUtc, b.start, b.end));
    if (conflict) continue;

    slots.push({
      start: slotStartUtc.toISOString(),
      end: slotEndUtc.toISOString(),
      label: minutesToTimeStr(startMin),
    });
  }

  return slots;
}

async function getServiceById(id) {
  const config = await getConfig();
  return findService(config, id);
}

// Retorna os próximos dias de funcionamento com os horários livres de cada um,
// para um serviço específico. Faz uma única consulta à Google Agenda cobrindo
// todo o intervalo para minimizar chamadas à API.
async function getAvailableDays(serviceId) {
  const config = await getConfig();
  if (config.locked) {
    return { locked: true, days: [] };
  }

  const service = findService(config, serviceId);
  if (!service) throw new Error('Serviço inválido');

  const todayStr = getTodayDateStrInTZ(config.timezone);
  const lastDateStr = addDaysToDateStr(todayStr, config.daysAhead - 1);

  const rangeStartUtc = fromZonedTime(`${todayStr}T00:00:00`, config.timezone);
  const rangeEndUtc = fromZonedTime(`${lastDateStr}T23:59:59`, config.timezone);
  const events = await listEvents(rangeStartUtc.toISOString(), rangeEndUtc.toISOString());

  const days = [];
  for (let i = 0; i < config.daysAhead; i += 1) {
    const dateStr = addDaysToDateStr(todayStr, i);
    const dayOfWeek = getDayOfWeek(dateStr);
    if (!config.workingHours[dayOfWeek]) continue; // dia fechado, nem aparece na lista

    const dayEvents = events.filter((e) => {
      const start = e.start?.dateTime || e.start?.date;
      return start && start.slice(0, 10) === dateStr;
    });

    days.push({
      date: dateStr,
      weekday: dayOfWeek,
      slots: computeSlotsForDate(dateStr, service, dayEvents, config),
    });
  }

  return { locked: false, days };
}

// Reconfere disponibilidade de um horário específico bem antes de confirmar o
// agendamento, para evitar condição de corrida com outro cliente/evento manual.
async function isSlotAvailable(startISO, service) {
  const config = await getConfig();
  if (config.locked) return false;

  const slotStart = new Date(startISO);
  const slotEnd = new Date(slotStart.getTime() + service.durationMinutes * 60000);

  const events = await listEvents(
    new Date(slotStart.getTime() - 60000).toISOString(),
    new Date(slotEnd.getTime() + 60000).toISOString(),
  );

  const busy = events.filter((e) => e.start?.dateTime && e.end?.dateTime);
  const conflict = busy.some((e) =>
    rangesOverlap(slotStart, slotEnd, new Date(e.start.dateTime), new Date(e.end.dateTime)),
  );

  return !conflict;
}

// Divide um instante em data (YYYY-MM-DD) e hora (HH:mm) na hora local do
// fuso do negócio — usado para falar com o Apps Script, que trabalha com
// data/hora local em vez de instantes UTC.
function splitLocalDateTime(date, timeZone) {
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);
  const timeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return { dateStr, timeStr };
}

module.exports = { getServiceById, getAvailableDays, isSlotAvailable, splitLocalDateTime };
