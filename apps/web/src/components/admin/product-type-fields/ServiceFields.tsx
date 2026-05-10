'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Clock,
  MapPin,
  Video,
  Globe,
  Link,
  User,
  Calendar,
  Users,
  Shield,
  Check,
  X,
  Plus,
  AlertCircle,
} from 'lucide-react';
import {
  ProductTypeFieldsProps,
  SERVICE_DURATION_UNITS,
  SERVICE_BOOKING_LEAD_TIMES,
  COMMON_CREDENTIALS,
} from './types';

// ─── Availability schedule ────────────────────────────────────────────────────

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface DaySchedule {
  open: boolean;
  from: string;
  to: string;
}

type WeekSchedule = Record<string, DaySchedule>;

const DEFAULT_SCHEDULE: WeekSchedule = {
  Monday: { open: true, from: '09:00', to: '17:00' },
  Tuesday: { open: true, from: '09:00', to: '17:00' },
  Wednesday: { open: true, from: '09:00', to: '17:00' },
  Thursday: { open: true, from: '09:00', to: '17:00' },
  Friday: { open: true, from: '09:00', to: '17:00' },
  Saturday: { open: false, from: '10:00', to: '14:00' },
  Sunday: { open: false, from: '10:00', to: '14:00' },
};

function serializeSchedule(schedule: WeekSchedule): string {
  return DAYS.map((day) => {
    const s = schedule[day];
    return s.open ? `${day}: ${s.from} - ${s.to}` : `${day}: Closed`;
  }).join('\n');
}

