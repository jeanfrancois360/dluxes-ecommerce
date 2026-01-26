# Settings UI/UX Design System

> **Version:** 2.7.0
> **Last Updated:** January 18, 2026
> **Status:** Production Ready

## Overview

All settings forms now follow a **uniform, professional design system** with consistent visual hierarchy, color scheme, and component patterns.

---

## Design Principles

### 1. **Visual Consistency**
- ✅ Same color scheme across all forms
- ✅ Uniform spacing and layout
- ✅ Consistent typography
- ✅ Predictable component behavior

### 2. **Brand Identity**
- **Primary Brand Color:** `#CBB57B` (Luxury Gold)
- **Usage:** Icons, borders, accents
- **Application:** 20% opacity for borders, 10% for backgrounds

### 3. **Professional Hierarchy**
- Clear section headers with icons
- Descriptive card titles and subtitles
- Grouped related settings
- Visual separation between sections

### 4. **User Experience**
- Helpful tooltips on hover
- Inline validation errors
- Helper text for guidance
- Loading states
- Keyboard shortcuts (Ctrl/Cmd + S to save)

---

## Component Library

### Core Components

#### 1. **SettingsCard**
**File:** `apps/web/src/components/settings/shared/SettingsCard.tsx`

**Features:**
- Icon support with brand-colored background
- Title and description
- Optional tooltip
- Consistent border and shadow

**Visual:**
```
┌─────────────────────────────────────────┐
│ [🎨] Title                              │
│     Description text                    │
├─────────────────────────────────────────┤
│                                         │
│ Card content here                       │
│                                         │
└─────────────────────────────────────────┘
```

**Usage:**
```typescript
<SettingsCard
  icon={Building2}
  title="Site Identity"
  description="Configure your site's basic information"
  tooltip="Optional help text"
>
  {/* Your settings fields */}
</SettingsCard>
```

**Styling:**
- Border: `border-[#CBB57B]/20`
- Icon background: `bg-[#CBB57B]/10`
- Icon color: `text-[#CBB57B]`

#### 2. **SettingsField**
**File:** `apps/web/src/components/settings/shared/SettingsField.tsx`

**Features:**
- Label with required indicator
- Tooltip support
- Error display with icon
- Helper text
- Prefix/suffix support

**Visual:**
```
Label (required *) [?]
[Input field                    ]
Helper text or error message
```

**Usage:**
```typescript
<SettingsField
  label="Site Name"
  id="site_name"
  required
  tooltip="The name of your marketplace"
  error={form.formState.errors.site_name?.message}
  helperText="Displayed in browser title and emails"
>
  <Input id="site_name" {...form.register('site_name')} />
</SettingsField>
```

#### 3. **SettingsToggle**
**File:** `apps/web/src/components/settings/shared/SettingsToggle.tsx`

**Features:**
- Label and description
- ON/OFF switch
- Disabled state
- Async onChange support

**Visual:**
```
┌─────────────────────────────────────┐
│ Label                    [ON/OFF]   │
│ Description text here               │
└─────────────────────────────────────┘
```

**Usage:**
```typescript
<SettingsToggle
  label="Maintenance Mode"
  description="Enable to temporarily disable the site"
  checked={maintenanceMode}
  onCheckedChange={async (checked) => {
    await updateSetting('maintenance_mode', checked);
  }}
  disabled={updating}
/>
```

#### 4. **SettingsFooter**
**File:** `apps/web/src/components/settings/shared/SettingsFooter.tsx`

**Features:**
- Save and Reset buttons
- Loading states
- Only appears when form is dirty
- Sticky positioning option

**Visual:**
```
┌─────────────────────────────────────┐
│ [Reset]           [Save Changes]    │
└─────────────────────────────────────┘
```

**Usage:**
```typescript
<SettingsFooter
  onReset={() => form.reset()}
  onSave={() => form.handleSubmit(onSubmit)()}
  isLoading={updating}
  isDirty={form.formState.isDirty}
/>
```

#### 5. **EnvSettingsDisplay**
**File:** `apps/web/src/components/settings/env-settings-display.tsx`

