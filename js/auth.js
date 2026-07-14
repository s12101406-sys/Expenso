/* Authentication helpers */

function requireAuth() {
  const session = getSession();
  if (!session || !session.email) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

function redirectIfLoggedIn() {
  const session = getSession();
  if (session && session.email) {
    window.location.href = 'home.html';
  }
}

function registerUser({ name, email, password }) {
  const users = getUsers();
  const normalized = email.trim().toLowerCase();

  if (users.some((user) => user.email === normalized)) {
    return { ok: false, message: 'An account with this email already exists.' };
  }

  if (password.length < 6) {
    return { ok: false, message: 'Password must be at least 6 characters.' };
  }

  const user = {
    id: createId(),
    name: name.trim(),
    email: normalized,
    password
  };

  users.push(user);
  saveUsers(users);
  setSession({ id: user.id, name: user.name, email: user.email });
  return { ok: true, user };
}

function loginUser({ email, password }) {
  const users = getUsers();
  const normalized = email.trim().toLowerCase();
  const user = users.find((item) => item.email === normalized);

  if (!user || user.password !== password) {
    return { ok: false, message: 'Invalid email or password.' };
  }

  setSession({ id: user.id, name: user.name, email: user.email });
  return { ok: true, user };
}

function logoutUser() {
  clearSession();
  window.location.href = 'login.html';
}

function bindLogoutButton() {
  const button = document.getElementById('logoutBtn');
  if (button) {
    button.addEventListener('click', logoutUser);
  }
}

function paintUserChip() {
  const session = getSession();
  const chip = document.getElementById('userChip');
  if (chip && session) {
    chip.textContent = session.name || session.email;
  }
}
