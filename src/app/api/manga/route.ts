import { NextRequest } from "next/server";
import * as MangaDex from "@/lib/mangadex-fetch";
import * as WeebCentral from "@/lib/weebcentral-fetch";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category") || "popular";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const source = searchParams.get("source") || "mangadex";

  try {
    let data: any;

    if (source === "weebcentral") {
      if (category === "popular") {
        data = await WeebCentral.getPopularWCManga(page);
      } else if (category === "latest") {
        data = await WeebCentral.getLatestWCManga(page);
      } else if (category === "search") {
        const query = searchParams.get("q") || "";
        data = await WeebCentral.searchWCManga(query, page);
      } else {
        data = await WeebCentral.getPopularWCManga(page);
      }
    } else {
      if (category === "popular") {
        data = await MangaDex.getPopularManga(page);
      } else if (category === "latest") {
        data = await MangaDex.getLatestManga(page);
      } else if (category === "search") {
        const query = searchParams.get("q") || "";
        data = await MangaDex.searchManga(query, page);
      } else {
        data = await MangaDex.getPopularManga(page);
      }
    }

    return Response.json({ ...data, source });
  } catch (error) {
    console.error("[Manga API Error]:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed", success: false },
      { status: 500 }
    );
  }
}