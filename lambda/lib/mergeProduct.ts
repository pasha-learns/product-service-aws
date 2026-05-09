import type { AvailableProduct, ProductRecord, StockRecord } from "../types/product";

export function mergeProductWithStock(
  product: ProductRecord,
  stock: StockRecord | undefined
): AvailableProduct {
  return {
    id: product.id,
    title: product.title,
    description: product.description ?? "",
    price: product.price,
    count: stock?.count ?? 0,
  };
}
