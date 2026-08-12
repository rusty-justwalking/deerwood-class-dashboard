import { NextResponse } from "next/server";
import { adminCookie, createAdminToken } from "@/lib/auth";

export async function POST(request: Request) {
  const { password } = await request.json();
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookie.name, createAdminToken(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: adminCookie.maxAge });
  return response;
}
