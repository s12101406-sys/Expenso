document.addEventListener('DOMContentLoaded', () => {
  const session = requireAuth();
  if (!session) return;

  paintUserChip();
  bindLogoutButton();
});
