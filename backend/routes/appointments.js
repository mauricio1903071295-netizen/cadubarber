const express = require('express');
const { getConfig } = require('../services/config');
const { getServiceById, isSlotAvailable, splitLocalDateTime } = require('../services/availability');
const { createEvent } = require('../services/googleCalendar');

const router = express.Router();

router.post('/', async (req, res) => {
  const { serviceId, start, customerName, customerPhone } = req.body || {};

  if (!serviceId || !start || !customerName || !customerPhone) {
    return res.status(400).json({
      error: 'Campos obrigatórios: serviceId, start, customerName, customerPhone',
    });
  }

  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) {
    return res.status(400).json({ error: 'Horário inválido' });
  }

  try {
    const config = await getConfig();
    if (config.locked) {
      return res.status(423).json({ error: 'Agenda temporariamente fechada. Tente novamente mais tarde.' });
    }

    const service = await getServiceById(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    const available = await isSlotAvailable(start, service);
    if (!available) {
      return res.status(409).json({ error: 'Esse horário não está mais disponível. Escolha outro.' });
    }

    const endDate = new Date(startDate.getTime() + service.durationMinutes * 60000);
    const { dateStr, timeStr } = splitLocalDateTime(startDate, config.timezone);

    const event = await createEvent({
      dateStr,
      timeStr,
      durationMinutes: service.durationMinutes,
      serviceName: service.name,
      customerName,
      customerPhone,
    });

    res.status(201).json({
      success: true,
      appointment: {
        service: service.name,
        price: service.price,
        durationMinutes: service.durationMinutes,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        customerName,
        customerPhone,
        eventId: event.eventId,
      },
    });
  } catch (err) {
    console.error('Erro ao criar agendamento:', err);
    res.status(500).json({ error: 'Erro ao criar o agendamento na agenda' });
  }
});

module.exports = router;
