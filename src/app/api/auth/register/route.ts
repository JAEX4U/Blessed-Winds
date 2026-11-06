import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";

async function verifyTurnstile(token: string): Promise<boolean> {
  const verifyResponse = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY!,
        response: token,
      }),
    }
  );
  const result = await verifyResponse.json();
  return result.success === true;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, turnstileToken } = body;

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Verify Turnstile captcha
    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Captcha verification required" },
        { status: 400 }
      );
    }

    if (!(await verifyTurnstile(turnstileToken))) {
      return NextResponse.json(
        { error: "Invalid or expired captcha" },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email,
        passwordHash,
        displayName: username,
        avatarUrl: "🌪️",
        windBalance: 1000,
        gemBalance: 25,
        level: 1,
        xp: 0,
        title: "Zephyr Novice",
        bio: "A new breeze has entered the Blessed Winds sanctuary.",
        blessingTier: "Aero Disciple",
        equippedBadge: "🌬️ Wind Whisperer",
        equippedAura: "emerald_breeze",
        streakDays: 1,
        authProvider: "credentials",
        emailVerified: false,
        isAnonymous: false,
      })
      .returning();

    // Create session
    const token = createSessionToken({
      userId: newUser.id,
      username: newUser.username ?? "",
      email: newUser.email ?? "",
    });
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username ?? "",
        email: newUser.email ?? "",
        displayName: newUser.displayName,
        avatarUrl: newUser.avatarUrl,
        windBalance: newUser.windBalance,
        gemBalance: newUser.gemBalance,
        level: newUser.level,
        xp: newUser.xp,
        title: newUser.title,
      },
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
