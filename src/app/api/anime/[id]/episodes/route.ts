import { NextRequest } from "next/server";

const ANIME_API_BASE = "https://anime-site.xo.je/api/v2/anikoto";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await fetch(`${ANIME_API_BASE}/anime/${id}/episodes`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "StreamVault/1.0",
      },
      next: { revalidate: 120 },
    });

    if (!res.ok) {
      throw new Error(`Anime episodes API failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to fetch anime episodes";
    return Response.json({ error: message }, { status: 500 });
  }
}
