import { BatchWriteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { mockProducts } from "../lambda/data/mockProducts";

const productsTable = process.env.PRODUCTS_TABLE_NAME;
const stocksTable = process.env.STOCKS_TABLE_NAME;

if (!productsTable || !stocksTable) {
  console.error(
    "Set PRODUCTS_TABLE_NAME and STOCKS_TABLE_NAME (same names as in AWS Console and CDK context)."
  );
  process.exit(1);
}

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

const productWrites = mockProducts.map((p) => ({
  PutRequest: {
    Item: {
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
    },
  },
}));

const stockWrites = mockProducts.map((p) => ({
  PutRequest: {
    Item: {
      product_id: p.id,
      count: p.count,
    },
  },
}));

async function batchWriteTable(
  tableName: string,
  writes: { PutRequest: { Item: Record<string, unknown> } }[]
): Promise<void> {
  const chunkSize = 25;
  for (let i = 0; i < writes.length; i += chunkSize) {
    const chunk = writes.slice(i, i + chunkSize);
    await client.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: chunk,
        },
      })
    );
  }
}

async function main(): Promise<void> {
  await batchWriteTable(productsTable, productWrites);
  await batchWriteTable(stocksTable, stockWrites);
  console.log(
    `Seeded ${mockProducts.length} products into ${productsTable} and stocks into ${stocksTable}.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
