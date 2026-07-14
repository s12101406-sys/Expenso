/* Shared storage helpers for Expenso */

const STORAGE_KEYS = {
  users: 'expenso_users',
  session: 'expenso_session',
  personal: 'expenso_personal_expenses',
  company: 'expenso_company_expenses',
  companySettings: 'expenso_company_settings'
};

const DEFAULT_COMPANY_SETTINGS = {
  companyName: 'My Company',
  monthlyBudget: 500000,
  currency: 'INR',
  budgets: {
    Operations: 80000,
    Sales: 100000,
    Marketing: 90000,
    Engineering: 120000,
    HR: 40000,
    Finance: 50000
  }
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.error('Storage read failed', error);
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
  return readJson(STORAGE_KEYS.users, []);
}

function saveUsers(users) {
  writeJson(STORAGE_KEYS.users, users);
}

function getSession() {
  return readJson(STORAGE_KEYS.session, null);
}

function setSession(session) {
  writeJson(STORAGE_KEYS.session, session);
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
}

function expensesKey(type, userId) {
  return `${type === 'company' ? STORAGE_KEYS.company : STORAGE_KEYS.personal}_${userId}`;
}

function getExpenses(type, userId) {
  return readJson(expensesKey(type, userId), []);
}

function saveExpenses(type, userId, expenses) {
  writeJson(expensesKey(type, userId), expenses);
}

function companySettingsKey(userId) {
  return `${STORAGE_KEYS.companySettings}_${userId}`;
}

function getCompanySettings(userId) {
  const saved = readJson(companySettingsKey(userId), null);
  if (!saved) return structuredClone(DEFAULT_COMPANY_SETTINGS);
  return {
    ...DEFAULT_COMPANY_SETTINGS,
    ...saved,
    budgets: { ...DEFAULT_COMPANY_SETTINGS.budgets, ...(saved.budgets || {}) }
  };
}

function saveCompanySettings(userId, settings) {
  writeJson(companySettingsKey(userId), settings);
}

function formatMoney(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(value);
}

function formatDate(isoDate) {
  if (!isoDate) return '—';
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function createId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function createRefCode() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `EXP-${stamp}${rand}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function showToast(message) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? '');
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    )
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
