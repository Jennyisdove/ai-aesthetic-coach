type UnsplashSearchResponse = {
  results?: Array<{
    urls?: {
      regular?: string;
    };
  }>;
};

const imageSearchCache = new Map<string, string | null>();

export async function searchUnsplashImage(
  query: string,
): Promise<string | null> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return null;
  }

  if (imageSearchCache.has(normalizedQuery)) {
    return imageSearchCache.get(normalizedQuery) ?? null;
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    imageSearchCache.set(normalizedQuery, null);
    return null;
  }

  try {
    const searchParams = new URLSearchParams({
      query: normalizedQuery,
      per_page: "1",
      orientation: "portrait",
    });
    const response = await fetch(
      `https://api.unsplash.com/search/photos?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      },
    );

    if (!response.ok) {
      imageSearchCache.set(normalizedQuery, null);
      return null;
    }

    const data = (await response.json()) as UnsplashSearchResponse;
    const imageUrl = data.results?.[0]?.urls?.regular ?? null;

    imageSearchCache.set(normalizedQuery, imageUrl);
    return imageUrl;
  } catch {
    imageSearchCache.set(normalizedQuery, null);
    return null;
  }
}
