'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Package,
  Truck,
  MapPin,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  Upload,
  Camera,
  FileText,
  ArrowLeft,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface DeliveryDetails {
  id: string;
  trackingNumber: string;
  currentStatus: string;
  expectedDeliveryDate?: string;
  createdAt: string;
  deliveryAddress: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    country: string;
    postalCode: string;
  };
  pickupAddress: {
    name: string;
    address1: string;
    city: string;
    country: string;
  };
  order: {
    orderNumber: string;
    total: number;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      product: {
        name: string;
        heroImage?: string;
      };
    }>;
  };
  deliveryPartner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  deliveryFee: number;
  partnerCommission: number;
  proofOfDelivery?: {
    signature?: string;
    photos?: string[];
    notes?: string;
  };
}

export default function DeliveryDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const deliveryId = params.id as string;

  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [proofNotes, setProofNotes] = useState('');

  useEffect(() => {
    fetchDeliveryDetails();
    fetchDrivers();
  }, [deliveryId]);

  const fetchDeliveryDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/delivery-company/deliveries/${deliveryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch delivery details');

      const data = await response.json();
      setDelivery(data);
      setNewStatus(data.currentStatus);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/delivery-company/drivers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch drivers');

      const data = await response.json();
      setDrivers(data.data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriver) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/delivery-company/deliveries/${deliveryId}/assign-driver`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ driverId: selectedDriver }),
        }
      );

      if (!response.ok) throw new Error('Failed to assign driver');

      alert('Driver assigned successfully!');
      fetchDeliveryDetails();
    } catch (err) {
      alert('Failed to assign driver');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (newStatus === delivery?.currentStatus) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/delivery-company/deliveries/${deliveryId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus, notes: statusNotes }),
        }
      );

      if (!response.ok) throw new Error('Failed to update status');

      alert('Status updated successfully!');
      fetchDeliveryDetails();
      setStatusNotes('');
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUploadProof = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/delivery-company/deliveries/${deliveryId}/proof`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            notes: proofNotes,
            // In a real app, you'd upload actual photos/signature here
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to upload proof');

      alert('Proof of delivery uploaded!');
      fetchDeliveryDetails();
      setProofNotes('');
    } catch (err) {
      alert('Failed to upload proof');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading delivery details...
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Delivery not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Deliveries
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: 'Poppins' }}>
                Delivery Details
              </h1>
              <p className="text-white/60 mt-1 font-mono">{delivery.trackingNumber}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/60">Order Number</div>
              <div className="font-semibold text-lg">{delivery.order.orderNumber}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Addresses */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Addresses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-[#DDC36C] mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Pickup Address
                  </h3>
                  <div className="text-sm space-y-1 text-white/80">
                    <p>{delivery.pickupAddress.name}</p>
                    <p>{delivery.pickupAddress.address1}</p>
                    <p>
                      {delivery.pickupAddress.city}, {delivery.pickupAddress.country}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-[#DDC36C] mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Delivery Address
                  </h3>
                  <div className="text-sm space-y-1 text-white/80">
                    <p>{delivery.deliveryAddress.name}</p>
                    <p>{delivery.deliveryAddress.address1}</p>
                    {delivery.deliveryAddress.address2 && (
                      <p>{delivery.deliveryAddress.address2}</p>
                    )}
                    <p>
                      {delivery.deliveryAddress.city}, {delivery.deliveryAddress.province}{' '}
                      {delivery.deliveryAddress.postalCode}
                    </p>
                    <p>{delivery.deliveryAddress.country}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </h2>
              <div className="space-y-3">
                {delivery.order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 pb-3 border-b border-white/10 last:border-0">
                    {item.product.heroImage && (
                      <img
                        src={item.product.heroImage}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-white/60">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${Number(item.price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Order Total:</span>
                  <span>${Number(delivery.order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Current Driver */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Assigned Driver
              </h3>
              {delivery.deliveryPartner ? (
                <div className="space-y-2">
                  <p className="font-medium">
                    {delivery.deliveryPartner.firstName} {delivery.deliveryPartner.lastName}
                  </p>
                  <p className="text-sm text-white/60">{delivery.deliveryPartner.email}</p>
                  {delivery.deliveryPartner.phone && (
                    <p className="text-sm text-white/60">{delivery.deliveryPartner.phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-white/60 mb-4">No driver assigned</p>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Assign/Reassign Driver</label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 mb-3"
                >
                  <option value="">Select a driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.firstName} {driver.lastName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignDriver}
                  disabled={!selectedDriver || updating}
                  className="w-full px-4 py-2 bg-[#DDC36C] hover:bg-[#DDC36C]/90 text-black font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Assigning...' : 'Assign Driver'}
                </button>
              </div>
            </div>

            {/* Update Status */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Update Status
              </h3>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 mb-3"
              >
                <option value="PENDING_PICKUP">Pending Pickup</option>
                <option value="PICKUP_SCHEDULED">Pickup Scheduled</option>
                <option value="PICKED_UP">Picked Up</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
              </select>
              <textarea
                placeholder="Add notes (optional)"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 mb-3 resize-none"
                rows={3}
              />
              <button
                onClick={handleUpdateStatus}
                disabled={newStatus === delivery.currentStatus || updating}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>

            {/* Upload Proof */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Proof of Delivery
              </h3>
              {delivery.proofOfDelivery?.notes && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded text-sm">
                  <p className="text-green-500 font-medium mb-1">Proof uploaded:</p>
                  <p className="text-white/80">{delivery.proofOfDelivery.notes}</p>
                </div>
              )}
              <textarea
                placeholder="Add delivery notes..."
                value={proofNotes}
                onChange={(e) => setProofNotes(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 mb-3 resize-none"
                rows={3}
              />
              <button
                onClick={handleUploadProof}
                disabled={!proofNotes || updating}
                className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Uploading...' : 'Upload Proof'}
              </button>
            </div>

            {/* Financial Info */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Delivery Fee:</span>
                  <span className="font-medium">${Number(delivery.deliveryFee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Your Commission:</span>
                  <span className="font-semibold text-[#DDC36C]">
                    ${Number(delivery.partnerCommission).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
