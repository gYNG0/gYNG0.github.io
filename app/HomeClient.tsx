"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type PlaceKey = "haeundae" | "gwangalli" | "songdo" | "taejongdae";
type Screen = "home" | "plan" | "discover" | "safety";

type Place = {
  id: PlaceKey;
  name: string;
  aliases: string[];
  transport: string;
  time: string;
  fare: string;
  hospital: { name: string; time: string; query: string };
  restaurants: { name: string; score: string; kind: string }[];
};

const places: Place[] = [
  { id: "haeundae", name: "Haeundae Beach", aliases: ["haeundae", "해운대"], transport: "Metro Line 2 + 9 min walk", time: "38 min", fare: "₩1,550", hospital: { name: "Haeundae Paik Hospital", time: "15 min by taxi", query: "Haeundae Paik Hospital Busan" }, restaurants: [{ name: "Haemok Haeundae", score: "4.6", kind: "Japanese eel" }, { name: "Miryang Sundae Dwaeji Gukbap", score: "4.5", kind: "Busan pork soup" }, { name: "Obanjang", score: "4.4", kind: "Korean barbecue" }] },
  { id: "gwangalli", name: "Gwangalli Beach", aliases: ["gwangalli", "광안리"], transport: "Metro Line 2 + 7 min walk", time: "31 min", fare: "₩1,550", hospital: { name: "Good GangAn Hospital", time: "12 min by taxi", query: "Good GangAn Hospital Busan" }, restaurants: [{ name: "Eonyang Bulgogi Busan", score: "4.6", kind: "Korean barbecue" }, { name: "Millak Raw Fish Town", score: "4.5", kind: "Seafood" }, { name: "Gwangalli Eobang Festival Table", score: "4.3", kind: "Local seafood" }] },
  { id: "songdo", name: "Songdo Bay", aliases: ["songdo", "송도"], transport: "Bus 7 + 8 min walk", time: "42 min", fare: "₩1,550", hospital: { name: "Pusan National University Hospital", time: "15 min by taxi", query: "Pusan National University Hospital Busan" }, restaurants: [{ name: "Songdo 1913", score: "4.5", kind: "Coastal brunch" }, { name: "Amnam Park Seafood", score: "4.4", kind: "Seafood" }, { name: "Jagalchi Market Kitchen", score: "4.3", kind: "Market food" }] },
  { id: "taejongdae", name: "Taejongdae", aliases: ["taejongdae", "태종대"], transport: "Bus 8 + Danubi train", time: "55 min", fare: "₩2,900", hospital: { name: "Pusan National University Hospital", time: "25 min by taxi", query: "Pusan National University Hospital Busan" }, restaurants: [{ name: "Taejongdae Jjamppong", score: "4.5", kind: "Korean-Chinese" }, { name: "Yeongdo Haejangguk", score: "4.4", kind: "Korean soup" }, { name: "Huinnyeoul Cafe Street", score: "4.3", kind: "Cafe & dessert" }] },
];

const hazards = ["Haeundae waterline — currents after rain", "Taejongdae trails — strong wind & wet paths", "Songdo rocks — slippery at tide change"];

