
export interface Product {
  id: string;
  name: string;
  price: number;
  tag: string;
  category: string;
  description: string;
  icon: string;
  image: string;
}

export interface User {
  name: string;
  email: string;
  joinDate: string;
}

export interface Order {
  id: string;
  items: string[];
  total: number;
  status: 'PROCESSING' | 'DELIVERED' | 'SHIPPED';
  date: string;
}

export interface CartItem extends Product {
  quantity: number;
}
