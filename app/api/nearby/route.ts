import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlaceInput = { lat: number; lon: number };

export async function POST(request: NextRequest) {
  let places: PlaceInput[] = [];
  let kind: "food" | "care" | "convenience" = "food";
  try {
    const body = await request.json();
    kind =
      body?.kind === "care"
        ? "care"
        : body?.kind === "convenience"
          ? "convenience"
          : "food";
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
    return NextResponse.json({ places: [] }, { status: 400 });
  }
  if (!places.length) return NextResponse.json({ places: [] });

  const filters =
    kind === "food"
      ? ['["amenity"~"restaurant|cafe|fast_food"]']
      : kind === "care"
        ? ['["amenity"~"hospital|clinic|doctors"]']
        : [
            '["shop"="convenience"]',
            '["name"~"^(GS ?25|CU($|[ _-])|7-?Eleven|7 ?eleven|세븐일레븐|emart ?24|이마트 ?24)",i]',
          ];
  // Convenience stores are dense in Busan. A smaller per-attraction radius
  // keeps the public Overpass request fast and dependable.
  const radius = kind === "convenience" ? 1200 : 2500;
  const clauses = places
    .flatMap((place) =>
      filters.flatMap((filter) =>
        kind === "convenience"
          ? [`node(around:${radius},${place.lat},${place.lon})${filter}`]
          : [
              `node(around:${radius},${place.lat},${place.lon})${filter}`,
              `way(around:${radius},${place.lat},${place.lon})${filter}`,
              `relation(around:${radius},${place.lat},${place.lon})${filter}`,
            ],
      ),
    )
    .join(";");
  const query = `[out:json][timeout:24];(${clauses};);out center tags;`;
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
        signal: AbortSignal.timeout(27_000),
        cache: "no-store",
      });
      if (!response.ok) continue;
      const data = await response.json();
      const results = (data.elements || [])
        .map((item: any) => ({
          id: `${kind}-${item.type}-${item.id}`,
          name:
            item.tags?.["name:en"] ||
            item.tags?.name ||
            item.tags?.["name:ko"] ||
            item.tags?.brand ||
            item.tags?.operator ||
            "",
          nameKo: item.tags?.["name:ko"] || item.tags?.name,
          nameJa: item.tags?.["name:ja"],
          nameZh: item.tags?.["name:zh"] || item.tags?.["name:zh-Hans"],
          cuisine: item.tags?.cuisine,
          hours: item.tags?.opening_hours,
          phone: item.tags?.phone || item.tags?.["contact:phone"],
          amenity: item.tags?.amenity,
          specialty: item.tags?.healthcare || item.tags?.amenity,
          lat: Number(item.lat ?? item.center?.lat),
          lon: Number(item.lon ?? item.center?.lon),
        }))
        .filter(
          (
            item: { id: string; name: string; lat: number; lon: number },
            index: number,
            items: { id: string }[],
          ) =>
            Boolean(item.name) &&
            Number.isFinite(item.lat) &&
            Number.isFinite(item.lon) &&
            items.findIndex((other) => other.id === item.id) === index,
        )
        .slice(0, 500);
      return NextResponse.json({ places: results });
    } catch {
      // Try the next public Overpass endpoint.
    }
  }
  return NextResponse.json({ places: [] }, { status: 502 });
}
