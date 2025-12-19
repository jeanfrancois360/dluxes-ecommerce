'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageLayout } from '@/components/layout/page-layout';
import Link from 'next/link';

type Address = {
  id: string;
  label: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
};

const mockAddresses: Address[] = [
  {
    id: '1',
    label: 'Home',
    name: 'Sarah Johnson',
    street: '123 Main Street, Apt 4B',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
    phone: '+1 (555) 123-4567',
    isDefault: true,
  },
  {
    id: '2',
    label: 'Office',
    name: 'Sarah Johnson',
    street: '456 Business Ave, Suite 200',
    city: 'New York',
    state: 'NY',
    zipCode: '10002',
    country: 'United States',
    phone: '+1 (555) 987-6543',
    isDefault: false,
  },
];

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const deleteAddress = (id: string) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
  };

  const setDefaultAddress = (id: string) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id,
    })));
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-black via-neutral-900 to-black text-white overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-gradient-to-tr from-gold/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[1200px] mx-auto px-4 lg:px-8 py-12">
          {/* Breadcrumbs */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-white/60 mb-6"
          >
            <Link href="/" className="hover:text-gold transition-colors">Home</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/account" className="hover:text-gold transition-colors">Account</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white font-medium">Addresses</span>
          </motion.div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-gold to-gold/80 rounded-2xl flex items-center justify-center shadow-lg shadow-gold/20">
                <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold font-['Poppins'] text-white mb-1">
                  Saved Addresses
                </h1>
                <p className="text-lg text-white/80">Manage your shipping addresses</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-all flex items-center gap-2 shadow-lg shadow-gold/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Address
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-b from-neutral-50 to-white min-h-screen py-12">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8">
          {/* Addresses Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <AnimatePresence>
              {addresses.map((address, index) => (
                <motion.div
                  key={address.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all relative ${
                    address.isDefault ? 'border-2 border-gold' : 'border border-neutral-200'
                  }`}
                >
                  {/* Default Badge */}
                  {address.isDefault && (
                    <span className="absolute top-4 right-4 px-3 py-1 bg-gold text-black text-xs font-semibold rounded-full">
                      Default
                    </span>
                  )}

                  {/* Label */}
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="text-xl font-serif font-bold text-black">{address.label}</span>
                  </div>

                  {/* Address Details */}
                  <div className="space-y-1 text-neutral-700 mb-6">
                    <p className="font-semibold text-black">{address.name}</p>
                    <p>{address.street}</p>
                    <p>{address.city}, {address.state} {address.zipCode}</p>
                    <p>{address.country}</p>
                    <p className="pt-2">{address.phone}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEditingAddress(address)}
                      className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-200 transition-all"
                    >
                      Edit
                    </motion.button>
                    {!address.isDefault && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDefaultAddress(address.id)}
                        className="flex-1 px-4 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-all"
                      >
                        Set Default
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => deleteAddress(address.id)}
                      disabled={address.isDefault}
                      className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add New Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="min-h-[320px] bg-white border-2 border-dashed border-neutral-300 rounded-xl hover:border-gold transition-all flex flex-col items-center justify-center gap-4 text-neutral-500 hover:text-gold"
            >
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-lg font-semibold">Add New Address</span>
            </motion.button>
          </div>

          {/* Add/Edit Modal */}
          <AnimatePresence>
            {(showAddModal || editingAddress) && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingAddress(null);
                  }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                />
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto pointer-events-auto"
                  >
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-serif font-bold text-black">
                          {editingAddress ? 'Edit Address' : 'Add New Address'}
                        </h2>
                        <button
                          onClick={() => {
                            setShowAddModal(false);
                            setEditingAddress(null);
                          }}
                          className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <form className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Address Label (e.g., Home, Office)
                          </label>
                          <input
                            type="text"
                            defaultValue={editingAddress?.label}
                            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-gold focus:outline-none"
                            placeholder="Home"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              First Name
                            </label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-gold focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-gold focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Street Address
                          </label>
                          <input
                            type="text"
                            defaultValue={editingAddress?.street}
                            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-gold focus:outline-none"
                            placeholder="123 Main St, Apt 4B"
                          />
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              City
                            </label>
                            <input
                              type="text"
                              defaultValue={editingAddress?.city}
                              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-gold focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              State
                            </label>
                            <input
                              type="text"
                              defaultValue={editingAddress?.state}
                              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-gold focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                              ZIP Code
                            </label>
                            <input
                              type="text"
                              defaultValue={editingAddress?.zipCode}
                              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-gold focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Country
                          </label>
                          <select className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-gold focus:outline-none">
                            <option>United States</option>
                            <option>Canada</option>
                            <option>United Kingdom</option>
                            <option>Australia</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            defaultValue={editingAddress?.phone}
                            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-gold focus:outline-none"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked={editingAddress?.isDefault}
                            className="w-5 h-5 text-gold border-neutral-300 rounded focus:ring-2 focus:ring-gold/20"
                          />
                          <span className="text-sm text-neutral-700">Set as default address</span>
                        </label>

                        <div className="flex gap-4 pt-6">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            className="flex-1 px-6 py-4 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-all"
                          >
                            {editingAddress ? 'Update Address' : 'Add Address'}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => {
                              setShowAddModal(false);
                              setEditingAddress(null);
                            }}
                            className="flex-1 px-6 py-4 bg-neutral-100 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-200 transition-all"
                          >
                            Cancel
                          </motion.button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageLayout>
  );
}
