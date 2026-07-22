const env = require('../config/env');

// Fala com o Google Apps Script Web App que expõe a agenda e a configuração
// do negócio (veja backend/APPS_SCRIPT.md para o código do script).
async function callAppsScript(action, params = {}, method = 'GET') {
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

module.exports = { callAppsScript };
