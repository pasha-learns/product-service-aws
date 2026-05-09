export interface ProductRecord {
  id: string;
  title: string;
  description?: string;
  price: number;
}

export interface StockRecord {
  product_id: string;
  count: number;
}

export interface AvailableProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
}
