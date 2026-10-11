// src/routes/menuRoutes.js
const express = require('express');
const router = express.Router();
const menuService = require('../services/menuService');

// GET /api/categories
router.get('/categories', (req, res) => {
  try {
    res.json(menuService.getAllCategories());
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/categories
router.post('/categories', (req, res) => {
  try {
    const cat = menuService.createCategory(req.body.name);
    res.status(201).json(cat);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/menu
router.get('/menu', (req, res) => {
  try {
    res.json(menuService.getMenuItems());
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/menu/grouped — available items grouped by category
router.get('/menu/grouped', (req, res) => {
  try {
    res.json(menuService.getMenuItemsByCategory());
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/menu/:id
router.get('/menu/:id', (req, res) => {
  try {
    res.json(menuService.getMenuItem(Number(req.params.id)));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/menu
router.post('/menu', (req, res) => {
  try {
    const item = menuService.createMenuItem(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// PUT /api/menu/:id
router.put('/menu/:id', (req, res) => {
  try {
    const item = menuService.updateMenuItem(Number(req.params.id), req.body);
    res.json(item);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// DELETE /api/menu/:id
router.delete('/menu/:id', (req, res) => {
  try {
    menuService.deleteMenuItem(Number(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
