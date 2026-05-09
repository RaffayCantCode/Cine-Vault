// Multi-API Streaming Fetcher with Fallback Logic
// APIs included:
// 1. 2Embed - https://www.2embed.cc (Most reliable)
// 2. VidSrc - https://vidsrc.to
// 3. Embed.su - https://embed.su
// 4. VidKing - https://www.vidking.net

interface StreamingAPIConfig {
  name: string;
  baseUrl: string;
  type: "vidsrc" | "embedsu" | "2embed" | "vidking";
}

const STREAMING_APIS: StreamingAPIConfig[] = [
  {
    name: "2Embed",
    baseUrl: "https://www.2embed.cc",
    type: "2embed",
  },
  {
    name: "VidSrc",
    baseUrl: "https://vidsrc.to",
    type: "vidsrc",
  },
  {
    name: "Embed.su",
    baseUrl: "https://embed.su",
    type: "embedsu",
  },
  {
    name: "VidKing",
    baseUrl: "https://www.vidking.net",
    type: "vidking",
  },
];

// Build embed URL based on API type
function buildEmbedUrl(api: StreamingAPIConfig, type: "movie" | "tv", id: number, season?: number, episode?: number): string {
  switch (api.type) {
    case "vidsrc":
      if (type === "movie") {
        return `${api.baseUrl}/embed/movie/${id}?autoPlay=true`;
      }
      return `${api.baseUrl}/embed/tv/${id}/${season ?? 1}/${episode ?? 1}?autoPlay=true`;
    
    case "embedsu":
      if (type === "movie") {
        return `${api.baseUrl}/embed/movie/${id}?autoPlay=true`;
      }
      return `${api.baseUrl}/embed/tv/${id}/${season ?? 1}/${episode ?? 1}?autoPlay=true`;
    
    case "2embed":
      if (type === "movie") {
        return `${api.baseUrl}/embed/${id}`;
      }
      return `${api.baseUrl}/embedtv/${id}/${season ?? 1}/${episode ?? 1}`;
    
    case "vidking":
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

// Get streaming sources with fallback
export function getStreamingSources(type: "movie" | "tv", id: number, season?: number, episode?: number): StreamingSource[] {
  return STREAMING_APIS.map(api => ({
    url: buildEmbedUrl(api, type, id, season, episode),
    name: api.name,
    type: api.type,
  }));
}

// Get primary source (first one)
export function getPrimarySource(type: "movie" | "tv", id: number, season?: number, episode?: number): StreamingSource {
  const sources = getStreamingSources(type, id, season, episode);
  return sources[0];
}
