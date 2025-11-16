# Auth UI Components

Elegant authentication components for luxury e-commerce.

## Design System

### Colors

```typescript
{
  primary: '#000000',      // Black - Main text, borders
  accent: '#CBB57B',       // Gold - CTAs, highlights
  error: '#EF4444',        // Red - Errors
  success: '#10B981',      // Green - Success states
  background: '#FFFFFF',   // White - Forms, cards
  inputBorder: '#D4D4D4',  // Gray - Input borders
}
```

### Typography

- **Font Family**: Inter, system fonts
- **Headings**: 700 weight, tight letter-spacing
- **Body**: 400-500 weight
- **Labels**: 500 weight, 14px

### Spacing

- **Inputs**: 16px padding
- **Forms**: 24px gap between fields
- **Buttons**: 16px vertical, 48px horizontal
- **Cards**: 40px padding

---

## Components

### FloatingInput

Elegant input field with floating label animation.

#### Import

```tsx
import { FloatingInput } from '@luxury/ui/components/floating-input';
```

#### Basic Usage

```tsx
<FloatingInput
  label="Email Address"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
/>
```

#### With Icon

```tsx
<FloatingInput
  label="Password"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  icon={
    <svg className="w-5 h-5" fill="none" stroke="currentColor">
      <path d="M12 15v2m-6 4h12..." />
    </svg>
  }
/>
```

#### With Error

```tsx
<FloatingInput
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error="Invalid email format"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | required | Input label text |
| `value` | string | - | Controlled value |
| `onChange` | function | - | Change handler |
| `error` | string | - | Error message |
| `icon` | ReactNode | - | Left icon element |
| `type` | string | 'text' | Input type |
| ...rest | InputHTMLAttributes | - | Native input props |

#### Styling

**States:**
- **Default**: Gray border, gray label
- **Focus**: Gold border, gold label, scale up
- **Filled**: Label stays up
- **Error**: Red border, red label
- **Hover**: Lighter border

**Animations:**
- Label float: 300ms ease
- Border color: 300ms ease
- All transitions smooth

---

### OTPInput

Beautiful 6-digit OTP input with auto-advance.

#### Import

```tsx
import { OTPInput } from '@luxury/ui/components/otp-input';
```

#### Basic Usage

```tsx
const [otp, setOtp] = useState('');

<OTPInput
  length={6}
  value={otp}
  onChange={setOtp}
/>
```

#### With Error

```tsx
<OTPInput
  length={6}
  value={otp}
  onChange={setOtp}
  error="Invalid verification code"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `length` | number | 6 | Number of digits |
| `value` | string | required | Current OTP value |
| `onChange` | function | required | Value change handler |
| `error` | string | - | Error message |

#### Features

**Auto-advance**: Automatically moves to next input when a digit is entered

**Paste Support**: Paste 6-digit code, auto-fills all inputs

**Keyboard Navigation**:
- `Backspace`: Clear and move to previous
- `Arrow Left`: Move to previous input
- `Arrow Right`: Move to next input

**Visual Feedback**:
- Empty: Gray border
- Filled: Gold border, gold background
- Focus: Gold border, scale up
- Error: Red border

**Animations**:
- Stagger entrance (50ms delay per input)
- Scale on focus
- Error shake

---

### AuthLayout

Wrapper component for authentication pages.

#### Import

```tsx
import AuthLayout from '@/components/auth/auth-layout';
```

#### Usage

```tsx
<AuthLayout
  title="Welcome Back"
  subtitle="Sign in to access your luxury collection"
>
  <form>
    {/* Your auth form */}
  </form>
</AuthLayout>
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `children` | ReactNode | Form content |
| `title` | string | Page heading |
| `subtitle` | string | Optional subtitle |

#### Layout

**Structure**:
```
┌─────────────────────────┐
│   Gradient Background   │
│  ┌───────────────────┐  │
│  │   Decorative      │  │
│  │   Elements        │  │
│  │  ┌─────────────┐  │  │
│  │  │   Logo Icon │  │  │
│  │  └─────────────┘  │  │
│  │      Title        │  │
│  │     Subtitle      │  │
│  │                   │  │
│  │   [Form Content]  │  │
│  │                   │  │
│  │  Security Badge   │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**Styling**:
- White card with backdrop blur
- Gradient background (neutral + gold)
- Decorative blur elements
- Centered logo with animation
- Footer security badge

---

## Complete Examples

### Login Page

```tsx
'use client';

import { useState } from 'react';
import AuthLayout from '@/components/auth/auth-layout';
import { FloatingInput } from '@luxury/ui/components/floating-input';
import { OTPInput } from '@luxury/ui/components/otp-input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [otp, setOtp] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    // Login logic
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account"
    >
      <form onSubmit={handleLogin} className="space-y-6">
        {!show2FA ? (
          <>
            <FloatingInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <FloatingInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="submit"
              className="w-full bg-black text-white py-4 rounded-lg"
            >
              Sign In
            </button>
          </>
        ) : (
          <OTPInput
            length={6}
            value={otp}
            onChange={setOtp}
          />
        )}
      </form>
    </AuthLayout>
  );
}
```

### Register Page

```tsx
'use client';

import { useState } from 'react';
import AuthLayout from '@/components/auth/auth-layout';
import { FloatingInput } from '@luxury/ui/components/floating-input';

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join our exclusive collection"
    >
      <form className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FloatingInput
            label="First Name"
            value={form.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
          />

          <FloatingInput
            label="Last Name"
            value={form.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
          />
        </div>

        <FloatingInput
          label="Email Address"
          type="email"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />

        <FloatingInput
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => handleChange('password', e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-black text-white py-4 rounded-lg"
        >
          Create Account
        </button>
      </form>
    </AuthLayout>
  );
}
```

