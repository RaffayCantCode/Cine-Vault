// Reliable Anime Embed Sources
// Uses title-based searches that work reliably
// Fallback system for when primary sources fail

export interface AnimeEmbedSource {
  name: string;
  embedUrl: string;
  type: "iframe";
  quality: "HD" | "SD";
  hasSubtitles?: boolean;
  hasDub?: boolean;
}

// Clean anime title for URL
function cleanTitle(title: string): string {
  return title.toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Get embed sources using anime title (most reliable)
export function getTitleBasedSources(title: string, episode: number = 1): AnimeEmbedSource[] {
  const clean = cleanTitle(title);
  
  return [
    {
      name: "2Embed",
      embedUrl: `https://www.2embed.cc/embed/${clean}-episode-${episode}`,
      type: "iframe",
      quality: "HD",
      hasSubtitles: true,
      hasDub: true,
    },
    {
      name: "VidKing",
      embedUrl: `https://www.vidking.net/embed/tv/${encodeURIComponent(title)}/${episode}`,
      type: "iframe",
      quality: "HD",
      hasSubtitles: true,
      hasDub: true,
    },
    {
      name: "VidSrc.me",
      embedUrl: `https://vidsrc.me/embed/tv/${encodeURIComponent(title)}/${episode}`,
      type: "iframe",
      quality: "HD",
      hasSubtitles: true,
      hasDub: true,
    },
    {
      name: "VidSrc",
      embedUrl: `https://vidsrc-embed.ru/embed/tv/${encodeURIComponent(title)}/${episode}?ds_lang=en`,
      type: "iframe",
      quality: "HD",
      hasSubtitles: true,
      hasDub: true,
    },
    {
      name: "VidSrc.sbs",
      embedUrl: `https://vidsrc.sbs/embed/tv/${encodeURIComponent(title)}/${episode}`,
      type: "iframe",
      quality: "HD",
      hasSubtitles: true,
      hasDub: true,
    },
  ];
}

// Legacy function - uses title in URL
export function getAnimeEmbedSources(animeId: string, episode: number = 1): AnimeEmbedSource[] {
  // Decode the ID if it's encoded, treat it as title
  const decoded = decodeURIComponent(animeId);
  return getTitleBasedSources(decoded, episode);
}

// Legacy auto-embed function
export function getAutoEmbedSources(title: string, episode: number = 1): AnimeEmbedSource[] {
  return getTitleBasedSources(title, episode);
}

// Get primary source
export function getPrimaryAnimeEmbed(title: string, animeId: string, episode: number = 1): AnimeEmbedSource {
  const sources = getAllAnimeSources(title, animeId, episode);
  return sources[0];
}

// Get all sources combined - tries title-based first
export function getAllAnimeSources(title: string, animeId: string, episode: number = 1): AnimeEmbedSource[] {
  // Always use title-based sources as primary
  return getTitleBasedSources(title, episode);
}