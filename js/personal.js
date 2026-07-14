document.addEventListener('DOMContentLoaded', () => {
  const session = requireAuth();
  if (!session) return;

  paintUserChip();
  bindLogoutButton();

  const form = document.getElementById('expenseForm');
  const expenseIdInput = document.getElementById('expenseId');
  const titleInput = document.getElementById('title');
  const amountInput = document.getElementById('amount');
  const categoryInput = document.getElementById('category');
  const dateInput = document.getElementById('date');
  const formTitle = document.getElementById('formTitle');
  const submitBtn = document.getElementById('submitBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const filterCategory = document.getElementById('filterCategory');
  const searchInput = document.getElementById('searchInput');
  const tableBody = document.getElementById('expenseTableBody');
  const cards = document.getElementById('expenseCards');
  const emptyState = document.getElementById('emptyState');

  dateInput.value = todayIso();

  function load() {
    return getExpenses('personal', session.id);
  }

  function persist(list) {
    saveExpenses('personal', session.id, list);
  }

  function filteredList() {
    const category = filterCategory.value;
    const query = searchInput.value.trim().toLowerCase();

    return load()
      .filter((item) => (category === 'all' ? true : item.category === category))
      .filter((item) => (query ? item.title.toLowerCase().includes(query) : true))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }

  function resetForm() {
    form.reset();
    expenseIdInput.value = '';
    dateInput.value = todayIso();
    formTitle.textContent = 'Add expense';
    submitBtn.textContent = 'Save expense';
    cancelEditBtn.hidden = true;
  }

  function startEdit(id) {
    const item = load().find((expense) => expense.id === id);
    if (!item) return;

    expenseIdInput.value = item.id;
    titleInput.value = item.title;
    amountInput.value = item.amount;
    categoryInput.value = item.category;
    dateInput.value = item.date;
    formTitle.textContent = 'Edit expense';
    submitBtn.textContent = 'Update expense';
    cancelEditBtn.hidden = false;
    titleInput.focus();
  }

  function removeExpense(id) {
    if (!confirm('Delete this expense?')) return;
    persist(load().filter((item) => item.id !== id));
    if (expenseIdInput.value === id) resetForm();
    render();
  }

  function updateSummary(allItems) {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthTotal = allItems
      .filter((item) => item.date.startsWith(monthKey))
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const allTotal = allItems.reduce((sum, item) => sum + Number(item.amount), 0);

    document.getElementById('monthTotal').textContent = formatMoney(monthTotal);
    document.getElementById('allTotal').textContent = formatMoney(allTotal);
    document.getElementById('entryCount').textContent = String(allItems.length);
  }

  function renderActions(id) {
    return `
      <div class="actions">
        <button type="button" class="btn btn-ghost btn-sm" data-edit="${id}">Edit</button>
        <button type="button" class="btn btn-danger btn-sm" data-delete="${id}">Delete</button>
      </div>
    `;
  }

  function render() {
    const allItems = load();
    const items = filteredList();
    updateSummary(allItems);

    tableBody.innerHTML = '';
    cards.innerHTML = '';
    emptyState.hidden = items.length > 0;

    items.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(item.title)}</td>
        <td>${escapeHtml(item.category)}</td>
        <td>${formatDate(item.date)}</td>
        <td class="amount">${formatMoney(item.amount)}</td>
        <td>${renderActions(item.id)}</td>
      `;
      tableBody.appendChild(row);

      const card = document.createElement('article');
      card.className = 'expense-card';
      card.innerHTML = `
        <div class="expense-card-top">
          <strong>${escapeHtml(item.title)}</strong>
          <span class="amount">${formatMoney(item.amount)}</span>
        </div>
        <div class="expense-meta">${escapeHtml(item.category)} · ${formatDate(item.date)}</div>
        ${renderActions(item.id)}
      `;
      cards.appendChild(card);
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const payload = {
      title: titleInput.value.trim(),
      amount: Number(amountInput.value),
      category: categoryInput.value,
      date: dateInput.value
    };

    if (!payload.title || !(payload.amount > 0) || !payload.date) return;

    const list = load();
    const editingId = expenseIdInput.value;

    if (editingId) {
      const index = list.findIndex((item) => item.id === editingId);
      if (index >= 0) {
        list[index] = { ...list[index], ...payload };
      }
    } else {
      list.push({
        id: createId(),
        ...payload,
        createdAt: Date.now()
      });
    }

    persist(list);
    resetForm();
    render();
  });

  cancelEditBtn.addEventListener('click', resetForm);
  filterCategory.addEventListener('change', render);
  searchInput.addEventListener('input', render);

  document.addEventListener('click', (event) => {
    const editId = event.target.getAttribute('data-edit');
    const deleteId = event.target.getAttribute('data-delete');
    if (editId) startEdit(editId);
    if (deleteId) removeExpense(deleteId);
  });

  render();
});
