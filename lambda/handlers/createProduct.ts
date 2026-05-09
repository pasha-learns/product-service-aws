import { randomUUID } from "node:crypto";
import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { createProductTransactional } from "../lib/productDb";
import { jsonResponse } from "../lib/responses";
import { logIncomingRequest } from "../lib/requestLog";
import { parseCreateProductBody } from "../lib/validateCreateProduct";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const requestId = randomUUID();
  logIncomingRequest("createProduct", event);
  try {
    const parsed = parseCreateProductBody(
      event.body,
      event.isBase64Encoded ?? false
    );
    if (!parsed.ok) {
      return jsonResponse(400, { message: parsed.message });
    }
    const id = randomUUID();
    const created = await createProductTransactional(parsed.data, id);
    return jsonResponse(201, created);
  } catch (err) {
    console.error(JSON.stringify({ requestId, error: String(err) }));
    return jsonResponse(500, { message: "Internal server error" });
  }
};
