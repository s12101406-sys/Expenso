document.addEventListener('DOMContentLoaded', () => {
  redirectIfLoggedIn();

  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authTitle = document.getElementById('authTitle');
  const authSubtitle = document.getElementById('authSubtitle');
  const loginError = document.getElementById('loginError');
  const registerError = document.getElementById('registerError');

  function setMode(mode) {
    const isLogin = mode === 'login';
    loginTab.classList.toggle('active', isLogin);
    registerTab.classList.toggle('active', !isLogin);
    loginForm.classList.toggle('active', isLogin);
    registerForm.classList.toggle('active', !isLogin);
    authTitle.textContent = isLogin ? 'Welcome back' : 'Create your account';
    authSubtitle.textContent = isLogin
      ? 'Sign in to open your Expenso workspace.'
      : 'Set up Expenso in under a minute.';
    loginError.textContent = '';
    registerError.textContent = '';
  }

  loginTab.addEventListener('click', () => setMode('login'));
  registerTab.addEventListener('click', () => setMode('register'));

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    loginError.textContent = '';

    const result = loginUser({
      email: document.getElementById('loginEmail').value,
      password: document.getElementById('loginPassword').value
    });

    if (!result.ok) {
      loginError.textContent = result.message;
      return;
    }

    window.location.href = 'home.html';
  });

  registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    registerError.textContent = '';

    const result = registerUser({
      name: document.getElementById('registerName').value,
      email: document.getElementById('registerEmail').value,
      password: document.getElementById('registerPassword').value
    });

    if (!result.ok) {
      registerError.textContent = result.message;
      return;
    }

    window.location.href = 'home.html';
  });
});