**Features:**
- Read-only display for .env settings
- Configuration status indicators
- Setup instructions
- Secret value masking

**Visual:**
```
┌─────────────────────────────────────┐
│ 📘 Environment Configuration        │
│ These settings are configured via   │
│ environment variables in .env file  │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ Setting Name      [.env]    │   │
│ │ ENV_VAR_NAME ✓ Configured   │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Color Palette

### Primary Colors
| Color | Hex | Usage |
|-------|-----|-------|
| **Luxury Gold** | `#CBB57B` | Primary brand color |
| **Gold 20%** | `#CBB57B/20` | Card borders, subtle accents |
| **Gold 10%** | `#CBB57B/10` | Icon backgrounds, hover states |

### Neutral Colors
| Color | Usage |
|-------|-------|
| `gray-900` | Primary text, headings |
| `gray-600` | Secondary text, descriptions |
| `gray-500` | Helper text, placeholders |
| `gray-400` | Icons, disabled states |
| `gray-200` | Borders, dividers |

### Status Colors
| Color | Usage |
|-------|-------|
| `green-600` | Success indicators, checkmarks |
| `red-600` | Errors, alerts |
| `amber-600` | Warnings, maintenance mode |
| `blue-600` | Informational messages |

---

## Form Layout Patterns

### Pattern 1: Basic Information Form
**Used in:** General Settings, Security Settings

```
[Form Start]

  ┌─ Section 1: Basic Info ─────────┐
  │ [Icon] Title                     │
  │ Description                      │
  │                                  │
  │ [Field 1]    [Field 2]          │
  │ [Field 3]    [Field 4]          │
  └──────────────────────────────────┘

  ┌─ Section 2: Additional Config ──┐
  │ [Icon] Title                     │
  │ Description                      │
  │                                  │
  │ [Field 5]    [Field 6]          │
  └──────────────────────────────────┘

  [Save] [Reset]
[Form End]
```

### Pattern 2: API Configuration Form
**Used in:** Payment Settings

```
[Form Start]

  ┌─ Service Configuration ──────────┐
  │ [Icon] Service Name  [Status]    │
  │ Description                      │
  │                                  │
  │ Configuration Status:            │
  │ ✓ API Key 1                      │
  │ ✓ API Key 2                      │
  │                                  │
  │ [Show/Hide API Keys]            │
  │                                  │
  │ -- Environment Settings --      │
  │ (Read-only .env display)        │
  │                                  │
  │ -- Business Configuration --    │
  │ (Editable database settings)    │
  └──────────────────────────────────┘

[Form End]
```

### Pattern 3: Toggle-Heavy Form
**Used in:** Notification Settings, Security Settings

```
[Form Start]

  ┌─ Features ───────────────────────┐
  │ [Icon] Title                     │
  │                                  │
  │ ☑ Feature 1      [ON/OFF]       │
  │   Description                    │
  │                                  │
  │ ☐ Feature 2      [ON/OFF]       │
  │   Description                    │
  └──────────────────────────────────┘

[Form End]
```

---

## Spacing System

### Card Spacing
- **Outer margin:** `space-y-6` (24px between cards)
- **Card padding:** `p-6` (24px inside cards)
- **Section spacing:** `space-y-6` (24px between sections within cards)

### Field Spacing
- **Field group:** `gap-6` (24px between fields)
- **Label to input:** `space-y-2` (8px)
- **Helper text margin:** `mt-1` (4px)

### Grid Layout
- **Mobile:** `grid-cols-1` (full width)
- **Desktop:** `grid-cols-2` (50/50 split)
- **Gap:** `gap-6` (24px)

---

## Typography

### Headings
```css
Card Title:      text-lg font-semibold text-gray-900
Card Description: text-sm text-gray-600
Section Header:  text-base font-medium text-gray-900
```

### Body Text
```css
Field Label:     text-sm font-medium text-gray-900
Helper Text:     text-xs text-gray-500
Error Text:      text-xs text-red-600
```

### Interactive Elements
```css
Button Text:     text-sm font-medium
Link Text:       text-sm text-blue-600 underline
```

