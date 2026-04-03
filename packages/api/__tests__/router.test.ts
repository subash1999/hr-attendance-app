import { describe, it, expect } from "vitest";
import { createRouter } from "../src/handlers/router.js";
import { buildResponse } from "../src/middleware/index.js";

describe("API Router", () => {
  const routes = [
    {
      method: "GET",
      path: "/employees/me",
      handler: async () => buildResponse(200, { id: "EMP#001" }),
    },
    {
      method: "GET",
      path: "/employees/:id",
      handler: async ({ pathParams }: { pathParams: Record<string, string> }) =>
        buildResponse(200, { id: pathParams["id"] }),
    },
    {
      method: "POST",
      path: "/employees",
      handler: async ({ body }: { body: unknown }) =>
        buildResponse(201, body),
    },
  ];

  const router = createRouter(routes);

  it("routes GET /employees/me", async () => {
    const res = await router({
      httpMethod: "GET",
      path: "/employees/me",
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ id: "EMP#001" });
  });

  it("routes GET /employees/:id with path param", async () => {
    const res = await router({
      httpMethod: "GET",
      path: "/employees/EMP001",
      pathParameters: { id: "EMP001" },
    });
    expect(res.statusCode).toBe(200);
  });

  it("routes POST with body", async () => {
    const res = await router({
      httpMethod: "POST",
      path: "/employees",
      body: JSON.stringify({ name: "Test" }),
    });
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body)).toEqual({ name: "Test" });
  });

  it("returns 404 for unmatched route", async () => {
    const res = await router({
      httpMethod: "DELETE",
      path: "/unknown",
    });
    expect(res.statusCode).toBe(404);
  });

  it("handles OPTIONS preflight", async () => {
    const res = await router({
      httpMethod: "OPTIONS",
      path: "/employees",
    });
    expect(res.statusCode).toBe(200);
  });

  it("returns 500 for handler errors", async () => {
    const errorRouter = createRouter([{
      method: "GET",
      path: "/error",
      handler: async () => { throw new Error("boom"); },
    }]);
    const res = await errorRouter({
      httpMethod: "GET",
      path: "/error",
    });
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe("boom");
  });
});
