import { NextRequest } from "next/server";

const ANIME_API_BASE = "https://anime-site.xo.je/api/v2/anikoto";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") || "home";

  try {
    let url: string;

    if (category === "home") {
      url = `${ANIME_API_BASE}/home`;
    } else if (category === "new-releases") {
      url = `${ANIME_API_BASE}/category/new-release?page=1`;
    } else if (category === "popular") {
      url = `${ANIME_API_BASE}/category/most-viewed?page=1`;
    } else if (category === "latest") {
      url = `${ANIME_API_BASE}/category/latest-updated?page=1`;
    } else {
      url = `${ANIME_API_BASE}/home`;
    }

    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "StreamVault/1.0",
      },
      next: { revalidate: 300 }, // cache 5 mins
    });

    if (!res.ok) {
      throw new Error(`Anime API fetch failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to fetch anime content";
    return Response.json({ error: message }, { status: 500 });
  }
}
