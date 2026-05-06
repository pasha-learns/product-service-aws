import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { mockProducts } from "../data/mockProducts";
import { jsonResponse } from "../lib/responses";


export const handler: APIGatewayProxyHandlerV2 = async () => {
  return jsonResponse(200, mockProducts);
}
