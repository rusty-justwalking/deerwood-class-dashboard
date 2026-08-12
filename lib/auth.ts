import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "deerwood_admin";
const maxAge = 60 * 60 * 8;

function secret() {
  return process.env.AUTH_SECRET ?? "local-development-only-change-me";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function createAdminToken() {
  const expires = Math.floor(Date.now() / 1000) + maxAge;
  const payload = String(expires);
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token?: string) {
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now() / 1000) return false;
  const expected = sign(expires);
  if (signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function isAdmin() {
  return verifyAdminToken((await cookies()).get(COOKIE_NAME)?.value);
}

export const adminCookie = { name: COOKIE_NAME, maxAge };
