import type { APIGatewayProxyResultV2 } from "aws-lambda";

const jsonHeaders: Record<string, string> = {
  "Content-Type": "application/json"
};

export const jsonResponse = (statusCode: number, body: unknown): APIGatewayProxyResultV2 => {
  return {
    statusCode, 
    headers: jsonHeaders,
    body: JSON.stringify(body)
  }
}