import { useState } from 'react';
import { OrderRecord, OrderStatus, AppUser } from '../types';
import { canTransitionStatus } from '../utils/procurement';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import {
  Clock,
  CheckCircle,
  Truck,
  PackageCheck,
  XCircle,
  ArrowRight,
  Building,
  MapPin,
  Calendar,
} from 'lucide-react';

interface OrdersListProps {
  orders: OrderRecord[];
  user: AppUser;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: typeof Clock }
> = {
  pending: {
    label: 'Pending Approval',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: Clock,
  },
  confirmed: {
    label: 'Order Confirmed',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    icon: CheckCircle,
  },
  dispatched: {
    label: 'Dispatched / In Transit',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered & Received',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    icon: PackageCheck,
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: XCircle,
  },
};

export default function OrdersList({ orders, user, onUpdateOrderStatus }: OrdersListProps) {
  const [filter, setFilter] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setProcessingId(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      onUpdateOrderStatus(orderId, newStatus);
    } catch (err: unknown) {
      console.warn('Could not update in Firestore directly, updating locally:', err);
      onUpdateOrderStatus(orderId, newStatus);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {['all', 'pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
              filter === st
                ? 'bg-sky-600 text-white font-semibold shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-slate-200 text-center">
          <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">No orders found</h4>
          <p className="text-xs text-slate-400 mt-1">
            {user.role === 'buyer'
              ? 'Browse the catalog or map to submit your first purchase order.'
              : 'Incoming orders from schools will be listed here in real-time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const cfg = STATUS_CONFIG[order.status];
            const StatusIcon = cfg.icon;

            return (
              <div
                key={order.id}
                className="bg-white p-4 sm:p-5 rounded-lg border border-sky-100 shadow-xs hover:border-sky-200 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-800">
                      #{order.id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{cfg.label}</span>
                  </div>
                </div>

                {/* Body Row */}
                <div className="py-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Item info */}
                  <div className="md:col-span-2">
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">
                      {order.productTitle}
                    </h4>
                    <p className="text-slate-500 mt-1 text-xs">
                      Quantity: <strong className="text-slate-800 font-semibold">{order.quantity} units</strong> @ ${order.unitPrice.toFixed(2)}
                    </p>

                    {/* Counterpart info */}
                    <div className="mt-2.5 flex flex-wrap gap-y-1 gap-x-4 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-sky-600" />
                        <span>
                          {user.role === 'buyer' ? `Supplier: ${order.supplierName}` : `Institution: ${order.buyerOrg}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[200px]">{order.buyerAddress}</span>
                      </div>
                    </div>

                    {order.deliveryNotes && (
                      <p className="mt-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-200/60">
                        <strong className="text-slate-700">Instructions:</strong> {order.deliveryNotes}
                      </p>
                    )}
                  </div>

                  {/* Pricing and Actions */}
                  <div className="flex flex-col justify-between items-start md:items-end border-t md:border-t-0 pt-2 md:pt-0">
                    <div>
                      <span className="text-[11px] text-slate-400 block text-left md:text-right">
                        Total Amount
                      </span>
                      <span className="text-lg font-bold text-slate-900">
                        ${order.totalAmount.toFixed(2)}
                      </span>
                    </div>

                    {/* Actions based on role and current status */}
                    <div className="mt-3 flex flex-wrap gap-1.5 w-full md:w-auto justify-end">
                      {user.role === 'supplier' && order.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(order.id, 'confirmed')}
                            disabled={processingId === order.id}
                            className="py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
                          >
                            Accept &amp; Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(order.id, 'cancelled')}
                            disabled={processingId === order.id}
                            className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {user.role === 'supplier' && order.status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(order.id, 'dispatched')}
                          disabled={processingId === order.id}
                          className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatch Shipment</span>
                        </button>
                      )}

                      {user.role === 'supplier' && order.status === 'dispatched' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(order.id, 'delivered')}
                          disabled={processingId === order.id}
                          className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mark Delivered</span>
                        </button>
                      )}

                      {user.role === 'buyer' && order.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          disabled={processingId === order.id}
                          className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold transition-colors"
                        >
                          Cancel PO
                        </button>
                      )}

                      {user.role === 'buyer' && order.status === 'dispatched' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(order.id, 'delivered')}
                          disabled={processingId === order.id}
                          className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Confirm Delivery Receipt</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
