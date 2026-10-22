import { useState } from 'react';
import { CatalogItem } from '../data/mockData';
import { AppUser, OrderRecord, OrderStatus } from '../types';
import OrdersList from './OrdersList';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import {
  Package,
  Plus,
  Clock,
  TrendingUp,
  Truck,
  DollarSign,
  MapPin,
  Trash2,
  Edit2,
  Check,
  X,
} from 'lucide-react';

interface SupplierDashboardProps {
  user: AppUser;
  products: CatalogItem[];
  orders: OrderRecord[];
  onAddProduct: (item: CatalogItem) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateProduct: (item: CatalogItem) => void;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
}

export default function SupplierDashboard({
  user,
  products,
  orders,
  onAddProduct,
  onDeleteProduct,
  onUpdateProduct,
  onUpdateOrderStatus,
}: SupplierDashboardProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog' | 'location'>('orders');
  const [showAddModal, setShowAddModal] = useState(false);

  // New product form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Stationery & Paper');
  const [unit, setUnit] = useState('box of 50');
  const [price, setPrice] = useState(25.0);
  const [moq, setMoq] = useState(1);
  const [inStock, setInStock] = useState(100);
  const [leadTimeDays, setLeadTimeDays] = useState(2);
  const [description, setDescription] = useState('');

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);

  // Filter products for this supplier
  const supplierProducts = products.filter(
    (p) => p.supplierId === user.uid || p.supplierOrg === user.organization
  );

  // Filter orders where supplier is this user
  const supplierOrders = orders.filter(
    (o) => o.supplierId === user.uid || o.supplierName === user.organization
  );

  const pendingOrders = supplierOrders.filter((o) => o.status === 'pending');
  const inTransitOrders = supplierOrders.filter((o) => o.status === 'dispatched');
  const totalRevenue = supplierOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newProd: CatalogItem = {
      id: 'prod_' + Date.now().toString(36),
      supplierId: user.uid,
      supplierName: user.displayName,
      supplierOrg: user.organization,
      supplierLocation: user.address || 'New York, NY',
      lat: user.lat || 40.745,
      lng: user.lng || -73.948,
      title: title.trim(),
      category,
      unit,
      price: Number(price) || 10,
      moq: Number(moq) || 1,
      inStock: Number(inStock) || 50,
      leadTimeDays: Number(leadTimeDays) || 2,
      description: description.trim() || 'High-grade educational equipment.',
      rating: 5.0,
    };

    onAddProduct(newProd);
    setShowAddModal(false);
    // Reset form
    setTitle('');
    setDescription('');
    setPrice(25);
  };

  const handleSaveInline = (product: CatalogItem) => {
    onUpdateProduct({
      ...product,
      price: editPrice,
      inStock: editStock,
    });
    setEditingId(null);
  };

  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    'AIzaSyAijIX4EDQ2s3IpQH-ohym0wj78Kt0YFSQ';

  return (
    <div className="w-full space-y-5">
      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-sky-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Active Catalog</span>
            <div className="p-1.5 rounded-md bg-sky-50 text-sky-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">{supplierProducts.length} items</div>
          <span className="text-[10px] text-slate-400">Available to schools</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-sky-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Pending POs</span>
            <div className="p-1.5 rounded-md bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-amber-700">{pendingOrders.length}</div>
          <span className="text-[10px] text-amber-600 font-medium">Requires supplier confirmation</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-sky-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">In Transit</span>
            <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">{inTransitOrders.length}</div>
          <span className="text-[10px] text-slate-400">En route to campuses</span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-sky-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Total Volume</span>
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-700">
            ${totalRevenue.toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Delivered &amp; confirmed</span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-3.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Orders Received ({supplierOrders.length})</span>
            {pendingOrders.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-full text-[10px] font-bold">
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`py-2 px-3.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>My Catalog ({supplierProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('location')}
            className={`py-2 px-3.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'location'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Depot Map</span>
          </button>
        </div>

        {activeTab === 'catalog' && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="py-2 px-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        )}
      </div>

      {/* Tab 1: Orders */}
      {activeTab === 'orders' && (
        <OrdersList
          orders={supplierOrders}
          user={user}
          onUpdateOrderStatus={onUpdateOrderStatus}
        />
      )}

      {/* Tab 2: Catalog Management */}
      {activeTab === 'catalog' && (
        <div className="space-y-3">
          {supplierProducts.length === 0 ? (
            <div className="bg-white p-8 rounded-lg border border-slate-200 text-center">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-700">No items listed yet</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Add supplies and equipment to make them visible to schools on the map and catalog.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-md inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Your First Item</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-sky-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price ($)</th>
                      <th className="py-3 px-4">In Stock</th>
                      <th className="py-3 px-4">MOQ</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {supplierProducts.map((p) => {
                      const isEditing = editingId === p.id;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 max-w-xs font-semibold text-slate-900">
                            {p.title}
                            <span className="block text-[10px] text-slate-400 font-normal">
                              Unit: {p.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.5"
                                value={editPrice}
                                onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 rounded border border-sky-400 text-xs"
                              />
                            ) : (
                              <span className="font-bold text-slate-900">${p.price.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editStock}
                                onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 rounded border border-sky-400 text-xs"
                              />
                            ) : (
                              <span className="text-emerald-600 font-semibold">{p.inStock}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{p.moq}</td>
                          <td className="py-3 px-4 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleSaveInline(p)}
                                  className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  title="Save Changes"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingId(p.id);
                                    setEditPrice(p.price);
                                    setEditStock(p.inStock);
                                  }}
                                  className="p-1.5 rounded-md text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                                  title="Quick Edit Price & Stock"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onDeleteProduct(p.id)}
                                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Depot Location Map */}
      {activeTab === 'location' && (
        <div className="bg-white p-4 rounded-lg border border-sky-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Your Supplier Depot on Google Maps</h4>
              <p className="text-xs text-slate-500">
                Schools discover your inventory and calculate route distances based on this pin.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-sky-50 text-sky-700 rounded-md border border-sky-200">
              {user.organization}
            </span>
          </div>

          <div className="w-full h-80 rounded-lg overflow-hidden border border-slate-200">
            <APIProvider apiKey={apiKey}>
              <Map
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                mapId="DEMO_MAP_ID"
                defaultCenter={{ lat: user.lat || 40.745, lng: user.lng || -73.948 }}
                defaultZoom={13}
                style={{ width: '100%', height: '100%' }}
              >
                <AdvancedMarker
                  position={{ lat: user.lat || 40.745, lng: user.lng || -73.948 }}
                  title={user.organization}
                >
                  <Pin background="#0284c7" borderColor="#0369a1" glyphColor="#ffffff" scale={1.2} />
                </AdvancedMarker>
              </Map>
            </APIProvider>
          </div>
          <p className="text-[11px] text-slate-400">
            Address: <span className="text-slate-700 font-medium">{user.address || 'Long Island City, NY'}</span>
          </p>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-xl p-6 shadow-2xl border border-sky-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add New Catalog Item</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ergonomic Student Desks (Pack of 10)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-md border border-slate-200 bg-white"
                  >
                    <option>Stationery &amp; Paper</option>
                    <option>Lab &amp; Science</option>
                    <option>Classroom Tech</option>
                    <option>Facility &amp; Safety</option>
                    <option>Cafeteria</option>
                    <option>Sports &amp; Physical Ed</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. box of 50, unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-md border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">MOQ</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={moq}
                    onChange={(e) => setMoq(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-md border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={inStock}
                    onChange={(e) => setInStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-md border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lead Time (Days)</label>
                <input
                  type="number"
                  min="1"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details, dimensions, compliance standards..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 px-3 rounded-md border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-xs"
                >
                  Publish Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
