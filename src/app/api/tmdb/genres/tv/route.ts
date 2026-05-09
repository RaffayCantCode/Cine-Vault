import { tmdbFetch } from "@/lib/tmdb";

export async function GET() {
  try {
    const data = await tmdbFetch("/genre/tv/list");
    return Response.json(data);
  } catch (error) {
    const message =
      error instanceof Error && error.message ? error.message : "Failed to fetch genres";
    return Response.json({ error: message }, { status: 500 });
  }
}
