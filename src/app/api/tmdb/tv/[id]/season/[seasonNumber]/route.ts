import { tmdbFetch } from "@/lib/tmdb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; seasonNumber: string }> }
) {
  const { id, seasonNumber } = await params;

  try {
    const data = await tmdbFetch(`/tv/${id}/season/${seasonNumber}`);
    return Response.json(data);
  } catch (error) {
    const message =
      error instanceof Error && error.message ? error.message : "Failed to fetch season details";
    return Response.json({ error: message }, { status: 500 });
  }
}
