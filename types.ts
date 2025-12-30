
export interface Product {
  id: string;
  name: string;
  price: number;
  tag: string;
  category: string;
  description: string;
  icon: string;
  image: string;
  stock?: number;
}

export interface User {
  name: string;
  email: string;
  password?: string;
  joinDate: string;
  wishlist: string[];
  isAdmin?: boolean;
  totalSpent?: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

export interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  user: string;
}

export interface Order {
  id: string;
  userId: string;
  items: string[];
  total: number;
  status: 'PROCESSING' | 'DELIVERED' | 'SHIPPED';
  date: string;
  paymentMethod: 'NEURAL_CREDIT' | 'SIGNAL_TRANSFER';
}

export interface CartItem extends Product {
  quantity: number;
}
