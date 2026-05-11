import { NextRequest } from "next/server";
import * as MangaDex from "@/lib/mangadex-fetch";
import * as WeebCentral from "@/lib/weebcentral-fetch";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const { chapterId } = await params;
  const url = new URL(_request.url);
  const source = url.searchParams.get("source") || "mangadex";

  try {
    if (source === "weebcentral") {
      const result = await WeebCentral.getWCChapterPages(chapterId);
      return Response.json(result);
    }

    const result = await MangaDex.getChapterPages(chapterId);
    return Response.json(result);
  } catch (error) {
    console.error("[Manga Reader Error]:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load chapter pages", success: false },
      { status: 500 }
    );
  }
}