import { NextRequest } from "next/server";
import { fetchAnimeApi } from "@/lib/anime-fetch";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await fetchAnimeApi(`/series/${id}`);
    const rawEpisodes = data?.data?.episodes || [];
    
    const episodes = rawEpisodes.map((ep: any, index: number) => {
      return {
        episodeId: ep.episodeId || `${id}-${index + 1}`,
        episodeNum: Number(ep.episodeNum || index + 1),
        title: ep.title || `Episode ${index + 1}`,
        src: "",
        sources: [],
      };
    });

    return Response.json({
      success: true,
      data: {
        episodes,
        totalEpisodes: episodes.length,
      },
    });
  } catch (error) {
    console.error("[Anime Episodes Error]:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch episodes", success: false },
      { status: 500 }
    );
  }
}