### 2FA Setup Page

```tsx
'use client';

import { useState } from 'react';
import { OTPInput } from '@luxury/ui/components/otp-input';

export default function Setup2FAPage() {
  const [otp, setOtp] = useState('');
  const [qrCode, setQrCode] = useState('data:image/png;base64,...');

  const handleVerify = async () => {
    // Verify OTP and enable 2FA
  };

  return (
    <AuthLayout
      title="Enable Two-Factor Authentication"
      subtitle="Scan QR code with your authenticator app"
    >
      <div className="space-y-6">
        {/* QR Code */}
        <div className="flex justify-center">
          <img
            src={qrCode}
            alt="2FA QR Code"
            className="w-48 h-48 border-2 border-neutral-200 rounded-lg"
          />
        </div>

        {/* Manual Entry */}
        <div className="text-center">
          <p className="text-sm text-neutral-600 mb-2">
            Or enter this code manually:
          </p>
          <code className="text-gold font-mono text-lg">
            ABCD EFGH IJKL MNOP
          </code>
        </div>

        {/* Verification */}
        <div>
          <p className="text-sm text-neutral-600 text-center mb-4">
            Enter the 6-digit code from your app
          </p>
          <OTPInput
            length={6}
            value={otp}
            onChange={setOtp}
          />
        </div>

        <button
          onClick={handleVerify}
          className="w-full bg-black text-white py-4 rounded-lg"
        >
          Verify & Enable
        </button>
      </div>
    </AuthLayout>
  );
}
```

---

## Responsive Design

All components are fully responsive:

**Mobile** (< 640px):
- Single column layout
- Full-width inputs
- Larger touch targets (min 44px)
- Reduced padding

**Tablet** (640px - 1024px):
- Optimized spacing
- Two-column for name fields
- Standard padding

**Desktop** (> 1024px):
- Maximum width: 600px
- Centered layout
- Full animations

---

## Accessibility

### Keyboard Navigation

- ✅ All inputs focusable
- ✅ Logical tab order
- ✅ Enter to submit
- ✅ Escape to clear (where applicable)

### Screen Readers

- ✅ Proper label associations
- ✅ Error announcements (aria-live)
- ✅ Button states (aria-pressed, aria-expanded)
- ✅ Form validation messages

### ARIA Attributes

```tsx
<FloatingInput
  label="Email"
  aria-label="Email Address"
  aria-required="true"
  aria-invalid={!!error}
  aria-describedby={error ? 'email-error' : undefined}
/>
```

### Color Contrast

- ✅ Text: 4.5:1 ratio minimum
- ✅ Interactive elements: 3:1 ratio
- ✅ Focus indicators: 3:1 ratio
- ✅ Error states: High contrast

---

## Animations

### Floating Label

```css
transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
/* Floats up: top 8px, font-size 12px */
/* Default: top 50%, font-size 16px */
```

### Input Focus

```css
transition: border-color 300ms ease;
/* Focus: border-gold with ring */
/* Hover: border-neutral-300 */
```

### OTP Input

```css
/* Stagger entrance */
delay: index * 50ms
/* Scale on focus */
transform: scale(1.05)
/* Filled state */
background: gold-50, border: gold
```

### Button Hover

```css
transition: all 300ms ease;
/* Hover: shadow-lg, slightly darker */
/* Active: scale(0.98) */
```

---

## Customization

### Theme Override

```tsx
// Customize via Tailwind config
export default {
  theme: {
    extend: {
      colors: {
        gold: '#CBB57B',      // Change accent color
        black: '#000000',     // Change primary
      },
    },
  },
};
```

### Component Styles

```tsx
// Override via className prop
<FloatingInput
  className="border-4 rounded-2xl"  // Custom border & radius
  label="Email"
/>
```

### Animation Speed

```tsx
// Adjust in component
<motion.div
  animate={{ ... }}
  transition={{ duration: 0.5 }}  // Slower
/>
```

---

## Best Practices

### Do's ✅

- Use consistent spacing (multiples of 4px)
- Provide helpful error messages
- Show loading states
- Auto-focus first input
- Enable paste for OTP
- Test on real devices

### Don'ts ❌

- Don't disable submit button unnecessarily
- Don't use technical error messages
- Don't over-animate
- Don't use placeholder as label
- Don't forget mobile users
- Don't skip accessibility

---

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS 14+, Android 10+)

**Not supported:**
- IE 11 (use polyfills)

---

## Performance

### Bundle Size

- FloatingInput: ~3KB
- OTPInput: ~2KB
- AuthLayout: ~4KB
- Total: ~9KB (gzipped)

### Optimization

- ✅ Code splitting
- ✅ Tree shaking
- ✅ CSS-in-JS minimal
- ✅ No external dependencies (except framer-motion)

---

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingInput } from './floating-input';

test('label floats on focus', () => {
  render(<FloatingInput label="Email" />);
  const input = screen.getByRole('textbox');

  fireEvent.focus(input);
  // Assert label is floating
});
```

### Integration Tests

```tsx
test('full login flow', async () => {
  render(<LoginPage />);

  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'test@example.com' },
  });

  fireEvent.click(screen.getByText('Sign In'));
  // Assert API call
});
```

---

**Component Library built with ❤️**

*Elegant, accessible, performant*
