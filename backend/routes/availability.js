const express = require('express');
const { getSlotsForDate, getServiceById } = require('../services/availability');

const router = express.Router();

router.get('/', async (req, res) => {
  const { serviceId, date } = req.query;

  if (!serviceId) {
    return res.status(400).json({ error: 'Parâmetro serviceId é obrigatório' });
  }
  if (!date) {
    return res.status(400).json({ error: 'Parâmetro date (YYYY-MM-DD) é obrigatório' });
  }

  try {
    const service = await getServiceById(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    const result = await getSlotsForDate(serviceId, date);
    res.json(result);
  } catch (err) {
    console.error('Erro ao consultar disponibilidade:', err);
    res.status(500).json({ error: 'Erro ao consultar disponibilidade na agenda' });
  }
});

module.exports = router;
