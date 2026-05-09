import { NextRequest } from "next/server";
import { tmdbFetch } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get("page") || "1";

  try {
    const data = await tmdbFetch("/movie/top_rated", { page });
    return Response.json(data);
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to fetch top rated movies";
    return Response.json({ error: message }, { status: 500 });
  }
}
