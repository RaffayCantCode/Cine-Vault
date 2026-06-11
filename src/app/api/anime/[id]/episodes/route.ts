import { NextRequest } from "next/server";
import { fetchEpisodesFromJikan, fetchEpisodesFromJikanPage, getAnimeDetails, fetchEpisodesFromAniZip, fetchEpisodesFromKitsu } from "@/lib/anime-fetch";
import { tmdbFetch, fetchTmdbEpisodeData } from "@/lib/tmdb";

interface TmdbSeasonMin {
  season_number: number;
  episode_count: number;
}

function mapAbsoluteToTmdb(
  absEpNum: number,
  tmdbSeasonsList: TmdbSeasonMin[]
): { seasonNumber: number; episodeNumber: number } {
  let remaining = absEpNum;
  for (const s of tmdbSeasonsList) {
    const count = s.episode_count || 0;
    if (remaining <= count) {
      return { seasonNumber: s.season_number, episodeNumber: remaining };
    }
    remaining -= count;
  }
  if (tmdbSeasonsList.length > 0) {
    const last = tmdbSeasonsList[tmdbSeasonsList.length - 1];
    return { seasonNumber: last.season_number, episodeNumber: remaining + (last.episode_count || 0) };
  }
  return { seasonNumber: 1, episodeNumber: absEpNum };
}

