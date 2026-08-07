import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlaceInput = { lat: number; lon: number };

export async function POST(request: NextRequest) {
  let places: PlaceInput[] = [];
  try {
    const body = await request.json();
    places = Array.isArray(body?.places)
      ? body.places
          .filter(
            (place: PlaceInput) =>
              Number.isFinite(place?.lat) &&
              Number.isFinite(place?.lon) &&
              place.lat >= 34.8 &&
              place.lat <= 35.5 &&
              place.lon >= 128.7 &&
              place.lon <= 129.4,
          )
          .slice(0, 8)
      : [];
  } catch {
    return NextResponse.json({ parking: [] }, { status: 400 });
  }
  if (!places.length) return NextResponse.json({ parking: [] });

  const clauses = places
    .flatMap((place) => [
      `node(around:1500,${place.lat},${place.lon})["amenity"="parking"]`,
      `way(around:1500,${place.lat},${place.lon})["amenity"="parking"]`,
      `relation(around:1500,${place.lat},${place.lon})["amenity"="parking"]`,
    ])
    .join(";");
  const query = `[out:json][timeout:22];(${clauses};);out center tags;`;
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "BLUE-LINE-BUSAN/1.0",
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(25_000),
        cache: "no-store",
      });
      if (!response.ok) continue;
      const data = await response.json();
      const parking = (data.elements || [])
        .map((item: any) => ({
          id: `parking-${item.type}-${item.id}`,
          name: item.tags?.["name:ko"] || item.tags?.name || "공개 주차장",
          nameJa: item.tags?.["name:ja"],
          nameZh: item.tags?.["name:zh"] || item.tags?.["name:zh-Hans"],
          lat: Number(item.lat ?? item.center?.lat),
          lon: Number(item.lon ?? item.center?.lon),
        }))
        .filter(
          (
            item: { id: string; lat: number; lon: number },
            index: number,
            items: { id: string }[],
          ) =>
            Number.isFinite(item.lat) &&
            Number.isFinite(item.lon) &&
            items.findIndex((other) => other.id === item.id) === index,
        )
        .slice(0, 100);
      return NextResponse.json({ parking });
    } catch {
      // Try the next public Overpass endpoint.
    }
  }
  return NextResponse.json({ parking: [] }, { status: 502 });
}
