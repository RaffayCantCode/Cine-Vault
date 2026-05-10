import { NextRequest } from "next/server";
import { fetchAnimeApi } from "@/lib/anime-fetch";
import * as Jikan from "@/lib/jikan-fetch";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const episodeId = searchParams.get("episodeId");
  const animeId = searchParams.get("animeId") || "";
  const episodeNum = searchParams.get("episode") || "1";
  const server = searchParams.get("server") || "default";

  if (!episodeId && !animeId) {
    return Response.json(
      { error: "Missing parameters", success: false },
      { status: 400 }
    );
  }

  try {
    let anikotoId = animeId;
    
    // If animeId looks like a MAL ID (numeric), search Anikoto first
    const malId = parseInt(animeId, 10);
    if (!isNaN(malId)) {
      const jikanData = await Jikan.getAnimeDetails(malId);
      if (jikanData.success && jikanData.data) {
        const searchResult = await fetchAnimeApi(`/api/search?keyword=${encodeURIComponent(jikanData.data.name)}`);
        const animes = searchResult.data || [];
        const match = animes.find((a: any) => 
          a.name.toLowerCase().includes(jikanData.data.name.toLowerCase()) ||
          jikanData.data.name.toLowerCase().includes(a.name.toLowerCase())
        );
        if (match) {
          anikotoId = match.id;
        }
      }
    }
    
    // Get streaming from Anikoto
    const data = await fetchAnimeApi(`/series/${anikotoId}`);
    
    if (data.success && data.data?.episodes) {
      // Find the episode
      const ep = data.data.episodes.find((e: any) => 
        String(e.episodeNum) === String(episodeNum) || e.episodeId === episodeId
      );
      
      if (ep && ep.id) {
        // Get actual streaming links
        const streamData = await fetchAnimeApi(`/episode/${ep.id}`);
        return Response.json({
          success: true,
          data: {
            episode: ep,
            sources: streamData.data?.sources || streamData.data?.video?.sources || [],
          },
        });
      }
    }
    
    // If no Anikoto data, try to return placeholder
    return Response.json({
      success: false,
      error: "No streaming available for this episode",
    });
    
  } catch (error) {
    console.error("[Anime Watch Error]:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch streaming", success: false },
      { status: 500 }
    );
  }
}