import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`/login?error=google_${error}`);
  }

  if (!code) {
    return NextResponse.redirect("/login?error=no_code");
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
          grant_type: "authorization_code",
        }),
      }
    );

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      return NextResponse.redirect("/login?error=token_failed");
    }

    // Fetch user profile from Google
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    const googleUser = await userResponse.json();

    if (!googleUser.id) {
      return NextResponse.redirect("/login?error=no_google_user");
    }

    // Find or create user
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, `google_${googleUser.id}`))
      .limit(1);

    if (!user) {
      // Check if email already exists (link accounts)
      const [existingEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, googleUser.email))
        .limit(1);

      if (existingEmail) {
        // Link Google to existing account
        await db
          .update(users)
          .set({
            authProvider: "google",
            username: existingEmail.username || `google_${googleUser.id}`,
            emailVerified: googleUser.verified_email ?? false,
          })
          .where(eq(users.id, existingEmail.id));
        user = existingEmail;
      } else {
        // Create new user from Google profile
        const [newUser] = await db
          .insert(users)
          .values({
            username: `google_${googleUser.id}`,
            email: googleUser.email,
            displayName: googleUser.name || googleUser.email,
            avatarUrl: googleUser.picture || "🌪️",
            windBalance: 1000,
            gemBalance: 25,
            level: 1,
            xp: 0,
            title: "Zephyr Novice",
            bio:
              "A new breeze entered the Blessed Winds sanctuary via Google.",
            blessingTier: "Aero Disciple",
            equippedBadge: "🌬️ Wind Whisperer",
            equippedAura: "emerald_breeze",
            streakDays: 1,
            authProvider: "google",
            emailVerified: googleUser.verified_email ?? false,
            isAnonymous: false,
          })
          .returning();
        user = newUser;
      }
    }

    // Create JWT session
    const token = createSessionToken({
      userId: user.id,
      username: user.username ?? "",
      email: user.email ?? "",
    });
    await setSessionCookie(token);

    return NextResponse.redirect("/");
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect("/login?error=oauth_failed");
  }
}
