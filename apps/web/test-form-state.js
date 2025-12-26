// Test script to debug form state
// Run this in browser console on the settings page

// Check if form state is updating
const checkFormState = () => {
  console.log('=== FORM STATE DEBUG ===');
  
  // Try to access React Hook Form DevTools data
  const forms = document.querySelectorAll('form');
  console.log('Number of forms on page:', forms.length);
  
  // Check button states
  const buttons = document.querySelectorAll('button[type="submit"]');
  buttons.forEach((btn, idx) => {
    console.log(`Submit button ${idx}:`, {
      disabled: btn.disabled,
      text: btn.textContent.trim()
    });
  });
  
  // Check inputs
  const inputs = document.querySelectorAll('input, textarea, select');
  console.log('Number of inputs:', inputs.length);
  
  console.log('\nChange an input field and run this again to see if button state changes');
};

checkFormState();
