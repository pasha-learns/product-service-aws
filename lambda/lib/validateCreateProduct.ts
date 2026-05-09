export interface ValidatedCreateProduct {
  title: string;
  description: string;
  price: number;
  count: number;
}

export function parseCreateProductBody(
  rawBody: string | undefined,
  isBase64Encoded?: boolean
):
  | { ok: true; data: ValidatedCreateProduct }
  | { ok: false; message: string } {
  let text = rawBody ?? "";
  if (!text.trim()) {
    return { ok: false, message: "Request body is required" };
  }
  if (isBase64Encoded) {
    text = Buffer.from(text, "base64").toString("utf8");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, message: "Invalid JSON body" };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, message: "Body must be a JSON object" };
  }
  const o = parsed as Record<string, unknown>;

  const title = o.title;
  if (typeof title !== "string" || title.trim().length === 0) {
    return {
      ok: false,
      message: "title is required and must be a non-empty string",
    };
  }

  let description = "";
  if (o.description !== undefined && o.description !== null) {
    if (typeof o.description !== "string") {
      return { ok: false, message: "description must be a string when provided" };
    }
    description = o.description;
  }

  const price = o.price;
  if (typeof price !== "number" || !Number.isInteger(price) || price < 0) {
    return {
      ok: false,
      message: "price is required and must be a non-negative integer",
    };
  }

  let count = 0;
  if (o.count !== undefined && o.count !== null) {
    if (typeof o.count !== "number" || !Number.isInteger(o.count) || o.count < 0) {
      return {
        ok: false,
        message: "count must be a non-negative integer when provided",
      };
    }
    count = o.count;
  }

  return {
    ok: true,
    data: {
      title: title.trim(),
      description,
      price,
      count,
    },
  };
}
