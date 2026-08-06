"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Stop = { id: string; name: string; lat: number; lon: number };
type Segment = { from: string; to: string; distance: number; duration: number };
type RouteData = { coordinates: [number, number][]; distance: number; duration: number; segments: Segment[] };

declare global { interface Window { L?: any } }

const BUSAN_PLACES: Stop[] = [
  { id: "haeundae", name: "Haeundae Beach", lat: 35.1587, lon: 129.1604 },
  { id: "gamcheon", name: "Gamcheon Culture Village", lat: 35.0976, lon: 129.0106 },
  { id: "gwangalli", name: "Gwangalli Beach", lat: 35.1532, lon: 129.1186 },
  { id: "busan-station", name: "Busan Station", lat: 35.1151, lon: 129.0414 },
  { id: "yongdusan", name: "Yongdusan Park", lat: 35.1008, lon: 129.0329 },
  { id: "huinnyeoul", name: "Huinnyeoul Culture Village", lat: 35.0786, lon: 129.0448 },
  { id: "songdo", name: "Songdo Beach", lat: 35.0766, lon: 129.0195 },
  { id: "taejongdae", name: "Taejongdae", lat: 35.0513, lon: 129.0875 },
];

const aliases: Record<string, string[]> = {
  haeundae: ["haeundae", "해운대"], gamcheon: ["gamcheon", "감천"], gwangalli: ["gwangalli", "광안리"],
  "busan-station": ["busan station", "부산역"], yongdusan: ["yongdusan", "용두산"], huinnyeoul: ["huinnyeoul", "흰여울"],
  songdo: ["songdo", "송도"], taejongdae: ["taejongdae", "태종대"],
};

const km = (meters: number) => `${(meters / 1000).toFixed(1)} km`;
const roadEstimate = (meters: number) => `${Math.max(1, Math.round((meters / 1000) * 4))} min`;

