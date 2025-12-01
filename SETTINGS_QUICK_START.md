# ⚡ Settings Module - Quick Start Guide

## 🚀 Activate in 3 Steps (5 minutes)

### Step 1: Activate the New Settings Page

```bash
cd apps/web/src/app/admin/settings
mv page.tsx page-old.tsx.backup
mv page-new.tsx page.tsx
```

### Step 2: Seed Default Settings (if not already done)

```bash
cd packages/database
npx tsx prisma/seed-settings.ts
```

### Step 3: Test the Settings Page

1. Start your dev server (if not running):
```bash
pnpm dev
```

2. Navigate to: `http://localhost:3000/admin/settings`

3. You should see the new tabbed settings interface!

---

## ✅ Verification Checklist

After activation, verify these work:

- [ ] Settings page loads without errors
- [ ] All 8 tabs are visible (General, Payment, Commission, Currency, Delivery, Security, Notifications, SEO)
- [ ] Clicking each tab shows different settings
- [ ] Forms are populated with seeded data
- [ ] Editing a value and clicking "Save Changes" works
- [ ] Toast notification appears after save
- [ ] "Audit Log" section shows change history
- [ ] "Reset" button restores original values

---

## 🎯 What You Get

### 8 Fully Functional Settings Sections

1. **General** - Site name, tagline, contact info, timezone, maintenance mode
2. **Payment** - Escrow configuration, payout settings, payment methods
3. **Commission** - Global commission rate, calculation type, shipping application
4. **Currency** - Default currency, supported currencies, auto-sync
5. **Delivery** - Delivery confirmation, auto-assign, free shipping threshold
6. **Security** - 2FA, session timeout, password requirements, file upload limits
7. **Notifications** - Email/SMS toggles, notification events selection
8. **SEO** - Meta title/description, keywords, analytics tracking

### Key Features

✅ Real-time validation with error messages
✅ Auto-save with toast notifications
✅ Audit log viewer (shows who changed what and when)
✅ Production locks (escrow cannot be disabled)
✅ Loading states and spinners
✅ Mobile responsive design
✅ Dark mode support

---

## 🔧 Customization

### Add a New Setting

1. **Add to seed file** (`packages/database/prisma/seed-settings.ts`):
```typescript
{
  key: 'my_new_setting',
  category: 'general',
  value: 'default_value',
  valueType: SettingValueType.STRING,
  label: 'My New Setting',
  description: 'What this setting does',
  isPublic: false,
  isEditable: true,
  requiresRestart: false,
  defaultValue: 'default_value',
}
```

2. **Add to Zod schema** (`apps/web/src/lib/validations/settings.ts`):
```typescript
export const generalSettingsSchema = z.object({
  // ... existing fields
  my_new_setting: z.string().min(1, 'Required'),
});
```

3. **Add to form** (`apps/web/src/components/settings/general-settings.tsx`):
```tsx
<div className="space-y-2">
  <Label htmlFor="my_new_setting">My New Setting *</Label>
  <Input
    id="my_new_setting"
    {...form.register('my_new_setting')}
    placeholder="Enter value"
  />
</div>
```

4. **Re-seed database**:
```bash
cd packages/database
npx tsx prisma/seed-settings.ts
```

---

## 📊 Using Settings in Your Code

### Frontend (React Components)

```typescript
import { useSettings } from '@/hooks/use-settings';
import { getSettingValue } from '@/lib/settings-utils';

function MyComponent() {
  const { settings, loading } = useSettings('general');

  const siteName = getSettingValue(settings, 'site_name', 'Default Name');

  return <h1>{siteName}</h1>;
}
```

### Backend (NestJS Services)

```typescript
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class MyService {
  constructor(private settingsService: SettingsService) {}

  async doSomething() {
    const escrowEnabled = await this.settingsService.getSetting('escrow_enabled');

    if (escrowEnabled.value) {
      // Escrow is enabled
    }
  }
}
```

---

## 🐛 Troubleshooting

### Settings page shows 404
- Make sure you renamed `page-new.tsx` to `page.tsx`
- Check that you're in the correct directory: `apps/web/src/app/admin/settings`

### Form fields are empty
- Run the seed script: `npx tsx prisma/seed-settings.ts`
- Check API is running: `curl http://localhost:4000/api/v1/settings/public`

### "Component X not found" error
- Make sure UI package is built: `cd packages/ui && pnpm build` (if needed)
- Check imports are correct: `from '@luxury/ui'`

### Validation errors on save
- Check Zod schema matches form field names
- Ensure required fields have values
- Check console for detailed error messages

### Audit log is empty
- Audit log only shows entries AFTER you make changes
- Try editing a setting and saving to create first audit entry

---

## 📚 Documentation Files

- **SETTINGS_MODULE_COMPLETE.md** - Full implementation details, architecture, features
- **SETTINGS_IMPLEMENTATION_GUIDE.md** - Original architecture and design guide
- **SETTINGS_COMPLETION_SUMMARY.md** - Status summary and integration points
- **SETTINGS_QUICK_START.md** - This file (activation and quick reference)

---

## 🎓 Best Practices

### When to Add a Setting

✅ **Add a setting when**:
- Value might change in production
- Different environments need different values
- Business team should control the value
- Value affects multiple parts of the app

❌ **Don't add a setting for**:
- Constants that never change (use TypeScript constants)
- Secrets (use environment variables)
- Feature flags (use a feature flag system)
- User preferences (use user model)

### Security Considerations

- **Sensitive settings**: Set `isPublic: false` to hide from public API
- **Production locks**: Set `isEditable: false` for critical settings
- **Validation**: Always validate on both frontend (Zod) and backend (DTO)
- **Audit trail**: Review audit logs regularly for suspicious changes

### Performance Tips

- Use `useSettings(category)` to load only relevant settings
- Settings are cached, so multiple calls are efficient
- Avoid fetching settings in loops
- Consider caching settings in local storage for public settings

---

## 🎉 You're Ready!

Your Settings module is now fully functional and production-ready. You can:

1. ✅ Configure your platform through the admin UI
2. ✅ Track all changes with audit logs
3. ✅ Use settings in your application code
4. ✅ Add new settings as your platform grows

**Have fun customizing your luxury e-commerce platform!** 🚀

---

**Questions?**
- Check the documentation files for detailed information
- Review the component code for implementation examples
- Test each feature to understand how it works
