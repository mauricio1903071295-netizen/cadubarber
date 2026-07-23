const { callAppsScript } = require('./appsScriptClient');
const defaultBusiness = require('../config/business');
const defaultServices = require('../config/services');

const CACHE_TTL_MS = 15000;
let cached = null;
let cachedAt = 0;

// Campos que o Cadu edita pelo painel /admin e ficam salvos no Apps Script.
// timezone e slotIntervalMinutes NÃO entram aqui de propósito: sempre vêm
// do código (backend/config/business.js), nunca de um retrato salvo antigo.
// Os demais têm fallback pro padrão do código quando ausentes de um retrato
// salvo antes desse campo existir — assim campos novos não ficam presos.
function buildEditableDefaults() {
  return {
    workingHours: defaultBusiness.workingHours,
    lunchBreak: defaultBusiness.lunchBreak,
    daysAhead: defaultBusiness.daysAhead,
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
    workingHours: saved.workingHours || editableDefaults.workingHours,
    lunchBreak: saved.lunchBreak !== undefined ? saved.lunchBreak : editableDefaults.lunchBreak,
    daysAhead: saved.daysAhead || editableDefaults.daysAhead,
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
    daysAhead,
    startDate,
    locked,
    services,
    whatsappNumber,
    address,
  } = config;

  const editablePayload = {
    workingHours,
    lunchBreak,
    daysAhead,
    startDate,
    locked,
    services,
    whatsappNumber,
    address,
  };
  await callAppsScript('salvar_configuracao', { configuracao: JSON.stringify(editablePayload) }, 'POST');
  cached = { ...config };
  cachedAt = Date.now();
  return cached;
}

module.exports = { getConfig, saveConfig, buildDefaultConfig };
