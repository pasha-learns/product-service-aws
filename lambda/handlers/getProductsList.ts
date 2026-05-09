import { randomUUID } from "node:crypto";
import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { listProductsMerged } from "../lib/productDb";
import { jsonResponse } from "../lib/responses";
import { logIncomingRequest } from "../lib/requestLog";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const requestId = randomUUID();
  logIncomingRequest("getProductsList", event);
  try {
    const products = await listProductsMerged();
    return jsonResponse(200, products);
  } catch (err) {
    console.error(JSON.stringify({ requestId, error: String(err) }));
    return jsonResponse(500, { message: "Internal server error" });
  }
};
