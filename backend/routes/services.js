const express = require('express');
const { getConfig } = require('../services/config');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const config = await getConfig();
    res.json(config.services);
  } catch (err) {
    console.error('Erro ao obter serviços:', err);
    res.status(500).json({ error: 'Erro ao carregar serviços' });
  }
});

module.exports = router;
