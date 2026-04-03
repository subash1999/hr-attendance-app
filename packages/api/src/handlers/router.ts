import { buildResponse, handleError } from "../middleware/index.js";
import type { ApiResponse } from "../middleware/index.js";

export type RouteHandler = (params: {
  claims: Record<string, unknown>;
  pathParams: Record<string, string>;
  queryParams: Record<string, string>;
  body: unknown;
}) => Promise<ApiResponse>;

export interface RouteDefinition {
  readonly method: string;
  readonly path: string;
  readonly handler: RouteHandler;
}

/**
 * Match incoming request to a route and execute the handler.
 */
export function createRouter(routes: readonly RouteDefinition[]) {
  return async (event: {
    httpMethod: string;
    path: string;
    pathParameters?: Record<string, string> | null;
    queryStringParameters?: Record<string, string> | null;
    body?: string | null;
    requestContext?: { authorizer?: { claims?: Record<string, unknown> } };
  }): Promise<ApiResponse> => {
    // Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return buildResponse(200, {});
    }

    // Extract claims
    const claims = event.requestContext?.authorizer?.claims ?? {};

    // Find matching route
    const route = routes.find(
      (r) => r.method === event.httpMethod && matchPath(r.path, event.path),
    );

    if (!route) {
      return handleError("NOT_FOUND", `No handler for ${event.httpMethod} ${event.path}`);
    }

    try {
      const body = event.body ? JSON.parse(event.body) as unknown : null;
      return await route.handler({
        claims,
        pathParams: event.pathParameters ?? {},
        queryParams: event.queryStringParameters ?? {},
        body,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error";
      return buildResponse(500, { error: message });
    }
  };
}

function matchPath(pattern: string, actual: string): boolean {
  const patternParts = pattern.split("/");
  const actualParts = actual.split("/");
  if (patternParts.length !== actualParts.length) return false;

  return patternParts.every((part, i) => {
    if (part.startsWith(":")) return true;
    return part === actualParts[i];
  });
}
