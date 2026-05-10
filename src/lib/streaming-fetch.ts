// Multi-API Streaming Fetcher with Fallback Logic
// APIs included:
// 1. VidSrc (vidsrc-embed.ru) - Best with English subtitles
// 2. VidSrc.me - Alternative working domain  
// 3. VidKing - Works, try subs
// 4. VidSrc.in - New alternative

interface StreamingAPIConfig {
  name: string;
  baseUrl: string;
  type: "vidsrcembed" | "vidsrcme" | "2embed" | "vidking" | "vidsrcin";
}

const STREAMING_APIS: StreamingAPIConfig[] = [
  {
    name: "VidSrc",
    baseUrl: "https://vidsrc-embed.ru",
    type: "vidsrcembed",
  },
  {
    name: "VidSrc.me",
    baseUrl: "https://vidsrc.me",
    type: "vidsrcme",
  },
  {
    name: "2Embed",
    baseUrl: "https://www.2embed.cc",
    type: "2embed",
  },
  {
    name: "VidKing",
    baseUrl: "https://www.vidking.net",
    type: "vidking",
  },
  {
    name: "VidSrc.in",
    baseUrl: "https://vidsrc.in",
    type: "vidsrcin",
  },
];

// Build embed URL based on API type with English subtitles priority
function buildEmbedUrl(api: StreamingAPIConfig, type: "movie" | "tv" | "anime", id: number | string, season?: number, episode?: number): string {
  switch (api.type) {
    case "vidsrcembed":
      // vidsrc-embed.ru - best with ds_lang=en for English subtitles
      if (type === "movie") {
        return `${api.baseUrl}/embed/movie/${id}?ds_lang=en`;
      }
      if (type === "anime") {
        return `${api.baseUrl}/embed/tv/${id}/${season ?? 1}/${episode ?? 1}?ds_lang=en`;
      }
      return `${api.baseUrl}/embed/tv/${id}/${season ?? 1}/${episode ?? 1}?ds_lang=en`;
    
    case "vidsrcme":
      // vidsrc.me - alternative with TMDB format
      if (type === "movie") {
        return `${api.baseUrl}/embed/movie?tmdb=${id}`;
      }
      return `${api.baseUrl}/embed/tv?tmdb=${id}&season=${season ?? 1}&episode=${episode ?? 1}`;
    
    case "2embed":
      if (type === "movie") {
        return `${api.baseUrl}/embed/${id}`;
      }
      return `${api.baseUrl}/embedtv/${id}/${season ?? 1}/${episode ?? 1}`;
    
    case "vidking":
      // VidKing - try with subtitle params
      if (type === "movie") {
        return `${api.baseUrl}/embed/movie/${id}?lang=en`;
      }
      if (type === "anime") {
        // Anime with Japanese audio, try sub parameter
        return `${api.baseUrl}/embed/tv/${id}/${season ?? 1}/${episode ?? 1}?lang=en&sub=1`;
      }
      return `${api.baseUrl}/embed/tv/${id}/${season ?? 1}/${episode ?? 1}?lang=en`;
    
    case "vidsrcin":
      // VidSrc.in - new alternative
      if (type === "movie") {
        return `${api.baseUrl}/embed/movie/${id}`;
      }
      return `${api.baseUrl}/embed/tv/${id}/${season ?? 1}/${episode ?? 1}`;
    
    default:
      return "";
  }
}

export interface StreamingSource {
  url: string;
  name: string;
  type: string;
}

// Get streaming sources for movies/TV
export function getStreamingSources(type: "movie" | "tv", id: number, season?: number, episode?: number): StreamingSource[] {
  return STREAMING_APIS.map(api => ({
    url: buildEmbedUrl(api, type, id, season, episode),
    name: api.name,
    type: api.type,
  }));
}

// Get streaming sources for anime
export function getAnimeStreamingSources(animeId: string, episodeNum: number = 1): StreamingSource[] {
  return STREAMING_APIS.map(api => ({
    url: buildEmbedUrl(api, "anime", animeId, episodeNum, episodeNum),
    name: api.name,
    type: api.type,
  }));
}

// Get primary source (first one)
export function getPrimarySource(type: "movie" | "tv", id: number, season?: number, episode?: number): StreamingSource {
  const sources = getStreamingSources(type, id, season, episode);
  return sources[0];
}