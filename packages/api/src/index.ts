// @willdesign-hr/api — REST API Lambda handlers (composition root)

export { parseAuthContext, validateBody, handleError, buildResponse } from "./middleware/index.js";
export type { ApiResponse } from "./middleware/index.js";
export { createRouter } from "./handlers/router.js";
export type { RouteHandler, RouteDefinition } from "./handlers/router.js";
