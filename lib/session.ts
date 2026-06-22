import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// jose로 서명한 JWT를 HttpOnly 쿠키에 저장하는 stateless 세션 (ADR 0003).
const key = new TextEncoder().encode(process.env.SESSION_SECRET);
const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30일

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return { userId: payload.userId as string };
  } catch {
    return null; // 위변조/만료된 토큰
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}
