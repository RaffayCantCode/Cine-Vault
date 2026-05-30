const TMDB_BASE = "https://api.themoviedb.org/3";

const ADULT_KEYWORDS = [
  "porn",
  "adult",
  "erotic",
  "sex",
  "nude",
  "nudity",
  "explicit",
  "hardcore",
  "softcore",
  "xxx",
  "nsfw",
];

function getAuthHeader(): string {
  const token = process.env.TMDB_API_KEY;
  if (!token || token === "") {
    throw new Error("TMDB_API_KEY is not set");
  }
  return `Bearer ${token}`;
}

export async function tmdbFetch(
  path: string,
  params?: Record<string, string>
): Promise<unknown> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("include_adult", "false");
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`TMDB fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return filterTmdbResponse(data);
}

function filterTmdbResponse(data: unknown): unknown {
  if (!data || typeof data !== "object" || !("results" in data)) {
    return data;
  }

  const response = data as { results?: unknown[] };
  if (!Array.isArray(response.results)) {
    return data;
  }

  return {
    ...response,
    results: response.results.filter((item) => {
      if (!item || typeof item !== "object") return false;
      const media = item as {
        adult?: boolean;
        title?: string;
        name?: string;
        overview?: string;
        poster_path?: string | null;
        backdrop_path?: string | null;
      };

      if (media.adult === true) return false;
      if (!media.poster_path && !media.backdrop_path) return false;

      const searchable = `${media.title || ""} ${media.name || ""} ${media.overview || ""}`.toLowerCase();
      return !ADULT_KEYWORDS.some((keyword) => searchable.includes(keyword));
    }),
  };
}
