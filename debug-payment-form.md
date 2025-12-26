# Debug Payment Settings Form

## Steps to Debug:

1. **Open the Settings page**
   - Go to http://localhost:3000/admin/settings
   - Click on the "Payment" tab

2. **Open Browser Console**
   - Press F12 (or Cmd+Option+I on Mac)
   - Go to the "Console" tab

3. **Make a change**
   - Change "Escrow Hold Period (Days)" from 7 to 14
   - You should see "Unsaved changes" badge appear

4. **Click "Save Changes" button**
   - Watch the console for these logs:
     ```
     === SAVE BUTTON CLICKED ===
     === FORM onSubmit EVENT ===
     === FORM SUBMIT CALLED ===
     Form data: { ... }
     Form errors: { ... }
     ```

## What to Check:

### If you see "SAVE BUTTON CLICKED" but NOT "FORM onSubmit EVENT":
- **Issue**: Button click is registered but form is not submitting
- **Cause**: Form might have validation errors

### If you see "FORM onSubmit EVENT" but NOT "FORM SUBMIT CALLED":
- **Issue**: Form validation is failing
- **Check**: Look for "Form errors:" in console - it will show validation errors

### If you see "FORM SUBMIT CALLED" but errors:
- **Issue**: API call is failing
- **Check**: Network tab for failed requests

## Common Issues:

### Issue 1: No logs at all
- **Check**: Is the page loaded correctly?
- **Fix**: Refresh the page (Cmd+R or Ctrl+R)

### Issue 2: Validation errors in console
- **Example**: `{ escrow_default_hold_days: { message: "..." } }`
- **Fix**: The validation schema might be too strict

### Issue 3: Network errors
- **Check**: Network tab in DevTools
- **Fix**: Backend might not be running

## Report Back:

Please paste the EXACT console output when you click "Save Changes" including:
1. All three log messages (if they appear)
2. Any errors shown
3. The "Form data:" and "Form errors:" output
