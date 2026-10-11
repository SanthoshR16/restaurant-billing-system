// src/services/settingsService.js
const { allRows, getRow, runSql, saveDb } = require('../db');

function getAll() {
  const rows = allRows('SELECT key, value FROM settings');
  const obj = {};
  for (const row of rows) {
    obj[row.key] = row.value;
  }
  return obj;
}

function update(updates) {
  const validKeys = ['tax_percent', 'service_charge_percent', 'restaurant_name'];

  for (const [key, value] of Object.entries(updates)) {
    if (!validKeys.includes(key)) {
      throw Object.assign(new Error(`Unknown setting: ${key}`), { status: 400 });
    }

    if (key === 'tax_percent' || key === 'service_charge_percent') {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 100) {
        throw Object.assign(new Error(`${key} must be a number between 0 and 100`), { status: 400 });
      }
      runSql('UPDATE settings SET value = ? WHERE key = ?', [String(num), key]);
    } else if (key === 'restaurant_name') {
      if (!value || !String(value).trim()) {
        throw Object.assign(new Error('Restaurant name is required'), { status: 400 });
      }
      runSql('UPDATE settings SET value = ? WHERE key = ?', [String(value).trim(), key]);
    }
  }

  saveDb();
  return getAll();
}

module.exports = { getAll, update };
