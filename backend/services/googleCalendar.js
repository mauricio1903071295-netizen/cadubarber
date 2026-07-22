const { google } = require('googleapis');
const env = require('../config/env');

function getAuthClient() {
  const privateKey = (env.googlePrivateKey || '').replace(/\\n/g, '\n');
  return new google.auth.JWT({
    email: env.googleClientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

function getCalendarClient() {
  return google.calendar({ version: 'v3', auth: getAuthClient() });
}

// Lista eventos (ocupados) da agenda num intervalo [timeMinISO, timeMaxISO).
// Lê a agenda inteira, então eventos criados manualmente pelo barbeiro também bloqueiam horários.
async function listEvents(timeMinISO, timeMaxISO) {
  const calendar = getCalendarClient();
  const { data } = await calendar.events.list({
    calendarId: env.googleCalendarId,
    timeMin: timeMinISO,
    timeMax: timeMaxISO,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 2500,
  });
  return data.items || [];
}

// Cria um novo evento (agendamento) na agenda do barbeiro.
async function createEvent({ summary, description, startISO, endISO, timeZone }) {
  const calendar = getCalendarClient();
  const { data } = await calendar.events.insert({
    calendarId: env.googleCalendarId,
    requestBody: {
      summary,
      description,
      start: { dateTime: startISO, timeZone },
      end: { dateTime: endISO, timeZone },
    },
  });
  return data;
}

module.exports = { listEvents, createEvent };
