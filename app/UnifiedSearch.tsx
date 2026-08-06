"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Point = { id: string; name: string; lat: number; lon: number; risk: string };
type Tab = "route" | "food" | "safety";
type RouteData = { coordinates: [number, number][]; distance: number; legs: { from: string; to: string; distance: number }[] };
declare global { interface Window { L?: any } }

const BUSAN_ATTRACTIONS: Point[] = [
  { id: "haeundae", name: "Haeundae Beach", lat: 35.1587, lon: 129.1604, risk: "Rip currents can occur when sea and weather conditions change. Swim only in designated zones." },
  { id: "gamcheon", name: "Gamcheon Culture Village", lat: 35.0976, lon: 129.0106, risk: "Steep alleys and stairs can be slippery. Wear stable shoes and stay on marked pedestrian routes." },
  { id: "gwangalli", name: "Gwangalli Beach", lat: 35.1532, lon: 129.1186, risk: "Strong wind and waves can reach sea walls. Avoid barriers and follow beach controls." },
  { id: "busan-station", name: "Busan Station", lat: 35.1151, lon: 129.0414, risk: "Busy roads and taxi lanes surround the station. Use marked crossings and watch luggage in crowds." },
  { id: "yongdusan", name: "Yongdusan Park", lat: 35.1008, lon: 129.0329, risk: "Slopes and stairs can become slick in rain. Use handrails and lit paths after dark." },
  { id: "huinnyeoul", name: "Huinnyeoul Culture Village", lat: 35.0786, lon: 129.0448, risk: "Narrow cliff-side alleys and stairs require care, especially in wind or rain." },
  { id: "songdo", name: "Songdo Beach", lat: 35.0766, lon: 129.0195, risk: "Wet rocks, sea spray and tide changes create slippery edges. Do not cross barriers." },
  { id: "taejongdae", name: "Taejongdae", lat: 35.0513, lon: 129.0875, risk: "Cliff paths are exposed to wind and rain. Follow closures and remain seated on tourist vehicles." },
];

const aliases: Record<string, string[]> = {
  haeundae: ["haeundae", "해운대"], gamcheon: ["gamcheon", "감천"], gwangalli: ["gwangalli", "광안리"],
  "busan-station": ["busan station", "부산역"], yongdusan: ["yongdusan", "용두산"], huinnyeoul: ["huinnyeoul", "흰여울"],
  songdo: ["songdo", "송도"], taejongdae: ["taejongdae", "태종대"],
};
const genericRisk = "No place-specific alert is registered in this guide. Check weather, official closures and on-site safety signs before visiting.";
const minutes = (meters: number) => Math.max(1, Math.round((meters / 1000) * 4));

