// tests/app.test.js
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

// Set up a test database path before requiring db module
const TEST_DB_PATH = path.join(__dirname, '..', 'test_restaurant.db');

// We need to adjust the DB path for testing
// The simplest approach: override the module, reinit each time

let db;
let menuService;
let tableService;
let orderService;
let settingsService;

async function initTestDb() {
  // Remove old test db
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  // Patch the db module to use test path
  const dbModule = require('../src/db');

  // We need to re-init. Since db.js caches, we clear the module cache:
  delete require.cache[require.resolve('../src/db')];
  delete require.cache[require.resolve('../src/services/menuService')];
  delete require.cache[require.resolve('../src/services/tableService')];
  delete require.cache[require.resolve('../src/services/orderService')];
  delete require.cache[require.resolve('../src/services/settingsService')];

  // Monkey-patch DB_PATH
  const dbMod = require('../src/db');
  // We'll set env or modify before init
  // Actually let's just use the existing path and clean up after
  // The db module uses a hardcoded path — let's init then cleanup
  await dbMod.initDb();

  menuService = require('../src/services/menuService');
  tableService = require('../src/services/tableService');
  orderService = require('../src/services/orderService');
  settingsService = require('../src/services/settingsService');

  return dbMod;
}

describe('Restaurant Billing System Tests', async () => {
  let dbMod;

  before(async () => {
    // Remove any existing db to get fresh seed
    const mainDbPath = path.join(__dirname, '..', 'restaurant.db');
    if (fs.existsSync(mainDbPath)) {
      fs.unlinkSync(mainDbPath);
    }
    dbMod = await initTestDb();
  });

  after(() => {
    // Clean up
    const mainDbPath = path.join(__dirname, '..', 'restaurant.db');
    if (fs.existsSync(mainDbPath)) {
      fs.unlinkSync(mainDbPath);
    }
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('Settings', () => {
    it('should have default settings', () => {
      const settings = settingsService.getAll();
      assert.equal(settings.tax_percent, '5');
      assert.equal(settings.service_charge_percent, '0');
      assert.equal(settings.restaurant_name, 'My Restaurant');
    });

    it('should validate tax_percent range', () => {
      assert.throws(() => settingsService.update({ tax_percent: -1 }), /between 0 and 100/);
      assert.throws(() => settingsService.update({ tax_percent: 101 }), /between 0 and 100/);
    });

    it('should update settings', () => {
      const updated = settingsService.update({ tax_percent: '10', service_charge_percent: '5' });
      assert.equal(updated.tax_percent, '10');
      assert.equal(updated.service_charge_percent, '5');
      // Reset to defaults for other tests
      settingsService.update({ tax_percent: '5', service_charge_percent: '0' });
    });
  });

  describe('Menu', () => {
    it('should have seeded menu items', () => {
      const items = menuService.getMenuItems();
      assert.ok(items.length > 0, 'Should have seeded items');
    });

    it('should have seeded categories', () => {
      const cats = menuService.getAllCategories();
      assert.ok(cats.length >= 5, 'Should have at least 5 categories');
    });

    it('should validate item name is required', () => {
      assert.throws(() => menuService.createMenuItem({ category_id: 1, name: '', price_paise: 100 }), /name is required/);
    });

    it('should validate price > 0', () => {
      assert.throws(() => menuService.createMenuItem({ category_id: 1, name: 'Test', price_paise: 0 }), /greater than 0/);
      assert.throws(() => menuService.createMenuItem({ category_id: 1, name: 'Test', price_paise: -100 }), /greater than 0/);
    });

    it('should create and get a menu item', () => {
      const item = menuService.createMenuItem({ category_id: 1, name: 'Test Item', price_paise: 15000 });
      assert.ok(item.id);
      assert.equal(item.name, 'Test Item');
      assert.equal(item.price_paise, 15000);
      assert.equal(item.is_available, 1);
    });

    it('should toggle availability', () => {
      const items = menuService.getMenuItems();
      const item = items[0];
      const updated = menuService.updateMenuItem(item.id, { is_available: false });
      assert.equal(updated.is_available, 0);
      // Re-enable
      menuService.updateMenuItem(item.id, { is_available: true });
    });
  });

  describe('Tables', () => {
    it('should have seeded tables', () => {
      const tables = tableService.getAllTables();
      assert.ok(tables.length >= 8, 'Should have seeded tables');
    });

    it('should create a table', () => {
      const table = tableService.createTable('VIP Booth');
      assert.ok(table.id);
      assert.equal(table.name, 'VIP Booth');
      assert.equal(table.status, 'free');
    });

    it('should not allow duplicate table names', () => {
      assert.throws(() => tableService.createTable('VIP Booth'), /already exists/);
    });

    it('should rename a table', () => {
      const tables = tableService.getAllTables();
      const table = tables[tables.length - 1];
      const updated = tableService.updateTable(table.id, 'Renamed Table');
      assert.equal(updated.name, 'Renamed Table');
    });
  });

  describe('Orders & Totals', () => {
    let orderId;
    let tableId;

    before(() => {
      // Create a fresh table for testing
      const table = tableService.createTable('Test Order Table');
      tableId = table.id;
    });

    it('should create an order for a free table', () => {
      const order = orderService.createOrder(tableId);
      assert.ok(order.id);
      assert.equal(order.status, 'open');
      assert.equal(order.table_id, tableId);
      orderId = order.id;
    });

    it('should not create duplicate order for same table', () => {
      assert.throws(() => orderService.createOrder(tableId), /already has an open order/);
    });

    it('should add item to order and mark table occupied', () => {
      const items = menuService.getMenuItems();
      const availItem = items.find(i => i.is_available);
      const result = orderService.addItem(orderId, { menu_item_id: availItem.id, quantity: 2 });
      assert.ok(result.items.length > 0);

      // Table should be occupied
      const table = tableService.getTable(tableId);
      assert.equal(table.status, 'occupied');
    });

    it('should merge quantity when re-adding same item', () => {
      const items = menuService.getMenuItems();
      const availItem = items.find(i => i.is_available);
      const order = orderService.getOrderWithItems(orderId);
      const existingItem = order.items.find(i => i.menu_item_id === availItem.id);
      const oldQty = existingItem ? existingItem.quantity : 0;

      const result = orderService.addItem(orderId, { menu_item_id: availItem.id, quantity: 1 });
      const updatedItem = result.items.find(i => i.menu_item_id === availItem.id);
      assert.equal(updatedItem.quantity, oldQty + 1, 'Quantity should merge');
    });

    it('should not add unavailable items', () => {
      const items = menuService.getMenuItems();
      const item = items[0];
      // Make it unavailable
      menuService.updateMenuItem(item.id, { is_available: false });
      assert.throws(() => orderService.addItem(orderId, { menu_item_id: item.id, quantity: 1 }), /not available/);
      // Restore
      menuService.updateMenuItem(item.id, { is_available: true });
    });

    it('should calculate totals correctly (tax 5%, no service charge)', () => {
      const order = orderService.getOrderWithItems(orderId);
      let expectedSubtotal = 0;
      for (const item of order.items) {
        expectedSubtotal += item.unit_price_paise * item.quantity;
      }
      assert.equal(order.subtotal_paise, expectedSubtotal, 'Subtotal should match');

      const expectedTax = Math.round(expectedSubtotal * 5 / 100);
      assert.equal(order.tax_paise, expectedTax, 'Tax should be 5% of subtotal');

      assert.equal(order.service_charge_paise, 0, 'Service charge should be 0');
      assert.equal(order.total_paise, expectedSubtotal + expectedTax, 'Total should be subtotal + tax');
    });

    it('should calculate totals with service charge', () => {
      settingsService.update({ service_charge_percent: '10' });
      // Recalc
      orderService.recalcOrderTotals(orderId);
      const order = orderService.getOrderWithItems(orderId);

      const expectedSc = Math.round(order.subtotal_paise * 10 / 100);
      assert.equal(order.service_charge_paise, expectedSc, 'Service charge should be 10% of subtotal');

      settingsService.update({ service_charge_percent: '0' });
      orderService.recalcOrderTotals(orderId);
    });

    it('should apply discount and cap at subtotal', () => {
      const order = orderService.getOrderWithItems(orderId);
      const hugDiscount = order.subtotal_paise + 100000;

      const result = orderService.setDiscount(orderId, { discount_paise: hugDiscount });
      assert.equal(result.discount_paise, order.subtotal_paise, 'Discount capped at subtotal');
      assert.equal(result.total_paise >= 0, true, 'Total should not be negative');

      // Reset discount
      orderService.setDiscount(orderId, { discount_paise: 0 });
    });

    it('should apply percent discount', () => {
      const result = orderService.setDiscount(orderId, { discount_percent: 10 });
      const order = orderService.getOrderWithItems(orderId);
      const expectedDiscount = Math.round(order.subtotal_paise * 10 / 100);
      assert.equal(order.discount_paise, expectedDiscount, 'Discount should be 10%');

      // Reset
      orderService.setDiscount(orderId, { discount_paise: 0 });
    });

    it('should round consistently to paise (integers)', () => {
      settingsService.update({ tax_percent: '18' });
      // Add an item with an awkward price
      const item = menuService.createMenuItem({ category_id: 1, name: 'Rounding Test', price_paise: 333 });
      orderService.addItem(orderId, { menu_item_id: item.id, quantity: 3 });
      const order = orderService.getOrderWithItems(orderId);

      // All values should be integers
      assert.equal(Number.isInteger(order.subtotal_paise), true, 'Subtotal should be integer');
      assert.equal(Number.isInteger(order.tax_paise), true, 'Tax should be integer');
      assert.equal(Number.isInteger(order.total_paise), true, 'Total should be integer');

      settingsService.update({ tax_percent: '5' });
      orderService.recalcOrderTotals(orderId);
    });

    it('should not pay an empty order', () => {
      // Create a new order with no items
      const emptyTable = tableService.createTable('Empty Order Table');
      const emptyOrder = orderService.createOrder(emptyTable.id);
      assert.throws(() => orderService.payOrder(emptyOrder.id, 'cash'), /empty order/);
      // Clean up
      orderService.cancelOrder(emptyOrder.id);
    });

    it('should pay order and free table', () => {
      const result = orderService.payOrder(orderId, 'card');
      assert.equal(result.status, 'paid');
      assert.equal(result.payment_method, 'card');

      // Table should be free
      const table = tableService.getTable(tableId);
      assert.equal(table.status, 'free');
    });

    it('should not modify paid order', () => {
      const items = menuService.getMenuItems();
      assert.throws(
        () => orderService.addItem(orderId, { menu_item_id: items[0].id, quantity: 1 }),
        /Cannot modify/
      );
    });

    it('should not pay a paid order again', () => {
      assert.throws(() => orderService.payOrder(orderId, 'cash'), /already paid/);
    });
  });

  describe('Table status transitions', () => {
    it('should transition free -> occupied when item added', () => {
      const table = tableService.createTable('Status Test Table');
      assert.equal(table.status, 'free');

      const order = orderService.createOrder(table.id);
      const items = menuService.getMenuItems();
      const avail = items.find(i => i.is_available);
      orderService.addItem(order.id, { menu_item_id: avail.id, quantity: 1 });

      const updatedTable = tableService.getTable(table.id);
      assert.equal(updatedTable.status, 'occupied');

      // Pay to free
      orderService.payOrder(order.id, 'upi');
      const freedTable = tableService.getTable(table.id);
      assert.equal(freedTable.status, 'free');
    });

    it('should not delete occupied table', () => {
      const table = tableService.createTable('Occupied Delete Test');
      const order = orderService.createOrder(table.id);
      const items = menuService.getMenuItems();
      const avail = items.find(i => i.is_available);
      orderService.addItem(order.id, { menu_item_id: avail.id, quantity: 1 });

      assert.throws(() => tableService.deleteTable(table.id), /occupied|open order/);

      // Clean up
      orderService.payOrder(order.id, 'cash');
    });
  });

  describe('Daily Report', () => {
    it('should return report for today', () => {
      const today = new Date().toISOString().split('T')[0];
      const report = orderService.getDailyReport(today);
      assert.ok(report.total_bills >= 0);
      assert.ok(report.total_sales_paise >= 0);
      assert.ok(report.breakdown);
      assert.ok(Array.isArray(report.top_items));
    });

    it('should validate date format', () => {
      assert.throws(() => orderService.getDailyReport('invalid'), /YYYY-MM-DD/);
    });

    it('should include paid orders in report numbers', () => {
      const today = new Date().toISOString().split('T')[0];
      const report = orderService.getDailyReport(today);
      // We paid at least 2 orders above (main order + status test)
      assert.ok(report.total_bills >= 2, `Expected at least 2 bills, got ${report.total_bills}`);
      assert.ok(report.total_sales_paise > 0, 'Sales should be > 0');
    });
  });

  describe('Menu deletion rules', () => {
    it('should delete item never ordered', () => {
      const item = menuService.createMenuItem({ category_id: 1, name: 'Deletable Item', price_paise: 5000 });
      menuService.deleteMenuItem(item.id); // Should not throw
      assert.throws(() => menuService.getMenuItem(item.id), /not found/);
    });

    it('should not delete item that has been ordered', () => {
      // Find an item that was used in orders
      const items = menuService.getMenuItems();
      const orderedItem = items.find(i => {
        try {
          const row = dbMod.getRow('SELECT id FROM order_items WHERE menu_item_id = ? LIMIT 1', [i.id]);
          return !!row;
        } catch (e) {
          return false;
        }
      });
      if (orderedItem) {
        assert.throws(() => menuService.deleteMenuItem(orderedItem.id), /Deactivate/);
      }
    });
  });
});
