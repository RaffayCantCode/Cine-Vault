// Multi-API Streaming Fetcher for Movies & TV
// Sources from vidsrc.domains

interface StreamingAPIConfig {
  name: string;
  baseUrl: string;
  type: string;
}

const STREAMING_APIS: StreamingAPIConfig[] = [
  {
    name: "VidSrc (PM)",
    baseUrl: "https://vidsrc.pm",
    type: "vidsrcpm",
  },
  {
    name: "VidSrc (EU)",
    baseUrl: "https://vidsrc.eu",
    type: "vidsrceu",
  },
  {
    name: "VidSrc (ME)",
    baseUrl: "https://vidsrc.me",
    type: "vidsrcme",
  },
  {
    name: "VidSrc (TV)",
    baseUrl: "https://vidsrc.tv",
    type: "vidsrctv",
  },
];

// Build embed URL based on API type
function buildEmbedUrl(api: StreamingAPIConfig, type: "movie" | "tv", id: number, season?: number, episode?: number): string {
  // Use TMDB ID for vidsrc domains
  if (type === "movie") {
    return `${api.baseUrl}/embed/movie/${id}`;
  }
  return `${api.baseUrl}/embed/tv/${id}-${season ?? 1}-${episode ?? 1}`;
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