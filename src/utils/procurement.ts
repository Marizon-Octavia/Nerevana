/**
 * Pure business logic for procurement, calculations, geolocation distance, and order workflows.
 */

export type OrderStatus = 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ProductItem {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierOrg: string;
  supplierLocation: string;
  lat: number;
  lng: number;
  title: string;
  category: string;
  description: string;
  unit: string;
  price: number;
  moq: number;
  inStock: number;
  leadTimeDays: number;
  rating: number;
}

/**
 * Calculate Haversine distance in miles between two latitude/longitude points.
 */
export function calculateDistanceMiles(coord1: LatLng, coord2: LatLng): number {
  if (
    typeof coord1?.lat !== 'number' ||
    typeof coord1?.lng !== 'number' ||
    typeof coord2?.lat !== 'number' ||
    typeof coord2?.lng !== 'number'
  ) {
    return 0;
  }

  const R = 3958.8; // Earth's radius in miles
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const lat1 = (coord1.lat * Math.PI) / 180;
  const lat2 = (coord2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Calculates line total, institutional tier discount (e.g., 5% off for orders over $500, 10% over $1,500),
 * estimated delivery, and final total.
 */
export function calculateOrderSummary(quantity: number, unitPrice: number) {
  const safeQty = Math.max(0, Math.floor(quantity || 0));
  const safePrice = Math.max(0, unitPrice || 0);
  const subtotal = safeQty * safePrice;

  let discountPercent = 0;
  if (subtotal >= 1500) {
    discountPercent = 0.10; // 10%
  } else if (subtotal >= 500) {
    discountPercent = 0.05; // 5%
  }

  const discountAmount = Math.round(subtotal * discountPercent * 100) / 100;
  const estimatedTax = 0; // Educational institutional tax exemption typically applies
  const total = Math.max(0, Math.round((subtotal - discountAmount + estimatedTax) * 100) / 100);

  return {
    quantity: safeQty,
    unitPrice: safePrice,
    subtotal,
    discountPercent: discountPercent * 100,
    discountAmount,
    total,
  };
}

/**
 * Validates if an order state transition is legal for the given user role.
 */
export function canTransitionStatus(
  current: OrderStatus,
  target: OrderStatus,
  role: 'buyer' | 'supplier'
): boolean {
  if (current === target) return false;
  if (current === 'delivered' || current === 'cancelled') return false; // terminal states

  if (role === 'supplier') {
    if (current === 'pending' && (target === 'confirmed' || target === 'cancelled')) return true;
    if (current === 'confirmed' && target === 'dispatched') return true;
    if (current === 'dispatched' && target === 'delivered') return true;
  }

  if (role === 'buyer') {
    if (current === 'pending' && target === 'cancelled') return true;
    if (current === 'dispatched' && target === 'delivered') return true; // buyer confirming receipt
  }

  return false;
}

/**
 * Filters and ranks product items based on query, category, maximum price, and proximity.
 */
export function filterProducts(
  products: ProductItem[],
  filters: {
    query?: string;
    category?: string;
    maxPrice?: number;
    userLocation?: LatLng | null;
    maxDistanceMiles?: number;
  }
): ProductItem[] {
  const q = (filters.query || '').trim().toLowerCase();
  const cat = (filters.category || '').trim();

  return products.filter((item) => {
    if (cat && cat !== 'All' && item.category !== cat) {
      return false;
    }
    if (filters.maxPrice && item.price > filters.maxPrice) {
      return false;
    }
    if (q) {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchOrg = item.supplierOrg.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchOrg && !matchCat) {
        return false;
      }
    }
    if (filters.userLocation && filters.maxDistanceMiles) {
      const dist = calculateDistanceMiles(filters.userLocation, { lat: item.lat, lng: item.lng });
      if (dist > filters.maxDistanceMiles) {
        return false;
      }
    }
    return true;
  });
}
