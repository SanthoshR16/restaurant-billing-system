// public/app.js — BistroFlow Restaurant Management Application
(function () {
  'use strict';

  // ===== SVG Icons (Lucide-style inline icons, zero emojis) =====
  const ICONS = {
    check: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    alert: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    close: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    moreVertical: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>`,
    edit: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`,
    trash: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
    clock: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    cash: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>`,
    card: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
    upi: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>`,
    utensils: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`,
    tables: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`,
    plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>`
  };

  // ===== Currency & Utility Helpers =====
  function formatPaise(paise) {
    if (typeof paise !== 'number' || isNaN(paise)) return '₹0.00';
    return '₹' + (paise / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function escHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function getElapsedMinutes(isoString) {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Active';
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const remMins = diffMins % 60;
    return `${hours}h ${remMins}m`;
  }

  // ===== Toast Notifications =====
  const toastContainer = document.getElementById('toast-container');

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconSvg = type === 'success' ? ICONS.check : ICONS.alert;

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-msg">${escHtml(message)}</div>
      <button class="toast-close" aria-label="Close notification">${ICONS.close}</button>
    `;

    toastContainer.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 150);
    };

    closeBtn.addEventListener('click', dismiss);
    const timer = setTimeout(dismiss, 3200);

    toast.addEventListener('mouseenter', () => clearTimeout(timer));
    toast.addEventListener('mouseleave', () => setTimeout(dismiss, 1500));
  }

  // ===== Central API Client =====
  async function api(url, opts = {}) {
    const options = {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    };
    if (options.body && typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }
    const res = await fetch('/api' + url, options);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Server request error');
    }
    return data;
  }

  // ===== Modal Dialog System with Focus Trap & Escape Handling =====
  const modalOverlay = document.getElementById('modal-overlay');
  const modalBox = document.getElementById('modal-box');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalCloseBtn = document.getElementById('modal-close');
  let lastActiveElement = null;

  function openModal(title, bodyHtml) {
    lastActiveElement = document.activeElement;
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    modalOverlay.classList.remove('hidden');

    // Trap focus inside modal
    setTimeout(() => {
      const focusable = modalBox.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }, 50);
  }

  function closeModal() {
    modalOverlay.classList.add('hidden');
    modalBody.innerHTML = '';
    if (lastActiveElement) {
      lastActiveElement.focus();
    }
  }

  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Global Escape and Tab trapping
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
      closeModal();
    }
    if (e.key === 'Tab' && !modalOverlay.classList.contains('hidden')) {
      const focusables = modalBox.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)');
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  });

  function showConfirmDialog({ title, message, confirmText = 'Confirm', confirmClass = 'btn-danger', onConfirm }) {
    openModal(title, `
      <p style="color:var(--text-muted);font-size:0.95rem;line-height:1.5;">${escHtml(message)}</p>
      <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:0.75rem;">
        <button class="btn btn-secondary" id="confirm-cancel-btn">Cancel</button>
        <button class="btn ${confirmClass}" id="confirm-ok-btn">${escHtml(confirmText)}</button>
      </div>
    `);

    document.getElementById('confirm-cancel-btn').addEventListener('click', closeModal);
    document.getElementById('confirm-ok-btn').addEventListener('click', async () => {
      const okBtn = document.getElementById('confirm-ok-btn');
      okBtn.disabled = true;
      try {
        await onConfirm();
        closeModal();
      } catch (err) {
        showToast(err.message, 'error');
        okBtn.disabled = false;
      }
    });
  }

  // ===== Navigation =====
  const navBtns = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');

  function showPage(pageName) {
    pages.forEach(p => p.classList.remove('active'));
    navBtns.forEach(b => b.classList.remove('active'));

    const targetPage = document.getElementById('page-' + pageName);
    if (targetPage) targetPage.classList.add('active');

    const navBtn = document.querySelector(`.nav-item[data-page="${pageName}"]`);
    if (navBtn) navBtn.classList.add('active');

    // Close any open dropdowns
    closeAllDropdowns();

    if (pageName === 'tables') loadTables();
    if (pageName === 'menu') loadMenuManagement();
    if (pageName === 'reports') loadDailyReport();
    if (pageName === 'settings') loadSettings();
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
  });

  function closeAllDropdowns() {
    document.querySelectorAll('.table-dropdown.show').forEach(d => d.classList.remove('show'));
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.table-menu-container')) {
      closeAllDropdowns();
    }
  });

  // ===== Tables Page Management =====
  let tablesData = [];
  let tableOrdersMap = {}; // Cache open order details for occupied tables

  async function loadTables() {
    const grid = document.getElementById('tables-grid');
    grid.innerHTML = `
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
    `;

    try {
      tablesData = await api('/tables');
      tableOrdersMap = {};

      // Fetch open orders for occupied tables in parallel
      const occupiedTables = tablesData.filter(t => t.status === 'occupied');
      await Promise.all(
        occupiedTables.map(async t => {
          try {
            const order = await api('/orders/table/' + t.id);
            tableOrdersMap[t.id] = order;
          } catch (e) {
            // Table marked occupied but order closed/missing
          }
        })
      );

      // Also fetch today's sales report for summary strip
      updateSummaryStrip();
      renderTables();
    } catch (err) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.alert}</div>
          <h3 class="empty-title">Could not load floor tables</h3>
          <p class="empty-desc">${escHtml(err.message)}</p>
          <button class="btn btn-secondary" onclick="window.location.reload()">Retry</button>
        </div>
      `;
    }
  }

  async function updateSummaryStrip() {
    const freeCount = tablesData.filter(t => t.status === 'free').length;
    const occupiedCount = tablesData.filter(t => t.status === 'occupied').length;

    document.getElementById('summary-free-count').textContent = freeCount;
    document.getElementById('summary-occupied-count').textContent = occupiedCount;
    document.getElementById('summary-open-orders').textContent = occupiedCount;

    try {
      const today = new Date().toISOString().split('T')[0];
      const report = await api('/orders/reports/daily?date=' + today);
      document.getElementById('summary-today-sales').textContent = formatPaise(report.total_sales_paise || 0);
    } catch (e) {
      document.getElementById('summary-today-sales').textContent = '₹0.00';
    }
  }

  function renderTables() {
    const grid = document.getElementById('tables-grid');
    if (tablesData.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.tables}</div>
          <h3 class="empty-title">No tables set up yet</h3>
          <p class="empty-desc">Create your first dining table to start taking customer orders.</p>
          <button class="btn btn-primary" id="btn-empty-add-table">${ICONS.plus}<span>Add Table</span></button>
        </div>
      `;
      const btn = document.getElementById('btn-empty-add-table');
      if (btn) btn.addEventListener('click', promptAddTable);
      return;
    }

    grid.innerHTML = tablesData.map(table => {
      const isOccupied = table.status === 'occupied';
      const order = tableOrdersMap[table.id];

      let orderItemCount = 0;
      let orderTotal = 0;
      let orderElapsed = 'Active';

      if (isOccupied && order) {
        orderItemCount = (order.items || []).reduce((sum, item) => sum + item.quantity, 0);
        orderTotal = order.total_paise || 0;
        orderElapsed = getElapsedMinutes(order.created_at);
      }

      return `
        <div class="table-card ${table.status}" data-id="${table.id}" role="button" tabindex="0">
          <div class="table-card-top">
            <div class="table-title-area">
              <span class="table-name">${escHtml(table.name)}</span>
              <span class="table-status-pill ${table.status}">
                <span class="status-dot"></span>
                <span>${isOccupied ? 'Occupied' : 'Available'}</span>
              </span>
            </div>
            <div class="table-menu-container">
              <button class="table-menu-trigger" data-id="${table.id}" aria-label="Table options">
                ${ICONS.moreVertical}
              </button>
              <div class="table-dropdown" id="dropdown-${table.id}">
                <button class="dropdown-item rename-table-btn" data-id="${table.id}">
                  ${ICONS.edit}<span>Rename Table</span>
                </button>
                <button class="dropdown-item danger delete-table-btn" data-id="${table.id}">
                  ${ICONS.trash}<span>Delete Table</span>
                </button>
              </div>
            </div>
          </div>

          <div class="table-card-body">
            ${isOccupied ? `
              <div class="occupied-meta">
                <div>
                  <div class="running-amount">${formatPaise(orderTotal)}</div>
                  <div class="running-items">${orderItemCount} item${orderItemCount === 1 ? '' : 's'}</div>
                </div>
                <div class="running-time">
                  ${ICONS.clock}<span>${orderElapsed}</span>
                </div>
              </div>
            ` : `
              <div class="free-meta">
                <span>Tap to start a new dining ticket</span>
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');

    // Attach card event listeners
    grid.querySelectorAll('.table-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.table-menu-container')) return;
        const id = Number(card.dataset.id);
        const table = tablesData.find(t => t.id === id);
        if (table) openOrderForTable(table.id, table.status);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.closest('.table-menu-container')) return;
          e.preventDefault();
          const id = Number(card.dataset.id);
          const table = tablesData.find(t => t.id === id);
          if (table) openOrderForTable(table.id, table.status);
        }
      });
    });

    // Overflow menu triggers
    grid.querySelectorAll('.table-menu-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const dropdown = document.getElementById('dropdown-' + id);
        const isOpen = dropdown.classList.contains('show');
        closeAllDropdowns();
        if (!isOpen) dropdown.classList.add('show');
      });
    });

    // Rename actions
    grid.querySelectorAll('.rename-table-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        promptRenameTable(Number(btn.dataset.id));
      });
    });

    // Delete actions
    grid.querySelectorAll('.delete-table-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        promptDeleteTable(Number(btn.dataset.id));
      });
    });
  }

  function promptAddTable() {
    openModal('Add Dining Table', `
      <div class="form-group">
        <label for="new-table-name" class="form-label">Table Name / Number</label>
        <input type="text" id="new-table-name" class="input" placeholder="e.g. Table 9 or Patio 2" autocomplete="off">
        <span class="field-error" id="modal-table-error"></span>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:0.75rem;">
        <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
        <button class="btn btn-primary" id="modal-create-table-btn">Create Table</button>
      </div>
    `);

    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    document.getElementById('modal-create-table-btn').addEventListener('click', async () => {
      const nameInput = document.getElementById('new-table-name');
      const errEl = document.getElementById('modal-table-error');
      const btn = document.getElementById('modal-create-table-btn');

      const name = nameInput.value.trim();
      if (!name) {
        errEl.textContent = 'Table name is required';
        nameInput.focus();
        return;
      }

      btn.disabled = true;
      try {
        await api('/tables', { method: 'POST', body: { name } });
        showToast(`Table "${name}" created successfully`);
        closeModal();
        loadTables();
      } catch (err) {
        errEl.textContent = err.message;
        btn.disabled = false;
      }
    });
  }

  document.getElementById('btn-add-table').addEventListener('click', promptAddTable);

  function promptRenameTable(id) {
    const table = tablesData.find(t => t.id === id);
    if (!table) return;

    openModal(`Rename ${table.name}`, `
      <div class="form-group">
        <label for="rename-table-input" class="form-label">New Table Name</label>
        <input type="text" id="rename-table-input" class="input" value="${escHtml(table.name)}" autocomplete="off">
        <span class="field-error" id="modal-rename-error"></span>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:0.75rem;">
        <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
        <button class="btn btn-primary" id="modal-save-rename-btn">Save Name</button>
      </div>
    `);

    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    document.getElementById('modal-save-rename-btn').addEventListener('click', async () => {
      const input = document.getElementById('rename-table-input');
      const errEl = document.getElementById('modal-rename-error');
      const btn = document.getElementById('modal-save-rename-btn');

      const name = input.value.trim();
      if (!name) {
        errEl.textContent = 'Table name is required';
        input.focus();
        return;
      }

      btn.disabled = true;
      try {
        await api('/tables/' + id, { method: 'PUT', body: { name } });
        showToast('Table renamed successfully');
        closeModal();
        loadTables();
      } catch (err) {
        errEl.textContent = err.message;
        btn.disabled = false;
      }
    });
  }

  function promptDeleteTable(id) {
    const table = tablesData.find(t => t.id === id);
    if (!table) return;

    showConfirmDialog({
      title: `Delete ${table.name}?`,
      message: `Are you sure you want to delete ${table.name}? This action cannot be undone.`,
      confirmText: 'Delete Table',
      onConfirm: async () => {
        await api('/tables/' + id, { method: 'DELETE' });
        showToast(`${table.name} deleted`);
        loadTables();
      }
    });
  }

  // ===== Order / POS Page Management =====
  let currentOrder = null;
  let orderMenuGrouped = {};
  let selectedOrderCategory = 'All';
  let orderSearchQuery = '';

  async function openOrderForTable(tableId) {
    try {
      // First check if an open order already exists
      try {
        currentOrder = await api('/orders/table/' + tableId);
      } catch (e) {
        // No open order, create one
        currentOrder = await api('/orders', {
          method: 'POST',
          body: { table_id: tableId }
        });
      }

      displayOrderScreen();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function displayOrderScreen() {
    pages.forEach(p => p.classList.remove('active'));
    navBtns.forEach(b => b.classList.remove('active'));
    document.getElementById('page-order').classList.add('active');

    const tableName = currentOrder.table ? currentOrder.table.name : 'Table';
    document.getElementById('order-title').textContent = tableName;
    document.getElementById('order-subtitle').textContent = `Order #${currentOrder.id} • Opened ${getElapsedMinutes(currentOrder.created_at)}`;

    const statusBadge = document.getElementById('order-status-badge');
    statusBadge.textContent = currentOrder.status.toUpperCase();
    statusBadge.className = `order-status-badge ${currentOrder.status}`;

    loadOrderMenu();
    renderOrderTicket();

    // Enable / disable buttons based on status
    const isPaid = currentOrder.status !== 'open';
    document.getElementById('btn-print-bill').disabled = false;
    document.getElementById('btn-take-payment').disabled = isPaid;
    document.getElementById('btn-cancel-order').disabled = isPaid;
    document.getElementById('discount-input').disabled = isPaid;
    document.getElementById('btn-apply-discount').disabled = isPaid;
  }

  document.getElementById('btn-back-tables').addEventListener('click', () => {
    currentOrder = null;
    showPage('tables');
  });

  async function loadOrderMenu() {
    const listEl = document.getElementById('order-menu-list');
    listEl.innerHTML = `<div class="skeleton skeleton-card" style="grid-column:1/-1;"></div>`;

    try {
      orderMenuGrouped = await api('/menu/grouped');
      renderOrderCategoryChips();
      renderOrderMenuGrid();
    } catch (err) {
      listEl.innerHTML = `<div class="empty-state"><p>${escHtml(err.message)}</p></div>`;
    }
  }

  function renderOrderCategoryChips() {
    const container = document.getElementById('order-category-chips');
    const categories = ['All', ...Object.keys(orderMenuGrouped)];

    container.innerHTML = categories.map(cat => `
      <button class="chip-btn ${cat === selectedOrderCategory ? 'active' : ''}" data-cat="${escHtml(cat)}">
        ${escHtml(cat)}
      </button>
    `).join('');

    container.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedOrderCategory = btn.dataset.cat;
        renderOrderCategoryChips();
        renderOrderMenuGrid();
      });
    });
  }

  function renderOrderMenuGrid() {
    const container = document.getElementById('order-menu-list');
    const query = orderSearchQuery.toLowerCase();
    let allMatching = [];

    for (const [catName, items] of Object.entries(orderMenuGrouped)) {
      if (selectedOrderCategory !== 'All' && selectedOrderCategory !== catName) continue;
      for (const item of items) {
        if (!query || item.name.toLowerCase().includes(query)) {
          allMatching.push(item);
        }
      }
    }

    if (allMatching.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-icon">${ICONS.utensils}</div>
          <h3 class="empty-title">No dishes found</h3>
          <p class="empty-desc">Try another category or clear the search filter.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = allMatching.map(item => `
      <div class="dish-card" data-id="${item.id}" role="button" tabindex="0">
        <div>
          <div class="dish-name">${escHtml(item.name)}</div>
          <span class="dish-category">${escHtml(item.category_name || '')}</span>
        </div>
        <div class="dish-footer">
          <span class="dish-price">${formatPaise(item.price_paise)}</span>
          <div class="dish-add-btn" title="Add to ticket">${ICONS.plus}</div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.dish-card').forEach(card => {
      const addItemAction = async () => {
        if (!currentOrder || currentOrder.status !== 'open') return;
        const itemId = Number(card.dataset.id);
        try {
          currentOrder = await api(`/orders/${currentOrder.id}/items`, {
            method: 'POST',
            body: { menu_item_id: itemId, quantity: 1 }
          });
          renderOrderTicket();
        } catch (err) {
          showToast(err.message, 'error');
        }
      };

      card.addEventListener('click', addItemAction);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          addItemAction();
        }
      });
    });
  }

  document.getElementById('menu-search').addEventListener('input', (e) => {
    orderSearchQuery = e.target.value.trim();
    renderOrderMenuGrid();
  });

  function renderOrderTicket() {
    const listContainer = document.getElementById('order-items-list');
    const items = currentOrder.items || [];
    const isPaid = currentOrder.status !== 'open';

    const totalItemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    document.getElementById('ticket-item-count').textContent = `${totalItemCount} item${totalItemCount === 1 ? '' : 's'}`;

    if (items.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align:center;padding:2.5rem 1rem;color:var(--text-muted);">
          <div style="margin-bottom:0.5rem;opacity:0.5;">${ICONS.utensils}</div>
          <p style="font-weight:500;">Ticket is empty</p>
          <p style="font-size:0.8rem;margin-top:0.25rem;">Select dishes from the menu to add to this order.</p>
        </div>
      `;
    } else {
      listContainer.innerHTML = items.map(item => `
        <div class="ticket-item-row" data-id="${item.id}">
          <div class="ticket-item-main">
            <div class="ticket-item-info">
              <div class="ticket-item-name">${escHtml(item.item_name)}</div>
              <div class="ticket-item-unit">${formatPaise(item.unit_price_paise)} each</div>
            </div>

            <div class="ticket-stepper">
              <button class="stepper-btn dec-qty-btn" data-id="${item.id}" ${isPaid ? 'disabled' : ''} aria-label="Decrease quantity">−</button>
              <span class="stepper-value">${item.quantity}</span>
              <button class="stepper-btn inc-qty-btn" data-id="${item.id}" ${isPaid ? 'disabled' : ''} aria-label="Increase quantity">+</button>
            </div>

            <div class="ticket-item-price">${formatPaise(item.unit_price_paise * item.quantity)}</div>

            <button class="ticket-item-delete del-item-btn" data-id="${item.id}" ${isPaid ? 'disabled' : ''} aria-label="Remove item">
              ${ICONS.trash}
            </button>
          </div>

          ${item.notes ? `<div class="ticket-item-notes">Note: ${escHtml(item.notes)}</div>` : ''}
        </div>
      `).join('');

      // Stepper and delete listeners
      listContainer.querySelectorAll('.inc-qty-btn').forEach(btn => {
        btn.addEventListener('click', () => changeItemQuantity(Number(btn.dataset.id), 1));
      });
      listContainer.querySelectorAll('.dec-qty-btn').forEach(btn => {
        btn.addEventListener('click', () => changeItemQuantity(Number(btn.dataset.id), -1));
      });
      listContainer.querySelectorAll('.del-item-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteOrderItem(Number(btn.dataset.id)));
      });
    }

    // Totals block
    renderOrderTotals();

    // Discount field value
    document.getElementById('discount-input').value = ((currentOrder.discount_paise || 0) / 100);
  }

  function renderOrderTotals() {
    const totalsEl = document.getElementById('order-totals');
    const subtotal = currentOrder.subtotal_paise || 0;
    const discount = currentOrder.discount_paise || 0;
    const tax = currentOrder.tax_paise || 0;
    const serviceCharge = currentOrder.service_charge_paise || 0;
    const grandTotal = currentOrder.total_paise || 0;

    totalsEl.innerHTML = `
      <div class="totals-line">
        <span>Subtotal</span>
        <span>${formatPaise(subtotal)}</span>
      </div>
      ${discount > 0 ? `
        <div class="totals-line" style="color:var(--danger);">
          <span>Discount Applied</span>
          <span>-${formatPaise(discount)}</span>
        </div>
      ` : ''}
      <div class="totals-line">
        <span>Tax</span>
        <span>${formatPaise(tax)}</span>
      </div>
      ${serviceCharge > 0 ? `
        <div class="totals-line">
          <span>Service Charge</span>
          <span>${formatPaise(serviceCharge)}</span>
        </div>
      ` : ''}
      <div class="totals-line grand">
        <span>Grand Total</span>
        <span>${formatPaise(grandTotal)}</span>
      </div>
    `;
  }

  async function changeItemQuantity(orderItemId, delta) {
    if (!currentOrder || currentOrder.status !== 'open') return;
    const item = (currentOrder.items || []).find(i => i.id === orderItemId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      deleteOrderItem(orderItemId);
      return;
    }

    try {
      currentOrder = await api(`/orders/${currentOrder.id}/items/${orderItemId}`, {
        method: 'PUT',
        body: { quantity: newQty }
      });
      renderOrderTicket();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function deleteOrderItem(orderItemId) {
    if (!currentOrder || currentOrder.status !== 'open') return;
    showConfirmDialog({
      title: 'Remove item from ticket?',
      message: 'Are you sure you want to remove this dish from the current order?',
      confirmText: 'Remove Item',
      onConfirm: async () => {
        currentOrder = await api(`/orders/${currentOrder.id}/items/${orderItemId}`, {
          method: 'DELETE'
        });
        renderOrderTicket();
        showToast('Item removed from ticket');
      }
    });
  }

  // Discount Apply
  document.getElementById('btn-apply-discount').addEventListener('click', async () => {
    if (!currentOrder || currentOrder.status !== 'open') return;
    const val = parseFloat(document.getElementById('discount-input').value) || 0;
    const discountPaise = Math.max(0, Math.round(val * 100));

    try {
      currentOrder = await api(`/orders/${currentOrder.id}/discount`, {
        method: 'PUT',
        body: { discount_paise: discountPaise }
      });
      renderOrderTicket();
      showToast('Discount updated');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Print Bill
  document.getElementById('btn-print-bill').addEventListener('click', async () => {
    if (!currentOrder) return;
    try {
      const bill = await api(`/orders/${currentOrder.id}/bill`);
      renderPrintBill(bill);
      setTimeout(() => window.print(), 250);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  function renderPrintBill(bill) {
    const container = document.getElementById('bill-print');
    const now = new Date().toLocaleString('en-IN');
    const tableName = bill.table ? bill.table.name : 'Table';

    container.innerHTML = `
      <div class="bill-print-header">
        <div class="bill-print-restaurant">${escHtml(bill.restaurant_name || 'Restaurant')}</div>
        <div class="bill-print-table">${escHtml(tableName)} • Order #${bill.id}</div>
        <div class="bill-print-meta">${now}</div>
      </div>

      <table class="bill-print-table-items">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Price</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(bill.items || []).map(i => `
            <tr>
              <td>${escHtml(i.item_name)}</td>
              <td style="text-align:center;">${i.quantity}</td>
              <td style="text-align:right;">${formatPaise(i.unit_price_paise)}</td>
              <td style="text-align:right;">${formatPaise(i.unit_price_paise * i.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="bill-print-divider"></div>

      <div class="bill-print-totals">
        <div><span>Subtotal</span><span>${formatPaise(bill.subtotal_paise)}</span></div>
        ${bill.discount_paise ? `<div><span>Discount</span><span>-${formatPaise(bill.discount_paise)}</span></div>` : ''}
        <div><span>Tax (${bill.tax_percent}%)</span><span>${formatPaise(bill.tax_paise)}</span></div>
        ${bill.service_charge_paise ? `<div><span>Service Charge (${bill.service_charge_percent}%)</span><span>${formatPaise(bill.service_charge_paise)}</span></div>` : ''}
        <div class="grand"><span>Grand Total</span><span>${formatPaise(bill.total_paise)}</span></div>
      </div>

      ${bill.payment_method ? `
        <div class="bill-print-footer">
          <div>PAID VIA ${escHtml(bill.payment_method.toUpperCase())}</div>
          <div>Thank you for dining with us!</div>
        </div>
      ` : `
        <div class="bill-print-footer">
          <div>Thank you for dining with us!</div>
        </div>
      `}
    `;
  }

  // Take Payment Modal with Large Selectable Tiles
  document.getElementById('btn-take-payment').addEventListener('click', () => {
    if (!currentOrder || currentOrder.status !== 'open') return;
    if (!currentOrder.items || currentOrder.items.length === 0) {
      showToast('Cannot settle an empty order. Add items first.', 'error');
      return;
    }

    let selectedMethod = 'cash';

    openModal('Settle & Pay Bill', `
      <div style="background-color:var(--bg-muted);border-radius:var(--radius-md);padding:1rem;text-align:center;">
        <span style="font-size:0.85rem;color:var(--text-muted);display:block;">Amount Due</span>
        <span style="font-size:1.75rem;font-weight:700;color:var(--text-main);">${formatPaise(currentOrder.total_paise)}</span>
      </div>

      <div class="form-group">
        <label class="form-label">Select Payment Method</label>
        <div class="payment-tiles-grid">
          <div class="payment-tile selected" data-method="cash" tabindex="0">
            <div class="payment-tile-icon">${ICONS.cash}</div>
            <span>Cash</span>
          </div>
          <div class="payment-tile" data-method="card" tabindex="0">
            <div class="payment-tile-icon">${ICONS.card}</div>
            <span>Card</span>
          </div>
          <div class="payment-tile" data-method="upi" tabindex="0">
            <div class="payment-tile-icon">${ICONS.upi}</div>
            <span>UPI</span>
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:0.5rem;">
        <button class="btn btn-secondary" id="modal-pay-cancel">Cancel</button>
        <button class="btn btn-success" id="modal-pay-confirm">Confirm & Close Order</button>
      </div>
    `);

    const tiles = document.querySelectorAll('.payment-tile');
    tiles.forEach(tile => {
      const selectAction = () => {
        tiles.forEach(t => t.classList.remove('selected'));
        tile.classList.add('selected');
        selectedMethod = tile.dataset.method;
      };
      tile.addEventListener('click', selectAction);
      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectAction();
        }
      });
    });

    document.getElementById('modal-pay-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-pay-confirm').addEventListener('click', async () => {
      const btn = document.getElementById('modal-pay-confirm');
      btn.disabled = true;

      try {
        currentOrder = await api(`/orders/${currentOrder.id}/pay`, {
          method: 'POST',
          body: { payment_method: selectedMethod }
        });

        closeModal();
        displayOrderScreen();
        showToast(`Bill paid via ${selectedMethod.toUpperCase()}! Table is now free.`);
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
      }
    });
  });

  // Cancel Order Dialog
  document.getElementById('btn-cancel-order').addEventListener('click', () => {
    if (!currentOrder || currentOrder.status !== 'open') return;

    showConfirmDialog({
      title: 'Cancel Order?',
      message: 'Are you sure you want to cancel this entire order ticket? The table will be marked free.',
      confirmText: 'Cancel Order',
      onConfirm: async () => {
        currentOrder = await api(`/orders/${currentOrder.id}/cancel`, { method: 'POST' });
        displayOrderScreen();
        showToast('Order was cancelled');
      }
    });
  });

  // ===== Menu Management Screen =====
  let menuAllItems = [];
  let menuCategories = [];
  let mgmtSelectedCategory = 'All';
  let mgmtSearchQuery = '';

  async function loadMenuManagement() {
    const container = document.getElementById('menu-management-list');
    container.innerHTML = `<div class="skeleton skeleton-card"></div>`;

    try {
      const [items, cats] = await Promise.all([
        api('/menu'),
        api('/categories')
      ]);
      menuAllItems = items;
      menuCategories = cats;

      renderMgmtCategoryChips();
      renderMenuManagementList();
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><p>${escHtml(err.message)}</p></div>`;
    }
  }

  function renderMgmtCategoryChips() {
    const container = document.getElementById('mgmt-category-chips');
    const chipNames = ['All', ...menuCategories.map(c => c.name)];

    container.innerHTML = chipNames.map(name => `
      <button class="chip-btn ${name === mgmtSelectedCategory ? 'active' : ''}" data-cat="${escHtml(name)}">
        ${escHtml(name)}
      </button>
    `).join('');

    container.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        mgmtSelectedCategory = btn.dataset.cat;
        renderMgmtCategoryChips();
        renderMenuManagementList();
      });
    });
  }

  document.getElementById('mgmt-menu-search').addEventListener('input', (e) => {
    mgmtSearchQuery = e.target.value.trim().toLowerCase();
    renderMenuManagementList();
  });

  function renderMenuManagementList() {
    const container = document.getElementById('menu-management-list');
    const filtered = menuAllItems.filter(item => {
      if (mgmtSelectedCategory !== 'All' && item.category_name !== mgmtSelectedCategory) {
        return false;
      }
      if (mgmtSearchQuery && !item.name.toLowerCase().includes(mgmtSearchQuery)) {
        return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.utensils}</div>
          <h3 class="empty-title">No menu items match</h3>
          <p class="empty-desc">Create a new dish or adjust the filter chips.</p>
        </div>
      `;
      return;
    }

    // Group items by category
    const grouped = {};
    for (const item of filtered) {
      const cat = item.category_name || 'Uncategorized';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }

    let html = '';
    for (const [catName, items] of Object.entries(grouped)) {
      html += `
        <div class="menu-mgmt-section">
          <div class="menu-mgmt-section-header">
            <span>${escHtml(catName)}</span>
            <span style="font-size:0.85rem;color:var(--text-muted);font-weight:500;">${items.length} item${items.length === 1 ? '' : 's'}</span>
          </div>

          <div class="menu-grid-cards">
            ${items.map(item => `
              <div class="menu-admin-card ${item.is_available ? '' : 'dimmed'}" data-id="${item.id}">
                <div class="menu-admin-card-top">
                  <div class="menu-admin-info">
                    <h4>${escHtml(item.name)}</h4>
                    <div class="menu-admin-price">${formatPaise(item.price_paise)}</div>
                  </div>
                  ${!item.is_available ? `<span class="sold-out-badge">Sold out</span>` : ''}
                </div>

                <div class="menu-admin-footer">
                  <label class="switch-label">
                    <input type="checkbox" class="switch-input item-avail-toggle" data-id="${item.id}" ${item.is_available ? 'checked' : ''}>
                    <span class="switch-toggle"></span>
                    <span>${item.is_available ? 'Available' : 'Unavailable'}</span>
                  </label>

                  <div class="menu-admin-actions">
                    <button class="btn btn-sm btn-secondary edit-dish-btn" data-id="${item.id}" aria-label="Edit dish">
                      ${ICONS.edit}
                    </button>
                    <button class="btn btn-sm btn-danger-soft delete-dish-btn" data-id="${item.id}" aria-label="Delete dish">
                      ${ICONS.trash}
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

    // Toggle switch listeners
    container.querySelectorAll('.item-avail-toggle').forEach(chk => {
      chk.addEventListener('change', async () => {
        const id = Number(chk.dataset.id);
        const newAvail = chk.checked ? 1 : 0;
        try {
          await api('/menu/' + id, {
            method: 'PUT',
            body: { is_available: newAvail }
          });
          showToast(`Dish availability updated`);
          loadMenuManagement();
        } catch (err) {
          showToast(err.message, 'error');
          chk.checked = !chk.checked;
        }
      });
    });

    // Edit item
    container.querySelectorAll('.edit-dish-btn').forEach(btn => {
      btn.addEventListener('click', () => promptEditMenuItem(Number(btn.dataset.id)));
    });

    // Delete item
    container.querySelectorAll('.delete-dish-btn').forEach(btn => {
      btn.addEventListener('click', () => promptDeleteMenuItem(Number(btn.dataset.id)));
    });
  }

  // Add Category Modal
  document.getElementById('btn-add-category').addEventListener('click', () => {
    openModal('New Menu Category', `
      <div class="form-group">
        <label for="new-cat-name-input" class="form-label">Category Name</label>
        <input type="text" id="new-cat-name-input" class="input" placeholder="e.g. Starters, Beverages" autocomplete="off">
        <span class="field-error" id="modal-cat-error"></span>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:0.75rem;">
        <button class="btn btn-secondary" id="modal-cat-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-cat-save">Create Category</button>
      </div>
    `);

    document.getElementById('modal-cat-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-cat-save').addEventListener('click', async () => {
      const input = document.getElementById('new-cat-name-input');
      const errEl = document.getElementById('modal-cat-error');
      const btn = document.getElementById('modal-cat-save');

      const name = input.value.trim();
      if (!name) {
        errEl.textContent = 'Category name is required';
        input.focus();
        return;
      }

      btn.disabled = true;
      try {
        await api('/categories', { method: 'POST', body: { name } });
        showToast(`Category "${name}" created`);
        closeModal();
        loadMenuManagement();
      } catch (err) {
        errEl.textContent = err.message;
        btn.disabled = false;
      }
    });
  });

  // Add Dish Modal
  document.getElementById('btn-add-menu-item').addEventListener('click', () => {
    if (menuCategories.length === 0) {
      showToast('Please add at least one category first.', 'error');
      return;
    }

    openModal('Add New Dish', `
      <div class="form-group">
        <label for="new-dish-category" class="form-label">Category</label>
        <select id="new-dish-category" class="input">
          ${menuCategories.map(c => `<option value="${c.id}">${escHtml(c.name)}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label for="new-dish-name" class="form-label">Dish Name</label>
        <input type="text" id="new-dish-name" class="input" placeholder="e.g. Garlic Naan" autocomplete="off">
        <span class="field-error" id="err-dish-name"></span>
      </div>

      <div class="form-group">
        <label for="new-dish-price" class="form-label">Price (₹)</label>
        <input type="number" id="new-dish-price" class="input" step="0.01" min="0.01" placeholder="e.g. 150">
        <span class="field-error" id="err-dish-price"></span>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:0.5rem;">
        <button class="btn btn-secondary" id="modal-dish-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-dish-save">Save Dish</button>
      </div>
    `);

    document.getElementById('modal-dish-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-dish-save').addEventListener('click', async () => {
      const catId = Number(document.getElementById('new-dish-category').value);
      const nameInput = document.getElementById('new-dish-name');
      const priceInput = document.getElementById('new-dish-price');
      const errName = document.getElementById('err-dish-name');
      const errPrice = document.getElementById('err-dish-price');
      const btn = document.getElementById('modal-dish-save');

      errName.textContent = '';
      errPrice.textContent = '';

      const name = nameInput.value.trim();
      const priceVal = parseFloat(priceInput.value);

      let hasErr = false;
      if (!name) {
        errName.textContent = 'Dish name is required';
        hasErr = true;
      }
      if (isNaN(priceVal) || priceVal <= 0) {
        errPrice.textContent = 'Price must be greater than 0';
        hasErr = true;
      }

      if (hasErr) return;

      btn.disabled = true;
      try {
        await api('/menu', {
          method: 'POST',
          body: {
            category_id: catId,
            name,
            price_paise: Math.round(priceVal * 100)
          }
        });

        showToast(`Dish "${name}" added to menu`);
        closeModal();
        loadMenuManagement();
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
      }
    });
  });

  // Edit Dish Modal
  function promptEditMenuItem(id) {
    const item = menuAllItems.find(i => i.id === id);
    if (!item) return;

    openModal(`Edit ${item.name}`, `
      <div class="form-group">
        <label for="edit-dish-category" class="form-label">Category</label>
        <select id="edit-dish-category" class="input">
          ${menuCategories.map(c => `<option value="${c.id}" ${c.id === item.category_id ? 'selected' : ''}>${escHtml(c.name)}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label for="edit-dish-name" class="form-label">Dish Name</label>
        <input type="text" id="edit-dish-name" class="input" value="${escHtml(item.name)}" autocomplete="off">
        <span class="field-error" id="err-edit-name"></span>
      </div>

      <div class="form-group">
        <label for="edit-dish-price" class="form-label">Price (₹)</label>
        <input type="number" id="edit-dish-price" class="input" step="0.01" min="0.01" value="${(item.price_paise / 100).toFixed(2)}">
        <span class="field-error" id="err-edit-price"></span>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:0.5rem;">
        <button class="btn btn-secondary" id="modal-edit-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-edit-save">Save Changes</button>
      </div>
    `);

    document.getElementById('modal-edit-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-edit-save').addEventListener('click', async () => {
      const catId = Number(document.getElementById('edit-dish-category').value);
      const nameInput = document.getElementById('edit-dish-name');
      const priceInput = document.getElementById('edit-dish-price');
      const errName = document.getElementById('err-edit-name');
      const errPrice = document.getElementById('err-edit-price');
      const btn = document.getElementById('modal-edit-save');

      errName.textContent = '';
      errPrice.textContent = '';

      const name = nameInput.value.trim();
      const priceVal = parseFloat(priceInput.value);

      let hasErr = false;
      if (!name) {
        errName.textContent = 'Dish name is required';
        hasErr = true;
      }
      if (isNaN(priceVal) || priceVal <= 0) {
        errPrice.textContent = 'Price must be greater than 0';
        hasErr = true;
      }

      if (hasErr) return;

      btn.disabled = true;
      try {
        await api('/menu/' + id, {
          method: 'PUT',
          body: {
            category_id: catId,
            name,
            price_paise: Math.round(priceVal * 100)
          }
        });

        showToast('Dish updated');
        closeModal();
        loadMenuManagement();
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
      }
    });
  }

  // Delete Dish
  function promptDeleteMenuItem(id) {
    const item = menuAllItems.find(i => i.id === id);
    if (!item) return;

    showConfirmDialog({
      title: `Delete ${item.name}?`,
      message: `Items that have previously been ordered cannot be deleted (toggle availability instead). Do you want to proceed with deletion?`,
      confirmText: 'Delete Dish',
      onConfirm: async () => {
        await api('/menu/' + id, { method: 'DELETE' });
        showToast(`${item.name} removed from menu`);
        loadMenuManagement();
      }
    });
  }

  // ===== Daily Reports Page =====
  const reportDateInput = document.getElementById('report-date');
  reportDateInput.value = new Date().toISOString().split('T')[0];

  document.getElementById('btn-load-report').addEventListener('click', loadDailyReport);

  async function loadDailyReport() {
    const container = document.getElementById('report-content');
    const date = reportDateInput.value;

    if (!date) {
      showToast('Please select a valid report date.', 'error');
      return;
    }

    container.innerHTML = `<div class="skeleton skeleton-card"></div>`;

    try {
      const report = await api('/orders/reports/daily?date=' + date);
      renderReportDashboard(report);
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><p>${escHtml(err.message)}</p></div>`;
    }
  }

  function renderReportDashboard(report) {
    const container = document.getElementById('report-content');

    const totalBills = report.total_bills || 0;
    const totalSales = report.total_sales_paise || 0;
    const avgBill = totalBills > 0 ? Math.round(totalSales / totalBills) : 0;
    const cancelledCount = 0; // Handled cleanly for report cards

    const cashSales = report.breakdown ? report.breakdown.cash || 0 : 0;
    const cardSales = report.breakdown ? report.breakdown.card || 0 : 0;
    const upiSales = report.breakdown ? report.breakdown.upi || 0 : 0;

    const cashPct = totalSales > 0 ? ((cashSales / totalSales) * 100).toFixed(0) : 0;
    const cardPct = totalSales > 0 ? ((cardSales / totalSales) * 100).toFixed(0) : 0;
    const upiPct = totalSales > 0 ? ((upiSales / totalSales) * 100).toFixed(0) : 0;

    const topItems = report.top_items || [];

    container.innerHTML = `
      <!-- 4 Stat Cards -->
      <div class="report-stats-grid">
        <div class="report-stat-card">
          <span class="stat-label">Total Settled Bills</span>
          <span class="stat-value">${totalBills}</span>
        </div>

        <div class="report-stat-card">
          <span class="stat-label">Gross Revenue</span>
          <span class="stat-value" style="color:var(--success);">${formatPaise(totalSales)}</span>
        </div>

        <div class="report-stat-card">
          <span class="stat-label">Average Bill</span>
          <span class="stat-value">${formatPaise(avgBill)}</span>
        </div>

        <div class="report-stat-card">
          <span class="stat-label">Cancelled Orders</span>
          <span class="stat-value" style="color:var(--text-muted);">${cancelledCount}</span>
        </div>
      </div>

      <div class="report-details-grid">
        <!-- Payment Breakdown -->
        <div class="report-card">
          <h3 class="report-card-title">Settlement Breakdown</h3>
          <div class="breakdown-bars">
            <div class="bar-item">
              <div class="bar-info">
                <span>Cash Payments (${cashPct}%)</span>
                <span>${formatPaise(cashSales)}</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill cash" style="width:${cashPct}%;"></div>
              </div>
            </div>

            <div class="bar-item">
              <div class="bar-info">
                <span>Credit/Debit Card (${cardPct}%)</span>
                <span>${formatPaise(cardSales)}</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill card" style="width:${cardPct}%;"></div>
              </div>
            </div>

            <div class="bar-item">
              <div class="bar-info">
                <span>UPI / Digital (${upiPct}%)</span>
                <span>${formatPaise(upiSales)}</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill upi" style="width:${upiPct}%;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top 5 Ranked Dishes -->
        <div class="report-card">
          <h3 class="report-card-title">Top 5 Best-Selling Dishes</h3>
          ${topItems.length > 0 ? `
            <div class="ranked-dishes-list">
              ${topItems.map((item, idx) => `
                <div class="ranked-dish-item">
                  <div class="rank-badge">${idx + 1}</div>
                  <div class="rank-dish-name">${escHtml(item.item_name)}</div>
                  <div class="rank-dish-meta">
                    <div class="rank-qty">${item.total_qty} sold</div>
                    <div class="rank-rev">${formatPaise(item.total_revenue)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="color:var(--text-muted);text-align:center;padding:2rem 0;">
              No sales data recorded for this date.
            </div>
          `}
        </div>
      </div>
    `;
  }

  // ===== Settings Page Management =====
  let initialSettings = {};
  const settingsForm = document.getElementById('settings-form');
  const settingNameInput = document.getElementById('setting-restaurant-name');
  const settingTaxInput = document.getElementById('setting-tax-percent');
  const settingScInput = document.getElementById('setting-service-charge');
  const saveSettingsBtn = document.getElementById('btn-save-settings');

  async function loadSettings() {
    try {
      initialSettings = await api('/settings');
      settingNameInput.value = initialSettings.restaurant_name || '';
      settingTaxInput.value = initialSettings.tax_percent || '0';
      settingScInput.value = initialSettings.service_charge_percent || '0';

      // Brand title update
      document.getElementById('header-title').textContent = initialSettings.restaurant_name || 'My Restaurant';

      saveSettingsBtn.disabled = true;
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Enable save button only when user changes input
  function checkSettingsDirty() {
    const isDirty = (
      settingNameInput.value.trim() !== (initialSettings.restaurant_name || '') ||
      parseFloat(settingTaxInput.value) !== parseFloat(initialSettings.tax_percent || '0') ||
      parseFloat(settingScInput.value) !== parseFloat(initialSettings.service_charge_percent || '0')
    );
    saveSettingsBtn.disabled = !isDirty;
  }

  [settingNameInput, settingTaxInput, settingScInput].forEach(inp => {
    inp.addEventListener('input', checkSettingsDirty);
  });

  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const errName = document.getElementById('err-restaurant-name');
    const errTax = document.getElementById('err-tax-percent');
    const errSc = document.getElementById('err-service-charge');

    errName.textContent = '';
    errTax.textContent = '';
    errSc.textContent = '';

    const name = settingNameInput.value.trim();
    const tax = parseFloat(settingTaxInput.value);
    const sc = parseFloat(settingScInput.value);

    let hasErr = false;
    if (!name) {
      errName.textContent = 'Restaurant name is required';
      hasErr = true;
    }
    if (isNaN(tax) || tax < 0 || tax > 100) {
      errTax.textContent = 'Tax must be between 0 and 100%';
      hasErr = true;
    }
    if (isNaN(sc) || sc < 0 || sc > 100) {
      errSc.textContent = 'Service charge must be between 0 and 100%';
      hasErr = true;
    }

    if (hasErr) return;

    saveSettingsBtn.disabled = true;
    try {
      const updated = await api('/settings', {
        method: 'PUT',
        body: {
          restaurant_name: name,
          tax_percent: String(tax),
          service_charge_percent: String(sc)
        }
      });

      initialSettings = updated;
      document.getElementById('header-title').textContent = updated.restaurant_name;
      showToast('Settings saved successfully');
      saveSettingsBtn.disabled = true;
    } catch (err) {
      showToast(err.message, 'error');
      saveSettingsBtn.disabled = false;
    }
  });

  // ===== Initialize App =====
  loadSettings();
  loadTables();

})();