const episodesCache = new Map<string, { data: any; expires: number }>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const seasonMalId = searchParams.get("seasonMalId") || null;
  const seasonId = searchParams.get("seasonId") || null;
  const seasonNumParam = parseInt(searchParams.get("seasonNum") || "", 10);
  const batchSize = 100;

  const cacheKey = `${id}:${searchParams.toString()}`;
  const cached = episodesCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return Response.json(cached.data);
  }

  try {
    // ── Lazy-load more episodes for a season (pagination) ──────────────────
    if (seasonMalId && page > 1) {
      const newEps = await fetchEpisodesFromJikanPage(seasonMalId, seasonId || id, page, batchSize);
      const resPayload = {
        success: true,
        data: { episodes: newEps, totalEpisodes: 0 },
      };
      episodesCache.set(cacheKey, { data: resPayload, expires: Date.now() + 1800000 });
      return Response.json(resPayload);
    }

    // ── Fetch a specific season's episodes by its AniList ID ───────────────
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

      const seasonNumFromList = meta.seasons.findIndex(s => s.id === seasonId) + 1;
      const tmdbId = (season as any).tmdbId;
      const tmdbSeasonNum = season.tmdbSeasonNumber;
      const episodeOffset = (season as any).episodeOffset || 0;
      const isTMDBReady = tmdbId && tmdbSeasonNum !== undefined && tmdbSeasonNum !== null;

      let seasonEps: any[] = [];
      let seasonOverview: string | null = null;

      if (isTMDBReady) {
        // ── TMDB is the source of truth for episodes ─────────────────────
        let tmdbSeasonsList: TmdbSeasonMin[] = [];
        try {
          const showData = await tmdbFetch(`/tv/${tmdbId}`) as { seasons?: TmdbSeasonMin[] };
          if (showData?.seasons) {
            tmdbSeasonsList = showData.seasons
              .filter(s => s.season_number > 0)
              .sort((a, b) => a.season_number - b.season_number);
          }
        } catch { /* ignore */ }

        // Get overlay data using AniZip (or Jikan/Kitsu fallback) for thumbnails/descriptions
        let overlayEps: any[] = [];
        try {
          const realEps = await fetchEpisodesFromAniZip(season.id, season.totalEpisodes);
          if (realEps && realEps.length > 0) overlayEps = realEps;
        } catch { /* fallback */ }

        if (overlayEps.length === 0 && season.idMal) {
          try {
            const realEps = await fetchEpisodesFromJikan(
              season.idMal, season.id,
              season.totalEpisodes
            );
            if (realEps) overlayEps = realEps;
          } catch { /* fallback */ }
        }

        if (overlayEps.length === 0) {
          try {
            const realEps = await fetchEpisodesFromKitsu(season.name, season.totalEpisodes);
            if (realEps) overlayEps = realEps;
          } catch { /* use TMDB-only */ }
        }

        // Calculate needed TMDB seasons
        const neededSeasons = new Set<number>();
        overlayEps.forEach(ep => {
          if (ep.seasonNumber) neededSeasons.add(ep.seasonNumber);
        });
        for (let i = 1; i <= season.totalEpisodes; i++) {
          const mapped = mapAbsoluteToTmdb(episodeOffset + i, tmdbSeasonsList);
          neededSeasons.add(mapped.seasonNumber);
        }

        const seasonNumbers = Array.from(neededSeasons);
        const tmdbEpisodes = seasonNumbers.length > 0
          ? await fetchTmdbEpisodeData(tmdbId, seasonNumbers)
          : new Map<string, any>();

        // Build episodes from TMDB, overlay AniZip/Jikan data
        for (let i = 1; i <= season.totalEpisodes; i++) {
          const matchEp = overlayEps.find(j => j.episodeNum === i);
          
          let tmdbSeason = matchEp?.seasonNumber || null;
          let tmdbEpisode = matchEp?.episodeNumber || null;

          if (!tmdbSeason || !tmdbEpisode) {
            const mapped = mapAbsoluteToTmdb(episodeOffset + i, tmdbSeasonsList);
            tmdbSeason = mapped.seasonNumber;
            tmdbEpisode = mapped.episodeNumber;
          }

          const tmdbEp = tmdbEpisodes.get(`${tmdbSeason}-${tmdbEpisode}`);
          
          seasonEps.push({
            episodeId: matchEp?.episodeId || `${season.id}-${i}`,
            episodeNum: i,
            title: tmdbEp?.title || matchEp?.title || `Episode ${i}`,
            thumbnail: tmdbEp?.thumbnail || matchEp?.thumbnail || null,
            malUrl: matchEp?.malUrl || null,
            isFiller: matchEp?.isFiller || false,
            releasedDate: matchEp?.releasedDate || null,
            description: tmdbEp?.description || matchEp?.description || null,
            vote_average: tmdbEp?.vote_average,
            runtime: tmdbEp?.runtime,
            seasonNum: seasonNumFromList,
            seasonId: season.id,
            seasonName: season.name,
            seasonMalId: season.idMal || null,
          });
        }

        // Fetch TMDB season overview
        try {
          const tmdbSeasonData = await tmdbFetch(`/tv/${tmdbId}/season/${tmdbSeasonNum}`) as { overview?: string };
          if (tmdbSeasonData) seasonOverview = tmdbSeasonData.overview || null;
        } catch { /* no overview */ }
      } else {
        // ── No TMDB: use AniZip/Jikan episodes ────────────────────────────────────
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

        let resolvedEps: any[] | null = null;
        try {
          resolvedEps = await fetchEpisodesFromAniZip(season.id, season.totalEpisodes);
        } catch { /* try Jikan */ }

        if (resolvedEps && resolvedEps.length > 0) {
          seasonEps = resolvedEps.map((ep) => ({
            ...ep,
            episodeId: ep.episodeId || `${season.id}-${ep.episodeNum}`,
            seasonNum: seasonNumFromList,
            seasonId: season.id,
            seasonName: season.name,
            seasonMalId: season.idMal || null,
          }));
        } else if (season.idMal) {
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
          } catch { /* try Kitsu */ }
        }

        if ((!resolvedEps || resolvedEps.length === 0) && (!seasonEps || seasonEps.length === 0 || seasonEps.every(e => !e.thumbnail || !e.description))) {
          try {
            const realEps = await fetchEpisodesFromKitsu(season.name, season.totalEpisodes);
            if (realEps && realEps.length > 0) {
              seasonEps = realEps.map((ep) => ({
                ...ep,
                episodeId: ep.episodeId || `${season.id}-${ep.episodeNum}`,
                seasonNum: seasonNumFromList,
                seasonId: season.id,
                seasonName: season.name,
                seasonMalId: season.idMal || null,
              }));
            }
          } catch { /* use placeholders */ }
        }

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
      }

      seasonEps.sort((a: any, b: any) => a.episodeNum - b.episodeNum);

      const resPayload = {
        success: true,
        data: {
          episodes: seasonEps,
          totalEpisodes: meta.totalEpisodes,
          seasonOverview,
        },
      };
      episodesCache.set(cacheKey, { data: resPayload, expires: Date.now() + 1800000 });
      return Response.json(resPayload);
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
        const tmdbId = (season as any).tmdbId;
        const tmdbSeasonNum = season.tmdbSeasonNumber;
        const episodeOffset = (season as any).episodeOffset || 0;
        const isTMDBReady = tmdbId && tmdbSeasonNum !== undefined && tmdbSeasonNum !== null;

        if (isTMDBReady) {
          let tmdbSeasonsList: TmdbSeasonMin[] = [];
          try {
            const showData = await tmdbFetch(`/tv/${tmdbId}`) as { seasons?: TmdbSeasonMin[] };
            if (showData?.seasons) {
              tmdbSeasonsList = showData.seasons
                .filter(s => s.season_number > 0)
                .sort((a, b) => a.season_number - b.season_number);
            }
          } catch { /* ignore */ }

          let overlayEps: any[] = [];
          try {
            const realEps = await fetchEpisodesFromAniZip(String(season.id), season.totalEpisodes);
            if (realEps) overlayEps = realEps;
          } catch { /* try Jikan */ }

          if (overlayEps.length === 0 && season.idMal) {
            try {
              const realEps = await fetchEpisodesFromJikan(
                season.idMal, String(season.id),
                season.totalEpisodes
              );
              if (realEps) overlayEps = realEps;
            } catch { /* try Kitsu */ }
          }

          if (overlayEps.length === 0) {
            try {
              const realEps = await fetchEpisodesFromKitsu(season.name, season.totalEpisodes);
              if (realEps) overlayEps = realEps;
            } catch { /* use TMDB-only */ }
          }

          const neededSeasons = new Set<number>();
          overlayEps.forEach(ep => {
            if (ep.seasonNumber) neededSeasons.add(ep.seasonNumber);
          });
          for (let i = 1; i <= season.totalEpisodes; i++) {
            const mapped = mapAbsoluteToTmdb(episodeOffset + i, tmdbSeasonsList);
            neededSeasons.add(mapped.seasonNumber);
          }

          const seasonNumbers = Array.from(neededSeasons);
          const tmdbEpisodes = seasonNumbers.length > 0
            ? await fetchTmdbEpisodeData(tmdbId, seasonNumbers)
            : new Map<string, any>();

          for (let i = 1; i <= season.totalEpisodes; i++) {
            const matchEp = overlayEps.find(j => j.episodeNum === i);
            
            let tmdbSeason = matchEp?.seasonNumber || null;
            let tmdbEpisode = matchEp?.episodeNumber || null;

            if (!tmdbSeason || !tmdbEpisode) {
              const mapped = mapAbsoluteToTmdb(episodeOffset + i, tmdbSeasonsList);
              tmdbSeason = mapped.seasonNumber;
              tmdbEpisode = mapped.episodeNumber;
            }

            const tmdbEp = tmdbEpisodes.get(`${tmdbSeason}-${tmdbEpisode}`);

            seasonEps.push({
              episodeId: matchEp?.episodeId || `${season.id}-${i}`,
              episodeNum: i,
              title: tmdbEp?.title || matchEp?.title || `Episode ${i}`,
              thumbnail: tmdbEp?.thumbnail || matchEp?.thumbnail || null,
              malUrl: matchEp?.malUrl || null,
              isFiller: matchEp?.isFiller || false,
              releasedDate: matchEp?.releasedDate || null,
              description: tmdbEp?.description || matchEp?.description || null,
              vote_average: tmdbEp?.vote_average,
              runtime: tmdbEp?.runtime,
              seasonNum: seasonNumParam,
              seasonId: String(season.id),
              seasonName: season.name,
              seasonMalId: season.idMal || null,
            });
          }
        } else {
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

          let resolvedEps: any[] | null = null;
          try {
            resolvedEps = await fetchEpisodesFromAniZip(String(season.id), 100);
          } catch { /* try Jikan */ }

          if (resolvedEps && resolvedEps.length > 0) {
            seasonEps = resolvedEps.map((ep) => ({
              ...ep,
              episodeId: ep.episodeId || `${season.id}-${ep.episodeNum}`,
              seasonNum: seasonNumParam,
              seasonId: String(season.id),
              seasonName: season.name,
              seasonMalId: season.idMal || null,
            }));
          } else if (season.idMal) {
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
            } catch { /* try Kitsu */ }
          }

          if ((!resolvedEps || resolvedEps.length === 0) && (!seasonEps || seasonEps.length === 0 || seasonEps.every(e => !e.thumbnail || !e.description))) {
            try {
              const realEps = await fetchEpisodesFromKitsu(season.name, season.totalEpisodes);
              if (realEps && realEps.length > 0) {
                seasonEps = realEps.map((ep) => ({
                  ...ep,
                  episodeId: ep.episodeId || `${season.id}-${ep.episodeNum}`,
                  seasonNum: seasonNumParam,
                  seasonId: String(season.id),
                  seasonName: season.name,
                  seasonMalId: season.idMal || null,
                }));
              }
            } catch { /* use placeholders */ }
          }

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
        }
        seasonEps.sort((a: any, b: any) => a.episodeNum - b.episodeNum);
      }

      const resPayload = {
        success: true,
        data: { episodes: seasonEps, totalEpisodes: meta.totalEpisodes },
      };
      episodesCache.set(cacheKey, { data: resPayload, expires: Date.now() + 1800000 });
      return Response.json(resPayload);
    }

    // ── Default: fetch ALL seasons' episodes ───────────────────────────────
    const meta = await getAnimeDetails(id, 100, true);
    if (!meta) throw new Error("Anime not found");

    let episodes: any[] = [];
    
    // Group and fetch episodes for each mapped season
    for (const season of meta.seasons) {
      const tmdbId = (season as any).tmdbId;
      const tmdbSeasonNum = season.tmdbSeasonNumber;
      const episodeOffset = (season as any).episodeOffset || 0;
      const isTMDBReady = tmdbId && tmdbSeasonNum !== undefined && tmdbSeasonNum !== null;
      const seasonIdx = meta.seasons.indexOf(season) + 1;

      if (isTMDBReady) {
        let tmdbSeasonsList: TmdbSeasonMin[] = [];
        try {
          const showData = await tmdbFetch(`/tv/${tmdbId}`) as { seasons?: TmdbSeasonMin[] };
          if (showData?.seasons) {
            tmdbSeasonsList = showData.seasons
              .filter(s => s.season_number > 0)
              .sort((a, b) => a.season_number - b.season_number);
          }
        } catch { /* ignore */ }

        let overlayEps: any[] = [];
        try {
          const realEps = await fetchEpisodesFromAniZip(season.id, season.totalEpisodes);
          if (realEps) overlayEps = realEps;
        } catch { /* try Jikan */ }

        if (overlayEps.length === 0 && season.idMal) {
          try {
            const realEps = await fetchEpisodesFromJikan(season.idMal, season.id, season.totalEpisodes);
            if (realEps) overlayEps = realEps;
          } catch { /* try Kitsu */ }
        }

        if (overlayEps.length === 0) {
          try {
            const realEps = await fetchEpisodesFromKitsu(season.name, season.totalEpisodes);
            if (realEps) overlayEps = realEps;
          } catch { /* use TMDB-only */ }
        }

        const neededSeasons = new Set<number>();
        overlayEps.forEach(ep => {
          if (ep.seasonNumber) neededSeasons.add(ep.seasonNumber);
        });
        for (let i = 1; i <= season.totalEpisodes; i++) {
          const mapped = mapAbsoluteToTmdb(episodeOffset + i, tmdbSeasonsList);
          neededSeasons.add(mapped.seasonNumber);
        }

        const seasonNumbers = Array.from(neededSeasons);
        const tmdbEpisodes = seasonNumbers.length > 0
          ? await fetchTmdbEpisodeData(tmdbId, seasonNumbers)
          : new Map<string, any>();

        for (let i = 1; i <= season.totalEpisodes; i++) {
          const matchEp = overlayEps.find(j => j.episodeNum === i);
          
          let tmdbSeason = matchEp?.seasonNumber || null;
          let tmdbEpisode = matchEp?.episodeNumber || null;

          if (!tmdbSeason || !tmdbEpisode) {
            const mapped = mapAbsoluteToTmdb(episodeOffset + i, tmdbSeasonsList);
            tmdbSeason = mapped.seasonNumber;
            tmdbEpisode = mapped.episodeNumber;
          }

          const tmdbEp = tmdbEpisodes.get(`${tmdbSeason}-${tmdbEpisode}`);
          episodes.push({
            episodeId: matchEp?.episodeId || `${season.id}-${i}`,
            episodeNum: i,
            title: tmdbEp?.title || matchEp?.title || `Episode ${i}`,
            thumbnail: tmdbEp?.thumbnail || matchEp?.thumbnail || null,
            malUrl: matchEp?.malUrl || null,
            isFiller: matchEp?.isFiller || false,
            releasedDate: matchEp?.releasedDate || null,
            description: tmdbEp?.description || matchEp?.description || null,
            vote_average: tmdbEp?.vote_average,
            runtime: tmdbEp?.runtime,
            seasonNum: seasonIdx,
            seasonId: season.id,
            seasonName: season.name,
            seasonMalId: season.idMal || null,
          });
        }
      } else {
        let resolvedEps: any[] | null = null;
        try {
          resolvedEps = await fetchEpisodesFromAniZip(season.id, season.totalEpisodes);
        } catch { /* try Jikan */ }

        let seasonEps: any[] = [];
        if (resolvedEps && resolvedEps.length > 0) {
          seasonEps = resolvedEps.map((ep) => ({
            ...ep,
            episodeId: ep.episodeId || `${season.id}-${ep.episodeNum}`,
            seasonNum: seasonIdx,
            seasonId: season.id,
            seasonName: season.name,
            seasonMalId: season.idMal || null,
          }));
        } else if (season.idMal) {
          try {
            const realEps = await fetchEpisodesFromJikan(season.idMal, season.id, season.totalEpisodes);
            if (realEps && realEps.length > 0) {
              seasonEps = realEps.map((ep) => ({
                ...ep,
                episodeId: ep.episodeId || `${season.id}-${ep.episodeNum}`,
                seasonNum: seasonIdx,
                seasonId: season.id,
                seasonName: season.name,
                seasonMalId: season.idMal,
              }));
            }
          } catch { /* try Kitsu */ }
        }

        if ((!resolvedEps || resolvedEps.length === 0) && (!seasonEps || seasonEps.length === 0 || seasonEps.every(e => !e.thumbnail || !e.description))) {
          try {
            const realEps = await fetchEpisodesFromKitsu(season.name, season.totalEpisodes);
            if (realEps && realEps.length > 0) {
              seasonEps = realEps.map((ep) => ({
                ...ep,
                episodeId: ep.episodeId || `${season.id}-${ep.episodeNum}`,
                seasonNum: seasonIdx,
                seasonId: season.id,
                seasonName: season.name,
                seasonMalId: season.idMal || null,
              }));
            }
          } catch { /* ignore */ }
        }

        if (!seasonEps || seasonEps.length === 0) {
          const metaEpsForSeason = meta.episodes.filter(e => e.seasonId === season.id);
          seasonEps = metaEpsForSeason.map((ep: any) => ({
            episodeId: ep.episodeId || `${season.id}-${ep.episodeNum}`,
            episodeNum: Number(ep.episodeNum || 1),
            title: ep.title || `Episode ${ep.episodeNum || 1}`,
            thumbnail: ep.thumbnail || null,
            malUrl: ep.malUrl || null,
            isFiller: ep.isFiller || false,
            releasedDate: ep.releasedDate || null,
            description: ep.description || null,
            seasonNum: seasonIdx,
            seasonId: season.id,
            seasonName: season.name,
            seasonMalId: season.idMal || null,
          }));
        }
        episodes.push(...seasonEps);
      }
    }

    const resPayload = {
      success: true,
      data: { episodes, totalEpisodes: episodes.length },
    };
    episodesCache.set(cacheKey, { data: resPayload, expires: Date.now() + 1800000 });
    return Response.json(resPayload);
  } catch (error) {
    console.error("[Anime Episodes Error]:", error);
    return Response.json(
      { error: "Failed to fetch episodes", success: false },
      { status: 500 }
    );
  }
}
