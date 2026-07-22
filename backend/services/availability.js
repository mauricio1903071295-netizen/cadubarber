const { fromZonedTime } = require('date-fns-tz');
const business = require('../config/business');
const servicesConfig = require('../config/services');
const { listEvents } = require('./googleCalendar');

function getServiceById(id) {
  return servicesConfig.find((s) => s.id === id);
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
function computeSlotsForDate(dateStr, service, busyEvents) {
  const dayOfWeek = getDayOfWeek(dateStr);
  const hours = business.workingHours[dayOfWeek];
  if (!hours) return [];

  const openMin = timeStrToMinutes(hours.start);
  const closeMin = timeStrToMinutes(hours.end);
  const lunchStartMin = business.lunchBreak ? timeStrToMinutes(business.lunchBreak.start) : null;
  const lunchEndMin = business.lunchBreak ? timeStrToMinutes(business.lunchBreak.end) : null;

  const busyPeriods = busyEvents
    .filter((e) => e.start?.dateTime && e.end?.dateTime) // ignora eventos de dia inteiro
    .map((e) => ({ start: new Date(e.start.dateTime), end: new Date(e.end.dateTime) }));

  const now = new Date();
  const slots = [];

  for (
    let startMin = openMin;
    startMin + service.durationMinutes <= closeMin;
    startMin += business.slotIntervalMinutes
  ) {
    const endMin = startMin + service.durationMinutes;

    if (lunchStartMin !== null && rangesOverlap(startMin, endMin, lunchStartMin, lunchEndMin)) {
      continue;
    }

    const slotStartUtc = fromZonedTime(`${dateStr}T${minutesToTimeStr(startMin)}:00`, business.timezone);
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

// Retorna os próximos dias de funcionamento com os horários livres de cada um,
// para um serviço específico. Faz uma única consulta à Google Agenda cobrindo
// todo o intervalo para minimizar chamadas à API.
async function getAvailableDays(serviceId, daysAhead = business.daysAhead) {
  const service = getServiceById(serviceId);
  if (!service) throw new Error('Serviço inválido');

  const todayStr = getTodayDateStrInTZ(business.timezone);
  const lastDateStr = addDaysToDateStr(todayStr, daysAhead - 1);

  const rangeStartUtc = fromZonedTime(`${todayStr}T00:00:00`, business.timezone);
  const rangeEndUtc = fromZonedTime(`${lastDateStr}T23:59:59`, business.timezone);
  const events = await listEvents(rangeStartUtc.toISOString(), rangeEndUtc.toISOString());

  const days = [];
  for (let i = 0; i < daysAhead; i += 1) {
    const dateStr = addDaysToDateStr(todayStr, i);
    const dayOfWeek = getDayOfWeek(dateStr);
    if (!business.workingHours[dayOfWeek]) continue; // dia fechado, nem aparece na lista

    const dayEvents = events.filter((e) => {
      const start = e.start?.dateTime || e.start?.date;
      return start && start.slice(0, 10) === dateStr;
    });

    days.push({
      date: dateStr,
      weekday: dayOfWeek,
      slots: computeSlotsForDate(dateStr, service, dayEvents),
    });
  }

  return days;
}

// Reconfere disponibilidade de um horário específico bem antes de confirmar o
// agendamento, para evitar condição de corrida com outro cliente/evento manual.
async function isSlotAvailable(startISO, service) {
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

module.exports = { getServiceById, getAvailableDays, isSlotAvailable };
