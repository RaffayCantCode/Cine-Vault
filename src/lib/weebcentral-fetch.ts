const WEECB_URL = "https://weebcentral.com";

interface WCManga {
  id: string;
  name: string;
  poster: string;
  description: string;
  type: string;
  genres: string[];
  year: number | null;
  author: string;
  status: string;
  chaptersCount: number;
  url: string;
}

interface WCChapter {
  id: string;
  number: number;
  title: string;
  volume: string | null;
  publishedAt: string | null;
  url: string;
}

interface WCChapterPages {
  chapterId: string;
  pages: string[];
}

function parseGenres(tagStr: string): string[] {
  if (!tagStr) return [];
  return tagStr.split(",").map((t) => t.trim()).filter(Boolean);
}

function extractChapterNumber(text: string): number {
  const match = text.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

async function wcFetch(path: string): Promise<string> {
  const res = await fetch(`${WEECB_URL}${path}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "text/html,application/xhtml+xml",
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`WeebCentral request failed: ${res.status}`);
  return res.text();
}

function parseSearchResults(html: string): WCManga[] {
  return [];
}

export async function searchWCManga(query: string, page = 1): Promise<{ success: boolean; data: WCManga[]; hasMore: boolean }> {
  try {
    const offset = (page - 1) * 24;
    const sanitized = query.replace(/[^a-zA-Z0-9\s]/g, " ").trim();
    const searchUrl = `/search/data?limit=24&offset=${offset}&text=${encodeURIComponent(sanitized)}&sort=Best+Match&order=Ascending&official=Any&display_mode=Minimal%20Display`;

    const html = await wcFetch(searchUrl);

    const results: WCManga[] = [];
    const itemRegex = /<a[^>]+href="(\/series\/([^"/]+)[^"]*)"[^>]*>\s*<img[^>]+src="([^"]+)"[^>]+alt="([^"]+)"[\s\S]*?<span[^>]*>\s*(Manhwa|Manhua|Manga|OEL)\s*<\/span>/gi;

    let match;
    while ((match = itemRegex.exec(html)) !== null && results.length < 24) {
      const [_, url, id, poster, name, type] = match;

      const yearMatch = html.slice(match.index, match.index + 300).match(/\b(19|20)\d{2}\b/);
      const statusMatch = html.slice(match.index, match.index + 300).match(/(Complete|Ongoing|Hiatus|Canceled)/i);
      const tagsMatch = html.slice(match.index, match.index + 300).match(/Tag\(s\):\s*([^<]+)/i);

      results.push({
        id,
        name: name.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
        poster: poster.replace(/&amp;/g, "&"),
        description: "",
        type: type,
        genres: tagsMatch ? parseGenres(tagsMatch[1]) : [],
        year: yearMatch ? parseInt(yearMatch[0]) : null,
        author: "",
        status: statusMatch ? statusMatch[1] : "",
        chaptersCount: 0,
        url: `${WEECB_URL}${url}`,
      });
    }

    return {
      success: true,
      data: results,
      hasMore: results.length >= 24,
    };
  } catch (error) {
    console.error("[WeebCentral Search Error]:", error);
    return { success: false, data: [], hasMore: false };
  }
}

export async function getPopularWCManga(page = 1): Promise<{ success: boolean; data: WCManga[]; hasMore: boolean }> {
  return searchWCManga("popular trending", page);
}

export async function getLatestWCManga(page = 1): Promise<{ success: boolean; data: WCManga[]; hasMore: boolean }> {
  return searchWCManga("latest updates", page);
}

export async function getWCMangaDetails(mangaId: string): Promise<{ success: boolean; data: WCManga | null; error?: string }> {
  try {
    const html = await wcFetch(`/series/${mangaId}`);

    const coverMatch = html.match(/class="[^"]*series-cover[^"]*"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/i);
    const titleMatch = html.match(/<h1[^>]*>\s*([^<]+)/i);
    const descMatch = html.match(/class="[^"]*series-description[^"]*"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
    const typeMatch = html.match(/Type:\s*<[^>]*>\s*([^<]+)/i);
    const statusMatch = html.match(/Status:\s*<[^>]*>\s*([^<]+)/i);
    const yearMatch = html.match(/Year:\s*<[^>]*>\s*(\d{4})/i);
    const authorMatch = html.match(/Author:\s*<[^>]*>\s*<a[^>]*>\s*([^<]+)/i);
    const chaptersCountMatch = html.match(/(\d+)\s*Chapters?/i);
    const tagsMatch = html.match(/class="[^"]*series-tags[^"]*"[^>]*>[\s\S]*?<\/div>/i);

    let genres: string[] = [];
    if (tagsMatch) {
      const tagMatches = tagsMatch[0].match(/<span[^>]*>\s*([^<]+)\s*<\/span>/gi);
      if (tagMatches) {
        genres = tagMatches.map((t) => t.replace(/<[^>]+>/g, "").trim()).filter(Boolean);
      }
    }

    const coverUrl = coverMatch ? coverMatch[1].replace(/&amp;/g, "&") : "";

    return {
      success: true,
      data: {
        id: mangaId,
        name: titleMatch ? titleMatch[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"') : "Unknown",
        poster: coverUrl,
        description: descMatch ? descMatch[1].replace(/&amp;/g, "&").replace(/<[^>]+>/g, "").trim() : "",
        type: typeMatch ? typeMatch[1] : "Manga",
        genres,
        year: yearMatch ? parseInt(yearMatch[1]) : null,
        author: authorMatch ? authorMatch[1].replace(/&amp;/g, "&") : "",
        status: statusMatch ? statusMatch[1] : "",
        chaptersCount: chaptersCountMatch ? parseInt(chaptersCountMatch[1]) : 0,
        url: `${WEECB_URL}/series/${mangaId}`,
      },
    };
  } catch (error) {
    console.error("[WeebCentral Manga Details Error]:", error);
    return { success: false, data: null, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function getWCChapters(mangaId: string): Promise<{ success: boolean; data: { chapters: WCChapter[]; totalChapters: number }; error?: string }> {
  try {
    const html = await wcFetch(`/series/${mangaId}/full-chapter-list`);

    const chapters: WCChapter[] = [];
    const chapterRegex = /href="(\/chapters\/([^"]+))"[^>]*>\s*<[^>]*>\s*Chapter\s*([\d.]+)\s*<\/[^>]*>[\s\S]*?<[^>]*>\s*([^<]+)\s*<\/[^>]*>/gi;

    let match;
    const seen = new Map<string, WCChapter>();

    while ((match = chapterRegex.exec(html)) !== null) {
      const [_, url, id, numStr, title] = match;
      const number = parseFloat(numStr) || 0;

      if (!seen.has(id)) {
        seen.set(id, {
          id,
          number,
          title: title.replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim() || "",
          volume: null,
          publishedAt: null,
          url: `${WEECB_URL}${url}`,
        });
      }
    }

    const chapterList = Array.from(seen.values()).sort((a, b) => b.number - a.number);

    return {
      success: true,
      data: {
        chapters: chapterList,
        totalChapters: chapterList.length,
      },
    };
  } catch (error) {
    console.error("[WeebCentral Chapters Error]:", error);
    return { success: false, data: { chapters: [], totalChapters: 0 }, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function getWCChapterPages(chapterId: string): Promise<{ success: boolean; data: WCChapterPages; error?: string }> {
  try {
    const html = await wcFetch(`/chapters/${chapterId}`);

    const imgRegex = /data-src="([^"]+\.(?:jpg|jpeg|png|webp))"/gi;
    const pages: string[] = [];
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      pages.push(match[1].replace(/&amp;/g, "&"));
    }

    if (pages.length === 0) {
      const srcImgRegex = /<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp))"[^>]*class="[^"]*chapter-page[^"]*"/gi;
      while ((match = srcImgRegex.exec(html)) !== null) {
        pages.push(match[1].replace(/&amp;/g, "&"));
      }
    }

    if (pages.length === 0) {
      const allImgRegex = /<img[^>]+src="([^"]+\.(?:jpg|jpeg|png|webp))"[^>]*>/gi;
      while ((match = allImgRegex.exec(html)) !== null) {
        const src = match[1].replace(/&amp;/g, "&");
        if (!src.includes("logo") && !src.includes("icon") && !src.includes("avatar")) {
          pages.push(src);
        }
      }
    }

    if (pages.length === 0) {
      return { success: false, data: { chapterId, pages: [] }, error: "No images found" };
    }

    return {
      success: true,
      data: { chapterId, pages },
    };
  } catch (error) {
    console.error("[WeebCentral Chapter Pages Error]:", error);
    return { success: false, data: { chapterId, pages: [] }, error: error instanceof Error ? error.message : "Failed" };
  }
}