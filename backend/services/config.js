const { callAppsScript } = require('./appsScriptClient');
const defaultBusiness = require('../config/business');
const defaultServices = require('../config/services');

const CACHE_TTL_MS = 15000;
let cached = null;
let cachedAt = 0;

// Campos que o Cadu edita pelo painel /admin e ficam salvos no Apps Script.
// timezone, slotIntervalMinutes e daysAhead NÃO entram aqui de propósito:
// sempre vêm do código (backend/config/business.js), nunca de um retrato
// salvo antigo — assim uma mudança de código (ex: aumentar daysAhead) vale
// pra todo mundo imediatamente, mesmo quem já salvou algo no admin antes
// desse campo existir.
function buildEditableDefaults() {
  return {
    workingHours: defaultBusiness.workingHours,
    lunchBreak: defaultBusiness.lunchBreak,
    startDate: defaultBusiness.startDate || null,
    locked: false,
    services: defaultServices,
    whatsappNumber: '',
    address: '',
  };
}

function buildDefaultConfig() {
  return {
    timezone: defaultBusiness.timezone,
    slotIntervalMinutes: defaultBusiness.slotIntervalMinutes,
    daysAhead: defaultBusiness.daysAhead,
    ...buildEditableDefaults(),
  };
}

// Busca a configuração combinando os campos editáveis salvos no Apps Script
// (ou os padrões, se o Cadu nunca salvou nada ainda) com as constantes que
// sempre vêm do código.
async function getConfig({ skipCache = false } = {}) {
  const now = Date.now();
  if (!skipCache && cached && now - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  const data = await callAppsScript('obter_configuracao');
  const saved = data.configuracao || {};
  const editableDefaults = buildEditableDefaults();

  const config = {
    timezone: defaultBusiness.timezone,
    slotIntervalMinutes: defaultBusiness.slotIntervalMinutes,
    daysAhead: defaultBusiness.daysAhead,
    workingHours: saved.workingHours || editableDefaults.workingHours,
    lunchBreak: saved.lunchBreak !== undefined ? saved.lunchBreak : editableDefaults.lunchBreak,
    startDate: saved.startDate || editableDefaults.startDate,
    locked: Boolean(saved.locked),
    services: saved.services || editableDefaults.services,
    whatsappNumber: saved.whatsappNumber || editableDefaults.whatsappNumber,
    address: saved.address || editableDefaults.address,
  };

  cached = config;
  cachedAt = now;
  return config;
}

async function saveConfig(config) {
  const {
    workingHours,
    lunchBreak,
    startDate,
    locked,
    services,
    whatsappNumber,
    address,
  } = config;

  const editablePayload = { workingHours, lunchBreak, startDate, locked, services, whatsappNumber, address };
  await callAppsScript('salvar_configuracao', { configuracao: JSON.stringify(editablePayload) }, 'POST');
  cached = { ...config };
  cachedAt = Date.now();
  return cached;
}

module.exports = { getConfig, saveConfig, buildDefaultConfig };
