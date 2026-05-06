import type {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { findProductById } from "../data/mockProducts";
import { jsonResponse } from "../lib/responses";

export const handler: APIGatewayProxyHandlerV2 = async (
  event
): Promise<APIGatewayProxyResultV2> => {
  const id = event.pathParameters?.productId;
  if (!id) {
    return jsonResponse(400, { message: "Missing product id" });
  }
  const product = findProductById(id);
  if (!product) {
    return jsonResponse(404, { message: "Product not found" });
  }
  return jsonResponse(200, product);
};
