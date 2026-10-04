import type { ProductImage } from '@/modules/seller/product/entities/product.entity';

export const ORDER_STATUSES = [
  'assigned',
  'picked_up',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface DeliveryAddress {
  recipientName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode?: string;
  instructions?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  productImage: ProductImage | null;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

export interface AssignedRider {
  profileId: string;
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  vehicleType: string;
  plateNumber: string | null;
}

export interface Order {
  id: string;
  userId: string | null;
  riderProfileId: string | null;
  status: OrderStatus;
  deliveryAddress: DeliveryAddress;
  subtotal: string;
  deliveryFee: string;
  total: string;
  assignedAt: Date;
  pickedUpAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderDetails extends Order {
  items: OrderItem[];
  rider: AssignedRider | null;
}

export type CheckoutFailure =
  | 'EMPTY_CART'
  | 'PRODUCT_UNAVAILABLE'
  | 'INSUFFICIENT_STOCK'
  | 'NO_AVAILABLE_RIDER';

export type CheckoutResult =
  | { order: OrderDetails; failure?: never }
  | { order?: never; failure: CheckoutFailure };
