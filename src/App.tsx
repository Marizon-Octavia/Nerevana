import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { AppUser, OrderRecord, OrderStatus, UserRole } from './types';
import {
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
  SupplierProfile,
  CatalogItem,
} from './data/mockData';
import Navbar from './components/Navbar';
import QuotaBanner from './components/QuotaBanner';
import SignInModal from './components/SignInModal';
import BuyerMap from './components/BuyerMap';
import BuyerCatalog from './components/BuyerCatalog';
import OrderModal from './components/OrderModal';
import OrdersList from './components/OrdersList';
import SupplierDashboard from './components/SupplierDashboard';
import {
  MapPin,
  Package,
  ClipboardList,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  // Current authenticated user (School Buyer or Supplier)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    // Check url param ?autostart=1
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      return {
        uid: 'demo_school_buyer',
        email: 'procurement@lincolnhigh.edu',
        displayName: 'Sarah Jenkins',
        role: 'buyer',
        organization: 'Lincoln High School',
        address: '350 5th Ave, New York, NY',
        lat: 40.7484,
        lng: -73.9857,
      };
    }
    const saved = localStorage.getItem('nerevana_user') || localStorage.getItem('edusupply_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [suppliers, setSuppliers] = useState<SupplierProfile[]>(INITIAL_SUPPLIERS);
  const [products, setProducts] = useState<CatalogItem[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    // Initial sample procurement orders
    return [
      {
        id: 'po_sample_101',
        buyerId: 'demo_school_buyer',
        buyerName: 'Sarah Jenkins',
        buyerOrg: 'Lincoln High School',
        buyerAddress: 'Lincoln High School, 350 5th Ave, New York, NY',
        supplierId: 'supp_apex',
        supplierName: 'Apex STEM & Stationery Wholesale',
        productId: 'prod_1',
        productTitle: 'Recycled College-Ruled Notebooks (Box of 50)',
        quantity: 10,
        unitPrice: 48.0,
        totalAmount: 480.0,
        deliveryNotes: 'Deliver to front office, Attn: Main Supply Room',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'po_sample_102',
        buyerId: 'demo_school_buyer',
        buyerName: 'Sarah Jenkins',
        buyerOrg: 'Lincoln High School',
        buyerAddress: 'Lincoln High School, 350 5th Ave, New York, NY',
        supplierId: 'supp_biolab',
        supplierName: 'BioSci Academic Laboratory Gear',
        productId: 'prod_3',
        productTitle: 'Compound Monocular Student Microscope 1000x',
        quantity: 4,
        unitPrice: 185.0,
        totalAmount: 703.0,
        deliveryNotes: 'Unpack at Chemistry & Biology Lab 304',
        status: 'dispatched',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  });

  // Buyer navigation view
  const [buyerView, setBuyerView] = useState<'map' | 'catalog' | 'orders'>('map');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterSupplierOrg, setFilterSupplierOrg] = useState<string | null>(null);

  // Active product being ordered in modal
  const [orderingProduct, setOrderingProduct] = useState<CatalogItem | null>(null);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser && !localStorage.getItem('edusupply_user')) {
        // User signed out and no demo saved
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem('nerevana_user', JSON.stringify(user));
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    localStorage.removeItem('nerevana_user');
    localStorage.removeItem('edusupply_user');
    setCurrentUser(null);
  };

  const handleSwitchRole = () => {
    if (!currentUser) return;
    const newRole: UserRole = currentUser.role === 'buyer' ? 'supplier' : 'buyer';
    const updatedUser: AppUser = {
      ...currentUser,
      role: newRole,
      organization:
        newRole === 'buyer' ? 'Lincoln High School' : 'Apex STEM & Stationery Wholesale',
      address:
        newRole === 'buyer' ? '350 5th Ave, New York, NY' : '420 Commercial Blvd, Long Island City, NY',
      lat: newRole === 'buyer' ? 40.7484 : 40.745,
      lng: newRole === 'buyer' ? -73.9857 : -73.948,
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('nerevana_user', JSON.stringify(updatedUser));
  };

  // When a buyer clicks "View Catalog" on a map pin
  const handleSelectSupplierOnMap = (supp: SupplierProfile) => {
    setFilterSupplierOrg(supp.organization);
    setBuyerView('catalog');
  };

  const handleOrderPlaced = (newOrder: OrderRecord) => {
    setOrders((prev) => [newOrder, ...prev]);
    // Switch to orders view to see tracking
    setBuyerView('orders');
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o))
    );
  };

  const handleAddProduct = (newProd: CatalogItem) => {
    setProducts((prev) => [newProd, ...prev]);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleUpdateProduct = (updated: CatalogItem) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans selection:bg-sky-100 selection:text-sky-800">
      {/* Tier 1 & 2 Quota Exceeded Notification */}
      <QuotaBanner />

      {/* Modern Slick Header */}
      <Navbar
        user={currentUser}
        onSignOut={handleSignOut}
        onSwitchRole={handleSwitchRole}
        pendingOrdersCount={pendingCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!currentUser ? (
          <SignInModal onSignInSuccess={handleSignIn} />
        ) : currentUser.role === 'buyer' ? (
          /* BUYER PORTAL (SCHOOLS & INSTITUTIONS) */
          <div className="space-y-4">
            {/* View Switcher Bar for Buyers */}
            <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-sky-100 shadow-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBuyerView('map')}
                  className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    buyerView === 'map'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Supplier Map</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBuyerView('catalog')}
                  className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    buyerView === 'catalog'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Procurement Catalog</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBuyerView('orders')}
                  className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    buyerView === 'orders'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>School Orders ({orders.filter((o) => o.buyerId === currentUser.uid || o.buyerOrg === currentUser.organization).length})</span>
                </button>
              </div>

              <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium pr-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Verified Local Vendors</span>
              </div>
            </div>

            {/* Buyer Sub-Views */}
            {buyerView === 'map' && (
              <BuyerMap
                suppliers={suppliers}
                user={currentUser}
                onSelectSupplier={handleSelectSupplierOnMap}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            )}

            {buyerView === 'catalog' && (
              <BuyerCatalog
                products={products}
                user={currentUser}
                onInitiateOrder={(prod) => setOrderingProduct(prod)}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                filterSupplierOrg={filterSupplierOrg}
                onClearSupplierFilter={() => setFilterSupplierOrg(null)}
              />
            )}

            {buyerView === 'orders' && (
              <OrdersList
                orders={orders.filter(
                  (o) => o.buyerId === currentUser.uid || o.buyerOrg === currentUser.organization
                )}
                user={currentUser}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            )}
          </div>
        ) : (
          /* SELLER / SUPPLIER PORTAL */
          <SupplierDashboard
            user={currentUser}
            products={products}
            orders={orders}
            onAddProduct={handleAddProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateProduct={handleUpdateProduct}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}
      </main>

      {/* Order Procurement Modal */}
      {orderingProduct && currentUser && (
        <OrderModal
          product={orderingProduct}
          user={currentUser}
          onClose={() => setOrderingProduct(null)}
          onOrderPlaced={handleOrderPlaced}
        />
      )}

      {/* Clean minimal mobile bottom navigation bar */}
      {currentUser && currentUser.role === 'buyer' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-sky-100 py-1.5 px-4 flex items-center justify-around shadow-lg">
          <button
            onClick={() => setBuyerView('map')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
              buyerView === 'map' ? 'text-sky-600' : 'text-slate-400'
            }`}
          >
            <MapPin className="w-4 h-4 mb-0.5" />
            <span>Map</span>
          </button>
          <button
            onClick={() => setBuyerView('catalog')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
              buyerView === 'catalog' ? 'text-sky-600' : 'text-slate-400'
            }`}
          >
            <Package className="w-4 h-4 mb-0.5" />
            <span>Catalog</span>
          </button>
          <button
            onClick={() => setBuyerView('orders')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
              buyerView === 'orders' ? 'text-sky-600' : 'text-slate-400'
            }`}
          >
            <ClipboardList className="w-4 h-4 mb-0.5" />
            <span>Orders</span>
          </button>
        </div>
      )}
    </div>
  );
}
