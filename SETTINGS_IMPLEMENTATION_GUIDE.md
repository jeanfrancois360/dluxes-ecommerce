# 🎯 Settings Module - Production Implementation Guide

## ✅ Completed Infrastructure

### 1. Database Layer
- **SystemSetting** model with CRUD operations  
- **SettingsAuditLog** for change tracking and rollback
- **18 default settings** seeded across 8 categories
- Location: `packages/database/prisma/schema.prisma`

### 2. Backend API
- Full REST API at `/api/v1/settings`
- Endpoints: GET, POST, PATCH, DELETE
- Audit logging on every change
- Rollback functionality
- Location: `apps/api/src/settings/`

### 3. Validation Layer
- Zod schemas for all 8 settings categories
- Cross-field validation
- Type-safe form validation
- Location: `apps/web/src/lib/validations/settings.ts`

### 4. Custom Hooks
- `useSettings(category?)` - Fetch settings with caching
- `useSettingsUpdate()` - Update with optimistic UI
- `useSettingsAudit(key?)` - View change history
- Location: `apps/web/src/hooks/use-settings.ts`

---

## 📦 Settings Categories

### General Settings
- site_name, site_tagline, contact_email
- timezone, maintenance_mode
- allowed_countries

### Payment & Escrow
- **escrow_enabled** (required=true, production-locked)
- escrow_default_hold_days, escrow_auto_release
- min_payout_amount, payout_schedule

### Commission
- global_commission_rate, commission_type
- commission_applies_to_shipping
- Priority: seller_override → category → global

### Currency
- default_currency, supported_currencies
- currency_auto_sync, sync_frequency
- Validation: default must be in supported list

### Delivery
- delivery_confirmation_required (locked=true)
- delivery_auto_assign
- free_shipping_threshold

### Security
- 2fa_required_for_admin
- session_timeout_minutes
- password_min_length, max_login_attempts
- allowed_file_types, max_file_size_mb

### Notifications & SEO
- email/sms notifications
- notification_events array
- seo_meta_title, seo_keywords

---

## 🎨 UI Architecture

### Main Settings Page (`/admin/settings`)

```tsx
<AdminLayout>
  <Tabs defaultValue="general">
    <TabsList>
      - General
      - Payment & Escrow
      - Commission
      - Currency
      - Delivery
      - Security
      - Notifications
      - SEO
    </TabsList>
    
    <TabsContent value="general">
      <GeneralSettingsSection />
    </TabsContent>
    
    // ... other sections
    
    <AuditLogViewer /> // Bottom panel
  </Tabs>
</AdminLayout>
```

### Settings Section Component Pattern

```tsx
function GeneralSettingsSection() {
  const { settings, loading } = useSettings('general');
  const { updateSetting, updating } = useSettingsUpdate();
  
  const form = useForm({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: transformSettings(settings),
  });
  
  const onSubmit = async (data) => {
    // Optimistic update
    for (const [key, value] of Object.entries(data)) {
      await updateSetting(key, value);
    }
    toast.success('Settings saved');
  };
  
  return (
    <Form {...form}>
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField name="site_name" ... />
          <FormField name="site_tagline" ... />
          // ...
        </CardContent>
        <CardFooter>
          <Button disabled={updating}>Save Changes</Button>
        </CardFooter>
      </Card>
    </Form>
  );
}
```

---

## 🔐 Security & Validation

### Frontend Validation (Zod)
- Type checking before API call
- Cross-field rules (e.g., default_currency in supported_currencies)
- Min/max constraints

### Backend Validation (DTO + Prisma)
- Additional server-side validation
- Prevents disabled fields from being edited
- Audit logging with IP + user agent

### Role-Based Access
- **Admin/Super Admin**: Full access to all settings
- **Seller**: Read-only view (commission rates, shipping fees)
- **Customer**: No access (public settings via `/settings/public`)

---

## 🔄 Real-Time Sync Flow

```
User edits form → Zod validation → optimistic UI update
                      ↓
               API PATCH /settings/:key
                      ↓
          Backend validation + audit log
                      ↓
         Database update + return new value
                      ↓
    Frontend confirms/reverts optimistic change
                      ↓
         Toast notification + refresh
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Zod schemas validate correctly
- [ ] Hooks fetch and update settings
- [ ] Audit log creation on every change

### Integration Tests
- [ ] Currency change reflects in cart totals
- [ ] Escrow payout triggered by delivery
- [ ] Commission override applies correctly
- [ ] Ad expiration removes product highlight

### Security Tests
- [ ] Non-admin cannot access settings API
- [ ] Production-locked settings cannot be disabled
- [ ] File uploads validated (type + size)
- [ ] Audit logs capture IP + user agent

---

## 🚀 Deployment Steps

1. **Run migrations**: `pnpm prisma migrate deploy`
2. **Seed settings**: `npx tsx prisma/seed-settings.ts`
3. **Verify API**: `curl http://localhost:4000/api/v1/settings/public`
4. **Test frontend**: Navigate to `/admin/settings`
5. **Check audit logs**: Verify changes are logged
6. **Production lock**: Ensure escrow_enabled cannot be disabled

---

## 💎 Design Tokens

```css
--luxury-black: #000000
--luxury-gold: #CBB57B
--luxury-gray: #C3C9C0
--luxury-white: #FFFFFF

font-family: 'Inter', sans-serif
font-family: 'Playfair Display', serif

transition: all 0.3s ease-in-out
```

---

## 📝 Implementation Status

✅ Database schema  
✅ Backend API with audit logging  
✅ Validation schemas (Zod)  
✅ Custom hooks  
⏳ Main Settings UI (in progress)  
⏳ All section components  
⏳ Consistency validation  
⏳ End-to-end testing

---

## 🔗 API Endpoints Reference

### Public (no auth)
- `GET /settings/public` - Public settings for frontend

### Admin only
- `GET /settings` - All settings
- `GET /settings/:key` - Single setting
- `GET /settings/category/:category` - By category
- `PATCH /settings/:key` - Update setting
- `POST /settings` - Create new setting
- `DELETE /settings/:key` - Delete setting
- `GET /settings/:key/audit` - Audit log for setting
- `GET /settings/admin/audit-logs` - All audit logs
- `POST /settings/rollback` - Rollback to previous value

---

## 📌 Next Steps for Full Completion

1. **Finish Main Settings Page** with tabbed interface
2. **Create all 8 section components** (General, Payment, Commission, etc.)
3. **Add Audit Log Viewer** panel at bottom
4. **Implement Consistency Validator** (detect conflicts)
5. **Add Rollback UI** (revert changes from audit log)
6. **Comprehensive Testing** (unit + integration + e2e)
7. **Documentation** (admin user guide)

---

**Status**: Backend complete, Frontend 40% complete  
**Estimated Time to Complete**: 4-6 hours  
**Priority**: High (production blocker)
