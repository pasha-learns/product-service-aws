import { randomUUID } from "node:crypto";
import type {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { getProductByIdMerged } from "../lib/productDb";
import { jsonResponse } from "../lib/responses";
import { logIncomingRequest } from "../lib/requestLog";

export const handler: APIGatewayProxyHandlerV2 = async (
  event
): Promise<APIGatewayProxyResultV2> => {
  const requestId = randomUUID();
  logIncomingRequest("getProductsById", event);
  try {
    const id = event.pathParameters?.productId;
    if (!id) {
      return jsonResponse(400, { message: "Missing product id" });
    }
    const product = await getProductByIdMerged(id);
    if (!product) {
      return jsonResponse(404, { message: "Product not found" });
    }
    return jsonResponse(200, product);
  } catch (err) {
    console.error(JSON.stringify({ requestId, error: String(err) }));
    return jsonResponse(500, { message: "Internal server error" });
  }
};
