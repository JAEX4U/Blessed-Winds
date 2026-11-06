import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "blessed-winds-dev-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface SessionPayload {
  userId: number;
  username: string;
  email: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("bw_session")?.value;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("bw_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("bw_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Cookie-based math captcha: stores the answer in a client-side cookie
 * so it works across Vercel serverless instances (no in-memory store needed).
 */
export function generateCaptcha(): { question: string; answer: number } {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return {
    question: `What is ${a} + ${b}?`,
    answer: a + b,
  };
}

export async function setCaptchaCookie(answer: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("bw_captcha", String(answer), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 5 * 60, // 5 minutes
    path: "/",
  });
}

export async function verifyCaptchaCookie(answer: number): Promise<boolean> {
  const cookieStore = await cookies();
  const stored = cookieStore.get("bw_captcha")?.value;
  if (!stored) return false;
  const match = parseInt(stored, 10) === answer;
  // Clear the captcha cookie after verification (success or failure)
  cookieStore.set("bw_captcha", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return match;
}

export async function clearCaptchaCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("bw_captcha", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}
