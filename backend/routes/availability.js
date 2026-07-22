const express = require('express');
const { getAvailableDays, getServiceById } = require('../services/availability');

const router = express.Router();

router.get('/', async (req, res) => {
  const { serviceId } = req.query;

  if (!serviceId) {
    return res.status(400).json({ error: 'Parâmetro serviceId é obrigatório' });
  }
  if (!getServiceById(serviceId)) {
    return res.status(404).json({ error: 'Serviço não encontrado' });
  }

  try {
    const days = await getAvailableDays(serviceId);
    res.json({ days });
  } catch (err) {
    console.error('Erro ao consultar disponibilidade:', err);
    res.status(500).json({ error: 'Erro ao consultar disponibilidade na agenda' });
  }
});

module.exports = router;
