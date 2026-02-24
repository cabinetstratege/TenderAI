const SOURCE_URL = 'https://france-geojson.gregoiredavid.fr/repo/departements.geojson';

export const revalidate = 60 * 60 * 24; // 24h caching at Next/fetch layer when possible

export async function GET() {
  let upstream: Response;

  try {
    upstream = await fetch(SOURCE_URL, {
      // Allow Next.js to cache the upstream response for the revalidate window
      next: { revalidate },
    });
  } catch (error) {
    console.error('[geojson] network error', error);
    return new Response('GeoJSON upstream unreachable', { status: 502 });
  }

  if (!upstream.ok) {
    console.error('[geojson] bad upstream status', upstream.status, upstream.statusText);
    return new Response('GeoJSON upstream error', { status: 502 });
  }

  const buffer = await upstream.arrayBuffer();
  const contentType = upstream.headers.get('content-type') ?? 'application/geo+json';

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
