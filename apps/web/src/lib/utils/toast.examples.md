# Professional Toast Notification System

## Overview

The NextPik platform uses a centralized, professional toast notification system built on Sonner. This provides consistent, beautiful notifications across the entire platform.

## Installation

The toast system is already set up in the platform. Simply import and use it:

```typescript
import { toast, standardToasts } from '@/lib/utils/toast';
```

## Basic Usage

### Simple Toasts

```typescript
// Success
toast.success('Order placed successfully!');

// Error
toast.error('Failed to process payment');

// Warning
toast.warning('Your session will expire in 5 minutes');

// Info
toast.info('New features available!');

// Loading
toast.loading('Processing your request...');
```

### Toasts with Options

```typescript
// Custom duration
toast.success('Saved!', { duration: 2000 });

// With action button
toast.error('Failed to save', {
  action: {
    label: 'Retry',
    onClick: () => console.log('Retry clicked'),
  },
});

// With custom position (set in layout.tsx)
toast.success('Welcome back!', {
  position: 'top-right', // or 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'
});
```

### Promise Toasts

Perfect for async operations:

```typescript
toast.promise(
  fetch('/api/data').then(res => res.json()),
  {
    loading: 'Loading data...',
    success: 'Data loaded successfully!',
    error: 'Failed to load data',
  }
);

// With dynamic messages
toast.promise(
  updateUserProfile(data),
  {
    loading: 'Updating profile...',
    success: (result) => `Profile updated for ${result.name}`,
    error: (error) => `Error: ${error.message}`,
  }
);
```

### Dismissing Toasts

```typescript
// Dismiss specific toast
const toastId = toast.loading('Processing...');
// Later...
toast.dismiss(toastId);

// Dismiss all toasts
toast.dismiss();
```

## Standard Toasts

Pre-configured toasts for common scenarios across the platform:

### Authentication

```typescript
// Login
standardToasts.auth.loginSuccess('John'); // "Welcome back, John!"
standardToasts.auth.loginSuccess(); // "Login successful"
standardToasts.auth.loginError(); // "Invalid email or password"
standardToasts.auth.logoutSuccess();

// Registration
standardToasts.auth.registerSuccess();
standardToasts.auth.registerError('Email already exists');

// Password Reset
standardToasts.auth.passwordResetSent();
standardToasts.auth.passwordResetSuccess();

// Session
standardToasts.auth.sessionExpired();
standardToasts.auth.unauthorized();

// Email Verification
standardToasts.auth.emailVerified();
```

### Store Management

```typescript
standardToasts.store.created(); // "Store created successfully! Pending admin approval."
standardToasts.store.updated();
standardToasts.store.deleted();
standardToasts.store.approved();
standardToasts.store.rejected();
```

### Products

```typescript
standardToasts.product.created();
standardToasts.product.updated();
standardToasts.product.deleted();
standardToasts.product.outOfStock();
standardToasts.product.addedToCart('Luxury Watch');
standardToasts.product.removedFromCart();
```

### Orders

```typescript
standardToasts.order.created();
standardToasts.order.updated();
standardToasts.order.cancelled();
standardToasts.order.shipped();
standardToasts.order.delivered();
```

### Cart & Wishlist

```typescript
// Cart
standardToasts.cart.cleared();
standardToasts.cart.updated();
standardToasts.cart.itemAdded('Premium Handbag');
standardToasts.cart.itemRemoved();

// Wishlist
standardToasts.wishlist.added('Designer Shoes');
standardToasts.wishlist.removed();
```

### Email OTP

```typescript
standardToasts.otp.sent();
standardToasts.otp.verified();
standardToasts.otp.invalid();
standardToasts.otp.enabled();
standardToasts.otp.disabled();
```

### OAuth

```typescript
standardToasts.oauth.googleLinked();
standardToasts.oauth.googleUnlinked();
standardToasts.oauth.oauthError();
```

### Generic Operations

```typescript
standardToasts.generic.saved();
standardToasts.generic.deleted();
standardToasts.generic.copied();
standardToasts.generic.uploadSuccess();
standardToasts.generic.uploadError();
standardToasts.generic.networkError();
standardToasts.generic.serverError();
standardToasts.generic.validationError('Invalid input');
standardToasts.generic.permissionDenied();
```

### Subscriptions

```typescript
standardToasts.subscription.created();
standardToasts.subscription.cancelled();
standardToasts.subscription.renewed();
standardToasts.subscription.paymentFailed();
```

## API Error Handling

Automatic error toast based on HTTP status codes:

```typescript
import { handleApiError } from '@/lib/utils/toast';

try {
  const data = await api.post('/endpoint', payload);
} catch (error) {
  handleApiError(error); // Automatically shows appropriate toast
}
```

Status code mapping:
- `400` - Shows error message
- `401` - Session expired warning
- `403` - Unauthorized error
- `404` - Resource not found
- `409` - Conflict (e.g., duplicate email)
- `422` - Validation error
- `429` - Rate limit warning
- `500` - Server error
- `503` - Service unavailable
- No internet - Network error

## Form Validation Toasts

