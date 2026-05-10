import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.TMDB_API_KEY;
  return NextResponse.json({
    keySet: !!key,
    keyLength: key?.length || 0,
    keyPrefix: key?.substring(0, 30) || "none",
    hasValidFormat: key?.startsWith("eyJ") || false
  });
}