export default function RoutePlanner({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState("");
  const [stops, setStops] = useState<Stop[]>([BUSAN_PLACES[0], BUSAN_PLACES[2]]);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("Add two or more attractions, then calculate a road route.");
  const mapNode = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const layer = useRef<any>(null);

  useEffect(() => {
    const ready = () => {
      if (!mapNode.current || map.current || !window.L) return;
      map.current = window.L.map(mapNode.current, { zoomControl: true }).setView([35.126, 129.055], 11);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map.current);
    };
    if (window.L) { ready(); return; }
    const stylesheet = document.createElement("link"); stylesheet.rel = "stylesheet"; stylesheet.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(stylesheet);
    const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.async = true; script.onload = ready; document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!map.current || !window.L) return;
    if (layer.current) layer.current.remove();
    const group = window.L.featureGroup();
    stops.forEach((stop, index) => window.L.circleMarker([stop.lat, stop.lon], { radius: 9, color: "#143956", fillColor: "#d8f64e", fillOpacity: 1, weight: 2 }).bindTooltip(`${index + 1}. ${stop.name}`, { permanent: true, direction: "top" }).addTo(group));
    if (route) window.L.polyline(route.coordinates.map(([lon, lat]) => [lat, lon]), { color: "#177f84", weight: 6, opacity: .9 }).addTo(group);
    group.addTo(map.current); layer.current = group;
    const bounds = group.getBounds(); if (bounds.isValid()) map.current.fitBounds(bounds, { padding: [35, 35] });
  }, [stops, route]);

  const suggestions = useMemo(() => {
    const value = input.trim().toLowerCase(); if (!value) return BUSAN_PLACES;
    return BUSAN_PLACES.filter((place) => place.name.toLowerCase().includes(value) || aliases[place.id].some((item) => item.includes(value)));
  }, [input]);

  const addStop = (stop: Stop) => {
    if (stops.some((item) => item.id === stop.id)) { setMessage("This attraction is already in your route."); return; }
    setStops((items) => [...items, stop]); setInput(""); setRoute(null); setMessage(`${stop.name} added to your route.`);
  };
  const addFromInput = (event: FormEvent) => { event.preventDefault(); const match = suggestions[0]; if (!match) { setMessage("No matching supported attraction. Choose from the Busan suggestions."); return; } addStop(match); };
  const calculate = async () => {
    if (stops.length < 2) { setMessage("Add at least two attractions to calculate a route."); return; }
    setStatus("loading"); setMessage("Calculating the road route...");
    try {
      const coordinates = stops.map((stop) => `${stop.lon},${stop.lat}`).join(";");
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`);
      if (!response.ok) throw new Error("route unavailable");
      const data = await response.json(); const found = data.routes?.[0]; if (!found) throw new Error("no route");
      const segments = found.legs.map((leg: { distance: number; duration: number }, index: number) => ({ from: stops[index].name, to: stops[index + 1].name, distance: leg.distance, duration: leg.duration }));
      setRoute({ coordinates: found.geometry.coordinates, distance: found.distance, duration: found.duration, segments }); setMessage("Road route ready."); setStatus("idle");
    } catch { setStatus("error"); setMessage("Route calculation could not be completed. Please try again shortly."); }
  };
  const taxiFare = route ? 4800 + Math.max(0, route.distance - 1600) / 132 * 100 : 0;
  const fuelCost = route ? (route.distance / 1000 / 12) * 1700 : 0;

  return <section className="route-planner" aria-labelledby="route-planner-title">
    <div className="planner-head"><div><p className="eyebrow dark">BLUE LINE BUSAN · ROUTE PLANNER</p><h2 id="route-planner-title">Build your coastal drive.</h2><p>Road distance comes from OSRM. Expected driving time uses a 4-minute-per-kilometer planning estimate and does not include live traffic, signals or road closures.</p></div><button className="planner-close" onClick={onClose}>Close planner</button></div>
    <div className="planner-layout"><aside className="planner-panel"><form className="planner-search" onSubmit={addFromInput}><label htmlFor="route-place">Add a tourist attraction</label><div><input id="route-place" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Search Busan attractions"/><button>Add</button></div></form><div className="suggestions" aria-label="Busan tourist attraction suggestions">{suggestions.slice(0, 8).map((place) => <button key={place.id} onClick={() => addStop(place)}>{place.name}<span>+</span></button>)}</div><ol className="stop-list">{stops.map((stop, index) => <li key={stop.id}><b>{index + 1}</b><span>{stop.name}</span><button onClick={() => { setStops((items) => items.filter((item) => item.id !== stop.id)); setRoute(null); }}>Remove</button></li>)}</ol><button className="calculate-route" onClick={calculate} disabled={status === "loading"}>{status === "loading" ? "Calculating…" : "Calculate route"}</button><p className={`planner-message ${status === "error" ? "error" : ""}`} role="status">{message}</p></aside>
      <div className="map-column"><div ref={mapNode} className="leaflet-map" aria-label="Interactive OpenStreetMap route map" />{route && <div className="route-summary"><article><small>CAR</small><b>{roadEstimate(route.distance)}</b><span>{km(route.distance)} · estimated fuel ₩{Math.round(fuelCost).toLocaleString()}</span></article><article><small>TAXI</small><b>{roadEstimate(route.distance)}</b><span>estimated fare ₩{(Math.round(taxiFare / 100) * 100).toLocaleString()}</span></article></div>}<p className="cost-note">Time is calculated at 4 minutes per road kilometer. Taxi fare is a distance-based estimate using a base fare. Late-night surcharges, traffic congestion and tolls are not included. Fuel cost assumes 12 km/L and ₩1,700/L.</p></div></div>
    {route && <div className="segment-list"><h3>Leg-by-leg road route</h3>{route.segments.map((segment, index) => <article key={`${segment.from}-${segment.to}`}><b>{index + 1}</b><span>{segment.from} → {segment.to}</span><small>{km(segment.distance)} · {roadEstimate(segment.distance)}</small></article>)}</div>}
  </section>;
}