async function findBusanPlace(value: string): Promise<Point> {
  const clean = value.trim();
  const normalized = clean.toLowerCase();
  const known = BUSAN_ATTRACTIONS.find((place) => place.name.toLowerCase().includes(normalized) || aliases[place.id]?.some((alias) => normalized.includes(alias) || alias.includes(normalized)));
  if (known) return known;
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=kr&q=${encodeURIComponent(`${clean}, Busan`)}`);
  if (!response.ok) throw new Error("search unavailable");
  const results = await response.json();
  if (!results[0]) throw new Error("not found");
  return { id: `search-${clean}-${results[0].lat}`, name: results[0].display_name.split(",")[0] || clean, lat: Number(results[0].lat), lon: Number(results[0].lon), risk: genericRisk };
}

export default function UnifiedSearch({ initialQuery, onClose }: { initialQuery: string; onClose: () => void }) {
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
  const mapNode = useRef<HTMLDivElement>(null); const map = useRef<any>(null); const layer = useRef<any>(null);

  const runSearch = async (event?: FormEvent, value = query) => {
    event?.preventDefault(); const clean = value.trim(); if (!clean) { setMessage("Enter a Busan place or tourist attraction."); return; }
    setLoading(true); setRoute(null); const normalized = clean.toLowerCase();
    if (["관광", "관광지", "관광지 추천", "tour", "attractions"].some((word) => normalized.includes(word))) {
      setPoints(BUSAN_ATTRACTIONS); setSelected(BUSAN_ATTRACTIONS[0]); setStops([BUSAN_ATTRACTIONS[0]]); setMessage("Busan's representative attractions are shown on the map. Select one for route, food and safety details."); setLoading(false); return;
    }
    try {
      const found = await findBusanPlace(clean);
      setPoints([found]); setSelected(found); setStops([found]); setMessage(`${found.name} selected. Add waypoints below, then use your location to calculate.`);
    } catch { setMessage("The place could not be found. Try a more specific Busan place name."); setPoints([]); setSelected(null); setStops([]); }
    setLoading(false);
  };

  useEffect(() => { runSearch(undefined, initialQuery); }, []);
  useEffect(() => {
    const ready = () => { if (!mapNode.current || map.current || !window.L) return; map.current = window.L.map(mapNode.current).setView([35.126, 129.055], 11); window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map.current); setMapReady(true); };
    if (window.L) ready(); else { const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(css); const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.onload = ready; document.body.appendChild(script); }
  }, []);
  useEffect(() => {
    if (!map.current || !window.L) return; if (layer.current) layer.current.remove(); const group = window.L.featureGroup();
    const routePoints = origin ? [origin, ...stops] : stops;
    routePoints.forEach((point, index) => window.L.circleMarker([point.lat, point.lon], { radius: index === 0 && origin ? 10 : 8, color: "#143956", fillColor: index === 0 && origin ? "#ffb45c" : "#d8f64e", fillOpacity: 1, weight: 2 }).bindTooltip(`${index + 1}. ${point.name}`, { permanent: routePoints.length < 5, direction: "top" }).addTo(group));
    if (!routePoints.length) points.forEach((point, index) => window.L.circleMarker([point.lat, point.lon], { radius: selected?.id === point.id ? 11 : 8, color: "#143956", fillColor: "#d8f64e", fillOpacity: 1, weight: 2 }).bindTooltip(`${index + 1}. ${point.name}`).on("click", () => setSelected(point)).addTo(group));
    if (route) window.L.polyline(route.coordinates.map(([lon, lat]) => [lat, lon]), { color: "#177f84", weight: 6 }).addTo(group); group.addTo(map.current); layer.current = group; const bounds = group.getBounds(); if (bounds.isValid()) map.current.fitBounds(bounds, { padding: [35, 35] });
  }, [points, selected, route, stops, origin, mapReady]);

  const addWaypoint = async (event: FormEvent) => {
    event.preventDefault(); const clean = stopInput.trim(); if (!clean) { setMessage("Enter a waypoint name first."); return; }
    setLoading(true);
    try { const found = await findBusanPlace(clean); if (stops.some((stop) => stop.id === found.id || (stop.lat === found.lat && stop.lon === found.lon))) setMessage(`${found.name} is already in the route.`); else { setStops((items) => [...items, found]); setRoute(null); setStopInput(""); setMessage(`${found.name} added as waypoint ${stops.length + 1}.`); } } catch { setMessage("The waypoint could not be found. Try a more specific Busan place name."); }
    setLoading(false);
  };

  const calculateRoute = async (start: Point) => {
    if (!stops.length) { setMessage("Add at least one destination or waypoint."); return; }
    setLoading(true); setRoute(null); setMessage("Calculating the road route…");
    try {
      const all = [start, ...stops]; const coordinates = all.map((point) => `${point.lon},${point.lat}`).join(";");
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`);
      if (!response.ok) throw new Error("route unavailable"); const data = await response.json(); const found = data.routes?.[0]; if (!found) throw new Error("no route");
      setOrigin(start); setRoute({ coordinates: found.geometry.coordinates, distance: found.distance, legs: found.legs.map((leg: { distance: number }, index: number) => ({ from: all[index].name, to: all[index + 1].name, distance: leg.distance })) }); setMessage(`Route calculated through ${stops.length} destination${stops.length > 1 ? "s" : ""}.`);
    } catch { setMessage("The road route could not be calculated. Please try again shortly."); }
    setLoading(false);
  };

  const useLocation = () => {
    if (!navigator.geolocation) { setMessage("Location is unavailable here. Open this HTTPS page in Chrome, Edge or Safari and allow location access."); return; }
    setLoading(true); setMessage("Waiting for location permission…");
    navigator.geolocation.getCurrentPosition(
      (position) => calculateRoute({ id: "my-location", name: "My location", lat: position.coords.latitude, lon: position.coords.longitude }),
      (error) => { const detail = error.code === 1 ? "Location permission was denied. Allow location for gyng0.github.io in your browser settings and try again." : error.code === 2 ? "Your device could not determine its location. Turn on GPS or Wi-Fi location and try again." : "Location request timed out. Move near a window or turn on GPS, then try again."; setMessage(detail); setLoading(false); },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 },
    );
  };

  const roadKm = route ? route.distance / 1000 : null;
  const foodLink = selected ? `https://map.naver.com/p/search/${encodeURIComponent(`${selected.name} 맛집`)}` : "#";
  return <section className="unified-search"><header><button onClick={onClose}>← Home</button><div><b>BLUE LINE BUSAN</b><span>SEARCHED PLACE GUIDE</span></div></header><div className="unified-inner"><form className="unified-form" onSubmit={runSearch}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search any Busan place or type 관광지" aria-label="Search any Busan place"/><button disabled={loading}>{loading ? "Please wait…" : "Search"}</button></form><p className="unified-message" role="status">{message}</p><div className="unified-map" ref={mapNode} aria-label="Search result map" />{selected && <><div className="result-title"><div><small>SELECTED PLACE</small><h2>{selected.name}</h2></div>{points.length > 1 && <select value={selected.id} onChange={(event) => { const point = points.find((item) => item.id === event.target.value); if (point) { setSelected(point); setStops([point]); setRoute(null); } }} aria-label="Choose an attraction">{points.map((point) => <option key={point.id} value={point.id}>{point.name}</option>)}</select>}</div><nav className="result-tabs"><button className={tab === "route" ? "active" : ""} onClick={() => setTab("route")}>Route planner</button><button className={tab === "food" ? "active" : ""} onClick={() => setTab("food")}>Find food</button><button className={tab === "safety" ? "active" : ""} onClick={() => setTab("safety")}>Safety board</button></nav><div className="result-panel">{tab === "route" && <article className="unified-route"><small>ROAD ROUTE</small><h3>Set destinations and waypoints</h3><p>The first item is your destination. Add more places in the order you want to visit, then calculate from your current location.</p><form className="waypoint-form" onSubmit={addWaypoint}><input value={stopInput} onChange={(event) => setStopInput(event.target.value)} placeholder="Enter a Busan waypoint" aria-label="Add waypoint"/><button disabled={loading}>Add waypoint</button></form><ol className="waypoint-list">{stops.map((stop, index) => <li key={`${stop.id}-${index}`}><b>{index + 1}</b><span>{stop.name}<small>{index === 0 ? "Destination" : "Waypoint"}</small></span><button aria-label={`Remove ${stop.name}`} onClick={() => { setStops((items) => items.filter((_, itemIndex) => itemIndex !== index)); setRoute(null); }}>Remove</button></li>)}</ol><button className="location-calculate" onClick={useLocation} disabled={loading || !stops.length}>{loading ? "Working…" : "Use location & calculate"}</button><p className="route-note">Location requires browser permission. Estimated time is 4 minutes per road kilometer and excludes live traffic and signals.</p>{roadKm !== null && <><div className="result-metrics"><b>{roadKm.toFixed(1)} km</b><b>About {minutes(route!.distance)} min</b></div><div className="route-legs">{route!.legs.map((leg, index) => <p key={`${leg.from}-${leg.to}`}><b>{index + 1}. {leg.from} → {leg.to}</b><span>{(leg.distance / 1000).toFixed(1)} km · about {minutes(leg.distance)} min</span></p>)}</div></>}</article>}{tab === "food" && <article><small>FOOD NEAR THE SEARCHED PLACE</small><h3>Restaurants near {selected.name}</h3><p>Open Naver Map results centered on the searched destination. Current photos, ratings and hours remain on Naver Map.</p><a href={foodLink} target="_blank" rel="noreferrer">Find food near {selected.name} →</a></article>}{tab === "safety" && <article><small>PLACE-SPECIFIC SAFETY</small><h3>What stands out near {selected.name}</h3><p>{selected.risk}</p><a href={`https://www.google.com/search?q=${encodeURIComponent(`${selected.name} 부산 안전 주의`)}`} target="_blank" rel="noreferrer">Check recent safety information →</a></article>}</div></>}</div><footer>Search data © OpenStreetMap contributors · Road routing by OSRM</footer></section>;
}
