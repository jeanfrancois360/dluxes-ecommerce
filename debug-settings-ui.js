/**
 * Debug script to paste into browser console
 * This will test if the buttons are properly wired up
 */

// Test 1: Check if tabs exist
console.log('=== Test 1: Check Tab Values ===');
const tabs = document.querySelectorAll('[role="tab"]');
console.log('Found tabs:', tabs.length);
tabs.forEach(tab => {
  console.log(`  - Tab value: "${tab.getAttribute('value')}" - Text: "${tab.textContent}"`);
});

// Test 2: Check Configure button
console.log('\n=== Test 2: Find Configure Buttons ===');
const configureButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
  btn.textContent?.includes('Configure')
);
console.log('Found Configure buttons:', configureButtons.length);
configureButtons.forEach((btn, idx) => {
  console.log(`  Button ${idx}:`, btn.textContent.trim());
});

// Test 3: Check Save Changes button
console.log('\n=== Test 3: Find Save Changes Button ===');
const saveButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
  btn.textContent?.includes('Save Changes')
);
console.log('Found Save Changes buttons:', saveButtons.length);
saveButtons.forEach((btn, idx) => {
  console.log(`  Button ${idx}:`, btn.textContent.trim(), 'Type:', btn.type, 'Disabled:', btn.disabled);
});

// Test 4: Check form
console.log('\n=== Test 4: Check Forms ===');
const forms = document.querySelectorAll('form');
console.log('Found forms:', forms.length);
forms.forEach((form, idx) => {
  console.log(`  Form ${idx}: Action=${form.action || 'none'}, Method=${form.method || 'default'}`);
});

// Test 5: Simulate Configure button click
console.log('\n=== Test 5: Simulate Configure Click ===');
if (configureButtons.length > 0) {
  const testCategory = 'PAYMENT'; // or whatever the category is
  console.log(`Simulating click for category: ${testCategory}`);
  const categoryLower = testCategory.toLowerCase();
  const tabTrigger = document.querySelector(`[value="${categoryLower}"]`);
  if (tabTrigger) {
    console.log('✅ Tab found:', tabTrigger);
  } else {
    console.error('❌ Tab NOT found for category:', categoryLower);
    console.log('Available tab values:', Array.from(tabs).map(t => t.getAttribute('value')));
  }
}

console.log('\n=== Debug Complete ===');
console.log('Copy and paste the output above');
