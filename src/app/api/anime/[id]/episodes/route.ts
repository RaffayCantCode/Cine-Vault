import { NextRequest } from "next/server";
import { fetchAnimeApi } from "@/lib/anime-fetch";
import * as Jikan from "@/lib/jikan-fetch";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const malId = parseInt(id, 10);
    
    if (!isNaN(malId)) {
      // Get list from Anikoto and find by MAL ID
      try {
        const anikotoList = await fetchAnimeApi(`/home`);
        const animes = anikotoList.data || [];
        const match = animes.find((a: any) => a.mal_id === String(malId) || a.mal_id === malId);
        
        if (match) {
          const seriesData = await fetchAnimeApi(`/series/${match.id}`);
          return Response.json({
            success: true,
            data: {
              episodes: seriesData.data?.episodes || [],
              totalEpisodes: seriesData.data?.totalEpisodes || 0,
            },
          });
        }
      } catch (e) {
        console.warn("[Anikoto] Could not find episodes");
      }
      
      // Fallback to Jikan
      const jikanData = await Jikan.getAnimeDetails(malId);
      if (jikanData.success && jikanData.data) {
        const totalEps = jikanData.data.episodes?.sub || 0;
        const episodes = [];
        for (let i = 1; i <= Math.min(totalEps, 100); i++) {
          episodes.push({ episodeId: `${id}-${i}`, episodeNum: i, title: `Episode ${i}` });
        }
        return Response.json({ success: true, data: { episodes, totalEpisodes: totalEps } });
      }
    }
    
    // Direct Anikoto ID
    const data = await fetchAnimeApi(`/series/${id}`);
    return Response.json({
      success: true,
      data: {
        episodes: data.data?.episodes || [],
        totalEpisodes: data.data?.totalEpisodes || 0,
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