function parseSchedule(raw: string): WeekSchedule {
  const schedule: WeekSchedule = {};
  DAYS.forEach((d) => (schedule[d] = { ...DEFAULT_SCHEDULE[d] }));
  if (!raw) return schedule;
  for (const line of raw.split('\n')) {
    for (const day of DAYS) {
      if (line.startsWith(day + ':')) {
        const rest = line.slice(day.length + 1).trim();
        if (rest.toLowerCase() === 'closed') {
          schedule[day] = { ...schedule[day], open: false };
        } else {
          const m = rest.match(/^(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
          if (m) schedule[day] = { open: true, from: m[1], to: m[2] };
        }
      }
    }
  }
  return schedule;
}

function dayDuration(from: string, to: string): string {
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  const mins = th * 60 + tm - (fh * 60 + fm);
  if (mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

// ─── Duration hint ────────────────────────────────────────────────────────────

function getDurationHint(duration?: number, unit?: string): string {
  if (!duration || !unit) return '';
  switch (unit) {
    case 'minutes':
      if (duration < 60) return `${duration} min`;
      if (duration % 60 === 0) return `${duration / 60} hr`;
      return `${Math.floor(duration / 60)} hr ${duration % 60} min`;
    case 'hours':
      return duration === 1 ? '1 hour' : `${duration} hours`;
    case 'days':
      return duration === 1 ? '1 day' : `${duration} days`;
    case 'sessions':
      return duration === 1 ? '1 session' : `${duration} sessions`;
    default:
      return '';
  }
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const INPUT =
  'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#CBB57B]/50 focus:border-[#CBB57B] disabled:bg-gray-50 disabled:text-gray-400 transition-colors';

const LABEL = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

const SECTION = 'bg-white rounded-xl border border-gray-200 p-5 shadow-sm';

const SECTION_TITLE = 'text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2';

// ─── Component ────────────────────────────────────────────────────────────────

export function ServiceFields({
  formData,
  onChange,
  errors = {},
  disabled = false,
}: ProductTypeFieldsProps) {
  const [schedule, setSchedule] = useState<WeekSchedule>(() =>
    parseSchedule(formData.serviceAvailability || '')
  );
  const [newInclude, setNewInclude] = useState('');
  const [newExclude, setNewExclude] = useState('');
  const [newCredential, setNewCredential] = useState('');
  const [photoError, setPhotoError] = useState(false);

  // Sync external data on mount (editing existing product)
  useEffect(() => {
    if (formData.serviceAvailability) {
      setSchedule(parseSchedule(formData.serviceAvailability));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSchedule = (updated: WeekSchedule) => {
    setSchedule(updated);
    onChange('serviceAvailability', serializeSchedule(updated));
  };

  const updateDay = (day: string, patch: Partial<DaySchedule>) =>
    updateSchedule({ ...schedule, [day]: { ...schedule[day], ...patch } });

  // Derived
  const serviceType = formData.serviceType || '';
  const isInPerson = serviceType === 'in_person' || serviceType === 'hybrid';
  const isOnline = serviceType === 'online' || serviceType === 'hybrid';
  const bookingRequired = formData.serviceBookingRequired ?? true;
  const durationHint = getDurationHint(formData.serviceDuration, formData.serviceDurationUnit);
  const maxClientsHint = !formData.serviceMaxClients
    ? 'Unlimited — open to group sessions'
    : formData.serviceMaxClients === 1
      ? '1-on-1 sessions only'
      : `Up to ${formData.serviceMaxClients} clients per session`;

  // Tag handlers
  const addToArray = (field: string, value: string, current: string[]) => {
    const v = value.trim();
    if (v && !current.includes(v)) onChange(field, [...current, v]);
  };
  const removeFromArray = (field: string, value: string, current: string[]) =>
    onChange(
      field,
      current.filter((x) => x !== value)
    );

  return (
    <div className="space-y-5">
      {/* ── 1. Service Details ──────────────────────────────────────────── */}
      <div className={SECTION}>
        <h3 className={SECTION_TITLE}>
          <Briefcase className="w-4 h-4 text-[#CBB57B]" />
          Service Details
        </h3>

        {/* Service Type — visual cards */}
        <div className="mb-5">
          <label className={LABEL}>Service Type *</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'in_person', label: 'In-Person', desc: 'At your location', icon: MapPin },
              { value: 'online', label: 'Online', desc: 'Remote / Virtual', icon: Video },
              { value: 'hybrid', label: 'Hybrid', desc: 'Both options', icon: Globe },
            ].map(({ value, label, desc, icon: Icon }) => {
              const selected = serviceType === value;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange('serviceType', value)}
                  className={`relative flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl border-2 transition-all text-center ${
                    selected
                      ? 'border-[#CBB57B] bg-[#CBB57B]/8 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {selected && (
                    <Check className="absolute top-2 right-2 w-3.5 h-3.5 text-[#CBB57B]" />
                  )}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      selected ? 'bg-[#CBB57B]/15' : 'bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${selected ? 'text-[#CBB57B]' : 'text-gray-500'}`} />
                  </div>
                  <span
                    className={`text-xs font-semibold ${selected ? 'text-[#CBB57B]' : 'text-gray-700'}`}
                  >
                    {label}
                  </span>
                  <span className="text-[10px] text-gray-400 leading-tight">{desc}</span>
                </button>
              );
            })}
          </div>
          {errors.serviceType && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.serviceType}
            </p>
          )}
        </div>

        {/* Duration */}
        <div className="mb-5">
          <label className={LABEL}>
            <Clock className="inline w-3.5 h-3.5 mr-1" />
            Duration
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              min="1"
              value={formData.serviceDuration ?? ''}
              onChange={(e) =>
                onChange('serviceDuration', e.target.value ? parseInt(e.target.value) : undefined)
              }
              disabled={disabled}
              placeholder="e.g., 60"
              className={`${INPUT} flex-1`}
            />
            <select
              value={formData.serviceDurationUnit || ''}
              onChange={(e) => onChange('serviceDurationUnit', e.target.value)}
              disabled={disabled}
              className={`${INPUT} flex-1`}
            >
              <option value="">Select unit...</option>
              {SERVICE_DURATION_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          {durationHint && (
            <p className="mt-1.5 text-xs text-[#6B5840] flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Session length: <strong>{durationHint}</strong>
            </p>
          )}
        </div>

        {/* Location — conditional on service type */}
        {serviceType && (
          <div className="space-y-3">
            {isInPerson && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>
                    <MapPin className="inline w-3.5 h-3.5 mr-1" />
                    Service Address
                  </label>
                  <input
                    type="text"
                    value={formData.serviceLocation || ''}
                    onChange={(e) => onChange('serviceLocation', e.target.value)}
                    disabled={disabled}
                    placeholder="e.g., 123 Main St, Suite 100, New York, NY"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Service Area / Coverage</label>
                  <input
                    type="text"
                    value={formData.serviceArea || ''}
                    onChange={(e) => onChange('serviceArea', e.target.value)}
                    disabled={disabled}
                    placeholder="e.g., Greater New York, Within 30 miles"
                    className={INPUT}
                  />
                </div>
              </div>
            )}
            {isOnline && (
              <div>
                <label className={LABEL}>
                  <Link className="inline w-3.5 h-3.5 mr-1" />
                  {serviceType === 'hybrid' ? 'Online Meeting Platform' : 'Meeting Platform / Link'}
                </label>
                <input
                  type="text"
                  value={
                    serviceType === 'online'
                      ? formData.serviceLocation || ''
                      : formData.serviceArea || ''
                  }
                  onChange={(e) =>
                    onChange(
                      serviceType === 'online' ? 'serviceLocation' : 'serviceArea',
                      e.target.value
                    )
                  }
                  disabled={disabled}
                  placeholder="e.g., Zoom, Google Meet, Teams — or paste your meeting link"
                  className={INPUT}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 2. Booking & Capacity ──────────────────────────────────────── */}
      <div className={SECTION}>
        <h3 className={SECTION_TITLE}>
          <Calendar className="w-4 h-4 text-[#CBB57B]" />
          Booking & Capacity
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Toggle */}
          <div>
            <label className={LABEL}>Booking Required</label>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange('serviceBookingRequired', !bookingRequired)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                bookingRequired ? 'border-[#CBB57B] bg-[#CBB57B]/5' : 'border-gray-200 bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div
                className={`relative w-10 h-5 rounded-full flex-shrink-0 transition-colors ${
                  bookingRequired ? 'bg-[#CBB57B]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                    bookingRequired ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {bookingRequired ? 'Required' : 'Not Required'}
                </p>
                <p className="text-xs text-gray-500">
                  {bookingRequired ? 'Customers book in advance' : 'Walk-in / on-demand'}
                </p>
              </div>
            </button>
          </div>

          {/* Lead Time */}
          <div>
            <label className={`${LABEL} ${!bookingRequired ? 'opacity-40' : ''}`}>
              Booking Lead Time
            </label>
            <select
              value={formData.serviceBookingLeadTime ?? ''}
              onChange={(e) =>
                onChange(
                  'serviceBookingLeadTime',
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              disabled={disabled || !bookingRequired}
              className={`${INPUT} ${!bookingRequired ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <option value="">Select lead time...</option>
              {SERVICE_BOOKING_LEAD_TIMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Max clients */}
          <div>
            <label className={LABEL}>
              <Users className="inline w-3.5 h-3.5 mr-1" />
              Max Clients
            </label>
            <input
              type="number"
              min="1"
              value={formData.serviceMaxClients ?? ''}
              onChange={(e) =>
                onChange('serviceMaxClients', e.target.value ? parseInt(e.target.value) : undefined)
              }
              disabled={disabled}
              placeholder="Leave empty for unlimited"
              className={INPUT}
            />
            <p className="mt-1.5 text-xs text-[#6B5840]">{maxClientsHint}</p>
          </div>
        </div>
      </div>

      {/* ── 3. Availability Schedule ──────────────────────────────────── */}
      <div className={SECTION}>
        <h3 className={SECTION_TITLE}>
          <Calendar className="w-4 h-4 text-[#CBB57B]" />
          Availability Schedule
        </h3>

        <div className="space-y-1.5 mb-4">
          {DAYS.map((day) => {
            const s = schedule[day];
            return (
              <div
                key={day}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-colors ${
                  s.open ? 'border-[#CBB57B]/25 bg-[#CBB57B]/4' : 'border-gray-100 bg-gray-50'
                }`}
              >
                {/* Day toggle */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => updateDay(day, { open: !s.open })}
                  className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors ${
                    s.open ? 'bg-[#CBB57B]' : 'bg-gray-300'
                  } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                      s.open ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>

                {/* Day name */}
                <span
                  className={`text-sm font-medium w-10 flex-shrink-0 ${
                    s.open ? 'text-gray-800' : 'text-gray-400'
                  }`}
                >
                  {day.slice(0, 3)}
                </span>

                {s.open ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={s.from}
                      onChange={(e) => updateDay(day, { from: e.target.value })}
                      disabled={disabled}
                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#CBB57B] focus:border-[#CBB57B] disabled:bg-gray-50 transition-colors"
                    />
                    <span className="text-gray-400 text-sm">–</span>
                    <input
                      type="time"
                      value={s.to}
                      onChange={(e) => updateDay(day, { to: e.target.value })}
                      disabled={disabled}
                      className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#CBB57B] focus:border-[#CBB57B] disabled:bg-gray-50 transition-colors"
                    />
                    {s.from && s.to && dayDuration(s.from, s.to) && (
                      <span className="text-xs text-gray-400 hidden sm:block">
                        {dayDuration(s.from, s.to)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Closed</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick-action shortcuts */}
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              const ref = schedule['Monday'];
              const updated = { ...schedule };
              ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach(
                (d) => (updated[d] = { ...ref, open: true })
              );
              updateSchedule(updated);
            }}
            className="text-xs px-3 py-1.5 rounded-full border border-[#CBB57B]/40 text-[#6B5840] hover:bg-[#CBB57B]/10 transition-colors disabled:opacity-40"
          >
            Copy Mon hours → all weekdays
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              const updated = { ...schedule };
              DAYS.forEach((d) => (updated[d] = { ...updated[d], open: true }));
              updateSchedule(updated);
            }}
            className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            Open all days
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              const updated = { ...schedule };
              ['Saturday', 'Sunday'].forEach((d) => (updated[d] = { ...updated[d], open: false }));
              updateSchedule(updated);
            }}
            className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            Close weekends
          </button>
        </div>
      </div>

      {/* ── 4. Service Provider ───────────────────────────────────────── */}
      <div className={SECTION}>
        <h3 className={SECTION_TITLE}>
          <User className="w-4 h-4 text-[#CBB57B]" />
          Service Provider
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={LABEL}>Provider Name</label>
            <input
              type="text"
              value={formData.serviceProviderName || ''}
              onChange={(e) => onChange('serviceProviderName', e.target.value)}
              disabled={disabled}
              placeholder="e.g., John Smith"
              className={INPUT}
            />
          </div>

          <div>
            <label className={LABEL}>Provider Photo URL</label>
            <div className="flex gap-2 items-center">
              {formData.serviceProviderImage && !photoError && (
                <img
                  src={formData.serviceProviderImage}
                  alt="Provider"
                  onError={() => setPhotoError(true)}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#CBB57B]/30 flex-shrink-0"
                />
              )}
              <input
                type="url"
                value={formData.serviceProviderImage || ''}
                onChange={(e) => {
                  setPhotoError(false);
                  onChange('serviceProviderImage', e.target.value);
                }}
                disabled={disabled}
                placeholder="https://example.com/photo.jpg"
                className={`${INPUT} flex-1`}
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className={LABEL}>Provider Bio</label>
          <textarea
            value={formData.serviceProviderBio || ''}
            onChange={(e) => onChange('serviceProviderBio', e.target.value)}
            disabled={disabled}
            rows={3}
            maxLength={500}
            placeholder="Brief description of the service provider's background and expertise..."
            className={`${INPUT} resize-none`}
          />
          <p className="text-right text-xs text-gray-400 mt-1">
            {(formData.serviceProviderBio || '').length}/500
          </p>
        </div>

        {/* Credentials */}
        <div>
          <label className={LABEL}>
            <Shield className="inline w-3.5 h-3.5 mr-1" />
            Credentials & Certifications
          </label>

          <div className="flex flex-wrap gap-2 mb-3">
            {COMMON_CREDENTIALS.map((cred) => {
              const isAdded = formData.serviceProviderCredentials?.includes(cred);
              return (
                <button
                  key={cred}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    isAdded
                      ? removeFromArray(
                          'serviceProviderCredentials',
                          cred,
                          formData.serviceProviderCredentials || []
                        )
                      : addToArray(
                          'serviceProviderCredentials',
                          cred,
                          formData.serviceProviderCredentials || []
                        )
                  }
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    isAdded
                      ? 'bg-[#CBB57B]/15 border-[#CBB57B] text-[#6B5840]'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-[#CBB57B]/50 hover:text-[#6B5840]'
                  } disabled:opacity-50`}
                >
                  {isAdded ? (
                    <>
                      <Check className="inline w-3 h-3 mr-0.5" />
                      {cred}
                    </>
                  ) : (
                    <>+ {cred}</>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newCredential}
              onChange={(e) => setNewCredential(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addToArray(
                    'serviceProviderCredentials',
                    newCredential,
                    formData.serviceProviderCredentials || []
                  );
                  setNewCredential('');
                }
              }}
              disabled={disabled}
              placeholder="Add custom credential..."
              className={`${INPUT} flex-1`}
            />
            <button
              type="button"
              onClick={() => {
                addToArray(
                  'serviceProviderCredentials',
                  newCredential,
                  formData.serviceProviderCredentials || []
                );
                setNewCredential('');
              }}
              disabled={disabled || !newCredential.trim()}
              className="px-3 py-2.5 bg-[#6B5840] text-white rounded-lg hover:bg-black disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {formData.serviceProviderCredentials?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.serviceProviderCredentials.map((cred: string) => (
                <span
                  key={cred}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#CBB57B]/10 text-[#6B5840] rounded-full text-xs font-medium border border-[#CBB57B]/30"
                >
                  <Shield className="w-3 h-3" />
                  {cred}
                  <button
                    type="button"
                    onClick={() =>
                      removeFromArray(
                        'serviceProviderCredentials',
                        cred,
                        formData.serviceProviderCredentials || []
                      )
                    }
                    disabled={disabled}
                    className="ml-0.5 hover:text-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 5. What's Included / Excluded ─────────────────────────────── */}
      <div className={SECTION}>
        <h3 className={SECTION_TITLE}>
          <Check className="w-4 h-4 text-[#CBB57B]" />
          What&apos;s Included & Excluded
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Includes */}
          <div>
            <label className="block text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
              ✓ Included
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newInclude}
                onChange={(e) => setNewInclude(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('serviceIncludes', newInclude, formData.serviceIncludes || []);
                    setNewInclude('');
                  }
                }}
                disabled={disabled}
                placeholder="Add included item..."
                className={INPUT}
              />
              <button
                type="button"
                onClick={() => {
                  addToArray('serviceIncludes', newInclude, formData.serviceIncludes || []);
                  setNewInclude('');
                }}
                disabled={disabled || !newInclude.trim()}
                className="px-3 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 min-h-[48px]">
              {formData.serviceIncludes?.length > 0 ? (
                formData.serviceIncludes.map((item: string) => (
                  <div
                    key={item}
                    className="flex items-center justify-between px-3 py-2 bg-green-50 rounded-lg border border-green-100 group"
                  >
                    <span className="flex items-center gap-2 text-sm text-green-800">
                      <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      {item}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        removeFromArray('serviceIncludes', item, formData.serviceIncludes || [])
                      }
                      disabled={disabled}
                      className="text-green-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic py-2">Nothing added yet</p>
              )}
            </div>
          </div>

          {/* Excludes */}
          <div>
            <label className="block text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
              ✗ Not Included
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newExclude}
                onChange={(e) => setNewExclude(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('serviceExcludes', newExclude, formData.serviceExcludes || []);
                    setNewExclude('');
                  }
                }}
                disabled={disabled}
                placeholder="Add excluded item..."
                className={INPUT}
              />
              <button
                type="button"
                onClick={() => {
                  addToArray('serviceExcludes', newExclude, formData.serviceExcludes || []);
                  setNewExclude('');
                }}
                disabled={disabled || !newExclude.trim()}
                className="px-3 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 min-h-[48px]">
              {formData.serviceExcludes?.length > 0 ? (
                formData.serviceExcludes.map((item: string) => (
                  <div
                    key={item}
                    className="flex items-center justify-between px-3 py-2 bg-red-50 rounded-lg border border-red-100 group"
                  >
                    <span className="flex items-center gap-2 text-sm text-red-700">
                      <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      {item}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        removeFromArray('serviceExcludes', item, formData.serviceExcludes || [])
                      }
                      disabled={disabled}
                      className="text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic py-2">Nothing added yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. Requirements & Policy ──────────────────────────────────── */}
      <div className={SECTION}>
        <h3 className={SECTION_TITLE}>
          <AlertCircle className="w-4 h-4 text-[#CBB57B]" />
          Requirements & Policies
        </h3>

        <div className="space-y-4">
          <div>
            <label className={LABEL}>Client Requirements</label>
            <textarea
              value={formData.serviceRequirements || ''}
              onChange={(e) => onChange('serviceRequirements', e.target.value)}
              disabled={disabled}
              rows={3}
              placeholder="What clients need to prepare or bring for this service..."
              className={`${INPUT} resize-none`}
            />
          </div>

          <div>
            <label className={LABEL}>Cancellation Policy</label>
            <textarea
              value={formData.serviceCancellationPolicy || ''}
              onChange={(e) => onChange('serviceCancellationPolicy', e.target.value)}
              disabled={disabled}
              rows={3}
              placeholder="e.g., Free cancellation up to 24 hours before scheduled time. 50% fee within 24 hours."
              className={`${INPUT} resize-none`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