```typescript
import { showFormError } from '@/lib/utils/toast';

const errors = {
  email: ['Invalid email format'],
  password: ['Must be at least 8 characters', 'Must include a number'],
};

showFormError(errors);
// Shows: "email: Invalid email format\npassword: Must be at least 8 characters, Must include a number"
```

## Real-World Examples

### User Registration

```typescript
const handleRegister = async (formData) => {
  try {
    await register(formData);

    // Show appropriate success message
    if (formData.role === 'SELLER') {
      standardToasts.store.created();
    } else {
      standardToasts.auth.registerSuccess();
    }

    router.push('/dashboard');
  } catch (error) {
    standardToasts.auth.registerError(error.message);
  }
};
```

### Product Creation

```typescript
const createProduct = async (productData) => {
  const toastId = toast.loading('Creating product...');

  try {
    const product = await api.post('/products', productData);
    toast.dismiss(toastId);
    standardToasts.product.created();
    return product;
  } catch (error) {
    toast.dismiss(toastId);
    handleApiError(error);
    throw error;
  }
};
```

### File Upload with Progress

```typescript
const uploadImage = async (file) => {
  return toast.promise(
    uploadFile(file),
    {
      loading: 'Uploading image...',
      success: 'Image uploaded successfully!',
      error: 'Failed to upload image',
    }
  );
};
```

### Bulk Operations

```typescript
const deleteMultipleItems = async (ids) => {
  const toastId = toast.loading(`Deleting ${ids.length} items...`);

  try {
    await api.delete('/items/bulk', { ids });
    toast.dismiss(toastId);
    toast.success(`${ids.length} items deleted successfully`);
  } catch (error) {
    toast.dismiss(toastId);
    toast.error('Failed to delete some items');
  }
};
```

### Confirmation Actions

```typescript
const deleteAccount = async () => {
  const confirmed = window.confirm('Are you sure you want to delete your account?');

  if (!confirmed) return;

  try {
    await api.delete('/account');
    toast.success('Account deleted successfully', {
      duration: 5000,
    });
    router.push('/');
  } catch (error) {
    handleApiError(error);
  }
};
```

## Best Practices

### 1. Use Standard Toasts First

Always prefer standard toasts over custom ones for consistency:

```typescript
// ✅ Good
standardToasts.auth.loginSuccess();

// ❌ Avoid
toast.success('Login successful!');
```

### 2. Provide Context

Include relevant details in toast messages:

```typescript
// ✅ Good
toast.success(`Order #${orderId} placed successfully`);
standardToasts.product.addedToCart(productName);

// ❌ Avoid generic messages
toast.success('Success');
```

### 3. Handle Loading States

Always handle loading states for async operations:

```typescript
// ✅ Good
const toastId = toast.loading('Processing...');
try {
  await operation();
  toast.dismiss(toastId);
  toast.success('Complete!');
} catch (error) {
  toast.dismiss(toastId);
  toast.error('Failed');
}

// Or use promise toast
toast.promise(operation(), {
  loading: 'Processing...',
  success: 'Complete!',
  error: 'Failed',
});
```

### 4. Appropriate Duration

- Success: 4000ms (default)
- Error: 5000ms (longer for user to read)
- Warning: 4500ms
- Info: 4000ms
- Critical errors: 6000-8000ms

```typescript
// For critical errors that need attention
toast.error('Payment failed. Please contact support.', {
  duration: 8000,
});
```

### 5. Don't Overuse

Avoid showing too many toasts at once:

```typescript
// ❌ Avoid
items.forEach(item => toast.success(`Deleted ${item.name}`));

// ✅ Good
toast.success(`Deleted ${items.length} items`);
```

### 6. User Actions

Provide action buttons when appropriate:

```typescript
toast.error('Connection lost', {
  action: {
    label: 'Retry',
    onClick: () => reconnect(),
  },
});
```

## Styling Customization

Toast styles are defined in `apps/web/src/app/globals.css`. The styling includes:

- Professional gradient backgrounds
- Smooth animations
- Responsive design
- Dark mode support
- Accessibility features

## Testing Toasts

```typescript
// Quick test in browser console
import { toast, standardToasts } from '@/lib/utils/toast';

// Test all types
toast.success('Success test');
toast.error('Error test');
toast.warning('Warning test');
toast.info('Info test');
toast.loading('Loading test');

// Test standard toasts
standardToasts.auth.loginSuccess('John Doe');
standardToasts.product.addedToCart('Test Product');
```

## Accessibility

All toasts are:
- Announced to screen readers
- Dismissible via close button
- Auto-dismissed after duration
- Keyboard navigable
- ARIA compliant

## Migration Guide

If you're migrating from the old toast system:

```typescript
// Old (ToastNotifier)
ToastNotifier.success('Title', 'Message');
ToastNotifier.error('Title', 'Message');

// New (Sonner)
toast.success('Message');
toast.error('Message');

// Or use standard toasts
standardToasts.auth.loginSuccess();
```

## Support

For issues or questions about the toast system:
1. Check this documentation
2. Review examples in code
3. Check Sonner documentation: https://sonner.emilkowal.ski/
4. Contact the development team
