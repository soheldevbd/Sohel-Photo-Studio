import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest, NextResponse } from "next/server";
import { users, oid } from "./db";
import { HttpError } from "./http";

const COOKIE = "rps_session";
const MAX_AGE = 30 * 86400;
const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET কমপক্ষে ৩২ অক্ষরের হতে হবে (.env.local দেখুন)");
  return new TextEncoder().encode(s);
};

export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const checkPassword = (p: string, h: string) => bcrypt.compare(p, h);
export const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10); // equalises timing when the email is unknown

export const signSession = (uid: string, tv: number) =>
  new SignJWT({ tv }).setProtectedHeader({ alg: "HS256" }).setSubject(uid).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(secret());

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
}
export const clearSessionCookie = (res: NextResponse) => res.cookies.set(COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });

export async function currentUser(req: NextRequest) {
  const t = req.cookies.get(COOKIE)?.value; if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, secret());
    const id = oid(payload.sub); if (!id) return null;
    const u = await (await users()).findOne({ _id: id });
    // tv changes whenever an admin resets the password, which signs out old sessions
    return u && (u.tv || 0) === (payload.tv || 0) ? u : null;
  } catch { return null; }
}
export async function requireUser(req: NextRequest) {
  const u = await currentUser(req);
  if (!u) throw new HttpError(401, "আগে লগইন করুন।", "AUTH");
  if (u.banned && u.role !== "admin") throw new HttpError(403, "এই অ্যাকাউন্ট ব্যান করা হয়েছে।", "BANNED");
  return u;
}
export async function requireAdmin(req: NextRequest) {
  const u = await requireUser(req);
  if (u.role !== "admin") throw new HttpError(403, "শুধু অ্যাডমিন এটা করতে পারবেন।");
  return u;
}
export const effPlan = (u: any) => (u.role === "admin" ? "pro" : u.plan === "pro" && u.proUntil > Date.now() ? "pro" : "free");

export const publicUser = (u: any) => ({
  id: u._id.toString(), email: u.email, name: u.name || "", role: u.role === "admin" ? "admin" : "user",
  plan: u.plan === "pro" ? "pro" : "free", proUntil: u.proUntil || 0, used1080: u.used1080 || 0,
  createdAt: u.createdAt || 0, lastLogin: u.lastLogin || 0, banned: !!u.banned,
});
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 120;
