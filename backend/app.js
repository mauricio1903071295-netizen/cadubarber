const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const business = require('./config/business');
const servicesRouter = require('./routes/services');
const availabilityRouter = require('./routes/availability');
const appointmentsRouter = require('./routes/appointments');

function createApp() {
  const app = express();

  app.use(cors({ origin: env.frontendUrl }));
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, business: business.businessName });
  });

  app.use('/api/services', servicesRouter);
  app.use('/api/availability', availabilityRouter);
  app.use('/api/appointments', appointmentsRouter);

  return app;
}

module.exports = createApp;
