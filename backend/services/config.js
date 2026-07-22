const { callAppsScript } = require('./appsScriptClient');
const defaultBusiness = require('../config/business');
const defaultServices = require('../config/services');

const CACHE_TTL_MS = 15000;
let cached = null;
let cachedAt = 0;

function buildDefaultConfig() {
  return {
    timezone: defaultBusiness.timezone,
    workingHours: defaultBusiness.workingHours,
    lunchBreak: defaultBusiness.lunchBreak,
    slotIntervalMinutes: defaultBusiness.slotIntervalMinutes,
    daysAhead: defaultBusiness.daysAhead,
    locked: false,
    services: defaultServices,
  };
}

// Busca a configuração (serviços, horário de funcionamento, trava de agenda)
// guardada no Apps Script. Enquanto o Cadu nunca salvou nada pelo painel
// admin, usa os valores padrão do código como ponto de partida.
async function getConfig({ skipCache = false } = {}) {
  const now = Date.now();
  if (!skipCache && cached && now - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  const data = await callAppsScript('obter_configuracao');
  const config = data.configuracao || buildDefaultConfig();
  cached = config;
  cachedAt = now;
  return config;
}

async function saveConfig(config) {
  await callAppsScript('salvar_configuracao', { configuracao: JSON.stringify(config) }, 'POST');
  cached = config;
  cachedAt = Date.now();
  return config;
}

module.exports = { getConfig, saveConfig, buildDefaultConfig };
