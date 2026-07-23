const express = require('express');
const env = require('../config/env');
const { getConfig, saveConfig } = require('../services/config');

const router = express.Router();

function slugify(text) {
  const base = String(text)
    .normalize('NFD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return base || `servico-${Date.now()}`;
}

function requireAdmin(req, res, next) {
  const token = req.get('x-admin-token');
  if (!env.adminPassword || token !== env.adminPassword) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  next();
}

router.use(requireAdmin);

router.get('/config', async (req, res) => {
  try {
    const config = await getConfig({ skipCache: true });
    res.json(config);
  } catch (err) {
    console.error('Erro ao obter configuração:', err);
    res.status(500).json({ error: 'Erro ao carregar configuração' });
  }
});

router.put('/config', async (req, res) => {
  const { services, workingHours, lunchBreak, locked, whatsappNumber, address, startDate } = req.body || {};

  if (!Array.isArray(services) || services.length === 0) {
    return res.status(400).json({ error: 'A lista de serviços não pode ficar vazia' });
  }
  if (!workingHours || typeof workingHours !== 'object' || Object.keys(workingHours).length === 0) {
    return res.status(400).json({ error: 'É preciso pelo menos um dia de funcionamento' });
  }

  try {
    const current = await getConfig({ skipCache: true });
    const updated = {
      ...current,
      services: services.map((s) => ({
        id: s.id || slugify(s.name),
        name: s.name,
        durationMinutes: Number(s.durationMinutes),
        price: Number(s.price),
      })),
      workingHours,
      lunchBreak: lunchBreak || null,
      locked: Boolean(locked),
      whatsappNumber: whatsappNumber || '',
      address: address || '',
      startDate: startDate || null,
    };

    await saveConfig(updated);
    res.json(updated);
  } catch (err) {
    console.error('Erro ao salvar configuração:', err);
    res.status(500).json({ error: 'Erro ao salvar configuração' });
  }
});

module.exports = router;
