import { NextResponse } from "next/server";
import { pool } from "@/db";

async function runMigration() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
        ADD COLUMN IF NOT EXISTS password_hash TEXT,
        ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'credentials',
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;
    `);
  } finally {
    client.release();
  }
}

export async function GET() {
  try {
    await runMigration();
    return NextResponse.json({
      success: true,
      message: "Database migration completed successfully",
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
