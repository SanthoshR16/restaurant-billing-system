// src/routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const settingsService = require('../services/settingsService');

// GET /api/settings
router.get('/', (req, res) => {
  try {
    res.json(settingsService.getAll());
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// PUT /api/settings
router.put('/', (req, res) => {
  try {
    const updated = settingsService.update(req.body);
    res.json(updated);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
