// Shared auth check for all admin pages
function checkAuth() {
  // Check if user has valid session
  fetch('/admin/api/check-auth')
    .then(res => {
      if (!res.ok) {
        // Not authenticated, redirect to login
        window.location.href = '/admin/login.html';
      }
    })
    .catch(() => {
      // Network error, assume not authenticated
      window.location.href = '/admin/login.html';
    });
}
