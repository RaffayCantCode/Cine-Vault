// Multi-API Streaming Fetcher for Movies & TV
// Working sources: VidKing, 2Embed, VidSrc (PM), VidSrc (ME)

interface StreamingAPIConfig {
  name: string;
  baseUrl: string;
  type: string;
}

const STREAMING_APIS: StreamingAPIConfig[] = [
  {
    name: "VidKing",
    baseUrl: "https://vidking.net",
    type: "vidking",
  },
  {
    name: "2Embed",
    baseUrl: "https://www.2embed.cc",
    type: "2embed",
  },
  {
    name: "VidSrc (PM)",
    baseUrl: "https://vidsrc.pm",
    type: "vidsrcpm",
  },
  {
    name: "VidSrc (ME)",
    baseUrl: "https://vidsrcme.ru",
    type: "vidsrcme",
  },
];

// Build embed URL based on API type
function buildEmbedUrl(api: StreamingAPIConfig, type: "movie" | "tv", id: number, season?: number, episode?: number): string {
  switch (api.type) {
    case "vidking":
      if (type === "movie") {
        return `${api.baseUrl}/embed/movie/${id}`;
      }
      return `${api.baseUrl}/embed/tv/${id}/${season ?? 1}/${episode ?? 1}`;
    
    case "2embed":
      if (type === "movie") {
        return `${api.baseUrl}/embed/${id}`;
      }
      return `${api.baseUrl}/embedtv/${id}/${season ?? 1}/${episode ?? 1}`;
    
    case "vidsrcpm":
      if (type === "movie") {
        return `${api.baseUrl}/embed/movie/${id}`;
      }
      return `${api.baseUrl}/embed/tv/${id}-${season ?? 1}-${episode ?? 1}`;
    
    case "vidsrcme":
      if (type === "movie") {
        return `${api.baseUrl}/embed/movie/${id}`;
      }
      return `${api.baseUrl}/embed/tv/${id}-${season ?? 1}-${episode ?? 1}`;
    
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

// Get primary source (first one)
export function getPrimarySource(type: "movie" | "tv", id: number, season?: number, episode?: number): StreamingSource {
  const sources = getStreamingSources(type, id, season, episode);
  return sources[0];
}