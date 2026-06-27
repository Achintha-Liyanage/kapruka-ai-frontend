export interface Product {
  id: string;
  name: string;
  price: {
    amount: number;
    currency: string;
  };
  compare_at_price?: {
    amount: number;
    currency: string;
  } | null;
  in_stock: boolean;
  stock_level: string;
  image_url?: string;
  category?: {
    id: string;
    name: string;
    slug?: string;
  };
  url?: string;
  description?: string;
  summary?: string;
}

export interface Category {
  name: string;
  url?: string;
  children?: Category[];
}

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  currency: string;
  image_url?: string;
  quantity: number;
  variant?: string; // e.g., "1.5 kg", "Red Roses"
  custom_message?: string; // Cake icing text or flower gift message
}

export interface Recipient {
  name: string;
  phone: string;
}

export interface Delivery {
  address: string;
  city: string;
  location_type: 'house' | 'apartment' | 'office' | 'other';
  date: string; // YYYY-MM-DD
  instructions?: string;
}

export interface Sender {
  name: string;
  anonymous: boolean;
}

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
  type?: 'text' | 'products' | 'categories' | 'order_summary' | 'error';
  products?: Product[];
  categories?: Category[];
  order_ref?: string;
  checkout_url?: string;
}
