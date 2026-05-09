import { mergeProductWithStock } from "../lambda/lib/mergeProduct";
import { parseCreateProductBody } from "../lambda/lib/validateCreateProduct";
import type { ProductRecord, StockRecord } from "../lambda/types/product";

describe("mergeProductWithStock", () => {
  it("merges description default and count from stock", () => {
    const product: ProductRecord = {
      id: "a",
      title: "T",
      price: 1,
    };
    const stock: StockRecord = { product_id: "a", count: 3 };
    expect(mergeProductWithStock(product, stock)).toEqual({
      id: "a",
      title: "T",
      description: "",
      price: 1,
      count: 3,
    });
  });

  it("uses count 0 when stock missing", () => {
    const product: ProductRecord = {
      id: "b",
      title: "T2",
      description: "d",
      price: 2,
    };
    expect(mergeProductWithStock(product, undefined)).toEqual({
      id: "b",
      title: "T2",
      description: "d",
      price: 2,
      count: 0,
    });
  });
});

describe("parseCreateProductBody", () => {
  it("accepts minimal valid body", () => {
    const r = parseCreateProductBody(JSON.stringify({ title: "x", price: 0 }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toEqual({
        title: "x",
        description: "",
        price: 0,
        count: 0,
      });
    }
  });

  it("rejects empty title", () => {
    const r = parseCreateProductBody(JSON.stringify({ title: "  ", price: 1 }));
    expect(r.ok).toBe(false);
  });

  it("rejects non-integer price", () => {
    const r = parseCreateProductBody(
      JSON.stringify({ title: "a", price: 1.5 })
    );
    expect(r.ok).toBe(false);
  });
});
