import { findProductById, mockProducts } from "../lambda/data/mockProducts";
import { jsonResponse } from "../lambda/lib/responses";

describe("findProductById", () => {
  it("returns product when id exists", () => {
    const expected = mockProducts[0];
    expect(findProductById(expected.id)).toEqual(expected);
  });

  it("returns undefined when id is unknown", () => {
    expect(findProductById("00000000-0000-0000-0000-000000000000")).toBeUndefined();
  });
});

describe("jsonResponse", () => {
  it("serializes body and sets status", () => {
    const res = jsonResponse(404, { message: "Product not found" });
    expect(typeof res).toBe("object");
    expect(res && typeof res === "object" && "statusCode" in res).toBe(true);
    if (typeof res !== "object" || res === null || !("statusCode" in res)) {
      throw new Error("expected structured proxy response");
    }
    expect(res.statusCode).toBe(404);
    expect(res.headers?.["Content-Type"]).toBe("application/json");
    expect(res.body).toBe(JSON.stringify({ message: "Product not found" }));
  });
});
