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

// Simple math captcha: generates a question and answer
export function generateCaptcha(): { question: string; answer: number } {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return {
    question: `What is ${a} + ${b}?`,
    answer: a + b,
  };
}

// Store captcha answers temporarily (in-memory, keyed by session/IP)
// In production, use Redis or a proper store
const captchaStore = new Map<string, { answer: number; expiresAt: number }>();

export function setCaptchaAnswer(key: string, answer: number): void {
  captchaStore.set(key, { answer, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 min
}

export function verifyCaptchaAnswer(key: string, answer: number): boolean {
  const entry = captchaStore.get(key);
  if (!entry || entry.expiresAt < Date.now()) return false;
  captchaStore.delete(key);
  return entry.answer === answer;
}

export function getCaptchaKey(reqHeaders: Headers): string {
  // Use a combination of headers as a simple fingerprint
  const forwarded = reqHeaders.get("x-forwarded-for");
  const ua = reqHeaders.get("user-agent");
  return `captcha:${forwarded ?? "unknown"}:${ua ?? "unknown"}`;
}
