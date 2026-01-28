// Check if user is authenticated in browser
const token = localStorage.getItem('auth_token');
if (token) {
  // Decode JWT to check role
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('User role:', payload.role);
  console.log('User email:', payload.email);
} else {
  console.log('No auth token found');
}
