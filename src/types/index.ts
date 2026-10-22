export type UserRole = 'buyer' | 'supplier';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  organization: string;
  address: string;
  lat: number;
  lng: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';

export interface OrderRecord {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerOrg: string;
  buyerAddress: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  deliveryNotes?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}
