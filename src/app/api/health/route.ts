import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

function describe(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause instanceof Error ? error.cause.message : error.cause ? String(error.cause) : "";
  const code = (error.cause as { code?: string } | undefined)?.code;
  return [error.message, code, cause].filter(Boolean).join(" | ");
}

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (error) {
    // Surfacing the driver message makes a misconfigured DATABASE_URL (wrong
    // pooler host, bad password, SSL mode) diagnosable without runtime logs.
    // The connection string itself is never included.
    return Response.json({ ok: false, error: describe(error) }, { status: 500 });
  }
}