export default function HomeClient() {
  const [screen, setScreen] = useState<Screen>("home");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PlaceKey>("haeundae");
  const [history, setHistory] = useState<string[]>([]);
  const [notice, setNotice] = useState("Search a Busan coast or attraction to start.");
  const place = useMemo(() => places.find((item) => item.id === selected) ?? places[0], [selected]);

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem("blueline-search-history") || "[]")); } catch { setHistory([]); }
  }, []);
  const saveHistory = (value: string) => {
    const next = [value, ...history.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, 5);
    setHistory(next); localStorage.setItem("blueline-search-history", JSON.stringify(next));
  };
  const search = (event?: FormEvent, value = query) => {
    event?.preventDefault();
    const clean = value.trim();
    if (!clean) { setNotice("Enter Haeundae, Gwangalli, Songdo or Taejongdae."); return; }
    const normalized = clean.toLowerCase();
    const found = places.find((item) => item.name.toLowerCase().includes(normalized) || item.aliases.some((alias) => alias.includes(normalized)));
    if (found) { setSelected(found.id); saveHistory(clean); setNotice(`${found.name} is ready: fastest transit, nearby hospital, and restaurant picks.`); setScreen("plan"); }
    else { saveHistory(clean); setNotice(`Showing restaurant discovery for “${clean}”. Try a coastal destination for transit details.`); setScreen("discover"); }
  };
  const choose = (id: PlaceKey) => { setSelected(id); setScreen("plan"); setNotice(`${places.find((item) => item.id === id)?.name} plan updated.`); };

  return <main className="app-shell">
    <header className="app-topbar"><button className="brand-button" onClick={() => setScreen("home")} aria-label="BlueLine Busan home"><b>B</b> BLUELINE <i>BUSAN</i></button><div><span className="online-dot" /> COAST GUIDE <button className="top-emergency" onClick={() => setScreen("safety")}>Emergency</button></div></header>

    {screen === "home" && <section className="home-screen">
      <div className="photo-panorama" aria-label="Busan coast panorama"><div className="photo-track"><div style={{ backgroundImage: "url('/busan-panorama-night.png')" }} /><div style={{ backgroundImage: "url('/busan-panorama-dusk.png')" }} /><div style={{ backgroundImage: "url('/busan-panorama-cliff.png')" }} /><div style={{ backgroundImage: "url('/busan-panorama-night.png')" }} /></div><div className="photo-overlay" /></div>
      <div className="home-content"><p className="eyebrow">BUSAN, KOREA · COASTAL TRAVEL COMPANION</p><h1>Find your sea.<br /><em>Keep your way.</em></h1><p className="hero-lead">One search gives you the most efficient route, travel cost, nearby care and local food recommendations.</p>
        <form className="main-search" onSubmit={(event) => search(event)}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Haeundae, Gwangalli, Songdo…" aria-label="Search Busan coastal destination" /><button>Plan trip →</button></form><p className="notice" aria-live="polite">{notice}</p>
        <div className="home-grid"><button onClick={() => setScreen("safety")}><span>!</span><b>Safety board</b><small>Incident-prone areas</small></button><button onClick={() => setScreen("discover")}><span>★</span><b>Find food</b><small>Naver rating guide</small></button><a href="tel:119"><span>119</span><b>Emergency call</b><small>Ambulance & rescue</small></a></div>
        {history.length > 0 && <div className="recent"><strong>Saved searches</strong>{history.map((item) => <button key={item} onClick={() => { setQuery(item); search(undefined, item); }}>{item}</button>)}</div>}
      </div><div className="panorama-label"><span>BUSAN COAST PANORAMA</span><b>Photos flow every 5 seconds</b><i /><i /><i /></div>
    </section>}

    {screen !== "home" && <section className="app-view">
      <nav className="view-nav"><button onClick={() => setScreen("home")}>← Home</button><button className={screen === "plan" ? "active" : ""} onClick={() => setScreen("plan")}>Trip plan</button><button className={screen === "discover" ? "active" : ""} onClick={() => setScreen("discover")}>Food nearby</button><button className={screen === "safety" ? "active" : ""} onClick={() => setScreen("safety")}>Safety</button></nav>
      {screen === "plan" && <section className="plan-view"><p className="eyebrow dark">YOUR SMART COAST ROUTE</p><h2>{place.name}<span> optimized for time & fare</span></h2><form className="compact-search" onSubmit={(event) => search(event)}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search another destination"/><button>Search</button></form><p className="notice dark-notice">{notice}</p><div className="place-tabs">{places.map((item) => <button key={item.id} className={item.id === selected ? "active" : ""} onClick={() => choose(item.id)}>{item.name}</button>)}</div><div className="plan-cards"><article className="route-result"><small>BEST VALUE ROUTE</small><h3>{place.transport}</h3><p>Recommended for a straightforward coastal visit with the lowest usual public-transport cost.</p><div className="metrics"><div><b>{place.time}</b><span>Estimated time</span></div><div><b>{place.fare}</b><span>Transport fare</span></div><div><b>1 transfer</b><span>Simple connection</span></div></div><a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, Busan, South Korea`)}`}>Open in Google Maps →</a></article><article className="hospital-result"><small>NEARBY HOSPITAL</small><span className="hospital-symbol">+</span><h3>{place.hospital.name}</h3><p>Emergency care option · {place.hospital.time}</p><a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.hospital.query)}`}>View directions →</a></article></div><button className="next-view" onClick={() => setScreen("discover")}>See highly rated food near {place.name} →</button></section>}

      {screen === "discover" && <section className="discover-view"><p className="eyebrow dark">LOCAL FOOD DISCOVERY</p><h2>Near {place.name}</h2><p className="section-lead">Restaurant suggestions ordered by displayed Naver rating. Ratings are reference values—check Naver Map for the current score, hours and availability.</p><div className="restaurant-grid">{place.restaurants.map((restaurant, index) => <article key={restaurant.name}><span>0{index + 1}</span><div className="score">★ {restaurant.score}<small>Naver rating guide</small></div><h3>{restaurant.name}</h3><p>{restaurant.kind} · near {place.name}</p><a target="_blank" rel="noreferrer" href={`https://map.naver.com/p/search/${encodeURIComponent(restaurant.name)}`}>Check on Naver Map →</a></article>)}</div><button className="next-view" onClick={() => setScreen("plan")}>← Back to route & hospital</button></section>}

      {screen === "safety" && <section className="safety-view"><p className="eyebrow dark">COASTAL CAUTION BOARD</p><h2>Safety first, always.</h2><p className="section-lead">These are caution prompts, not real-time incident data. For immediate danger call 119.</p><a className="call-119" href="tel:119"><b>119</b> Call emergency services <span>→</span></a><div className="hazard-grid">{hazards.map((item, index) => <article key={item}><span>0{index + 1}</span><h3>{item.split(" — ")[0]}</h3><p>{item.split(" — ")[1]}</p></article>)}</div><button className="next-view" onClick={() => setScreen("home")}>Back to home →</button></section>}
    </section>}
  </main>;
}
