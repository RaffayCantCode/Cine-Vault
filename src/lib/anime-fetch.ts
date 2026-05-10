// Multi-API Anime Fetcher with Fallback Logic
// APIs included:
// 1. Anikoto API - https://www.anikotoapi.site (Working!)
// 2. AniPub API - https://api.anipub.xyz (Fallback)

interface AnimeAPIConfig {
  name: string;
  baseUrl: string;
  type: "anikoto" | "anipub";
}

const ANIME_APIS: AnimeAPIConfig[] = [
  {
    name: "Anikoto",
    baseUrl: "https://www.anikotoapi.site",
    type: "anikoto",
  },
  {
    name: "AniPub",
    baseUrl: "https://api.anipub.xyz",
    type: "anipub",
  },
];

// Unified Anime Item interface
export interface AnimeItem {
  id: string;
  name: string;
  jname?: string | null;
  poster: string;
  type?: string | null;
  episodes?: { sub: number | null; dub: number | null };
  rating?: string | null;
  description?: string;
  genres?: string[];
}

// Transform different API responses to unified format
function transformResponse(apiType: string, data: any): any {
  switch (apiType) {
    case "anikoto":
      return transformAnikoto(data);
    case "anipub":
      return transformAniPub(data);
    default:
      return data;
  }
}

// Transform Anikoto API response
function transformAnikoto(data: any): any {
  if (data.ok && data.data) {
    // Check if it's an array (search) or single object (series)
    if (Array.isArray(data.data)) {
      const items = data.data.map((item: any) => ({
        id: String(item.id),
        name: item.title || "Unknown",
        jname: item.native || null,
        poster: item.poster || "",
        type: "TV",
        episodes: {
          sub: item.is_sub || null,
          dub: item.is_dub || null,
        },
        rating: item.score || null,
        description: item.description || "",
        genres: item.terms_by_type?.genre || [],
      }));
      return { success: true, data: items };
    } else {
      // Series detail response
      return {
        success: true,
        data: {
          ...data.data,
          episodes: data.data.episodes?.map((ep: any, idx: number) => ({
            episodeId: String(ep.id || idx + 1),
            episodeNum: ep.number || idx + 1,
            title: ep.title || `Episode ${idx + 1}`,
          })) || [],
          totalEpisodes: data.data.episodes?.length || 0,
        },
      };
    }
  }
  return data;
}

function transformAniPub(data: any): any {
  // If it's a search response
  if (data.results || data.data) {
    const items = (data.results || data.data || []).map((item: any) => ({
      id: item.slug || item.id || "",
      name: item.title || item.name || "Unknown",
      jname: item.japanese_title || item.jname || null,
      poster: item.poster || item.image || item.cover || "",
      type: item.type || item.format || "TV",
      episodes: {
        sub: item.episodes?.sub || item.episode_count || null,
        dub: item.episodes?.dub || null,
      },
      rating: item.rating || null,
      description: item.description || item.synopsis || "",
      genres: item.genres || [],
    }));
    return { success: true, data: items };
  }
  return data;
}

function transformConsumet(data: any): any {
  // Consumet returns array for list endpoints
  if (Array.isArray(data)) {
    const items = data.map((item: any) => ({
      id: item.id || "",
      name: item.title || "Unknown",
      jname: null,
      poster: item.image || "",
      type: item.subOrDub || "sub",
      episodes: {
        sub: item.episodes || item.episodeCount || null,
        dub: null,
      },
      rating: null,
      description: "",
      genres: item.genres || [],
    }));
    return { success: true, data: items };
  }
  return data;
}

function transformAniWatch(data: any): any {
  if (data.animes || data.results || data.data) {
    const items = (data.animes || data.results || data.data || []).map((item: any) => ({
      id: item.id || item.slug || "",
      name: item.name || item.title || "Unknown",
      jname: item.jname || item.japanese_title || null,
      poster: item.poster || item.img || item.image || item.cover || "",
      type: item.type || "TV",
      episodes: {
        sub: item.episodes?.sub || item.episode_count || null,
        dub: item.episodes?.dub || null,
      },
      rating: null,
      description: item.description || "",
      genres: item.genres || [],
    }));
    return { success: true, data: items };
}
  return data;
}

