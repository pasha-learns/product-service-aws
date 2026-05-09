import {
  BatchGetCommand,
  GetCommand,
  ScanCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import type { AvailableProduct, ProductRecord, StockRecord } from "../types/product";
import { getDocumentClient } from "./dynamo";
import { mergeProductWithStock } from "./mergeProduct";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return v;
}

const BATCH_SIZE = 100;

async function batchGetStocks(
  productIds: string[]
): Promise<Map<string, StockRecord>> {
  const map = new Map<string, StockRecord>();
  if (productIds.length === 0) {
    return map;
  }
  const doc = getDocumentClient();
  const stocksTable = requireEnv("STOCKS_TABLE_NAME");

  for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
    const slice = productIds.slice(i, i + BATCH_SIZE);
    const keys = slice.map((id) => ({ product_id: id }));
    let requestKeys = keys;
    let attempts = 0;
    while (requestKeys.length > 0 && attempts < 5) {
      attempts += 1;
      const batch = await doc.send(
        new BatchGetCommand({
          RequestItems: {
            [stocksTable]: { Keys: requestKeys },
          },
        })
      );
      const items = batch.Responses?.[stocksTable] as StockRecord[] | undefined;
      for (const s of items ?? []) {
        map.set(s.product_id, s);
      }
      const unprocessed = batch.UnprocessedKeys?.[stocksTable]?.Keys as
        | { product_id: string }[]
        | undefined;
      requestKeys = unprocessed ?? [];
    }
  }
  return map;
}

export async function listProductsMerged(): Promise<AvailableProduct[]> {
  const doc = getDocumentClient();
  const productsTable = requireEnv("PRODUCTS_TABLE_NAME");

  const productRows: ProductRecord[] = [];
  let startKey: Record<string, unknown> | undefined;

  do {
    const out = await doc.send(
      new ScanCommand({
        TableName: productsTable,
        ExclusiveStartKey: startKey,
      })
    );
    for (const item of out.Items ?? []) {
      productRows.push(item as ProductRecord);
    }
    startKey = out.LastEvaluatedKey;
  } while (startKey);

  const stockMap = await batchGetStocks(productRows.map((p) => p.id));

  return productRows.map((p) =>
    mergeProductWithStock(p, stockMap.get(p.id))
  );
}

export async function getProductByIdMerged(
  id: string
): Promise<AvailableProduct | null> {
  const doc = getDocumentClient();
  const productsTable = requireEnv("PRODUCTS_TABLE_NAME");
  const stocksTable = requireEnv("STOCKS_TABLE_NAME");

  const productRes = await doc.send(
    new GetCommand({
      TableName: productsTable,
      Key: { id },
    })
  );
  if (!productRes.Item) {
    return null;
  }
  const product = productRes.Item as ProductRecord;

  const stockRes = await doc.send(
    new GetCommand({
      TableName: stocksTable,
      Key: { product_id: id },
    })
  );
  const stock = stockRes.Item as StockRecord | undefined;

  return mergeProductWithStock(product, stock);
}

export interface CreateProductInput {
  title: string;
  description: string;
  price: number;
  count: number;
}

export async function createProductTransactional(
  input: CreateProductInput,
  id: string
): Promise<AvailableProduct> {
  const doc = getDocumentClient();
  const productsTable = requireEnv("PRODUCTS_TABLE_NAME");
  const stocksTable = requireEnv("STOCKS_TABLE_NAME");

  const productItem: ProductRecord = {
    id,
    title: input.title,
    description: input.description,
    price: input.price,
  };
  const stockItem: StockRecord = {
    product_id: id,
    count: input.count,
  };

  await doc.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: productsTable,
            Item: productItem,
          },
        },
        {
          Put: {
            TableName: stocksTable,
            Item: stockItem,
          },
        },
      ],
    })
  );

  return mergeProductWithStock(productItem, stockItem);
}
