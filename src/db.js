// src/db.js — Database initialization and access using sql.js
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, '..', 'restaurant.db');

let db = null;
let SQL = null;

/** Save the in-memory database to disk */
function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

/** Initialize sql.js and load or create the database */
async function initDb() {
  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable WAL-like behavior and foreign keys
  db.run('PRAGMA foreign_keys = ON;');

  createSchema();
  seedData();
  saveDb();

  return db;
}

function createSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price_paise INTEGER NOT NULL CHECK(price_paise > 0),
      is_available INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'free' CHECK(status IN ('free', 'occupied')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'paid', 'cancelled')),
      subtotal_paise INTEGER NOT NULL DEFAULT 0,
      discount_paise INTEGER NOT NULL DEFAULT 0,
      tax_paise INTEGER NOT NULL DEFAULT 0,
      service_charge_paise INTEGER NOT NULL DEFAULT 0,
      total_paise INTEGER NOT NULL DEFAULT 0,
      payment_method TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      closed_at TEXT,
      FOREIGN KEY (table_id) REFERENCES tables(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      unit_price_paise INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
      notes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'served')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Insert default settings if missing
  const settingsDefaults = [
    ['tax_percent', '5'],
    ['service_charge_percent', '0'],
    ['restaurant_name', 'My Restaurant']
  ];
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of settingsDefaults) {
    insertSetting.run([key, value]);
  }
  insertSetting.free();
}

function seedData() {
  // Only seed if menu is empty
  const result = db.exec('SELECT COUNT(*) as count FROM menu_items');
  const count = result.length > 0 ? result[0].values[0][0] : 0;
  if (count > 0) return;

  const categories = ['Starters', 'Main Course', 'Breads', 'Beverages', 'Desserts'];
  const insertCat = db.prepare('INSERT INTO categories (name) VALUES (?)');
  for (const cat of categories) {
    insertCat.run([cat]);
  }
  insertCat.free();

  const menuItems = [
    // Starters (category_id = 1)
    [1, 'Paneer Tikka', 22000],
    [1, 'Veg Spring Rolls', 18000],
    [1, 'Chicken Seekh Kebab', 26000],
    [1, 'Crispy Corn', 16000],
    // Main Course (category_id = 2)
    [2, 'Butter Chicken', 32000],
    [2, 'Dal Makhani', 24000],
    [2, 'Paneer Butter Masala', 28000],
    [2, 'Veg Biryani', 22000],
    [2, 'Chicken Biryani', 28000],
    // Breads (category_id = 3)
    [3, 'Butter Naan', 5000],
    [3, 'Garlic Naan', 6000],
    [3, 'Tandoori Roti', 4000],
    [3, 'Laccha Paratha', 5500],
    // Beverages (category_id = 4)
    [4, 'Masala Chai', 4000],
    [4, 'Fresh Lime Soda', 6000],
    [4, 'Mango Lassi', 8000],
    [4, 'Cold Coffee', 10000],
    // Desserts (category_id = 5)
    [5, 'Gulab Jamun', 8000],
    [5, 'Rasmalai', 10000],
    [5, 'Brownie with Ice Cream', 14000],
  ];

  const insertItem = db.prepare(
    'INSERT INTO menu_items (category_id, name, price_paise) VALUES (?, ?, ?)'
  );
  for (const [catId, name, price] of menuItems) {
    insertItem.run([catId, name, price]);
  }
  insertItem.free();

  // Seed tables
  const insertTable = db.prepare('INSERT INTO tables (name) VALUES (?)');
  for (let i = 1; i <= 8; i++) {
    insertTable.run([`Table ${i}`]);
  }
  insertTable.free();
}

/** Get the database instance */
function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

// Helper to run a query and return all rows as objects
function allRows(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper to get a single row as object
function getRow(sql, params = []) {
  const rows = allRows(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper to run a write statement and return { changes, lastInsertRowid }
function runSql(sql, params = []) {
  db.run(sql, params);
  const info = db.exec('SELECT changes() as changes, last_insert_rowid() as lastId');
  const changes = info.length > 0 ? info[0].values[0][0] : 0;
  const lastInsertRowid = info.length > 0 ? info[0].values[0][1] : 0;
  return { changes, lastInsertRowid };
}

// Transaction helper
function transaction(fn) {
  db.run('BEGIN TRANSACTION');
  try {
    const result = fn();
    db.run('COMMIT');
    saveDb();
    return result;
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
}

module.exports = { initDb, getDb, saveDb, allRows, getRow, runSql, transaction };
