document.addEventListener('DOMContentLoaded', () => {
  const session = requireAuth();
  if (!session) return;

  paintUserChip();
  bindLogoutButton();

  const form = document.getElementById('expenseForm');
  const expenseIdInput = document.getElementById('expenseId');
  const titleInput = document.getElementById('title');
  const amountInput = document.getElementById('amount');
  const departmentInput = document.getElementById('department');
  const employeeInput = document.getElementById('employee');
  const categoryInput = document.getElementById('category');
  const statusInput = document.getElementById('status');
  const dateInput = document.getElementById('date');
  const formTitle = document.getElementById('formTitle');
  const submitBtn = document.getElementById('submitBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const filterDepartment = document.getElementById('filterDepartment');
  const filterStatus = document.getElementById('filterStatus');
  const searchInput = document.getElementById('searchInput');
  const tableBody = document.getElementById('expenseTableBody');
  const cards = document.getElementById('expenseCards');
  const emptyState = document.getElementById('emptyState');
  const deptBars = document.getElementById('deptBars');

  dateInput.value = todayIso();

  function load() {
    return getExpenses('company', session.id);
  }

  function persist(list) {
    saveExpenses('company', session.id, list);
  }

  function filteredList() {
    const department = filterDepartment.value;
    const status = filterStatus.value;
    const query = searchInput.value.trim().toLowerCase();

    return load()
      .filter((item) => (department === 'all' ? true : item.department === department))
      .filter((item) => (status === 'all' ? true : item.status === status))
      .filter((item) => {
        if (!query) return true;
        return (
          item.title.toLowerCase().includes(query) ||
          item.employee.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }

  function statusBadge(status) {
    if (status === 'approved') return '<span class="badge badge-ok">Approved</span>';
    if (status === 'rejected') return '<span class="badge badge-danger">Rejected</span>';
    return '<span class="badge badge-warn">Pending</span>';
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function resetForm() {
    form.reset();
    expenseIdInput.value = '';
    dateInput.value = todayIso();
    formTitle.textContent = 'Log company expense';
    submitBtn.textContent = 'Save expense';
    cancelEditBtn.hidden = true;
  }

  function startEdit(id) {
    const item = load().find((expense) => expense.id === id);
    if (!item) return;

    expenseIdInput.value = item.id;
    titleInput.value = item.title;
    amountInput.value = item.amount;
    departmentInput.value = item.department;
    employeeInput.value = item.employee;
    categoryInput.value = item.category;
    statusInput.value = item.status;
    dateInput.value = item.date;
    formTitle.textContent = 'Edit company expense';
    submitBtn.textContent = 'Update expense';
    cancelEditBtn.hidden = false;
    titleInput.focus();
  }

  function removeExpense(id) {
    if (!confirm('Delete this company expense?')) return;
    persist(load().filter((item) => item.id !== id));
    if (expenseIdInput.value === id) resetForm();
    render();
  }

  function updateSummary(allItems) {
    const total = allItems.reduce((sum, item) => sum + Number(item.amount), 0);
    const pending = allItems
      .filter((item) => item.status === 'pending')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const approved = allItems
      .filter((item) => item.status === 'approved')
      .reduce((sum, item) => sum + Number(item.amount), 0);

    document.getElementById('totalSpend').textContent = formatMoney(total);
    document.getElementById('pendingSpend').textContent = formatMoney(pending);
    document.getElementById('approvedSpend').textContent = formatMoney(approved);

    const departments = {};
    allItems.forEach((item) => {
      departments[item.department] = (departments[item.department] || 0) + Number(item.amount);
    });

    const max = Math.max(...Object.values(departments), 1);
    const entries = Object.entries(departments).sort((a, b) => b[1] - a[1]);

    if (!entries.length) {
      deptBars.innerHTML = '<p class="hint">Department breakdown appears after you add expenses.</p>';
      return;
    }

    deptBars.innerHTML = `<h2 style="margin-bottom:0.75rem;">By department</h2>${entries
      .map(([name, amount]) => {
        const width = Math.round((amount / max) * 100);
        return `
          <div class="dept-row">
            <span>${escapeHtml(name)}</span>
            <div class="track"><div class="fill" style="width:${width}%"></div></div>
            <span class="amt">${formatMoney(amount)}</span>
          </div>
        `;
      })
      .join('')}`;
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
        <td>${escapeHtml(item.department)}</td>
        <td>${escapeHtml(item.employee)}</td>
        <td>${statusBadge(item.status)}</td>
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
        <div class="expense-meta">
          ${escapeHtml(item.department)} · ${escapeHtml(item.employee)} · ${formatDate(item.date)}
        </div>
        <div style="margin-bottom:0.65rem;">${statusBadge(item.status)}</div>
        ${renderActions(item.id)}
      `;
      cards.appendChild(card);
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const payload = {
      title: titleInput.value.trim(),
      amount: Number(amountInput.value),
      department: departmentInput.value,
      employee: employeeInput.value.trim(),
      category: categoryInput.value,
      status: statusInput.value,
      date: dateInput.value
    };

    if (!payload.title || !(payload.amount > 0) || !payload.employee || !payload.date) return;

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
  filterDepartment.addEventListener('change', render);
  filterStatus.addEventListener('change', render);
  searchInput.addEventListener('input', render);

  document.addEventListener('click', (event) => {
    const editId = event.target.getAttribute('data-edit');
    const deleteId = event.target.getAttribute('data-delete');
    if (editId) startEdit(editId);
    if (deleteId) removeExpense(deleteId);
  });

  render();
});
