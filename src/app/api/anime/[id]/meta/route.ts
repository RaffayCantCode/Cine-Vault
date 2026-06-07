import { NextRequest } from "next/server";
import { getAnimeDetails } from "@/lib/anime-fetch";
import { searchTmdbShow } from "@/lib/tmdb";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await getAnimeDetails(id, 100, true);
    if (!data) {
      return Response.json(
        { error: "Anime not found", success: false },
        { status: 404 }
      );
    }

    const { anime, totalEpisodes, seasons, openedSeasonId, franchiseNodes } = data;

    // Look up TMDB show ID once for the franchise (used by the page for TMDB episode data)
    let tmdbId: number | null = null;
    try {
      tmdbId = await searchTmdbShow(anime.name, anime.seasonYear || undefined);
      if (!tmdbId && anime.jname) {
        tmdbId = await searchTmdbShow(anime.jname, anime.seasonYear || undefined);
      }
    } catch {
      tmdbId = null;
    }

    return Response.json({
      success: true,
      data: {
        anime: {
          ...anime,
          totalEpisodes,
          seasons,
          openedSeasonId,
          tmdbId,
        },
        franchiseNodes,
      },
    });
  } catch (error) {
    console.error("[Anime Meta Error]:", error);
    return Response.json(
      { error: "Failed to fetch anime details", success: false },
      { status: 500 }
    );
  }
}