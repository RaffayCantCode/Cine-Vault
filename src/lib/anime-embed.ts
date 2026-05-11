// Anime Embed Sources - Using working streaming sites
// These work by searching anime by title in the URL

export interface AnimeEmbedSource {
  name: string;
  embedUrl: string;
  type: "iframe";
  quality: "HD";
}

// Clean title for URL
function cleanAnimeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Get all anime sources from title - use working embeds
export function getAllAnimeSources(title: string, episode: number = 1): AnimeEmbedSource[] {
  const clean = cleanAnimeTitle(title);
  
  return [
    {
      name: "VidPlay",
      embedUrl: `https://vidplay.site/embed/${clean}-episode-${episode}`,
      type: "iframe",
      quality: "HD",
    },
    {
      name: "StreamSB",
      embedUrl: `https://streamsb.net/embed/${clean}-episode-${episode}`,
      type: "iframe",
      quality: "HD",
    },
    {
      name: "Filemoon",
      embedUrl: `https://filemoon.top/e/${clean}-episode-${episode}`,
      type: "iframe",
      quality: "HD",
    },
    {
      name: "VidCloud",
      embedUrl: `https://vidcloud9.ru/embed/${clean}-episode-${episode}`,
      type: "iframe",
      quality: "HD",
    },
  ];
}

// Get primary source
export function getPrimaryAnimeEmbed(title: string, episode: number = 1): AnimeEmbedSource {
  return getAllAnimeSources(title, episode)[0];
}

// Legacy compatibility - handle animeId as second param
export function getAnimeEmbedSources(animeId: string, episode: number = 1): AnimeEmbedSource[] {
  const decoded = decodeURIComponent(animeId);
  return getAllAnimeSources(decoded, episode);
}

export function getAutoEmbedSources(title: string, episode: number = 1): AnimeEmbedSource[] {
  return getAllAnimeSources(title, episode);
}