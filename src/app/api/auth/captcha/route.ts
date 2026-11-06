import { NextResponse } from "next/server";
import { generateCaptcha, setCaptchaCookie } from "@/lib/auth";

export async function GET() {
  try {
    const captcha = generateCaptcha();
    await setCaptchaCookie(captcha.answer);

    return NextResponse.json({
      question: captcha.question,
    });
  } catch (error) {
    console.error("Captcha error:", error);
    return NextResponse.json({ error: "Failed to generate captcha" }, { status: 500 });
  }
}
