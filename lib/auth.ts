import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac } from "crypto";
import { prisma } from "./db";

const COOKIE_NAME = "wh_session";
const SECRET = process.env.SESSION_SECRET || "dev-secret";

function sign(value: string) {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

export async function createSession(userId: number) {
  const value = String(userId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${value}.${sign(value)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.SECURE_COOKIES === "true", // set only on the HTTPS cloud
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const [value, sig] = raw.split(".");
  if (!value || sig !== sign(value)) return null;
  const user = await prisma.user.findUnique({ where: { id: Number(value) } });
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
