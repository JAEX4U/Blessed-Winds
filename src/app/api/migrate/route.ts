import { NextResponse } from "next/server";
import { pool } from "@/db";

export async function POST() {
  try {
    const client = await pool.connect();
    try {
      // Add missing auth columns to the users table (idempotent with IF NOT EXISTS)
      await client.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
        ADD COLUMN IF NOT EXISTS password_hash TEXT,
        ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'credentials',
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;
      `);

      return NextResponse.json({
        success: true,
        message: "Database migration completed successfully",
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Migration failed" },
      { status: 500 }
    );
  }
}
