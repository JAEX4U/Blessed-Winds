import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  });
}
