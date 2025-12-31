
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
}

export interface Order {
  id: string;
  userId: string;
  items: { productId: string; name: string; quantity: number; price: number }[];
  total: number;
  status: 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
  date: string;
  paymentMethod: string;
}

export interface CartItem extends Product {
  quantity: number;
}
