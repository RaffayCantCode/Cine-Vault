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
      // Get anime details from Jikan
      const jikanData = await Jikan.getAnimeDetails(malId);
      
      if (jikanData.success && jikanData.data) {
        const anime = jikanData.data;
        
        // Get list from Anikoto and find by MAL ID
        try {
          const anikotoList = await fetchAnimeApi(`/home`);
          const animes = anikotoList.data || [];
          const match = animes.find((a: any) => a.mal_id === String(malId) || a.mal_id === malId);
          
          if (match) {
            // Get full details from Anikoto
            const seriesData = await fetchAnimeApi(`/series/${match.id}`);
            return Response.json({
              success: true,
              data: {
                anime: {
                  ...anime,
                  anikotoId: match.id,
                  episodes: seriesData.data?.episodes || [],
                  totalEpisodes: seriesData.data?.totalEpisodes || anime.episodes?.sub || 0,
                },
              },
            });
          }
        } catch (e) {
          console.warn("[Anikoto] Could not find streaming");
        }
        
        // Return Jikan data without streaming
        return Response.json({
          success: true,
          data: {
            anime: {
              ...anime,
              episodes: { sub: anime.episodes?.sub || null, dub: anime.episodes?.dub || null },
            },
          },
        });
      }
    }
    
    // Try as direct Anikoto ID
    const data = await fetchAnimeApi(`/series/${id}`);
    return Response.json(data);
    
  } catch (error) {
    console.error("[Anime Details Error]:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch anime details", success: false },
      { status: 500 }
    );
  }
}