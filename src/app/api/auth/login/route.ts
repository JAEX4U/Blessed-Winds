import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  verifyPassword,
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
    const { usernameOrEmail, password, turnstileToken } = body;

    // Validate required fields
    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { error: "Username/email and password are required" },
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

    // Find user by username or email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, usernameOrEmail))
      .limit(1);

    if (!user) {
      // Try email lookup
      const [emailUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, usernameOrEmail))
        .limit(1);
      if (!emailUser) {
        return NextResponse.json(
          { error: "Invalid username/email or password" },
          { status: 401 }
        );
      }
      // Found by email - check if it has a password
      if (!emailUser.passwordHash) {
        return NextResponse.json(
          { error: "Account uses a different sign-in method" },
          { status: 401 }
        );
      }
      const passwordValid = await verifyPassword(
        password,
        emailUser.passwordHash
      );
      if (!passwordValid) {
        return NextResponse.json(
          { error: "Invalid username/email or password" },
          { status: 401 }
        );
      }

      const token = createSessionToken({
        userId: emailUser.id,
        username: emailUser.username ?? "",
        email: emailUser.email ?? "",
      });
      await setSessionCookie(token);

      return NextResponse.json({
        success: true,
        user: {
          id: emailUser.id,
          username: emailUser.username ?? "",
          email: emailUser.email ?? "",
          displayName: emailUser.displayName,
          avatarUrl: emailUser.avatarUrl,
          windBalance: emailUser.windBalance,
          gemBalance: emailUser.gemBalance,
          level: emailUser.level,
          xp: emailUser.xp,
          title: emailUser.title,
        },
        message: "Welcome back to the Blessed Winds sanctuary",
      });
    }

    // Found by username
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Account uses a different sign-in method" },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid username/email or password" },
        { status: 401 }
      );
    }

    // Create session
    const token = createSessionToken({
      userId: user.id,
      username: user.username ?? "",
      email: user.email ?? "",
    });
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username ?? "",
        email: user.email ?? "",
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        windBalance: user.windBalance,
        gemBalance: user.gemBalance,
        level: user.level,
        xp: user.xp,
        title: user.title,
      },
      message: "Welcome back to the Blessed Winds sanctuary",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Failed to sign in" },
      { status: 500 }
    );
  }
}
