import type { VercelRequest, VercelResponse } from "@vercel/node";
import { startServer } from "../server.js";

// Cache the Express app instance to reuse it across function invocations
let cachedApp: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cachedApp) {
    cachedApp = await startServer();
  }
  return cachedApp(req, res);
}
