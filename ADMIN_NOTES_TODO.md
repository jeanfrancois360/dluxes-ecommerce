# Admin Notes Backend Implementation TODO

## Overview
Admin notes functionality has been implemented on the frontend UI but requires backend database schema changes and API endpoints to be fully functional.

## Database Schema Required

### 1. Create AdminNote Model in Prisma Schema

Add this model to `packages/database/prisma/schema.prisma`:

```prisma
model AdminNote {
  id        String   @id @default(cuid())
  userId    String   // Customer this note is about
  adminId   String   // Admin who created the note
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user  User @relation("CustomerNotes", fields: [userId], references: [id], onDelete: Cascade)
  admin User @relation("AdminNoteCreator", fields: [adminId], references: [id])

  @@index([userId])
  @@index([adminId])
  @@map("admin_notes")
}
```

### 2. Update User Model

Add these relations to the User model:

```prisma
model User {
  // ... existing fields ...

  // Admin Notes
  adminNotesCreated AdminNote[] @relation("AdminNoteCreator")
  adminNotesAbout   AdminNote[] @relation("CustomerNotes")
}
```

### 3. Create Migration

```bash
pnpm prisma:migrate dev --name add_admin_notes
```

## Backend API Endpoints Required

### Service: `apps/api/src/admin/admin.service.ts`

Add these methods:

```typescript
/**
 * Get all notes for a customer
 */
async getCustomerNotes(userId: string) {
  return this.prisma.adminNote.findMany({
    where: { userId },
    include: {
      admin: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Create a new note for a customer
 */
async createCustomerNote(userId: string, adminId: string, content: string) {
  return this.prisma.adminNote.create({
    data: {
      userId,
      adminId,
      content,
    },
    include: {
      admin: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Update a note
 */
async updateCustomerNote(noteId: string, content: string) {
  return this.prisma.adminNote.update({
    where: { id: noteId },
    data: { content },
  });
}

/**
 * Delete a note
 */
async deleteCustomerNote(noteId: string) {
  return this.prisma.adminNote.delete({
    where: { id: noteId },
  });
}
```

### Controller: `apps/api/src/admin/admin.controller.ts`

Add these endpoints:

```typescript
// Get customer notes
@Get('users/:id/notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
async getCustomerNotes(@Param('id') userId: string) {
  return this.adminService.getCustomerNotes(userId);
}

// Create customer note
@Post('users/:id/notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
async createCustomerNote(
  @Param('id') userId: string,
  @Req() req,
  @Body() body: { content: string },
) {
  const adminId = req.user.id;
  return this.adminService.createCustomerNote(userId, adminId, body.content);
}

// Update customer note
@Patch('notes/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
async updateCustomerNote(
  @Param('id') noteId: string,
  @Body() body: { content: string },
) {
  return this.adminService.updateCustomerNote(noteId, body.content);
}

// Delete customer note
@Delete('notes/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
async deleteCustomerNote(@Param('id') noteId: string) {
  return this.adminService.deleteCustomerNote(noteId);
}
```

## Frontend API Integration Required

### Update: `apps/web/src/lib/api/admin.ts`

Add these methods:

```typescript
export const adminCustomersApi = {
  // ... existing methods ...

  async getNotes(userId: string): Promise<any[]> {
    const response = await api.get(`/admin/users/${userId}/notes`);
    return response.data || response;
  },

  async createNote(userId: string, content: string): Promise<any> {
    const response = await api.post(`/admin/users/${userId}/notes`, { content });
    return response.data || response;
  },

  async updateNote(noteId: string, content: string): Promise<any> {
    const response = await api.patch(`/admin/notes/${noteId}`, { content });
    return response.data || response;
  },

  async deleteNote(noteId: string): Promise<void> {
    await api.delete(`/admin/notes/${noteId}`);
  },
};
```

## Frontend Component Updates

### Update: `apps/web/src/app/admin/customers/[id]/page.tsx`

The UI is already in place. Just need to:

1. Add state for notes and note input
2. Fetch notes on component mount
3. Wire up the "Add Note" button
4. Display fetched notes
5. Add edit/delete functionality for each note

Example implementation:

```typescript
const [notes, setNotes] = useState<any[]>([]);
const [noteInput, setNoteInput] = useState('');
const [loadingNotes, setLoadingNotes] = useState(false);

// Fetch notes
useEffect(() => {
  async function fetchNotes() {
    try {
      const data = await adminCustomersApi.getNotes(params.id as string);
      setNotes(data);
    } catch (error) {
      console.error('Failed to load notes');
    }
  }
  if (params.id) fetchNotes();
}, [params.id]);

// Add note
const handleAddNote = async () => {
  if (!noteInput.trim()) return;
  setLoadingNotes(true);
  try {
    const newNote = await adminCustomersApi.createNote(params.id as string, noteInput);
    setNotes([newNote, ...notes]);
    setNoteInput('');
    toast.success('Note added');
  } catch (error) {
    toast.error('Failed to add note');
  } finally {
    setLoadingNotes(false);
  }
};
```

## Testing Checklist

- [ ] Migration runs successfully
- [ ] Can create admin notes for customers
- [ ] Can view all notes for a customer
- [ ] Can edit existing notes
- [ ] Can delete notes
- [ ] Notes are ordered by most recent first
- [ ] Notes show admin author information
- [ ] Notes are only visible to admins
- [ ] Customer deletion cascades to delete their notes

## Priority

This feature is LOW PRIORITY for v1.0 launch. The UI framework is in place and can be connected later when database schema changes are approved.

## Estimated Time

- Backend: 1-2 hours
- Frontend integration: 30 minutes
- Testing: 30 minutes
- **Total: ~2-3 hours**
