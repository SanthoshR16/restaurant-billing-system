// src/services/tableService.js
const { allRows, getRow, runSql, saveDb } = require('../db');

function getAllTables() {
  return allRows('SELECT * FROM tables ORDER BY name');
}

function getTable(id) {
  const table = getRow('SELECT * FROM tables WHERE id = ?', [id]);
  if (!table) {
    throw Object.assign(new Error('Table not found'), { status: 404 });
  }
  return table;
}

function createTable(name) {
  if (!name || !name.trim()) {
    throw Object.assign(new Error('Table name is required'), { status: 400 });
  }
  const existing = getRow('SELECT id FROM tables WHERE name = ?', [name.trim()]);
  if (existing) {
    throw Object.assign(new Error('Table name already exists'), { status: 409 });
  }
  const { lastInsertRowid } = runSql('INSERT INTO tables (name) VALUES (?)', [name.trim()]);
  saveDb();
  return getRow('SELECT * FROM tables WHERE id = ?', [lastInsertRowid]);
}

function updateTable(id, name) {
  getTable(id); // ensure exists
  if (!name || !name.trim()) {
    throw Object.assign(new Error('Table name is required'), { status: 400 });
  }
  const existing = getRow('SELECT id FROM tables WHERE name = ? AND id != ?', [name.trim(), id]);
  if (existing) {
    throw Object.assign(new Error('Table name already exists'), { status: 409 });
  }
  runSql('UPDATE tables SET name = ? WHERE id = ?', [name.trim(), id]);
  saveDb();
  return getTable(id);
}

function deleteTable(id) {
  const table = getTable(id);
  if (table.status === 'occupied') {
    throw Object.assign(new Error('Cannot delete an occupied table'), { status: 409 });
  }
  // Also check for open orders
  const openOrder = getRow('SELECT id FROM orders WHERE table_id = ? AND status = ?', [id, 'open']);
  if (openOrder) {
    throw Object.assign(new Error('Cannot delete table with an open order'), { status: 409 });
  }
  runSql('DELETE FROM tables WHERE id = ?', [id]);
  saveDb();
}

function setTableStatus(id, status) {
  if (!['free', 'occupied'].includes(status)) {
    throw Object.assign(new Error('Invalid table status'), { status: 400 });
  }
  runSql('UPDATE tables SET status = ? WHERE id = ?', [status, id]);
}

module.exports = {
  getAllTables,
  getTable,
  createTable,
  updateTable,
  deleteTable,
  setTableStatus,
};
