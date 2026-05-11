import { NextRequest } from "next/server";
import * as AniPub from "@/lib/anime-fetch-new";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get streaming links from AniPub which includes episode info
    const links = await AniPub.getStreamingLinks(id);
    
    if (links.success && links.data?.episodes?.length > 0) {
      return Response.json({
        success: true,
        data: {
          episodes: links.data.episodes,
          totalEpisodes: links.data.totalEpisodes,
        },
      });
    }
    
    // If no streaming links, try to get details for episode count
    const details = await AniPub.getAnimeDetails(id);
    const totalEps = details.data?.episodes?.sub || 0;
    
    // Generate placeholder episodes if we have count
    if (totalEps > 0) {
      const episodes = [];
      for (let i = 1; i <= Math.min(totalEps, 100); i++) {
        episodes.push({ episodeId: `${id}-${i}`, episodeNum: i, title: `Episode ${i}` });
      }
      return Response.json({ success: true, data: { episodes, totalEpisodes: totalEps } });
    }
    
    return Response.json({ 
      success: true, 
      data: { 
        episodes: [{ episodeId: "1", episodeNum: 1, title: "Episode 1" }],
        totalEpisodes: 1 
      } 
    });
    
  } catch (error) {
    console.error("[Anime Episodes Error]:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch episodes", success: false },
      { status: 500 }
    );
  }
}