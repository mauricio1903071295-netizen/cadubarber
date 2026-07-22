const express = require('express');
const servicesConfig = require('../config/services');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(servicesConfig);
});

module.exports = router;
