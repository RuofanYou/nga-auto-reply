import type { AppEnv } from "./types";
import { errorResponse } from "./utils";

async function digestSecret(value: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(digest);
}

async function fixedTimeEqual(left: string, right: string): Promise<boolean> {
  const [leftDigest, rightDigest] = await Promise.all([
    digestSecret(left),
    digestSecret(right),
  ]);
  let difference = 0;
  for (let index = 0; index < leftDigest.length; index += 1) {
    difference |= leftDigest[index]! ^ rightDigest[index]!;
  }
  return difference === 0;
}

export async function requireAdmin(request: Request, env: AppEnv): Promise<Response | null> {
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 24) {
    return errorResponse(
      503,
      "ADMIN_TOKEN_NOT_CONFIGURED",
      "ADMIN_TOKEN is missing or too short. Configure it with wrangler secret put ADMIN_TOKEN.",
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const headerToken = request.headers.get("x-admin-token") ?? "";
  const bearerToken = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
  const supplied = headerToken || bearerToken;

  if (!supplied || !(await fixedTimeEqual(supplied, env.ADMIN_TOKEN))) {
    return errorResponse(401, "UNAUTHORIZED", "A valid administrator token is required.");
  }
  return null;
}
