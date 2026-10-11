// src/services/menuService.js
const { allRows, getRow, runSql, saveDb } = require('../db');

function getAllCategories() {
  return allRows('SELECT * FROM categories ORDER BY name');
}

function createCategory(name) {
  if (!name || !name.trim()) {
    throw Object.assign(new Error('Category name is required'), { status: 400 });
  }
  const existing = getRow('SELECT id FROM categories WHERE name = ?', [name.trim()]);
  if (existing) {
    throw Object.assign(new Error('Category already exists'), { status: 409 });
  }
  const { lastInsertRowid } = runSql('INSERT INTO categories (name) VALUES (?)', [name.trim()]);
  saveDb();
  return getRow('SELECT * FROM categories WHERE id = ?', [lastInsertRowid]);
}

function getMenuItems() {
  return allRows(`
    SELECT mi.*, c.name as category_name
    FROM menu_items mi
    JOIN categories c ON mi.category_id = c.id
    ORDER BY c.name, mi.name
  `);
}

function getMenuItemsByCategory() {
  const items = allRows(`
    SELECT mi.*, c.name as category_name
    FROM menu_items mi
    JOIN categories c ON mi.category_id = c.id
    WHERE mi.is_available = 1
    ORDER BY c.name, mi.name
  `);
  const grouped = {};
  for (const item of items) {
    if (!grouped[item.category_name]) {
      grouped[item.category_name] = [];
    }
    grouped[item.category_name].push(item);
  }
  return grouped;
}

function getMenuItem(id) {
  const item = getRow(`
    SELECT mi.*, c.name as category_name
    FROM menu_items mi
    JOIN categories c ON mi.category_id = c.id
    WHERE mi.id = ?
  `, [id]);
  if (!item) {
    throw Object.assign(new Error('Menu item not found'), { status: 404 });
  }
  return item;
}

function createMenuItem({ category_id, name, price_paise }) {
  if (!name || !name.trim()) {
    throw Object.assign(new Error('Item name is required'), { status: 400 });
  }
  if (!price_paise || price_paise <= 0) {
    throw Object.assign(new Error('Price must be greater than 0'), { status: 400 });
  }
  if (!category_id) {
    throw Object.assign(new Error('Category is required'), { status: 400 });
  }
  const cat = getRow('SELECT id FROM categories WHERE id = ?', [category_id]);
  if (!cat) {
    throw Object.assign(new Error('Category not found'), { status: 404 });
  }
  const { lastInsertRowid } = runSql(
    'INSERT INTO menu_items (category_id, name, price_paise) VALUES (?, ?, ?)',
    [category_id, name.trim(), Math.round(price_paise)]
  );
  saveDb();
  return getMenuItem(lastInsertRowid);
}

function updateMenuItem(id, { category_id, name, price_paise, is_available }) {
  const existing = getMenuItem(id);
  if (name !== undefined && (!name || !name.trim())) {
    throw Object.assign(new Error('Item name is required'), { status: 400 });
  }
  if (price_paise !== undefined && price_paise <= 0) {
    throw Object.assign(new Error('Price must be greater than 0'), { status: 400 });
  }
  if (category_id !== undefined) {
    const cat = getRow('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (!cat) {
      throw Object.assign(new Error('Category not found'), { status: 404 });
    }
  }

  const finalName = name !== undefined ? name.trim() : existing.name;
  const finalPrice = price_paise !== undefined ? Math.round(price_paise) : existing.price_paise;
  const finalCat = category_id !== undefined ? category_id : existing.category_id;
  const finalAvail = is_available !== undefined ? (is_available ? 1 : 0) : existing.is_available;

  runSql(
    'UPDATE menu_items SET category_id = ?, name = ?, price_paise = ?, is_available = ? WHERE id = ?',
    [finalCat, finalName, finalPrice, finalAvail, id]
  );
  saveDb();
  return getMenuItem(id);
}

function deleteMenuItem(id) {
  getMenuItem(id); // ensure exists
  // Check if the item has been ordered
  const ordered = getRow('SELECT id FROM order_items WHERE menu_item_id = ? LIMIT 1', [id]);
  if (ordered) {
    throw Object.assign(
      new Error('Cannot delete item that has been ordered. Deactivate it instead.'),
      { status: 409 }
    );
  }
  runSql('DELETE FROM menu_items WHERE id = ?', [id]);
  saveDb();
}

module.exports = {
  getAllCategories,
  createCategory,
  getMenuItems,
  getMenuItemsByCategory,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