---

## Icon System

### Icon Sizes
- **Card icon:** `h-5 w-5`
- **Field tooltip:** `h-4 w-4`
- **Inline icon:** `h-3 w-3`

### Icon Sources
**Lucide React:** All icons come from `lucide-react`

**Common Icons:**
| Icon | Usage |
|------|-------|
| `Building2` | Site/Business settings |
| `Mail` | Contact/Email settings |
| `Globe` | Regional/Internationalization |
| `CreditCard` | Payment settings |
| `Shield` | Security settings |
| `Bell` | Notifications |
| `Lock` | Escrow/Security features |
| `DollarSign` | Payout/Financial |
| `AlertTriangle` | Warnings/Maintenance |
| `CheckCircle` | Success states |
| `XCircle` | Error states |

---

## Validation & Error Handling

### Error Display Pattern
```typescript
{Object.keys(form.formState.errors).length > 0 && (
  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
    <div className="flex items-center gap-2 mb-2">
      <AlertCircle className="h-5 w-5 text-red-600" />
      <h4 className="text-sm font-medium text-red-900">
        Form Validation Errors
      </h4>
    </div>
    <ul className="text-sm text-red-700 space-y-1 ml-7">
      {Object.entries(form.formState.errors).map(([field, error]) => (
        <li key={field}>
          <strong>{field}:</strong> {error.message}
        </li>
      ))}
    </ul>
  </div>
)}
```

### Field-Level Errors
- Shown below the input field
- Red color (`text-red-600`)
- Alert icon included
- Takes precedence over helper text

---

## Loading States

### Form Loading
```typescript
if (loading) {
  return (
    <Card>
      <CardContent className="py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
```

### Button Loading
- Disabled state applied
- Loading spinner shown
- Text remains visible

---

## Accessibility

### Keyboard Navigation
- **Ctrl/Cmd + S:** Save form
- **Escape:** Reset form (when footer focused)
- **Tab:** Navigate through fields
- **Enter:** Submit form (when on last field)

### Screen Readers
- All fields have proper labels
- Error messages are announced
- Required fields indicated
- Tooltips accessible via keyboard

### Focus States
- Clear focus rings on all interactive elements
- Logical tab order
- No focus traps

---

## Implementation Checklist

When creating a new settings form:

- [ ] Use `SettingsCard` for sections
- [ ] Use `SettingsField` for inputs
- [ ] Use `SettingsToggle` for boolean settings
- [ ] Use `SettingsFooter` at the end
- [ ] Include form validation with Zod
- [ ] Show loading state while fetching
- [ ] Display validation errors at top
- [ ] Add keyboard shortcuts
- [ ] Include helpful tooltips
- [ ] Use consistent spacing (`space-y-6`)
- [ ] Apply brand colors (`#CBB57B`)
- [ ] Test with screen reader
- [ ] Verify mobile responsiveness

---

## Examples

### Complete Form Example
See: `apps/web/src/components/settings/general-settings.tsx`

### Payment Integration Example
See: `apps/web/src/components/settings/payment-settings.tsx`

### Environment Settings Example
See: `apps/web/src/components/settings/env-settings-display.tsx`

---

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## Performance

### Optimizations Applied
- Lazy loading for heavy components
- Debounced form validation
- Optimistic UI updates
- Memoized selectors
- Code splitting per settings category

### Metrics
- **Initial Load:** < 100kb per settings page
- **Time to Interactive:** < 1s
- **Form Submission:** < 500ms (with network)

---

## Future Enhancements

### Planned Improvements
1. Dark mode support
2. Bulk edit mode
3. Import/export settings
4. Settings templates
5. Advanced search/filter
6. Change history viewer
7. Settings comparison tool

---

## Maintenance

### When to Update
- New settings category added
- Brand colors change
- Component library updates
- Accessibility improvements needed

### Testing Procedure
1. Run `pnpm type-check` - verify TypeScript
2. Test all forms manually
3. Check mobile responsiveness
4. Verify keyboard navigation
5. Test screen reader compatibility

---

*For implementation questions, refer to existing forms or create an issue.*
