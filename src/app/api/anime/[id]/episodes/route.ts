import { NextRequest } from "next/server";
import { fetchAnimeApi, fetchEpisodesFromJikan, fetchEpisodesFromJikanPage, getAnimeDetails } from "@/lib/anime-fetch";
import { searchTmdbShow, fetchTmdbEpisodeData } from "@/lib/tmdb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const seasonMalId = searchParams.get("seasonMalId") || null;
  // NEW: prefer seasonId (actual AniList ID), fall back to seasonNum (index)
  const seasonId = searchParams.get("seasonId") || null;
  const seasonNumParam = parseInt(searchParams.get("seasonNum") || "", 10);
  const batchSize = 100;

  try {
    // ── Lazy-load more episodes for a season (pagination) ──────────────────
    if (seasonMalId && page > 1) {
      const newEps = await fetchEpisodesFromJikanPage(seasonMalId, seasonId || id, page, batchSize);
      return Response.json({
        success: true,
        data: { episodes: newEps, totalEpisodes: 0 },
      });
    }

    // ── Fetch a specific season's episodes by its AniList ID (preferred) ───
    if (seasonId) {
      const meta = await getAnimeDetails(id, 100, true);
      if (!meta) throw new Error("Anime not found");

      const season = meta.seasons.find(s => s.id === seasonId);
      if (!season) {
        return Response.json({
          success: true,
          data: { episodes: [], totalEpisodes: 0 },
        });
      }

      // Find the 1-based season number from the seasons list
      const seasonNumFromList = meta.seasons.findIndex(s => s.id === seasonId) + 1;

      let seasonEps: any[] = [];

      // Start with placeholder episodes from meta
      const metaEpsForSeason = meta.episodes.filter(e => e.seasonId === seasonId);
      seasonEps = metaEpsForSeason.map((ep: any) => ({
        episodeId: ep.episodeId || `${seasonId}-${ep.episodeNum}`,
        episodeNum: Number(ep.episodeNum || 1),
        title: ep.title || `Episode ${ep.episodeNum || 1}`,
        thumbnail: ep.thumbnail || null,
        malUrl: ep.malUrl || null,
        isFiller: ep.isFiller || false,
        releasedDate: ep.releasedDate || null,
        description: ep.description || null,
        seasonNum: seasonNumFromList,
        seasonId: season.id,
        seasonName: season.name,
        seasonMalId: season.idMal || null,
      }));

      // Fetch real episode data from Jikan if we have a MAL ID
      if (season.idMal) {
        try {
          const realEps = await fetchEpisodesFromJikan(season.idMal, season.id, season.totalEpisodes);
          if (realEps && realEps.length > 0) {
            seasonEps = realEps.map((ep) => ({
              ...ep,
              episodeId: ep.episodeId || `${season.id}-${ep.episodeNum}`,
              seasonNum: seasonNumFromList,
              seasonId: season.id,
              seasonName: season.name,
              seasonMalId: season.idMal,
            }));
          }
        } catch { /* use placeholders */ }
      }

      // Ensure we have all episode numbers covered (fill gaps)
      const covered = new Set(seasonEps.map((e: any) => e.episodeNum));
      const isSpecialFormat = ["Movie", "OVA", "Special"].some(t => season.seasonLabel.startsWith(t));
      const count = isSpecialFormat ? 1 : season.totalEpisodes;
      for (let i = 1; i <= count; i++) {
        if (!covered.has(i)) {
          seasonEps.push({
            episodeId: `${season.id}-${i}`,
            episodeNum: i,
            title: `Episode ${i}`,
            thumbnail: null, malUrl: null, isFiller: false,
            releasedDate: null, description: null,
            seasonNum: seasonNumFromList,
            seasonId: season.id,
            seasonName: season.name,
            seasonMalId: season.idMal || null,
          });
        }
      }
      seasonEps.sort((a: any, b: any) => a.episodeNum - b.episodeNum);

      // TMDB enrichment for this season
      try {
        const animeName = meta.anime.name;
        const animeJname = meta.anime.jname;
        const seasonYear: number | undefined = meta.anime.seasonYear ?? undefined;
        let tmdbId: number | null = null;
        if (animeName) tmdbId = await searchTmdbShow(animeName, seasonYear);
        if (!tmdbId && animeJname) tmdbId = await searchTmdbShow(animeJname, seasonYear);
        if (tmdbId) {
          const tmdbEpisodes = await fetchTmdbEpisodeData(tmdbId, [seasonNumFromList]);
          seasonEps = seasonEps.map((ep: any) => {
            const key = `${seasonNumFromList}-${ep.episodeNum}`;
            const tmdb = tmdbEpisodes.get(key);
            if (!tmdb) return ep;
            return {
              ...ep,
              title: tmdb.title || ep.title,
              thumbnail: tmdb.thumbnail || ep.thumbnail,
              description: tmdb.description || ep.description,
            };
          });
        }
      } catch { /* skip TMDB */ }

      return Response.json({
        success: true,
        data: { episodes: seasonEps, totalEpisodes: meta.totalEpisodes },
      });
    }

    // ── Fallback: fetch by season index (backward compat) ──────────────────
    if (!isNaN(seasonNumParam) && seasonNumParam > 0) {
      const meta = await getAnimeDetails(id, 100, true);
      if (!meta) throw new Error("Anime not found");
      const seasons = meta.seasons;
      const seasonIdx = seasonNumParam - 1;
      const season = seasons[seasonIdx];
      let seasonEps: any[] = [];

      if (season) {
        const seasonInfo = meta.episodes.filter(e => e.seasonNum === seasonNumParam);
        seasonEps = seasonInfo.map((ep: any) => ({
          episodeId: ep.episodeId || `${season.id}-${ep.episodeNum}`,
          episodeNum: Number(ep.episodeNum || 1),
          title: ep.title || `Episode ${ep.episodeNum || 1}`,
          thumbnail: ep.thumbnail || null,
          malUrl: ep.malUrl || null,
          isFiller: ep.isFiller || false,
          releasedDate: ep.releasedDate || null,
          description: ep.description || null,
          seasonNum: seasonNumParam,
          seasonId: String(season.id),
          seasonName: season.name,
          seasonMalId: season.idMal || null,
        }));

        if (season.idMal) {
          try {
            const realEps = await fetchEpisodesFromJikan(season.idMal, String(season.id), 100);
            if (realEps && realEps.length > 0) {
              seasonEps = realEps.map((ep) => ({
                ...ep,
                episodeId: ep.episodeId || `${season.id}-${ep.episodeNum}`,
                seasonNum: seasonNumParam,
                seasonId: String(season.id),
                seasonName: season.name,
                seasonMalId: season.idMal,
              }));
            }
          } catch { /* use placeholders */ }
        }

        // Fill gaps
        const covered = new Set(seasonEps.map((e: any) => e.episodeNum));
        const isSpecial = ["Movie", "OVA", "Special"].some(t => season.seasonLabel.startsWith(t));
        const count = isSpecial ? 1 : season.totalEpisodes;
        for (let i = 1; i <= count; i++) {
          if (!covered.has(i)) {
            seasonEps.push({
              episodeId: `${season.id}-${i}`, episodeNum: i, title: `Episode ${i}`,
              thumbnail: null, malUrl: null, isFiller: false, releasedDate: null,
              description: null, seasonNum: seasonNumParam,
              seasonId: String(season.id), seasonName: season.name,
              seasonMalId: season.idMal || null,
            });
          }
        }
        seasonEps.sort((a: any, b: any) => a.episodeNum - b.episodeNum);

        // TMDB enrichment
        try {
          const animeName = meta.anime.name;
          const animeJname = meta.anime.jname;
          const seasonYear: number | undefined = meta.anime.seasonYear ?? undefined;
          let tmdbId: number | null = null;
          if (animeName) tmdbId = await searchTmdbShow(animeName, seasonYear);
          if (!tmdbId && animeJname) tmdbId = await searchTmdbShow(animeJname, seasonYear);
          if (tmdbId) {
            const tmdbEpisodes = await fetchTmdbEpisodeData(tmdbId, [seasonNumParam]);
            seasonEps = seasonEps.map((ep: any) => {
              const key = `${seasonNumParam}-${ep.episodeNum}`;
              const tmdb = tmdbEpisodes.get(key);
              if (!tmdb) return ep;
              return { ...ep, title: tmdb.title || ep.title, thumbnail: tmdb.thumbnail || ep.thumbnail, description: tmdb.description || ep.description };
            });
          }
        } catch { /* skip TMDB */ }
      }

      return Response.json({
        success: true,
        data: { episodes: seasonEps, totalEpisodes: meta.totalEpisodes },
      });
    }

    // ── Default: fetch ALL seasons' episodes ───────────────────────────────
    const data = await fetchAnimeApi(`/series/${id}`, true);
    const rawEpisodes = data?.data?.episodes || [];
    const totalEps = data?.data?.totalEpisodes || rawEpisodes.length || 0;

    let episodes = rawEpisodes.map((ep: any) => ({
      episodeId: ep.episodeId || `${id}-${ep.episodeNum}`,
      episodeNum: Number(ep.episodeNum || ep.episode || 1),
      title: ep.title || `Episode ${ep.episodeNum || 1}`,
      thumbnail: ep.thumbnail || null,
      malUrl: ep.malUrl || null,
      isFiller: ep.isFiller || false,
      releasedDate: ep.releasedDate || null,
      description: ep.description || null,
      seasonNum: ep.seasonNum || null,
      seasonId: ep.seasonId || null,
      seasonName: ep.seasonName || null,
      seasonMalId: ep.seasonMalId || null,
    }));

    // TMDB enrichment (non-blocking)
    const animeName: string | undefined = data?.data?.name;
    const animeJname: string | undefined = data?.data?.jname;
    const seasonYear: number | undefined = data?.data?.seasonYear;
    if (episodes.length > 0) {
      try {
        const uniqueSeasonNums = [...new Set(episodes.map((ep: any) => ep.seasonNum || 1))] as number[];
        let tmdbId: number | null = null;
        if (animeName) tmdbId = await searchTmdbShow(animeName, seasonYear);
        if (!tmdbId && animeJname) tmdbId = await searchTmdbShow(animeJname, seasonYear);
        if (tmdbId) {
          const tmdbEpisodes = await fetchTmdbEpisodeData(tmdbId, uniqueSeasonNums);
          episodes = episodes.map((ep: any) => {
            const key = `${ep.seasonNum || 1}-${ep.episodeNum}`;
            const tmdb = tmdbEpisodes.get(key);
            if (!tmdb) return ep;
            return { ...ep, title: tmdb.title || ep.title, thumbnail: tmdb.thumbnail || ep.thumbnail, description: tmdb.description || ep.description };
          });
        }
      } catch {
        // TMDB enrichment failed
      }
    }

    return Response.json({
      success: true,
      data: { episodes, totalEpisodes: totalEps },
    });
  } catch (error) {
    console.error("[Anime Episodes Error]:", error);
    return Response.json(
      { error: "Failed to fetch episodes", success: false },
      { status: 500 }
    );
  }
}