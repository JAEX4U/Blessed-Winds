import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (error) {
    // Surfacing the driver message makes misconfigured DATABASE_URL values
    // (wrong host/pooler, bad password, missing SSL) obvious without digging
    // through runtime logs. It never includes the connection string itself.
    const message = error instanceof Error ? error.message : "Unknown database error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
