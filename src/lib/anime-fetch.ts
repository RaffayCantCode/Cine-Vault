// Multi-API Anime Fetcher with Fallback Logic
// Integrating Kiwi Anime API for Japanese dub with English sub

interface AnimeAPIConfig {
  name: string;
  baseUrl: string;
  type: "kiwi";
}

const ANIME_APIS: AnimeAPIConfig[] = [
  {
    name: "Kiwi",
    baseUrl: "https://animefreestream.vercel.app/anime/zoro",
    type: "kiwi",
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
    case "kiwi":
      return transformKiwi(data);
    default:
      return data;
  }
}

// Transform Kiwi API response
function transformKiwi(data: any): any {
  if (data.results || Array.isArray(data.results)) {
    // Search or list response
    const items = (data.results || []).map((item: any) => ({
      id: String(item.id || ""),
      name: item.title || "Unknown",
      jname: item.japaneseTitle || null,
      poster: item.image || "",
      type: item.type || "TV",
      episodes: {
        sub: item.sub || null,
        dub: item.dub || null,
      },
      rating: null,
      description: item.description || "",
      genres: item.genres || [],
    }));
    return { success: true, data: items };
  } else if (data.id || data.title) {
    // Series detail response
    return {
      success: true,
      data: {
        ...data,
        id: String(data.id),
        name: data.title || "Unknown",
        jname: data.japaneseTitle || null,
        poster: data.image || "",
        episodes: data.episodes?.map((ep: any, idx: number) => ({
          episodeId: String(ep.id || idx + 1),
          episodeNum: ep.number || idx + 1,
          title: ep.title || `Episode ${ep.number || idx + 1}`,
        })) || [],
        totalEpisodes: data.totalEpisodes || data.episodes?.length || 0,
      },
    };
  }
  return data;
}

// Build endpoint URL based on API type
function buildEndpoint(api: AnimeAPIConfig, endpoint: string): string {
  switch (api.type) {
    case "kiwi":
      // Kiwi API - get recent anime
      if (endpoint === "/home") {
        return `${api.baseUrl}/top-airing?page=1`;
      }
      if (endpoint.startsWith("/api/search")) {
        const params = new URLSearchParams(endpoint.split("?")[1]);
        const keyword = params.get("keyword") || params.get("q") || "";
        return `${api.baseUrl}/${encodeURIComponent(keyword)}?page=1`;
      }
      if (endpoint.startsWith("/series/")) {
        const seriesId = endpoint.replace("/series/", "");
        return `${api.baseUrl}/info?id=${encodeURIComponent(seriesId)}`;
      }
      return `${api.baseUrl}/recent-episodes?page=1`;
    
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
        case "kiwi":
          url = `${api.baseUrl}/watch/${encodeURIComponent(episodeId)}?server=${server === 'default' ? 'vidcloud' : server}`;
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
