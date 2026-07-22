require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL,
  googlePrivateKey: process.env.GOOGLE_PRIVATE_KEY,
  googleCalendarId: process.env.GOOGLE_CALENDAR_ID,
  frontendUrl: process.env.FRONTEND_URL || '*',
};
