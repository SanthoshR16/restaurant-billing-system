// src/routes/tableRoutes.js
const express = require('express');
const router = express.Router();
const tableService = require('../services/tableService');

// GET /api/tables
router.get('/', (req, res) => {
  try {
    res.json(tableService.getAllTables());
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/tables/:id
router.get('/:id', (req, res) => {
  try {
    res.json(tableService.getTable(Number(req.params.id)));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/tables
router.post('/', (req, res) => {
  try {
    const table = tableService.createTable(req.body.name);
    res.status(201).json(table);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// PUT /api/tables/:id
router.put('/:id', (req, res) => {
  try {
    const table = tableService.updateTable(Number(req.params.id), req.body.name);
    res.json(table);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// DELETE /api/tables/:id
router.delete('/:id', (req, res) => {
  try {
    tableService.deleteTable(Number(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
