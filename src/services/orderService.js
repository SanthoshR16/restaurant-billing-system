// src/services/orderService.js
const { allRows, getRow, runSql, transaction, saveDb } = require('../db');
const tableService = require('./tableService');

function getSettings() {
  const rows = allRows('SELECT key, value FROM settings');
  const obj = {};
  for (const row of rows) {
    obj[row.key] = row.value;
  }
  return obj;
}

/** Recalculate and update order totals */
function recalcOrderTotals(orderId) {
  const order = getRow('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });

  const items = allRows('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
  let subtotal = 0;
  for (const item of items) {
    subtotal += item.unit_price_paise * item.quantity;
  }

  const settings = getSettings();
  const taxPercent = parseFloat(settings.tax_percent) || 0;
  const scPercent = parseFloat(settings.service_charge_percent) || 0;

  // Cap discount so it doesn't exceed subtotal
  let discount = order.discount_paise || 0;
  if (discount > subtotal) discount = subtotal;

  const taxable = subtotal - discount;
  const tax = Math.round(taxable * taxPercent / 100);
  const serviceCharge = Math.round(taxable * scPercent / 100);
  const total = taxable + tax + serviceCharge;

  runSql(
    `UPDATE orders SET subtotal_paise = ?, discount_paise = ?, tax_paise = ?,
     service_charge_paise = ?, total_paise = ? WHERE id = ?`,
    [subtotal, discount, tax, serviceCharge, total, orderId]
  );

  return { subtotal, discount_paise: discount, tax_paise: tax, service_charge_paise: serviceCharge, total_paise: total };
}

function getOrder(id) {
  const order = getRow('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) {
    throw Object.assign(new Error('Order not found'), { status: 404 });
  }
  return order;
}

function getOrderWithItems(id) {
  const order = getOrder(id);
  const items = allRows('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at', [id]);
  const table = getRow('SELECT * FROM tables WHERE id = ?', [order.table_id]);
  return { ...order, items, table };
}

function createOrder(tableId) {
  const table = tableService.getTable(tableId);

  // Check if there's already an open order for this table
  const existing = getRow('SELECT id FROM orders WHERE table_id = ? AND status = ?', [tableId, 'open']);
  if (existing) {
    throw Object.assign(new Error('Table already has an open order'), { status: 409 });
  }

  const { lastInsertRowid } = runSql(
    'INSERT INTO orders (table_id) VALUES (?)',
    [tableId]
  );
  saveDb();
  return getOrderWithItems(lastInsertRowid);
}

function getOpenOrderForTable(tableId) {
  return getRow('SELECT * FROM orders WHERE table_id = ? AND status = ?', [tableId, 'open']);
}

function addItem(orderId, { menu_item_id, quantity = 1, notes = '' }) {
  return transaction(() => {
    const order = getOrder(orderId);
    if (order.status !== 'open') {
      throw Object.assign(new Error('Cannot modify a ' + order.status + ' order'), { status: 409 });
    }

    if (!menu_item_id) {
      throw Object.assign(new Error('Menu item ID is required'), { status: 400 });
    }
    if (quantity <= 0) {
      throw Object.assign(new Error('Quantity must be greater than 0'), { status: 400 });
    }

    const menuItem = getRow('SELECT * FROM menu_items WHERE id = ?', [menu_item_id]);
    if (!menuItem) {
      throw Object.assign(new Error('Menu item not found'), { status: 404 });
    }
    if (!menuItem.is_available) {
      throw Object.assign(new Error('Menu item is not available'), { status: 400 });
    }

    // Check if this item already exists in the order
    const existingItem = getRow(
      'SELECT * FROM order_items WHERE order_id = ? AND menu_item_id = ?',
      [orderId, menu_item_id]
    );

    if (existingItem) {
      // Merge: increase quantity
      const newQty = existingItem.quantity + quantity;
      const newNotes = notes ? (existingItem.notes ? existingItem.notes + '; ' + notes : notes) : existingItem.notes;
      runSql(
        'UPDATE order_items SET quantity = ?, notes = ? WHERE id = ?',
        [newQty, newNotes, existingItem.id]
      );
    } else {
      runSql(
        `INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price_paise, quantity, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, menu_item_id, menuItem.name, menuItem.price_paise, quantity, notes || '']
      );
    }

    // Mark table as occupied
    tableService.setTableStatus(order.table_id, 'occupied');

    recalcOrderTotals(orderId);
    return getOrderWithItems(orderId);
  });
}

function updateItem(orderId, itemId, { quantity, notes }) {
  return transaction(() => {
    const order = getOrder(orderId);
    if (order.status !== 'open') {
      throw Object.assign(new Error('Cannot modify a ' + order.status + ' order'), { status: 409 });
    }

    const item = getRow('SELECT * FROM order_items WHERE id = ? AND order_id = ?', [itemId, orderId]);
    if (!item) {
      throw Object.assign(new Error('Order item not found'), { status: 404 });
    }

    if (quantity !== undefined) {
      if (quantity <= 0) {
        throw Object.assign(new Error('Quantity must be greater than 0. Use remove to delete.'), { status: 400 });
      }
      runSql('UPDATE order_items SET quantity = ? WHERE id = ?', [quantity, itemId]);
    }
    if (notes !== undefined) {
      runSql('UPDATE order_items SET notes = ? WHERE id = ?', [notes, itemId]);
    }

    recalcOrderTotals(orderId);
    return getOrderWithItems(orderId);
  });
}

function removeItem(orderId, itemId) {
  return transaction(() => {
    const order = getOrder(orderId);
    if (order.status !== 'open') {
      throw Object.assign(new Error('Cannot modify a ' + order.status + ' order'), { status: 409 });
    }

    const item = getRow('SELECT * FROM order_items WHERE id = ? AND order_id = ?', [itemId, orderId]);
    if (!item) {
      throw Object.assign(new Error('Order item not found'), { status: 404 });
    }

    runSql('DELETE FROM order_items WHERE id = ?', [itemId]);

    // Check if there are remaining items
    const remaining = allRows('SELECT id FROM order_items WHERE order_id = ?', [orderId]);
    if (remaining.length === 0) {
      // Free the table if no items left
      tableService.setTableStatus(order.table_id, 'free');
    }

    recalcOrderTotals(orderId);
    return getOrderWithItems(orderId);
  });
}

function setDiscount(orderId, { discount_paise, discount_percent }) {
  return transaction(() => {
    const order = getOrder(orderId);
    if (order.status !== 'open') {
      throw Object.assign(new Error('Cannot modify a ' + order.status + ' order'), { status: 409 });
    }

    let discount = 0;
    if (discount_paise !== undefined && discount_paise !== null) {
      discount = Math.round(discount_paise);
    } else if (discount_percent !== undefined && discount_percent !== null) {
      if (discount_percent < 0 || discount_percent > 100) {
        throw Object.assign(new Error('Discount percent must be 0-100'), { status: 400 });
      }
      discount = Math.round(order.subtotal_paise * discount_percent / 100);
    }

    if (discount < 0) {
      throw Object.assign(new Error('Discount cannot be negative'), { status: 400 });
    }

    // Cap discount at subtotal
    if (discount > order.subtotal_paise) {
      discount = order.subtotal_paise;
    }

    runSql('UPDATE orders SET discount_paise = ? WHERE id = ?', [discount, orderId]);
    recalcOrderTotals(orderId);
    return getOrderWithItems(orderId);
  });
}

function getBill(orderId) {
  const order = getOrderWithItems(orderId);
  const settings = getSettings();
  return {
    restaurant_name: settings.restaurant_name,
    ...order,
    tax_percent: parseFloat(settings.tax_percent),
    service_charge_percent: parseFloat(settings.service_charge_percent),
  };
}

function payOrder(orderId, paymentMethod) {
  return transaction(() => {
    const order = getOrder(orderId);
    if (order.status !== 'open') {
      throw Object.assign(new Error('Order is already ' + order.status), { status: 409 });
    }

    const items = allRows('SELECT id FROM order_items WHERE order_id = ?', [orderId]);
    if (items.length === 0) {
      throw Object.assign(new Error('Cannot pay an empty order'), { status: 400 });
    }

    if (!paymentMethod || !['cash', 'card', 'upi'].includes(paymentMethod)) {
      throw Object.assign(new Error('Payment method must be cash, card, or upi'), { status: 400 });
    }

    runSql(
      `UPDATE orders SET status = 'paid', payment_method = ?, closed_at = datetime('now') WHERE id = ?`,
      [paymentMethod, orderId]
    );

    // Free the table
    tableService.setTableStatus(order.table_id, 'free');

    return getOrderWithItems(orderId);
  });
}

function cancelOrder(orderId) {
  return transaction(() => {
    const order = getOrder(orderId);
    if (order.status !== 'open') {
      throw Object.assign(new Error('Order is already ' + order.status), { status: 409 });
    }

    runSql(
      `UPDATE orders SET status = 'cancelled', closed_at = datetime('now') WHERE id = ?`,
      [orderId]
    );

    // Free the table
    tableService.setTableStatus(order.table_id, 'free');

    return getOrderWithItems(orderId);
  });
}

function getDailyReport(date) {
  // date format: YYYY-MM-DD
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw Object.assign(new Error('Date must be in YYYY-MM-DD format'), { status: 400 });
  }

  const orders = allRows(
    `SELECT * FROM orders WHERE status = 'paid'
     AND date(closed_at) = ?`,
    [date]
  );

  const totalSales = orders.reduce((sum, o) => sum + o.total_paise, 0);

  const breakdown = { cash: 0, card: 0, upi: 0 };
  for (const o of orders) {
    if (o.payment_method && breakdown.hasOwnProperty(o.payment_method)) {
      breakdown[o.payment_method] += o.total_paise;
    }
  }

  // Top 5 items by quantity
  const topItems = allRows(
    `SELECT oi.item_name, SUM(oi.quantity) as total_qty, SUM(oi.quantity * oi.unit_price_paise) as total_revenue
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE o.status = 'paid' AND date(o.closed_at) = ?
     GROUP BY oi.item_name
     ORDER BY total_qty DESC
     LIMIT 5`,
    [date]
  );

  return {
    date,
    total_bills: orders.length,
    total_sales_paise: totalSales,
    breakdown,
    top_items: topItems,
  };
}

module.exports = {
  getOrder,
  getOrderWithItems,
  createOrder,
  getOpenOrderForTable,
  addItem,
  updateItem,
  removeItem,
  setDiscount,
  getBill,
  payOrder,
  cancelOrder,
  getDailyReport,
  recalcOrderTotals,
  getSettings,
};
