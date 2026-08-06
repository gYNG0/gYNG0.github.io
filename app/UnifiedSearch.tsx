"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Point = {
  id: string;
  name: string;
  nameKo?: string;
  lat: number;
  lon: number;
  risk: string;
  riskKo?: string;
};
type Tab = "route" | "food" | "safety";
type RouteData = {
  coordinates: [number, number][];
  distance: number;
  legs: { from: string; to: string; distance: number }[];
};
declare global {
  interface Window {
    L?: any;
  }
}

const BUSAN_ATTRACTIONS: Point[] = [
  {
    id: "haeundae",
    name: "Haeundae Beach",
    nameKo: "해운대 해수욕장",
    lat: 35.1587,
    lon: 129.1604,
    risk: "Rip currents can occur when sea and weather conditions change. Swim only in designated zones.",
    riskKo:
      "바다와 날씨 변화에 따라 이안류가 발생할 수 있습니다. 지정된 구역에서만 물놀이하고 안전요원의 안내를 따르세요.",
  },
  {
    id: "gamcheon",
    name: "Gamcheon Culture Village",
    nameKo: "감천문화마을",
    lat: 35.0976,
    lon: 129.0106,
    risk: "Steep alleys and stairs can be slippery. Wear stable shoes and stay on marked pedestrian routes.",
    riskKo:
      "가파른 골목과 계단이 미끄러울 수 있습니다. 미끄럼 방지 신발을 착용하고 지정된 보행로를 이용하세요.",
  },
  {
    id: "gwangalli",
    name: "Gwangalli Beach",
    nameKo: "광안리 해수욕장",
    lat: 35.1532,
    lon: 129.1186,
    risk: "Strong wind and waves can reach sea walls. Avoid barriers and follow beach controls.",
    riskKo:
      "강풍과 높은 파도가 방파제까지 닿을 수 있습니다. 안전 펜스에 접근하지 말고 현장 통제를 따르세요.",
  },
  {
    id: "busan-station",
    name: "Busan Station",
    nameKo: "부산역",
    lat: 35.1151,
    lon: 129.0414,
    risk: "Busy roads and taxi lanes surround the station. Use marked crossings and watch luggage in crowds.",
    riskKo:
      "역 주변 도로와 택시 승강장이 혼잡합니다. 횡단보도를 이용하고 혼잡한 곳에서 짐을 잘 관리하세요.",
  },
  {
    id: "yongdusan",
    name: "Yongdusan Park",
    nameKo: "용두산공원",
    lat: 35.1008,
    lon: 129.0329,
    risk: "Slopes and stairs can become slick in rain. Use handrails and lit paths after dark.",
    riskKo:
      "비가 오면 경사로와 계단이 미끄러울 수 있습니다. 난간을 이용하고 야간에는 조명이 있는 길로 이동하세요.",
  },
  {
    id: "huinnyeoul",
    name: "Huinnyeoul Culture Village",
    nameKo: "흰여울문화마을",
    lat: 35.0786,
    lon: 129.0448,
    risk: "Narrow cliff-side alleys and stairs require care, especially in wind or rain.",
    riskKo:
      "절벽 주변의 좁은 골목과 계단에서는 특히 비바람이 불 때 주의하세요.",
  },
  {
    id: "songdo",
    name: "Songdo Beach",
    nameKo: "송도해수욕장",
    lat: 35.0766,
    lon: 129.0195,
    risk: "Wet rocks, sea spray and tide changes create slippery edges. Do not cross barriers.",
    riskKo:
      "젖은 바위와 파도, 조수 변화로 해안 가장자리가 미끄럽습니다. 안전선을 넘지 마세요.",
  },
  {
    id: "taejongdae",
    name: "Taejongdae",
    nameKo: "태종대",
    lat: 35.0513,
    lon: 129.0875,
    risk: "Cliff paths are exposed to wind and rain. Follow closures and remain seated on tourist vehicles.",
    riskKo:
      "절벽 산책로는 비바람에 노출됩니다. 출입 통제를 따르고 관광차량에서는 착석해 주세요.",
  },
];

