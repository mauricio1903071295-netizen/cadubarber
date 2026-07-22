require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  appsScriptUrl: process.env.APPS_SCRIPT_URL,
  appsScriptToken: process.env.APPS_SCRIPT_TOKEN,
  adminPassword: process.env.ADMIN_PASSWORD,
  frontendUrl: process.env.FRONTEND_URL || '*',
};
