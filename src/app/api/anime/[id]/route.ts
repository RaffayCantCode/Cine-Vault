import { NextRequest } from "next/server";
import * as AniPub from "@/lib/anime-fetch-new";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await AniPub.getAnimeDetails(id);
    const links = await AniPub.getStreamingLinks(id);
    
    return Response.json({
      success: true,
      data: {
        anime: {
          ...data.data,
          episodes: links.data?.episodes || [],
          totalEpisodes: links.data?.totalEpisodes || data.data?.episodes?.sub || 0,
        },
      },
    });
  } catch (error) {
    console.error("[Anime Details Error]:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch anime details", success: false },
      { status: 500 }
    );
  }
}