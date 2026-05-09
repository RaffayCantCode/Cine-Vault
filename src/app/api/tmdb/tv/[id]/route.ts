import { tmdbFetch } from "@/lib/tmdb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await tmdbFetch(`/tv/${id}`, {
      append_to_response: "credits,videos,similar",
    });
    return Response.json(data);
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to fetch TV show details";
    return Response.json({ error: message }, { status: 500 });
  }
}
