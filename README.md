# Restaurant Billing & Management System

A robust, lightweight, and bug-free Restaurant Billing & Management System built with Node.js, Express, SQLite, and vanilla HTML/CSS/JavaScript.

---

## 🛠 Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite via `sql.js` (WebAssembly/Pure JavaScript SQLite engine saving directly to `restaurant.db` on disk, eliminating native build/compiler dependencies on any platform/Node version)
- **Frontend**: Plain HTML5, CSS3, and vanilla JavaScript served from `/public` (no build step, no framework overhead)
- **Testing**: Built-in Node test runner (`node --test`) without external testing dependencies

---

## ✨ Features

1. **Table Management**:
   - Visual grid of tables color-coded by status (Green: Free, Orange: Occupied).
   - Add new dining tables, rename existing tables, and delete tables (deletion blocked if occupied or has active orders).
2. **Menu Management**:
   - Categorized menu display (Starters, Main Course, Breads, Beverages, Desserts).
   - Add new categories and menu items with validation (name required, price > 0).
   - Edit menu items and toggle availability status.
   - Safe deletion rules: items that have historical order records cannot be deleted (only deactivated).
3. **Order Taking & POS**:
   - Select any table to open/view its active order.
   - Filter menu items by name in real-time.
   - Add items with quantities and custom kitchen notes.
   - Re-adding an existing item automatically merges quantities instead of creating duplicate line items.
   - Increment, decrement, and remove items with responsive controls.
   - Table status automatically transitions to occupied when the first item is added, and returns to free when cleared or paid.
4. **Totals & Calculations**:
   - Server-side calculation on every mutation: subtotal, discount, tax, service charge, grand total.
   - All financial calculations stored and rounded as integer paise (currency formatted in UI).
   - Flat discount or percentage discount with an automatic cap ensuring discounts never exceed the subtotal.
5. **Billing & Payments**:
   - Formatted printable receipt bill view (restaurant name, table, itemized lines, taxes, service charges, grand total, timestamps).
   - Multi-method payment collection: Cash, Card, UPI.
   - Closing order automatically marks it as paid, records payment timestamp & method, and frees the table.
   - Modification of paid or closed orders is strictly blocked.
6. **Daily Sales Reports**:
   - Date picker to view daily analytics.
   - Total bills issued, gross sales revenue, payment method breakdown (Cash, Card, UPI), and Top 5 items ranked by quantity sold.
7. **Settings**:
   - Configure restaurant name, tax percentage (0–100%), and service charge percentage (0–100%).
   - Inputs validated on both client and server.

---

## 🏗 Architecture & Project Structure

```
Restaurant/
├── public/                  # Static frontend files
│   ├── index.html           # Single-page application HTML
│   ├── style.css            # Dark theme responsive styling & print layout
│   └── app.js               # Client state, API client, and DOM manipulation
├── src/
│   ├── db.js                # SQLite database setup, schema migration, seed logic, export
│   ├── server.js            # Express server configuration and routing
│   ├── routes/
│   │   ├── menuRoutes.js    # Routes for menu items and categories
│   │   ├── tableRoutes.js   # Routes for table management
│   │   ├── orderRoutes.js   # Routes for orders, line items, payments, bills, reports
│   │   └── settingsRoutes.js# Routes for restaurant configuration
│   └── services/
│       ├── menuService.js   # Menu CRUD, availability toggle, and delete restrictions
│       ├── tableService.js  # Table CRUD, status transitions
│       ├── orderService.js  # Order calculations, transaction writes, payment, reporting
│       └── settingsService.js# Settings persistence and validation
├── tests/
│   └── app.test.js          # Unit and integration test suite (Node built-in runner)
├── .gitignore               # Excludes node_modules and restaurant.db
├── package.json
└── README.md
```

---

## 🗄 Database Schema

The SQLite schema is automatically created on first boot (`restaurant.db`):

- **`categories`** (`id`, `name`)
- **`menu_items`** (`id`, `category_id`, `name`, `price_paise`, `is_available`, `created_at`)
- **`tables`** (`id`, `name`, `status`, `created_at`)
- **`orders`** (`id`, `table_id`, `status`, `subtotal_paise`, `discount_paise`, `tax_paise`, `service_charge_paise`, `total_paise`, `payment_method`, `created_at`, `closed_at`)
- **`order_items`** (`id`, `order_id`, `menu_item_id`, `item_name`, `unit_price_paise`, `quantity`, `notes`, `status`, `created_at`)
- **`settings`** (`key`, `value`)

---

## 🚀 How to Run

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start the server**:
   ```bash
   npm start
   ```
3. **Open the browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

4. **Run the test suite**:
   ```bash
   npm test
   ```

---

## 🌱 Demo Seed Information

On startup, if the menu is empty, the database automatically seeds:
- 5 Categories: Starters, Main Course, Breads, Beverages, Desserts
- 20 Popular Restaurant Menu Items with authentic pricing in paise
- 8 Dining Tables (`Table 1` through `Table 8`)
- Default settings: `tax_percent: 5`, `service_charge_percent: 0`, `restaurant_name: "My Restaurant"`

---

## ⚠️ Known Issues / Platform Notes

- On environments running bleeding-edge Node.js (e.g., Node v24 on Windows without Python / C++ build tools installed), native addon packages like `better-sqlite3` fail compiling via `node-gyp`. To guarantee 100% platform stability and zero native build failures without sacrificing SQLite file persistence, the database engine uses WebAssembly-backed SQLite (`sql.js`), which persists to the identical `restaurant.db` file with full ACID transaction safety.

---

## 🔮 What to Add Next

1. **Kitchen Order Ticket (KOT) Generation**: Printing dedicated slips for kitchen prep stations with timestamps and table identifiers.
2. **Role-Based Access Control & User Login**: Separate PIN or password logins for Waiters, Cashiers, Kitchen Staff, and Managers.
3. **Split Billing & Item Transfers**: Splitting a table bill evenly or by selected items, and moving items or entire orders between tables.
4. **Inventory & Stock Tracking**: Deducting ingredient counts per recipe upon order payment and low-stock alerts.
5. **Customer Loyalty & CRM**: Phone number lookup, dining history, and points accrual.
