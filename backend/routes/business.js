const express = require('express');
const { getConfig } = require('../services/config');

const router = express.Router();

// Informação pública (não sensível) usada pelo frontend para montar o
// calendário de dias sem precisar consultar a Google Agenda a cada troca de mês.
router.get('/', async (req, res) => {
  try {
    const config = await getConfig();
    res.json({
      timezone: config.timezone,
      workingHours: config.workingHours,
      daysAhead: config.daysAhead,
      startDate: config.startDate || null,
      locked: config.locked,
    });
  } catch (err) {
    console.error('Erro ao obter informações do negócio:', err);
    res.status(500).json({ error: 'Erro ao carregar informações' });
  }
});

module.exports = router;