// Build endpoint URL based on API type
function buildEndpoint(api: AnimeAPIConfig, endpoint: string): string {
  switch (api.type) {
    case "anikoto":
      // Anikoto API - get recent anime
      if (endpoint === "/home") {
        return `${api.baseUrl}/recent-anime?page=1&per_page=20`;
      }
      if (endpoint.startsWith("/api/search")) {
        const params = new URLSearchParams(endpoint.split("?")[1]);
        const keyword = params.get("keyword") || params.get("q") || "";
        return `${api.baseUrl}/search?title=${encodeURIComponent(keyword)}&page=1`;
      }
      if (endpoint.startsWith("/series/")) {
        const seriesId = endpoint.replace("/series/", "");
        return `${api.baseUrl}/series/${seriesId}`;
      }
      return `${api.baseUrl}/recent-anime?page=1&per_page=20`;
    
    case "anipub":
      // AniPub API endpoints
      if (endpoint === "/home") {
        return `${api.baseUrl}/api/anime/trending?limit=20`;
      }
      if (endpoint.startsWith("/api/search")) {
        const params = new URLSearchParams(endpoint.split("?")[1]);
        const keyword = params.get("keyword") || params.get("q") || "";
        return `${api.baseUrl}/api/search/${encodeURIComponent(keyword)}`;
      }
      return `${api.baseUrl}${endpoint}`;
    
    default:
      return `${api.baseUrl}${endpoint}`;
  }
}

export async function fetchAnimeApi(endpoint: string, options?: RequestInit): Promise<any> {
  const errors: string[] = [];

  for (const api of ANIME_APIS) {
    try {
      const url = buildEndpoint(api, endpoint);
      console.log(`[Anime API] Trying ${api.name}: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "StreamVault/1.0",
          ...options?.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`${api.name} returned ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      // Transform response based on API type
      const transformed = transformResponse(api.type, data);

      console.log(`[Anime API] ✅ ${api.name} succeeded`);
      return transformed;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.warn(`[Anime API] ❌ ${api.name} failed:`, message);
      errors.push(`${api.name}: ${message}`);
      continue; // Try next API
    }
  }

  // All APIs failed
  console.error("[Anime API] All APIs failed:", errors);
  throw new Error(`All Anime APIs failed. Errors: ${errors.join(" | ")}`);
}

// Fetch with specific API preference
export async function fetchAnimeApiWithPreference(
  endpoint: string,
  preferredApi: string,
  options?: RequestInit
): Promise<any> {
  const api = ANIME_APIS.find((a) => a.name.toLowerCase().includes(preferredApi.toLowerCase()));
  if (api) {
    const url = buildEndpoint(api, endpoint);
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        "User-Agent": "StreamVault/1.0",
        ...options?.headers,
      },
    });
    if (!res.ok) throw new Error(`${api.name} returned ${res.status}`);
    const data = await res.json();
    return transformResponse(api.type, data);
  }
  return fetchAnimeApi(endpoint, options);
}

// Get streaming source for an episode
export async function getStreamingSource(
  animeId: string,
  episodeId: string,
  server: string = "default"
): Promise<any> {
  const errors: string[] = [];

  for (const api of ANIME_APIS) {
    try {
      let url: string;

      switch (api.type) {
        case "anikoto":
          // Get series details with episodes
          url = `${api.baseUrl}/series/${animeId}`;
          break;
        case "anipub":
          url = `${api.baseUrl}/v1/api/details/${episodeId}`;
          break;
        default:
          continue;
      }

      console.log(`[Streaming] Trying ${api.name}: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "StreamVault/1.0",
        },
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`${api.name} returned ${res.status}`);
      }

      const data = await res.json();
      console.log(`[Streaming] ✅ ${api.name} succeeded`);
      return { success: true, data, source: api.name };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.warn(`[Streaming] ❌ ${api.name} failed:`, message);
      errors.push(`${api.name}: ${message}`);
      continue;
    }
  }

  console.error("[Streaming] All APIs failed:", errors);
  throw new Error(`All streaming sources failed. Errors: ${errors.join(" | ")}`);
}
