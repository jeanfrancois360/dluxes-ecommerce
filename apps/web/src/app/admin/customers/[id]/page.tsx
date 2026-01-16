'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { adminCustomersApi } from '@/lib/api/admin';
import { toast, standardToasts } from '@/lib/utils/toast';
import { format } from 'date-fns';
import Link from 'next/link';
import { formatCurrencyAmount } from '@/lib/utils/number-format';

function CustomerDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<any[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    async function fetchCustomer() {
      try {
        setLoading(true);
        const data = await adminCustomersApi.getById(params.id as string);
        setCustomer(data);
      } catch (error) {
        toast.error('Failed to load customer');
        router.push('/admin/customers');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchCustomer();
    }
  }, [params.id, router]);

  // Fetch admin notes
  useEffect(() => {
    async function fetchNotes() {
      try {
        const notesData = await adminCustomersApi.getNotes(params.id as string);
        setNotes(notesData);
      } catch (error) {
        console.error('Failed to load notes');
      }
    }

    if (params.id) {
      fetchNotes();
    }
  }, [params.id]);

  const handleSuspend = async () => {
    if (!confirm('Are you sure you want to suspend this customer?')) return;

    try {
      await adminCustomersApi.suspend(params.id as string);
      toast.success('Customer suspended successfully');
      // Refresh customer data
      const data = await adminCustomersApi.getById(params.id as string);
      setCustomer(data);
    } catch (error) {
      toast.error('Failed to suspend customer');
    }
  };

  const handleActivate = async () => {
    try {
      await adminCustomersApi.activate(params.id as string);
      toast.success('Customer activated successfully');
      // Refresh customer data
      const data = await adminCustomersApi.getById(params.id as string);
      setCustomer(data);
    } catch (error) {
      toast.error('Failed to activate customer');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;

    try {
      await adminCustomersApi.delete(params.id as string);
      toast.success('Customer deleted successfully');
      router.push('/admin/customers');
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  const handleAddNote = async () => {
    if (!noteInput.trim()) {
      toast.error('Please enter a note');
      return;
    }

    setLoadingNotes(true);
    try {
      const newNote = await adminCustomersApi.addNote(params.id as string, noteInput);
      setNotes([newNote, ...notes]);
      setNoteInput('');
      toast.success('Note added');
    } catch (error) {
      toast.error('Failed to add note');
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await adminCustomersApi.deleteNote(params.id as string, noteId);
      setNotes(notes.filter(note => note.id !== noteId));
      toast.success('Note deleted');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-neutral-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#CBB57B] border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-neutral-600 font-medium">Loading customer...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">Customer not found</p>
      </div>
    );
  }

  const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email;
  const isVIP = customer.totalSpent >= 1000;
  const avgOrderValue = customer._count?.orders > 0
    ? customer.totalSpent / customer._count.orders
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-black">{customerName}</h1>
              {isVIP && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  VIP
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                  customer.isActive
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : customer.isSuspended
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                }`}
              >
                {customer.isActive ? 'Active' : customer.isSuspended ? 'Suspended' : 'Inactive'}
              </span>
            </div>
            <p className="text-neutral-600">{customer.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/customers/${params.id}/edit`}
            className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg hover:border-[#CBB57B] hover:text-[#CBB57B] transition-all"
          >
            Edit
          </Link>
          {customer.isActive ? (
            <button
              onClick={handleSuspend}
              className="px-4 py-2 bg-orange-100 border border-orange-200 text-orange-700 rounded-lg hover:bg-orange-200 transition-all"
            >
              Suspend
            </button>
          ) : (
            <button
              onClick={handleActivate}
              className="px-4 py-2 bg-green-100 border border-green-200 text-green-700 rounded-lg hover:bg-green-200 transition-all"
            >
              Activate
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-100 border border-red-200 text-red-700 rounded-lg hover:bg-red-200 transition-all"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <p className="text-sm text-neutral-600 mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-black">{customer._count?.orders || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <p className="text-sm text-neutral-600 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-black">${formatCurrencyAmount(customer.totalSpent || 0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <p className="text-sm text-neutral-600 mb-1">Avg. Order Value</p>
          <p className="text-2xl font-bold text-black">${formatCurrencyAmount(avgOrderValue)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <p className="text-sm text-neutral-600 mb-1">Member Since</p>
          <p className="text-2xl font-bold text-black">
            {format(new Date(customer.createdAt), 'MMM yyyy')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Customer Info */}
        <div className="space-y-6">
          {/* Activity Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-lg font-bold text-black mb-4">Activity Timeline</h2>
            <div className="space-y-4">
              {/* Last Login */}
              {customer.lastLoginAt && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div className="w-px h-full bg-neutral-200 mt-2"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium text-black">Last Login</p>
                    <p className="text-xs text-neutral-600 mt-1">
                      {format(new Date(customer.lastLoginAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              )}

              {/* Account Status Changes */}
              {customer.isSuspended && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </div>
                    <div className="w-px h-full bg-neutral-200 mt-2"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium text-black">Account Suspended</p>
                    <p className="text-xs text-neutral-600 mt-1">Account is currently suspended</p>
                  </div>
                </div>
              )}

              {/* Email Verified */}
              {customer.emailVerified && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="w-px h-full bg-neutral-200 mt-2"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium text-black">Email Verified</p>
                    <p className="text-xs text-neutral-600 mt-1">Email address confirmed</p>
                  </div>
                </div>
              )}

              {/* Recent Orders (show last 3) */}
              {customer.orders && customer.orders.slice(0, 3).map((order: any, index: number) => (
                <div key={order.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    {index < 2 && customer.orders.length > index + 1 && (
                      <div className="w-px h-full bg-neutral-200 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium text-black">Order #{order.orderNumber}</p>
                    <p className="text-xs text-neutral-600 mt-1">
                      {format(new Date(order.createdAt), 'MMM d, yyyy')} • ${formatCurrencyAmount(order.total)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Account Created */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-black">Account Created</p>
                  <p className="text-xs text-neutral-600 mt-1">
                    {format(new Date(customer.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-lg font-bold text-black mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-black">{customer.email}</p>
                  <p className="text-xs text-neutral-600">
                    {customer.emailVerified ? '✓ Verified' : '○ Not verified'}
                  </p>
                </div>
              </div>
              {customer.phone && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black">{customer.phone}</p>
                    <p className="text-xs text-neutral-600">
                      {customer.phoneVerified ? '✓ Verified' : '○ Not verified'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-lg font-bold text-black mb-4">Admin Notes</h2>

            {/* Note Input */}
            <div className="mb-4">
              <textarea
                placeholder="Add a note about this customer..."
                rows={3}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                disabled={loadingNotes}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent resize-none disabled:opacity-50"
              />
              <button
                onClick={handleAddNote}
                disabled={loadingNotes || !noteInput.trim()}
                className="mt-2 w-full px-4 py-2 bg-[#CBB57B] text-white rounded-lg hover:bg-[#a89158] transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingNotes ? 'Adding...' : 'Add Note'}
              </button>
            </div>

            {/* Notes List */}
            <div className="space-y-3">
              {notes.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-4">
                  No notes yet. Admin notes are visible only to administrators.
                </p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs font-semibold text-black">
                        {note.author ? `${note.author.firstName} ${note.author.lastName}` : 'Unknown Admin'}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-neutral-500">
                          {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete note"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-700 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-lg font-bold text-black mb-4">Account Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-neutral-700">Account Status</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    customer.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {customer.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-neutral-200">
                <span className="text-sm text-neutral-700">Email Verified</span>
                <span className={`text-sm font-medium ${customer.emailVerified ? 'text-green-600' : 'text-neutral-600'}`}>
                  {customer.emailVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-neutral-200">
                <span className="text-sm text-neutral-700">Role</span>
                <span className="text-sm font-medium text-neutral-900">{customer.role}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-neutral-200">
                <span className="text-sm text-neutral-700">Last Login</span>
                <span className="text-sm text-neutral-600">
                  {customer.lastLoginAt
                    ? format(new Date(customer.lastLoginAt), 'MMM d, yyyy h:mm a')
                    : 'Never'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-neutral-200">
                <span className="text-sm text-neutral-700">Created</span>
                <span className="text-sm text-neutral-600">
                  {format(new Date(customer.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Orders */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-black">Recent Orders</h2>
              <div className="flex items-center gap-3">
                {customer._count?.orders > 0 && (
                  <span className="text-sm text-neutral-600">
                    {customer._count.orders} total
                  </span>
                )}
                {customer._count?.orders > 10 && (
                  <Link
                    href={`/admin/customers/${params.id}/orders`}
                    className="px-3 py-1.5 text-sm bg-[#CBB57B] text-white rounded-lg hover:bg-[#a89158] transition-all font-medium"
                  >
                    View All
                  </Link>
                )}
              </div>
            </div>

            {customer.orders && customer.orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-black">
                        Order
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-black">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-black">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-black">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {customer.orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-sm font-medium text-[#CBB57B] hover:underline"
                          >
                            #{order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-700">
                          {format(new Date(order.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${
                              order.status === 'DELIVERED'
                                ? 'bg-green-100 text-green-700'
                                : order.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-700'
                                : order.status === 'PROCESSING'
                                ? 'bg-blue-100 text-blue-700'
                                : order.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-black text-right">
                          ${formatCurrencyAmount(order.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-neutral-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-sm text-neutral-600">No orders yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDetailPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <CustomerDetailContent />
      </AdminLayout>
    </AdminRoute>
  );
}
