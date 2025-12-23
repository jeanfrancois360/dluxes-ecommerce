'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Mail,
  Package,
  CheckCircle,
  Star,
  Truck,
} from 'lucide-react';

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  deliveryAssignments: Array<{
    id: string;
    currentStatus: string;
    trackingNumber: string;
  }>;
  stats: {
    totalAssigned: number;
    activeDeliveries: number;
    deliveredCount: number;
    averageRating: number;
  };
}

export default function DriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/v1/delivery-company/drivers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }

      const data = await response.json();
      setDrivers(data.data);
      setProvider(data.provider);
    } catch (err) {
      console.error('Error fetching drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Poppins' }}>
            Team Drivers
          </h1>
          <p className="text-white/60 mt-1 font-light">
            Manage your delivery team and their performance
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            <button
              onClick={() => router.push('/delivery-company/dashboard')}
              className="text-white/60 hover:text-white transition pb-1 font-medium"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/delivery-company/deliveries')}
              className="text-white/60 hover:text-white transition pb-1 font-medium"
            >
              Deliveries
            </button>
            <button
              onClick={() => router.push('/delivery-company/drivers')}
              className="text-[#DDC36C] border-b-2 border-[#DDC36C] pb-1 font-medium"
            >
              Drivers
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12 text-white/60">Loading drivers...</div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <User className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p>No drivers found</p>
            <p className="text-sm mt-2">
              Contact admin to add delivery partners to your company
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition"
              >
                {/* Driver Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-[#DDC36C]/20 flex items-center justify-center">
                    {driver.avatar ? (
                      <img
                        src={driver.avatar}
                        alt={`${driver.firstName} ${driver.lastName}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-[#DDC36C]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {driver.firstName} {driver.lastName}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-[#DDC36C] fill-[#DDC36C]" />
                      <span className="text-sm text-white/80">
                        {driver.stats.averageRating > 0
                          ? driver.stats.averageRating.toFixed(1)
                          : 'No ratings'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{driver.email}</span>
                  </div>
                  {driver.phone && (
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Phone className="w-4 h-4" />
                      <span>{driver.phone}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-white/10">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Truck className="w-4 h-4 text-orange-500" />
                      <span className="text-2xl font-bold">
                        {driver.stats.activeDeliveries}
                      </span>
                    </div>
                    <p className="text-xs text-white/60">Active</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-2xl font-bold">
                        {driver.stats.deliveredCount}
                      </span>
                    </div>
                    <p className="text-xs text-white/60">Delivered</p>
                  </div>
                </div>

                {/* Total Assigned */}
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-white/60">Total Assigned:</span>
                  <span className="font-semibold">{driver.stats.totalAssigned}</span>
                </div>

                {/* Active Deliveries List */}
                {driver.deliveryAssignments.length > 0 && (
                  <div className="mb-4 pt-4 border-t border-white/10">
                    <p className="text-xs font-semibold text-white/80 mb-2">
                      Current Deliveries:
                    </p>
                    <div className="space-y-1">
                      {driver.deliveryAssignments.slice(0, 3).map((delivery) => (
                        <div
                          key={delivery.id}
                          className="text-xs text-white/60 font-mono"
                        >
                          {delivery.trackingNumber}
                        </div>
                      ))}
                      {driver.deliveryAssignments.length > 3 && (
                        <div className="text-xs text-[#DDC36C]">
                          +{driver.deliveryAssignments.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <button
                  onClick={() =>
                    router.push(
                      `/delivery-company/deliveries?driver=${driver.id}`
                    )
                  }
                  className="w-full px-4 py-2 bg-[#DDC36C] hover:bg-[#DDC36C]/90 text-black font-medium rounded-lg transition"
                >
                  View Deliveries
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
