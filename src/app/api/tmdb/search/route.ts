import { NextRequest } from "next/server";
import { tmdbFetch } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const type = searchParams.get("type") || "multi";
  const page = searchParams.get("page") || "1";

  if (!query) {
    return Response.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    const data = await tmdbFetch(`/search/${type}`, { query, page });
    return Response.json(data);
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Failed to search";
    return Response.json({ error: message }, { status: 500 });
  }
}
