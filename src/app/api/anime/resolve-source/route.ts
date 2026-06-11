import { NextRequest, NextResponse } from "next/server";

async function testUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(1500),
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const provider = searchParams.get("provider") || "";
  
  // Clean IDs by removing tmdb- prefix and any non-numeric characters for safety
  const cleanId = (id: string | null) => {
    if (!id || id.startsWith("tmdb-")) return null;
    return id.replace(/\D/g, "");
  };

  const currentAnilistId = cleanId(searchParams.get("currentAnilistId"));
  const currentMalId = cleanId(searchParams.get("currentMalId"));
  const mainAnilistId = cleanId(searchParams.get("mainAnilistId"));
  const mainMalId = cleanId(searchParams.get("mainMalId"));

  const episode = parseInt(searchParams.get("episode") || "1", 10);
  const episodeOffset = parseInt(searchParams.get("episodeOffset") || "0", 10);
  const absoluteEpisode = episodeOffset + episode;

  // Optimized path: If not a sequel (or current ID matches root ID), return the Season URL immediately
  const isSequel = currentAnilistId && mainAnilistId && currentAnilistId !== mainAnilistId;

  if (!isSequel) {
    let defaultUrl = "";
    switch (provider) {
      case "vidnest":
        defaultUrl = currentAnilistId 
          ? `https://vidnest.fun/anime/${currentAnilistId}/${episode}/sub`
          : `https://vidnest.fun/anime/${mainAnilistId || ""}/${absoluteEpisode}/sub`;
        break;
      case "animepahe":
        defaultUrl = `https://vidnest.fun/animepahe/${currentMalId || currentAnilistId || mainMalId || mainAnilistId || ""}/${episode}/sub`;
        break;
      case "animeplay":
        defaultUrl = currentAnilistId
          ? `https://animeplay.cfd/stream/ani/${currentAnilistId}/${episode}/sub`
          : `https://animeplay.cfd/stream/mal/${currentMalId || mainMalId || ""}/${episode}/sub`;
        break;
      case "ninjastream":
        defaultUrl = currentAnilistId
          ? `https://ninjasheild.stream/map/anime/${currentAnilistId}/${episode}/sub`
          : `https://ninjasheild.stream/map/anime/${mainAnilistId || ""}/${absoluteEpisode}/sub`;
        break;
    }
    return NextResponse.json({ success: true, url: defaultUrl, checked: false });
  }

  // Sequel path: Perform ping checks to find the correct ID under the hood
  try {
    let resolvedUrl = "";

    switch (provider) {
      case "vidnest": {
        // Ping Season ID first
        const seasonApiUrl = `https://new.vidnest.fun/hianime/anime/${currentAnilistId}/${episode}/sub`;
        const seasonWorks = await testUrl(seasonApiUrl);
        if (seasonWorks) {
          resolvedUrl = `https://vidnest.fun/anime/${currentAnilistId}/${episode}/sub`;
        } else {
          resolvedUrl = `https://vidnest.fun/anime/${mainAnilistId}/${absoluteEpisode}/sub`;
        }
        break;
      }

      case "animepahe": {
        // Ping Season AniList ID to see if Season is mapped on Gogo/HiAnime
        const seasonApiUrl = `https://new.vidnest.fun/hianime/anime/${currentAnilistId}/${episode}/sub`;
        const seasonWorks = await testUrl(seasonApiUrl);
        if (seasonWorks) {
          resolvedUrl = `https://vidnest.fun/animepahe/${currentMalId || currentAnilistId}/${episode}/sub`;
        } else {
          resolvedUrl = `https://vidnest.fun/animepahe/${mainMalId || mainAnilistId}/${absoluteEpisode}/sub`;
        }
        break;
      }

      case "animeplay": {
        // Ping Season AniList ID to verify
        const seasonApiUrl = `https://new.vidnest.fun/hianime/anime/${currentAnilistId}/${episode}/sub`;
        const seasonWorks = await testUrl(seasonApiUrl);
        if (seasonWorks) {
          resolvedUrl = `https://animeplay.cfd/stream/ani/${currentAnilistId}/${episode}/sub`;
        } else {
          resolvedUrl = `https://animeplay.cfd/stream/ani/${mainAnilistId}/${absoluteEpisode}/sub`;
        }
        break;
      }

      case "ninjastream": {
        // Ping NinjaStream Season iframe URL directly (returns 404 if invalid)
        const seasonIframeUrl = `https://ninjasheild.stream/map/anime/${currentAnilistId}/${episode}/sub`;
        const seasonWorks = await testUrl(seasonIframeUrl);
        if (seasonWorks) {
          resolvedUrl = seasonIframeUrl;
        } else {
          resolvedUrl = `https://ninjasheild.stream/map/anime/${mainAnilistId}/${absoluteEpisode}/sub`;
        }
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid provider", success: false }, { status: 400 });
    }

    return NextResponse.json({ success: true, url: resolvedUrl, checked: true });
  } catch (error) {
    console.error("[Source Resolver Error]:", error);
    // Fall back to Season URL in case of error
    return NextResponse.json({ success: true, url: `https://vidnest.fun/anime/${currentAnilistId}/${episode}/sub`, checked: false });
  }
}
