'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Star,
  Calendar
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface CompanyStats {
  provider: {
    id: string;
    name: string;
    logo?: string;
  };
  kpis: {
    totalAssigned: number;
    pendingPickup: number;
    inTransit: number;
    delivered: number;
    averageRating: number;
    totalEarnings: number;
    averageDeliveryTime: number;
    deliveryRate: number;
  };
}

export default function DeliveryCompanyDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_URL}/delivery-company/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-red-500">{error || 'Failed to load data'}</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Assigned',
      value: stats.kpis.totalAssigned,
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Pending Pickup',
      value: stats.kpis.pendingPickup,
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'In Transit',
      value: stats.kpis.inTransit,
      icon: Truck,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Delivered',
      value: stats.kpis.delivered,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Average Rating',
      value: stats.kpis.averageRating.toFixed(1),
      icon: Star,
      color: 'text-[#DDC36C]',
      bgColor: 'bg-[#DDC36C]/10',
      suffix: '/ 5',
    },
    {
      title: 'Total Earnings',
      value: `$${stats.kpis.totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-600/10',
    },
    {
      title: 'Avg. Delivery Time',
      value: stats.kpis.averageDeliveryTime.toFixed(1),
      icon: Calendar,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      suffix: ' days',
    },
    {
      title: 'Success Rate',
      value: `${stats.kpis.deliveryRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: 'Poppins' }}>
                Delivery Company Dashboard
              </h1>
              <p className="text-white/60 mt-1 font-light">
                Welcome, {stats.provider.name}
              </p>
            </div>
            {stats.provider.logo && (
              <img
                src={stats.provider.logo}
                alt={stats.provider.name}
                className="h-16 w-auto object-contain"
              />
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            <button
              onClick={() => router.push('/delivery-company/dashboard')}
              className="text-[#DDC36C] border-b-2 border-[#DDC36C] pb-1 font-medium"
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
              className="text-white/60 hover:text-white transition pb-1 font-medium"
            >
              Drivers
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white/5 border border-gray-200 rounded-lg p-6 hover:bg-white/10 transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-white/60 text-sm font-light">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">
                    {stat.value}
                    {stat.suffix && (
                      <span className="text-sm text-white/60 font-normal ml-1">
                        {stat.suffix}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/delivery-company/deliveries?status=PENDING_PICKUP')}
              className="bg-yellow-500/10 border border-yellow-500/20 hover:border-yellow-500/40 rounded-lg p-4 text-left transition group"
            >
              <Clock className="w-6 h-6 text-yellow-500 mb-2" />
              <h3 className="font-medium group-hover:text-yellow-500 transition">
                View Pending Pickups
              </h3>
              <p className="text-sm text-white/60 mt-1">
                {stats.kpis.pendingPickup} orders waiting
              </p>
            </button>

            <button
              onClick={() => router.push('/delivery-company/deliveries?status=IN_TRANSIT')}
              className="bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/40 rounded-lg p-4 text-left transition group"
            >
              <Truck className="w-6 h-6 text-orange-500 mb-2" />
              <h3 className="font-medium group-hover:text-orange-500 transition">
                Track In Transit
              </h3>
              <p className="text-sm text-white/60 mt-1">
                {stats.kpis.inTransit} active deliveries
              </p>
            </button>

            <button
              onClick={() => router.push('/delivery-company/drivers')}
              className="bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 rounded-lg p-4 text-left transition group"
            >
              <Package className="w-6 h-6 text-blue-500 mb-2" />
              <h3 className="font-medium group-hover:text-blue-500 transition">
                Manage Drivers
              </h3>
              <p className="text-sm text-white/60 mt-1">
                Assign deliveries to team
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
