// src/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');

// POST /api/orders — create order for a table
router.post('/', (req, res) => {
  try {
    const { table_id } = req.body;
    if (!table_id) {
      return res.status(400).json({ error: 'table_id is required' });
    }
    const order = orderService.createOrder(Number(table_id));
    res.status(201).json(order);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  try {
    res.json(orderService.getOrderWithItems(Number(req.params.id)));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/orders/table/:tableId — get open order for table
router.get('/table/:tableId', (req, res) => {
  try {
    const order = orderService.getOpenOrderForTable(Number(req.params.tableId));
    if (!order) {
      return res.status(404).json({ error: 'No open order for this table' });
    }
    res.json(orderService.getOrderWithItems(order.id));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/orders/:id/items — add item to order
router.post('/:id/items', (req, res) => {
  try {
    const result = orderService.addItem(Number(req.params.id), req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// PUT /api/orders/:id/items/:itemId — update order item
router.put('/:id/items/:itemId', (req, res) => {
  try {
    const result = orderService.updateItem(
      Number(req.params.id),
      Number(req.params.itemId),
      req.body
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// DELETE /api/orders/:id/items/:itemId — remove item from order
router.delete('/:id/items/:itemId', (req, res) => {
  try {
    const result = orderService.removeItem(
      Number(req.params.id),
      Number(req.params.itemId)
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// PUT /api/orders/:id/discount
router.put('/:id/discount', (req, res) => {
  try {
    const result = orderService.setDiscount(Number(req.params.id), req.body);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/orders/:id/bill
router.get('/:id/bill', (req, res) => {
  try {
    res.json(orderService.getBill(Number(req.params.id)));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/orders/:id/pay
router.post('/:id/pay', (req, res) => {
  try {
    const result = orderService.payOrder(Number(req.params.id), req.body.payment_method);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/orders/:id/cancel
router.post('/:id/cancel', (req, res) => {
  try {
    const result = orderService.cancelOrder(Number(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/reports/daily?date=YYYY-MM-DD
router.get('/reports/daily', (req, res) => {
  try {
    const report = orderService.getDailyReport(req.query.date);
    res.json(report);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