const aliases: Record<string, string[]> = {
  haeundae: ["haeundae", "해운대"],
  gamcheon: ["gamcheon", "감천"],
  gwangalli: ["gwangalli", "광안리"],
  "busan-station": ["busan station", "부산역"],
  yongdusan: ["yongdusan", "용두산"],
  huinnyeoul: ["huinnyeoul", "흰여울"],
  songdo: ["songdo", "송도"],
  taejongdae: ["taejongdae", "태종대"],
};
const genericRisk =
  "No place-specific alert is registered in this guide. Check weather, official closures and on-site safety signs before visiting.";
const minutes = (meters: number) =>
  Math.max(1, Math.round((meters / 1000) * 4));
const TOURISM_KEYWORDS = [
  "관광",
  "관광지",
  "관광지 추천",
  "tour",
  "tourist",
  "tourism",
  "attraction",
  "attractions",
  "sightseeing",
  "landmark",
  "landmarks",
  "places to visit",
  "travel spots",
];

async function findBusanPlace(value: string): Promise<Point> {
  const clean = value.trim();
  const normalized = clean.toLowerCase();
  const known = BUSAN_ATTRACTIONS.find(
    (place) =>
      place.name.toLowerCase().includes(normalized) ||
      aliases[place.id]?.some(
        (alias) => normalized.includes(alias) || alias.includes(normalized),
      ),
  );
  if (known) return known;
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=kr&q=${encodeURIComponent(`${clean}, Busan`)}`,
  );
  if (!response.ok) throw new Error("search unavailable");
  const results = await response.json();
  if (!results[0]) throw new Error("not found");
  return {
    id: `search-${clean}-${results[0].lat}`,
    name: results[0].display_name.split(",")[0] || clean,
    lat: Number(results[0].lat),
    lon: Number(results[0].lon),
    risk: genericRisk,
  };
}

export default function UnifiedSearch({
  initialQuery,
  onClose,
  language,
}: {
  initialQuery: string;
  onClose: () => void;
  language: "ko" | "en";
}) {
  const ko = language === "ko";
  const displayName = (point: Point) =>
    ko ? point.nameKo || point.name : point.name;
  const say = (en: string, korean: string) => (ko ? korean : en);
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<Point | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [tab, setTab] = useState<Tab>("route");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Searching Busan…");
  const [origin, setOrigin] = useState<Point | null>(null);
  const [stops, setStops] = useState<Point[]>([]);
  const [stopInput, setStopInput] = useState("");
  const [route, setRoute] = useState<RouteData | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapNode = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const layer = useRef<any>(null);

  const runSearch = async (event?: FormEvent, value = query) => {
    event?.preventDefault();
    const clean = value.trim();
    if (!clean) {
      setMessage(
        say(
          "Enter a Busan place or tourist attraction.",
          "부산의 지명이나 관광지를 입력하세요.",
        ),
      );
      return;
    }
    setLoading(true);
    setRoute(null);
    const normalized = clean.toLowerCase();
    if (TOURISM_KEYWORDS.some((word) => normalized.includes(word))) {
      setPoints(BUSAN_ATTRACTIONS);
      setSelected(BUSAN_ATTRACTIONS[0]);
      setStops([BUSAN_ATTRACTIONS[0]]);
      setMessage(
        say(
          "Busan's representative attractions are shown on the map. Select one for route, food and safety details.",
          "부산 대표 관광지를 지도에 표시했습니다. 관광지를 선택하면 경로·음식점·안전 정보를 확인할 수 있습니다.",
        ),
      );
      setLoading(false);
      return;
    }
    try {
      const found = await findBusanPlace(clean);
      setPoints([found]);
      setSelected(found);
      setStops([found]);
      setMessage(
        say(
          `${found.name} selected. Add waypoints below, then use your location to calculate.`,
          `${displayName(found)}을(를) 선택했습니다. 경유지를 추가한 후 현재 위치로 경로를 계산하세요.`,
        ),
      );
    } catch {
      setMessage(
        say(
          "The place could not be found. Try a more specific Busan place name.",
          "장소를 찾지 못했습니다. 더 구체적인 부산 지명을 입력해 주세요.",
        ),
      );
      setPoints([]);
      setSelected(null);
      setStops([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    runSearch(undefined, initialQuery);
  }, []);
  useEffect(() => {
    const ready = () => {
      if (!mapNode.current || map.current || !window.L) return;
      map.current = window.L.map(mapNode.current).setView(
        [35.126, 129.055],
        11,
      );
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map.current);
      setMapReady(true);
    };
    if (window.L) ready();
    else {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = ready;
      document.body.appendChild(script);
    }
  }, []);
  useEffect(() => {
    if (!map.current || !window.L) return;
    if (layer.current) layer.current.remove();
    const group = window.L.featureGroup();
    const routePoints = origin ? [origin, ...stops] : stops;
    routePoints.forEach((point, index) =>
      window.L.circleMarker([point.lat, point.lon], {
        radius: index === 0 && origin ? 10 : 8,
        color: "#143956",
        fillColor: index === 0 && origin ? "#ffb45c" : "#d8f64e",
        fillOpacity: 1,
        weight: 2,
      })
        .bindTooltip(`${index + 1}. ${point.name}`, {
          permanent: routePoints.length < 5,
          direction: "top",
        })
        .addTo(group),
    );
    if (!routePoints.length)
      points.forEach((point, index) =>
        window.L.circleMarker([point.lat, point.lon], {
          radius: selected?.id === point.id ? 11 : 8,
          color: "#143956",
          fillColor: "#d8f64e",
          fillOpacity: 1,
          weight: 2,
        })
          .bindTooltip(`${index + 1}. ${point.name}`)
          .on("click", () => setSelected(point))
          .addTo(group),
      );
    if (route)
      window.L.polyline(
        route.coordinates.map(([lon, lat]) => [lat, lon]),
        { color: "#177f84", weight: 6 },
      ).addTo(group);
    group.addTo(map.current);
    layer.current = group;
    const bounds = group.getBounds();
    if (bounds.isValid()) map.current.fitBounds(bounds, { padding: [35, 35] });
  }, [points, selected, route, stops, origin, mapReady]);

  useEffect(() => {
    if (selected && stops.length === 0) setStops([selected]);
  }, [selected, stops.length]);

  const addWaypoint = async (event: FormEvent) => {
    event.preventDefault();
    const clean = stopInput.trim();
    if (!clean) {
      setMessage(
        say("Enter a waypoint name first.", "경유지 이름을 먼저 입력하세요."),
      );
      return;
    }
    setLoading(true);
    try {
      const found = await findBusanPlace(clean);
      if (
        stops.some(
          (stop) =>
            stop.id === found.id ||
            (stop.lat === found.lat && stop.lon === found.lon),
        )
      )
        setMessage(
          say(
            `${found.name} is already in the route.`,
            `${displayName(found)}은(는) 이미 경로에 있습니다.`,
          ),
        );
      else {
        setStops((items) => [...items, found]);
        setPoints((items) =>
          items.some((item) => item.id === found.id)
            ? items
            : [...items, found],
        );
        setSelected(found);
        setRoute(null);
        setStopInput("");
        setMessage(
          say(
            `${found.name} added as waypoint ${stops.length + 1}. Food and safety now follow this place.`,
            `${displayName(found)}을(를) ${stops.length + 1}번째 경유지로 추가했습니다. 음식점과 안전 정보도 이 장소를 기준으로 변경했습니다.`,
          ),
        );
      }
    } catch {
      setMessage(
        say(
          "The waypoint could not be found. Try a more specific Busan place name.",
          "경유지를 찾지 못했습니다. 더 구체적인 부산 지명을 입력해 주세요.",
        ),
      );
    }
    setLoading(false);
  };

  const calculateRoute = async (start: Point) => {
    const destinations = stops.length ? stops : selected ? [selected] : [];
    if (!destinations.length) {
      setMessage(
        say(
          "Add at least one destination or waypoint.",
          "목적지 또는 경유지를 하나 이상 추가하세요.",
        ),
      );
      return;
    }
    setLoading(true);
    setRoute(null);
    setMessage(
      say("Calculating the road route…", "도로 경로를 계산하고 있습니다…"),
    );
    try {
      const all = [start, ...destinations];
      const coordinates = all
        .map((point) => `${point.lon},${point.lat}`)
        .join(";");
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`,
      );
      if (!response.ok) throw new Error("route unavailable");
      const data = await response.json();
      const found = data.routes?.[0];
      if (!found) throw new Error("no route");
      setOrigin(start);
      setRoute({
        coordinates: found.geometry.coordinates,
        distance: found.distance,
        legs: found.legs.map((leg: { distance: number }, index: number) => ({
          from: displayName(all[index]),
          to: displayName(all[index + 1]),
          distance: leg.distance,
        })),
      });
      setMessage(
        say(
          `Route calculated through ${destinations.length} destination${destinations.length > 1 ? "s" : ""}.`,
          `${destinations.length}개 목적지를 지나는 경로를 계산했습니다.`,
        ),
      );
    } catch {
      setMessage(
        say(
          "The road route could not be calculated. Please try again shortly.",
          "도로 경로를 계산하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      );
    }
    setLoading(false);
  };

  const useLocation = () => {
    if (!navigator.geolocation) {
      setMessage(
        say(
          "Location is unavailable here. Open this HTTPS page in Chrome, Edge or Safari and allow location access.",
          "현재 브라우저에서 위치를 사용할 수 없습니다. Chrome, Edge 또는 Safari에서 이 HTTPS 페이지를 열고 위치 권한을 허용하세요.",
        ),
      );
      return;
    }
    setLoading(true);
    setMessage(
      say("Waiting for location permission…", "위치 권한을 기다리고 있습니다…"),
    );
    navigator.geolocation.getCurrentPosition(
      (position) =>
        calculateRoute({
          id: "my-location",
          name: "My location",
          nameKo: "현재 위치",
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          risk: "",
        }),
      (error) => {
        const detail =
          error.code === 1
            ? say(
                "Location permission was denied. Allow location for gyng0.github.io in your browser settings and try again.",
                "위치 권한이 거부되었습니다. 브라우저 설정에서 gyng0.github.io의 위치 권한을 허용한 후 다시 시도하세요.",
              )
            : error.code === 2
              ? say(
                  "Your device could not determine its location. Turn on GPS or Wi-Fi location and try again.",
                  "기기에서 위치를 확인하지 못했습니다. GPS 또는 Wi-Fi 위치 기능을 켜고 다시 시도하세요.",
                )
              : say(
                  "Location request timed out. Move near a window or turn on GPS, then try again.",
                  "위치 요청 시간이 초과되었습니다. GPS를 켜거나 창가로 이동한 후 다시 시도하세요.",
                );
        setMessage(detail);
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 },
    );
  };

  const roadKm = route ? route.distance / 1000 : null;
  const infoPlaces = stops.length ? stops : selected ? [selected] : [];
  return (
    <section className="unified-search">
      <header>
        <button onClick={onClose}>← {ko ? "홈" : "Home"}</button>
        <div>
          <b>BLUE LINE BUSAN</b>
          <span>{ko ? "검색 관광지 안내" : "SEARCHED PLACE GUIDE"}</span>
        </div>
      </header>
      <div className="unified-inner">
        <form className="unified-form" onSubmit={runSearch}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              ko
                ? "부산 지명 또는 관광지를 검색하세요"
                : "Search any Busan place or attraction"
            }
            aria-label={ko ? "부산 장소 검색" : "Search any Busan place"}
          />
          <button disabled={loading}>
            {loading
              ? ko
                ? "잠시만요…"
                : "Please wait…"
              : ko
                ? "검색"
                : "Search"}
          </button>
        </form>
        <p className="unified-message" role="status">
          {message}
        </p>
        <div
          className="unified-map"
          ref={mapNode}
          aria-label={ko ? "검색 결과 지도" : "Search result map"}
        />
        {selected && (
          <>
            <div className="result-title">
              <div>
                <small>{ko ? "선택한 장소" : "SELECTED PLACE"}</small>
                <h2>{displayName(selected)}</h2>
              </div>
              {points.length > 1 && (
                <select
                  value={selected.id}
                  onChange={(event) => {
                    const point = points.find(
                      (item) => item.id === event.target.value,
                    );
                    if (point) {
                      setSelected(point);
                      setStops([point]);
                      setRoute(null);
                    }
                  }}
                  aria-label={ko ? "관광지 선택" : "Choose an attraction"}
                >
                  {points.map((point) => (
                    <option key={point.id} value={point.id}>
                      {displayName(point)}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <nav className="result-tabs">
              <button
                className={tab === "route" ? "active" : ""}
                onClick={() => setTab("route")}
              >
                {ko ? "경로 안내" : "Route planner"}
              </button>
              <button
                className={tab === "food" ? "active" : ""}
                onClick={() => setTab("food")}
              >
                {ko ? "주변 음식점" : "Find food"}
              </button>
              <button
                className={tab === "safety" ? "active" : ""}
                onClick={() => setTab("safety")}
              >
                {ko ? "안전 정보" : "Safety board"}
              </button>
            </nav>
            <div className="result-panel">
              {tab === "route" && (
                <article className="unified-route">
                  <small>{ko ? "도로 경로" : "ROAD ROUTE"}</small>
                  <h3>
                    {ko
                      ? "목적지와 경유지 설정"
                      : "Set destinations and waypoints"}
                  </h3>
                  <p>
                    {ko
                      ? "첫 번째 항목이 목적지입니다. 방문할 순서대로 장소를 추가한 후 현재 위치에서 경로를 계산하세요."
                      : "The first item is your destination. Add more places in the order you want to visit, then calculate from your current location."}
                  </p>
                  <form className="waypoint-form" onSubmit={addWaypoint}>
                    <input
                      value={stopInput}
                      onChange={(event) => setStopInput(event.target.value)}
                      placeholder={
                        ko ? "부산 경유지 입력" : "Enter a Busan waypoint"
                      }
                      aria-label={ko ? "경유지 추가" : "Add waypoint"}
                    />
                    <button disabled={loading}>
                      {ko ? "경유지 추가" : "Add waypoint"}
                    </button>
                  </form>
                  <ol className="waypoint-list">
                    {stops.map((stop, index) => (
                      <li key={`${stop.id}-${index}`}>
                        <b>{index + 1}</b>
                        <span>
                          {displayName(stop)}
                          <small>
                            {index === 0
                              ? ko
                                ? "목적지"
                                : "Destination"
                              : ko
                                ? "경유지"
                                : "Waypoint"}
                          </small>
                        </span>
                        <button
                          aria-label={`${ko ? "삭제" : "Remove"} ${displayName(stop)}`}
                          onClick={() => {
                            setStops((items) =>
                              items.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            );
                            setRoute(null);
                          }}
                        >
                          {ko ? "삭제" : "Remove"}
                        </button>
                      </li>
                    ))}
                  </ol>
                  <button
                    className="location-calculate"
                    onClick={useLocation}
                    disabled={loading || !stops.length}
                  >
                    {loading
                      ? ko
                        ? "처리 중…"
                        : "Working…"
                      : ko
                        ? "현재 위치로 경로 계산"
                        : "Use location & calculate"}
                  </button>
                  <p className="route-note">
                    {ko
                      ? "위치 권한이 필요합니다. 예상 시간은 도로 1km당 4분이며 실시간 교통과 신호 대기는 포함하지 않습니다."
                      : "Location requires browser permission. Estimated time is 4 minutes per road kilometer and excludes live traffic and signals."}
                  </p>
                  {roadKm !== null && (
                    <>
                      <div className="result-metrics">
                        <b>{roadKm.toFixed(1)} km</b>
                        <b>
                          {ko
                            ? `약 ${minutes(route!.distance)}분`
                            : `About ${minutes(route!.distance)} min`}
                        </b>
                      </div>
                      <div className="route-legs">
                        {route!.legs.map((leg, index) => (
                          <p key={`${leg.from}-${leg.to}`}>
                            <b>
                              {index + 1}. {leg.from} → {leg.to}
                            </b>
                            <span>
                              {(leg.distance / 1000).toFixed(1)} km ·{" "}
                              {ko
                                ? `약 ${minutes(leg.distance)}분`
                                : `about ${minutes(leg.distance)} min`}
                            </span>
                          </p>
                        ))}
                      </div>
                    </>
                  )}
                </article>
              )}
              {tab === "food" && (
                <article className="all-place-info">
                  <small>
                    {ko
                      ? "추가한 모든 장소 주변 음식점"
                      : "FOOD NEAR ALL ADDED PLACES"}
                  </small>
                  <h3>
                    {ko
                      ? `${infoPlaces.length}개 장소의 음식점 찾기`
                      : `Restaurants near ${infoPlaces.length} added place${infoPlaces.length === 1 ? "" : "s"}`}
                  </h3>
                  <p>
                    {ko
                      ? "각 목적지와 경유지 주변의 네이버 지도 음식점 검색을 제공합니다. 최신 사진, 평점과 영업시간은 네이버 지도에서 확인하세요."
                      : "Open Naver Map restaurant results for every destination and waypoint. Current photos, ratings and hours remain on Naver Map."}
                  </p>
                  <div className="place-info-grid">{infoPlaces.map((place, index) => <section key={`food-${place.id}-${index}`}><b>{index + 1}. {displayName(place)}</b><span>{ko ? (index === 0 ? "목적지 주변" : "경유지 주변") : (index === 0 ? "Near destination" : "Near waypoint")}</span><a href={`https://map.naver.com/p/search/${encodeURIComponent(`${place.name} 맛집`)}`} target="_blank" rel="noreferrer">{ko ? "주변 음식점 보기 →" : "Find nearby food →"}</a></section>)}</div>
                </article>
              )}
              {tab === "safety" && (
                <article className="all-place-info">
                  <small>
                    {ko ? "추가한 모든 장소의 안전 정보" : "SAFETY FOR ALL ADDED PLACES"}
                  </small>
                  <h3>
                    {ko
                      ? `${infoPlaces.length}개 장소에서 주의할 점`
                      : `Safety near ${infoPlaces.length} added place${infoPlaces.length === 1 ? "" : "s"}`}
                  </h3>
                  <p>{ko ? "목적지와 경유지별 기본 주의사항을 확인하고, 방문 직전 최신 보도와 공식 안내를 다시 확인하세요." : "Review a safety note for every destination and waypoint, then check current reporting and official notices before visiting."}</p>
                  <div className="place-info-grid safety-grid">{infoPlaces.map((place, index) => <section key={`safety-${place.id}-${index}`}><b>{index + 1}. {displayName(place)}</b><p>{ko ? place.riskKo || "등록된 장소별 주의사항이 없습니다. 현장 안내판과 날씨, 출입 통제를 확인하세요." : place.risk}</p><a href={`https://www.google.com/search?q=${encodeURIComponent(`${place.name} 부산 안전 주의`)}`} target="_blank" rel="noreferrer">{ko ? "최근 안전 정보 확인 →" : "Check recent safety information →"}</a></section>)}</div>
                </article>
              )}
            </div>
          </>
        )}
      </div>
      <footer>
        {ko
          ? "검색 데이터: OpenStreetMap 기여자 · 도로 경로: OSRM"
          : "Search data © OpenStreetMap contributors · Road routing by OSRM"}
      </footer>
    </section>
  );
}
