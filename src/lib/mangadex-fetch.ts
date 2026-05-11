const MANGADEX_API = "https://api.mangadex.org";

function pickTitle(attributes: any): string {
  const en = attributes?.title?.en;
  if (en) return en;
  const ja = attributes?.title?.ja;
  if (ja) return ja;
  const jaRo = attributes?.title?.["ja-ro"];
  if (jaRo) return jaRo;
  const values = Object.values(attributes?.title || {}) as string[];
  return values[0] || "Untitled";
}

function mapManga(item: any) {
  const attrs = item.attributes || {};

  let coverUrl = "";
  const coverRel = (item.relationships || []).find((r: any) => r.type === "cover_art");
  if (coverRel?.attributes?.fileName) {
    const fileName = coverRel.attributes.fileName;
    coverUrl = `https://uploads.mangadex.org/covers/${item.id}/${fileName}.512.jpg`;
  }

  const authorRel = item.relationships?.find((r: any) => r.type === "author");
  const authorName = authorRel?.attributes?.name || "";
  const artistRel = item.relationships?.find((r: any) => r.type === "artist");
  const artistName = artistRel?.attributes?.name || "";

  const tags = (attrs.tags || []).map((t: any) => t.attributes?.name?.en).filter(Boolean);

  const origLang = attrs.originalLanguage || "ja";
  let contentType = "Manga";
  if (origLang === "ko") contentType = "Manhwa";
  else if (origLang === "zh") contentType = "Manhua";

  return {
    id: item.id,
    name: pickTitle(attrs),
    poster: coverUrl,
    description: attrs.description?.en || attrs.description?.ja || "",
    type: contentType,
    genres: tags,
    year: attrs.year || null,
    author: authorName,
    artist: artistName !== authorName ? artistName : "",
    status: attrs.status || "",
    tags,
    lastChapter: attrs.lastChapter || null,
    originalLanguage: origLang,
    tagsFormatted: tags.slice(0, 8),
  };
}

async function fetchMangaList(params: URLSearchParams): Promise<any> {
  params.append("includes[]", "cover_art");
  params.append("includes[]", "author");
  params.append("includes[]", "artist");
  params.append("contentRating[]", "safe");
  params.append("contentRating[]", "suggestive");
  params.append("limit", "24");

  const res = await fetch(`${MANGADEX_API}/manga?${params.toString()}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`MangaDex request failed: ${res.status}`);
  const data = await res.json();

  return {
    success: true,
    data: (data.data || []).map(mapManga),
    hasMore: (data.total || 0) > (data.offset || 0) + (data.limit || 24),
  };
}

export async function getPopularManga(page = 1): Promise<any> {
  const offset = (page - 1) * 24;
  const params = new URLSearchParams();
  params.append("offset", String(offset));
  params.append("order[followedCount]", "desc");
  params.append("availableTranslatedLanguage[]", "en");
  return fetchMangaList(params);
}

export async function getLatestManga(page = 1): Promise<any> {
  const offset = (page - 1) * 24;
  const params = new URLSearchParams();
  params.append("offset", String(offset));
  params.append("order[latestUploadedChapter]", "desc");
  params.append("availableTranslatedLanguage[]", "en");
  return fetchMangaList(params);
}

export async function searchManga(query: string, page = 1): Promise<any> {
  const offset = (page - 1) * 24;
  const params = new URLSearchParams();
  params.append("offset", String(offset));
  params.append("title", query);
  params.append("order[relevance]", "desc");
  params.append("availableTranslatedLanguage[]", "en");
  return fetchMangaList(params);
}

export async function getMangaDetails(mangaId: string): Promise<any> {
  const res = await fetch(
    `${MANGADEX_API}/manga/${mangaId}?includes[]=cover_art&includes[]=author&includes[]=artist&includes[]=tag`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error(`MangaDex details failed: ${res.status}`);
  const payload = await res.json();
  const item = payload.data;
  const mapped = mapManga(item);

  return {
    success: true,
    data: mapped,
  };
}

export async function getChapterDetails(chapterId: string): Promise<any> {
  const res = await fetch(
    `${MANGADEX_API}/chapter/${chapterId}?includes[]=scanlation_group&includes[]=manga`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`MangaDex chapter details failed: ${res.status}`);
  const payload = await res.json();
  return { success: true, data: payload.data };
}

export async function getChapterPages(chapterId: string): Promise<any> {
  const res = await fetch(`${MANGADEX_API}/at-home/server/${chapterId}`, {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`MangaDex at-home failed (${res.status}):`, errorText);
    throw new Error(`MangaDex at-home failed: ${res.status}`);
  }

  const data = await res.json();
  const baseUrl = data.baseUrl;
  const hash = data.chapter?.hash;

  let files = data.chapter?.data || [];
  const useDataSaver = files.length === 0;
  if (useDataSaver) files = data.chapter?.dataSaver || [];

  if (!baseUrl || !hash || files.length === 0) {
    throw new Error("No readable pages found for this chapter");
  }

  const qualityDir = useDataSaver ? "data-saver" : "data";
  const pages = files.map((file: string) => `${baseUrl}/${qualityDir}/${hash}/${file}`);

  return {
    success: true,
    data: {
      chapterId,
      pages,
      baseUrl,
      hash,
      quality: useDataSaver ? "data-saver" : "data",
    },
  };
}
