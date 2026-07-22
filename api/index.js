// Entrypoint de função serverless da Vercel. Reaproveita o mesmo app Express
// usado localmente (backend/app.js) — nenhuma lógica duplicada.
const createApp = require('../backend/app');

module.exports = createApp();
