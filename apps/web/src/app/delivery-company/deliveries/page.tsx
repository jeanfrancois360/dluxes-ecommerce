'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Calendar,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Delivery {
  id: string;
  trackingNumber: string;
  currentStatus: string;
  expectedDeliveryDate?: string;
  createdAt: string;
  deliveryAddress: {
    name: string;
    address1: string;
    city: string;
    country: string;
  };
  order: {
    orderNumber: string;
    total: number;
    status: string;
  };
  deliveryPartner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
  PENDING_PICKUP: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', icon: Clock },
  PICKUP_SCHEDULED: { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: Calendar },
  PICKED_UP: { bg: 'bg-purple-500/10', text: 'text-purple-500', icon: Package },
  IN_TRANSIT: { bg: 'bg-orange-500/10', text: 'text-orange-500', icon: Truck },
  OUT_FOR_DELIVERY: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', icon: MapPin },
  DELIVERED: { bg: 'bg-green-500/10', text: 'text-green-500', icon: CheckCircle },
};

export default function DeliveriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    country: '',
    search: '',
  });

  useEffect(() => {
    fetchDeliveries();
  }, [filters, pagination.page]);

  const fetchDeliveries = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.country && { country: filters.country }),
      });

      const response = await fetch(`${API_URL}/delivery-company/deliveries?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch deliveries');
      }

      const data = await response.json();
      setDeliveries(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_COLORS[status] || {
      bg: 'bg-gray-500/10',
      text: 'text-gray-500',
      icon: Package,
    };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4" />
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const filteredDeliveries = deliveries.filter((delivery) =>
    filters.search
      ? delivery.trackingNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
        delivery.order.orderNumber.toLowerCase().includes(filters.search.toLowerCase())
      : true
  );

  return (
    <div className="min-h-screen bg-white text-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Poppins' }}>
            Assigned Deliveries
          </h1>
          <p className="text-white/60 mt-1 font-light">
            Manage and track all deliveries assigned to your company
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-gray-200">
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
              className="text-[#DDC36C] border-b-2 border-[#DDC36C] pb-1 font-medium"
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
        {/* Filters */}
        <div className="bg-white/5 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search tracking or order number..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full bg-white/5 border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-[#DDC36C]"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="bg-white/5 border border-gray-200 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#DDC36C]"
            >
              <option value="">All Statuses</option>
              <option value="PENDING_PICKUP">Pending Pickup</option>
              <option value="PICKUP_SCHEDULED">Pickup Scheduled</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
            </select>

            {/* Country Filter */}
            <input
              type="text"
              placeholder="Filter by country..."
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
              className="bg-white/5 border border-gray-200 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-[#DDC36C]"
            />
          </div>
        </div>

        {/* Deliveries Table */}
        {loading ? (
          <div className="text-center py-12 text-white/60">Loading deliveries...</div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p>No deliveries found</p>
          </div>
        ) : (
          <>
            <div className="bg-white/5 border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-white/80">
                      Tracking #
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-white/80">
                      Order
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-white/80">
                      Destination
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-white/80">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-white/80">
                      Driver
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-white/80">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredDeliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm">{delivery.trackingNumber}</div>
                        <div className="text-xs text-white/60 mt-1">
                          {new Date(delivery.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{delivery.order.orderNumber}</div>
                        <div className="text-sm text-white/60">
                          ${delivery.order.total.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{delivery.deliveryAddress.city}</div>
                        <div className="text-sm text-white/60">
                          {delivery.deliveryAddress.country}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(delivery.currentStatus)}</td>
                      <td className="px-6 py-4">
                        {delivery.deliveryPartner ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-white/60" />
                            <span className="text-sm">
                              {delivery.deliveryPartner.firstName}{' '}
                              {delivery.deliveryPartner.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-white/40">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            router.push(`/delivery-company/deliveries/${delivery.id}`)
                          }
                          className="text-[#DDC36C] hover:text-[#DDC36C]/80 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-white/60">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} deliveries
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-white/5 border border-gray-200 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 bg-white/5 border border-gray-200 rounded-lg">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPagination({
                      ...pagination,
                      page: Math.min(pagination.totalPages, pagination.page + 1),
                    })
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-white/5 border border-gray-200 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
