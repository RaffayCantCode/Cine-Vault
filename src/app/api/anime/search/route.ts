import { NextRequest } from "next/server";

const ANIME_API_BASE = "https://anime-site.xo.je/api/v2/anikoto";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q") || "";
  const page = searchParams.get("page") || "1";

  if (!query || query.length < 2) {
    return Response.json({ error: "Query too short" }, { status: 400 });
  }

  try {
    const url = `${ANIME_API_BASE}/search?q=${encodeURIComponent(query)}&page=${page}`;

    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "StreamVault/1.0",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Anime search failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to search anime";
    return Response.json({ error: message }, { status: 500 });
  }
}
