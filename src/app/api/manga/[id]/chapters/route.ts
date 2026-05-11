import { NextRequest } from "next/server";
import * as MangaDex from "@/lib/mangadex-fetch";
import * as WeebCentral from "@/lib/weebcentral-fetch";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(_request.url);
  const source = url.searchParams.get("source") || "mangadex";

  try {
    if (source === "weebcentral") {
      const [wcDetails, wcChapters] = await Promise.all([
        WeebCentral.getWCMangaDetails(id),
        WeebCentral.getWCChapters(id),
      ]);

      return Response.json({
        success: wcDetails.success && wcChapters.success,
        data: {
          chapters: wcChapters.data.chapters,
          totalChapters: wcChapters.data.totalChapters,
          manga: wcDetails.data,
        },
      });
    }

    const [mangaDetails, chaptersRes] = await Promise.all([
      MangaDex.getMangaDetails(id),
      fetch(
        `https://api.mangadex.org/manga/${id}/feed?translatedLanguage[]=en&order[chapter]=desc&limit=500&includeEmptyPages=false`,
        { next: { revalidate: 300 } }
      ),
    ]);

    if (!chaptersRes.ok) {
      throw new Error(`MangaDex chapter feed failed: ${chaptersRes.status}`);
    }

    const chapterPayload = await chaptersRes.json();
    const seen = new Map<string, any>();

    for (const ch of chapterPayload.data || []) {
      const num = ch?.attributes?.chapter;
      if (!num) continue;
      if (!seen.has(num)) {
        const groupRel = ch.relationships?.find((r: any) => r.type === "scanlation_group");
        seen.set(num, {
          id: ch.id,
          number: parseFloat(num),
          title: ch.attributes.title || "",
          volume: ch.attributes.volume || null,
          publishedAt: ch.attributes.publishAt || null,
          scanlationGroup: groupRel?.attributes?.name || "Unknown",
          read: false,
        });
      }
    }

    const chapters = Array.from(seen.values()).sort((a, b) => b.number - a.number);

    return Response.json({
      success: true,
      data: {
        chapters,
        totalChapters: chapters.length,
        manga: mangaDetails.data,
      },
    });
  } catch (error) {
    console.error("[Manga Chapters Error]:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch chapters", success: false },
      { status: 500 }
    );
  }
}