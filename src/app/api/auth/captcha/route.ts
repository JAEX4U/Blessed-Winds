import { NextResponse } from "next/server";
import { generateCaptcha, setCaptchaAnswer, getCaptchaKey } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const captcha = generateCaptcha();
    const key = getCaptchaKey(request.headers);
    setCaptchaAnswer(key, captcha.answer);

    return NextResponse.json({
      key,
      question: captcha.question,
    });
  } catch (error) {
    console.error("Captcha error:", error);
    return NextResponse.json({ error: "Failed to generate captcha" }, { status: 500 });
  }
}
