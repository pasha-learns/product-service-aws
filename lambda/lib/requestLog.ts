import type { APIGatewayProxyEventV2 } from "aws-lambda";

export function logIncomingRequest(
  handlerName: string,
  event: APIGatewayProxyEventV2
): void {
  console.log(
    JSON.stringify({
      handler: handlerName,
      method: event.requestContext.http.method,
      path: event.rawPath,
      pathParameters: event.pathParameters ?? null,
      queryStringParameters: event.queryStringParameters ?? null,
      body: event.body ?? null,
      isBase64Encoded: event.isBase64Encoded ?? false,
    })
  );
}
