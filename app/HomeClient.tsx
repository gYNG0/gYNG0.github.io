"use client";

import { useMemo, useState } from "react";

type PlaceKey = "haeundae" | "gwangalli" | "songdo" | "taejongdae";

type Destination = {
  id: PlaceKey;
  name: string;
  korean: string;
  tag: string;
  note: string;
  safety: string;
  safetyTone: "calm" | "watch" | "alert";
  map: { left: string; top: string };
};

const destinations: Destination[] = [
  {
    id: "haeundae",
    name: "Haeundae Beach",
    korean: "해운대해수욕장",
    tag: "Beach & city",
    note: "Wide sand, sea views and an easy start for first-time visitors.",
    safety: "Check currents after rain or wind",
    safetyTone: "watch",
    map: { left: "77%", top: "23%" },
  },
  {
    id: "gwangalli",
    name: "Gwangalli Beach",
    korean: "광안리해수욕장",
    tag: "Night view",
    note: "Bridge views, waterfront cafés and a bright evening promenade.",
    safety: "Stay on lit paths after dark",
    safetyTone: "calm",
    map: { left: "59%", top: "42%" },
  },
  {
    id: "songdo",
    name: "Songdo Bay",
    korean: "송도해수욕장",
    tag: "Cable car",
    note: "A calm bay with skywalk views and a coastal cable car.",
    safety: "Keep clear of wet rocks",
    safetyTone: "watch",
    map: { left: "27%", top: "67%" },
  },
  {
    id: "taejongdae",
    name: "Taejongdae",
    korean: "태종대",
    tag: "Cliffs & forest",
    note: "Sea cliffs and a forest trail on Yeongdo Island.",
    safety: "Avoid cliff paths in high wind",
    safetyTone: "alert",
    map: { left: "54%", top: "78%" },
  },
];

const careByPlace: Record<PlaceKey, { name: string; korean: string; detail: string; eta: string; query: string }> = {
  haeundae: {
    name: "Haeundae Paik Hospital",
    korean: "해운대백병원",
    detail: "Emergency care option for the Haeundae area",
    eta: "≈ 15 min by taxi",
    query: "Haeundae Paik Hospital Busan",
  },
  gwangalli: {
    name: "Good GangAn Hospital",
    korean: "좋은강안병원",
    detail: "Emergency care option near the Suyeong waterfront",
    eta: "≈ 12 min by taxi",
    query: "Good GangAn Hospital Busan",
  },
  songdo: {
    name: "Pusan National University Hospital",
    korean: "부산대학교병원",
    detail: "Emergency care option for the west-side coast",
    eta: "≈ 15 min by taxi",
    query: "Pusan National University Hospital Busan",
  },
  taejongdae: {
    name: "Pusan National University Hospital",
    korean: "부산대학교병원",
    detail: "Emergency care option from Yeongdo coastal routes",
    eta: "≈ 25 min by taxi",
    query: "Pusan National University Hospital Busan",
  },
};

const routeOptions = [
  {
    id: "coast",
    label: "Coast essentials",
    time: "4h 25m",
    transit: "Metro + walk",
    stops: ["Haeundae Beach", "Gwangalli Beach", "Songdo Bay"],
    description: "The simplest east-to-west coastal day, with clear transfer points.",
  },
  {
    id: "sunset",
    label: "Sunset & skyline",
    time: "3h 40m",
    transit: "Taxi + walk",
    stops: ["Songdo Bay", "Gwangalli Beach", "Haeundae Beach"],
    description: "Optimized for golden hour at Gwangalli and Haeundae after dark.",
  },
  {
    id: "cliff",
    label: "Cliffs & harbor",
    time: "4h 10m",
    transit: "Bus + walk",
    stops: ["Songdo Bay", "Taejongdae", "Gwangalli Beach"],
    description: "A scenic route with extra safety checks for exposed coastal paths.",
  },
];

const hazards = [
  {
    place: "Haeundae waterline",
    level: "Use extra care",
    text: "Strong currents can form in changing weather. Swim only in marked zones when lifeguards are present.",
  },
  {
    place: "Taejongdae cliff paths",
    level: "Weather-sensitive",
    text: "Wind, spray and uneven edges make the lookout trails riskier during rain or high waves.",
  },
  {
    place: "Songdo rocks & seawall",
    level: "Slippery surface",
    text: "Do not step over barriers or onto wet rocks, especially near tide changes.",
  },
];

export default function Home() {
  const [selectedPlace, setSelectedPlace] = useState<PlaceKey>("haeundae");
  const [selectedRoute, setSelectedRoute] = useState("coast");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchNotice, setSearchNotice] = useState("Search a beach, bay or coastal landmark.");
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [language, setLanguage] = useState<"EN" | "KR">("EN");
  const [notice, setNotice] = useState("Route ready — choose a stop to update nearby care.");

  const place = destinations.find((item) => item.id === selectedPlace) ?? destinations[0];
  const runSearch = () => {
    const query = searchTerm.trim().toLowerCase();
    const match = destinations.find((item) => item.name.toLowerCase().includes(query) || item.tag.toLowerCase().includes(query));
    if (!query) { setSearchNotice("Type a destination name to begin."); return; }
    if (match) {
      setSelectedPlace(match.id);
      setSearchNotice(`${match.name} is ready in your route planner.`);
      document.getElementById("planner")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setSearchNotice("No match yet. Try Haeundae, Gwangalli, Songdo or Taejongdae.");
  };
  const care = careByPlace[selectedPlace];
  const route = useMemo(
    () => routeOptions.find((item) => item.id === selectedRoute) ?? routeOptions[0],
    [selectedRoute],
  );

  const selectPlace = (id: PlaceKey) => {
    setSelectedPlace(id);
    setNotice(`${destinations.find((item) => item.id === id)?.name} selected — nearby care updated.`);
  };

  return (
    <main>
      <section className="home-hero" aria-labelledby="home-title">
        <div className="panorama-stage" aria-label="Busan coastal panorama rotating every five seconds">
          <div className="panorama-track" aria-hidden="true">
            <div className="panorama panorama-photo" style={{ backgroundImage: "url('/busan-panorama-night.png')" }}><span>BUSAN NIGHT / MARINE CITY</span></div>
            <div className="panorama panorama-photo" style={{ backgroundImage: "url('/busan-panorama-dusk.png')" }}><span>GWANGALLI / SUNSET COAST</span></div>
            <div className="panorama panorama-photo" style={{ backgroundImage: "url('/busan-panorama-cliff.png')" }}><span>TAEJONGDAE / CLIFF WALK</span></div>
          </div>
          <div className="panorama-scrim" />
        </div>
        <div className="shell home-hero-content">
          <nav className="home-nav" aria-label="BlueLine Busan navigation">
            <a className="home-brand" href="#planner"><span className="home-brand-mark">B</span><span>BLUELINE <i>BUSAN</i></span></a>
            <div><span className="nav-status"><i /> BUSAN COAST GUIDE</span><a className="nav-link" href="#safety">Safety guide</a></div>
          </nav>
          <div className="home-copy">
            <p className="home-eyebrow">BUSAN, KOREA / COASTAL SAFETY COMPANION</p>
            <h1 id="home-title">Find your sea,<br /><em>keep your way.</em></h1>
            <p>Search Busan's coastal highlights, make a safer route, and keep urgent help one tap away.</p>
            <form className="home-search" onSubmit={(event) => { event.preventDefault(); runSearch(); }}>
              <label className="sr-only" htmlFor="coast-search">Search a coastal destination</label>
              <span aria-hidden="true">Search</span>
              <input id="coast-search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search Haeundae, Gwangalli, Songdo..." />
              <button type="submit">Search <b>-&gt;</b></button>
            </form>
            <p className="search-feedback" aria-live="polite">{searchNotice}</p>
            <div className="home-actions">
              <a className="home-emergency" href="tel:119"><span>119</span><div><strong>Emergency call</strong><small>Ambulance & rescue</small></div><b>-&gt;</b></a>
              <button className="home-incidents" onClick={() => setIncidentOpen(true)}><span className="incident-icon">!</span><div><strong>View incident areas</strong><small>Coastal caution board</small></div><b>-&gt;</b></button>
            </div>
          </div>
          <div className="panorama-caption"><span>NOW SHOWING</span><strong>Busan's coastal panorama</strong><div className="pano-dots"><i /><i /><i /></div><small>Changes every 5 seconds</small></div>
        </div>
      </section>

      {incidentOpen && <div className="incident-modal" role="dialog" aria-modal="true" aria-labelledby="incident-title"><button className="incident-backdrop" aria-label="Close incident areas" onClick={() => setIncidentOpen(false)} /><section className="incident-sheet"><div className="incident-sheet-head"><div><p>COASTAL CAUTION BOARD</p><h2 id="incident-title">Incident areas</h2></div><button onClick={() => setIncidentOpen(false)} aria-label="Close">x</button></div><p className="incident-intro">These are registered safety caution areas, not a live incident feed. In immediate danger, call 119.</p><div className="incident-list">{hazards.map((hazard, index) => <article key={hazard.place}><span>0{index + 1}</span><div><small>{hazard.level}</small><h3>{hazard.place}</h3><p>{hazard.text}</p></div><a href="#safety" onClick={() => setIncidentOpen(false)}>Details -&gt;</a></article>)}</div><a className="incident-call" href="tel:119"><span>119</span> Call emergency services <b>-&gt;</b></a></section></div>}

      <section className="google-map-section" id="tourist-map" aria-labelledby="tourist-map-title">
        <div className="shell google-map-grid">
          <div className="google-map-copy">
            <p className="map-eyebrow">GOOGLE MAPS / TOURIST LOCATIONS</p>
            <h2 id="tourist-map-title">See every stop<br />before you go.</h2>
            <p>Select a coastal attraction to place it on the map. The map view and the route planner stay in sync.</p>
            <div className="map-location-list" role="group" aria-label="Busan coastal tourist locations">
              {destinations.map((item, index) => <button key={item.id} className={selectedPlace === item.id ? "map-location-active" : ""} onClick={() => selectPlace(item.id)}><span>0{index + 1}</span><strong>{item.name}</strong><small>{item.tag}</small></button>)}
            </div>
            <a className="google-map-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, Busan, South Korea`)}`} target="_blank" rel="noreferrer">Open {place.name} in Google Maps <b>-&gt;</b></a>
          </div>
          <div className="google-map-frame-wrap">
            <div className="map-frame-label"><span>SELECTED ATTRACTION</span><strong>{place.name}</strong></div>
            <iframe className="google-map-frame" title={`Google Map showing ${place.name}`} src={`https://www.google.com/maps?q=${encodeURIComponent(`${place.name}, Busan, South Korea`)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </div>
      </section>
      <section className="hero" aria-labelledby="page-title">
        <div className="shell">
          <nav className="topbar" aria-label="Main navigation">
            <a className="brand" href="#planner" aria-label="BlueLine Busan home">
              <span className="brand-mark">≈</span>
              <span>BLUELINE <i>BUSAN</i></span>
            </a>
            <div className="nav-actions">
              <a className="safety-link" href="#safety">Safety board <span>↘</span></a>
              <div className="language-switch" aria-label="Language preference">
                <button className={language === "EN" ? "active" : ""} onClick={() => setLanguage("EN")} aria-pressed={language === "EN"}>EN</button>
                <button className={language === "KR" ? "active" : ""} onClick={() => setLanguage("KR")} aria-pressed={language === "KR"}>한국어</button>
              </div>
            </div>
          </nav>

          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow"><span /> SAFE COASTAL EXPLORATION</p>
              <h1 id="page-title">Sea the city<br />safely.</h1>
              <p className="hero-subtitle">
                {language === "EN"
                  ? "A clear, safety-first way to explore Busan’s coast — routes, nearby care and local caution zones in one view."
                  : "부산 해안을 안전하게 여행하기 위한 경로, 주변 응급의료, 주의구간 안내를 한눈에 제공합니다."}
              </p>
              <div className="hero-ctas">
                <a className="button button-dark" href="#planner">Build my day <span>→</span></a>
                <a className="text-link" href="#safety">See safety tips <span>↓</span></a>
              </div>
              <p className="traveler-note">Made for independent travelers <b>•</b> English-first guidance <b>•</b> Busan, Korea</p>
            </div>

            <aside className="hero-card" aria-label="Today’s travel brief">
              <div className="card-topline"><span>TRAVEL BRIEF</span><span className="pulse"><i /> Prepared</span></div>
              <div className="ocean-orb"><span>BUSAN<br />COAST</span></div>
              <div className="brief-row"><span className="brief-icon">⌁</span><div><strong>Route plans</strong><small>3 coastal itineraries</small></div><b>01</b></div>
              <div className="brief-row"><span className="brief-icon">✚</span><div><strong>Care nearby</strong><small>Quick emergency options</small></div><b>02</b></div>
              <div className="brief-row"><span className="brief-icon">!</span><div><strong>Caution zones</strong><small>Before you head out</small></div><b>03</b></div>
            </aside>
          </div>
        </div>
        <div className="hero-tide hero-tide-one" />
        <div className="hero-tide hero-tide-two" />
      </section>

      <section className="planner-section" id="planner" aria-labelledby="planner-title">
        <div className="shell">
          <div className="section-heading split-heading">
            <div><p className="eyebrow teal"><span /> START HERE</p><h2 id="planner-title">Plan the coast<br />without the guesswork.</h2></div>
            <p>Pick a route or tap a stop. Your travel plan keeps the nearest recommended care and coastal safety note in view.</p>
          </div>

          <div className="planner-grid">
            <div className="map-panel" aria-label="Stylized Busan coastal route map">
              <div className="map-label">BUSAN COAST / SAMPLE ITINERARY</div>
              <div className="map-sea map-sea-a" /><div className="map-sea map-sea-b" /><div className="map-island island-a" /><div className="map-island island-b" />
              <div className="route-stroke" />
              {destinations.map((item, index) => (
                <button
                  className={`map-stop ${selectedPlace === item.id ? "selected" : ""}`}
                  style={{ left: item.map.left, top: item.map.top }}
                  key={item.id}
                  onClick={() => selectPlace(item.id)}
                  aria-label={`Select ${item.name}`}
                >
                  <span>{index + 1}</span><b>{item.name.replace(" Beach", "").replace(" Bay", "")}</b>
                </button>
              ))}
              <div className="map-footer"><span>◉ {place.name}</span><span>{route.transit}</span></div>
            </div>

            <article className="route-card">
              <div className="card-kicker"><span>YOUR EFFICIENT ROUTE</span><span>01 / 03</span></div>
              <h3>{route.label}</h3>
              <p>{route.description}</p>
              <div className="route-meta"><span>◷ {route.time}</span><span>⌁ {route.transit}</span></div>
              <ol className="route-stops">
                {route.stops.map((stop, index) => <li key={stop}><i>{index + 1}</i><span>{stop}</span>{index === route.stops.length - 1 ? <b>Finish</b> : <em>↓</em>}</li>)}
              </ol>
              <a className="button button-lime" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(route.stops.join(", Busan, "))}`} target="_blank" rel="noreferrer">Open route in Maps <span>↗</span></a>
            </article>
          </div>

          <div className="route-picker" role="group" aria-label="Route choices">
            {routeOptions.map((item) => <button key={item.id} onClick={() => { setSelectedRoute(item.id); setNotice(`${item.label} is now your active route.`); }} className={selectedRoute === item.id ? "chosen" : ""}><span>{item.id === "coast" ? "01" : item.id === "sunset" ? "02" : "03"}</span><strong>{item.label}</strong><small>{item.time}</small></button>)}
          </div>
          <p className="live-notice" aria-live="polite"><span>●</span>{notice}</p>
        </div>
      </section>

      <section className="places-section" aria-labelledby="places-title">
        <div className="shell">
          <div className="section-heading compact-heading"><div><p className="eyebrow teal"><span /> SEA-SIDE HIGHLIGHTS</p><h2 id="places-title">Choose your next view.</h2></div><p>Tap a destination to keep its care option and safety note ready below.</p></div>
          <div className="place-grid">
            {destinations.map((item, index) => <button key={item.id} onClick={() => selectPlace(item.id)} className={`place-card place-${index + 1} ${selectedPlace === item.id ? "place-selected" : ""}`}>
              <span className="place-number">0{index + 1}</span><span className="place-tag">{item.tag}</span><div><h3>{item.name}</h3><p>{item.korean}</p></div><span className="place-arrow">↗</span>
            </button>)}
          </div>
        </div>
      </section>

      <section className="care-section" id="care" aria-labelledby="care-title">
        <div className="shell care-grid">
          <div className="care-intro"><p className="eyebrow lime"><span /> CARE WITHIN REACH</p><h2 id="care-title">Help should not be hard to find.</h2><p>For an emergency, call 119. This guide keeps a practical medical option visible while you explore.</p><a className="emergency-button" href="tel:119"><span>119</span> Emergency call <b>↗</b></a><small>For immediate danger, use 119 first. Ask for an interpreter if you need one.</small></div>
          <article className="care-card">
            <div className="care-card-head"><span>NEAR {place.name.toUpperCase()}</span><span className="care-status"><i /> Care option</span></div>
            <div className="medical-icon">✚</div>
            <h3>{care.name}</h3><p className="korean-name">{care.korean}</p><p>{care.detail}</p>
            <div className="care-eta"><span>⌖</span><div><strong>{care.eta}</strong><small>Travel time is an estimate — confirm live conditions.</small></div></div>
            <a className="button button-light" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(care.query)}`} target="_blank" rel="noreferrer">View directions <span>↗</span></a>
          </article>
        </div>
      </section>

      <section className="safety-section" id="safety" aria-labelledby="safety-title">
        <div className="shell">
          <div className="section-heading split-heading safety-heading"><div><p className="eyebrow coral"><span /> SAFETY BOARD</p><h2 id="safety-title">Read the coast<br />before you go.</h2></div><p>These are place-based caution prompts, not a live emergency feed. Weather, tide and official closures always take priority.</p></div>
          <div className="safety-grid">
            <article className="selected-safety"><div className="safety-chip"><span className={`dot ${place.safetyTone}`} /> {place.safety}</div><h3>{place.name}</h3><p>{place.note}</p><div className="safety-divider" /><div className="safety-facts"><span>Best habit</span><strong>Check weather, wave warnings and local notices before departure.</strong></div></article>
            <div className="hazard-list">
              {hazards.map((hazard, index) => <article key={hazard.place} className="hazard-item"><span className="hazard-index">0{index + 1}</span><div><p className="hazard-level">{hazard.level}</p><h3>{hazard.place}</h3><p>{hazard.text}</p></div><span className="hazard-arrow">↗</span></article>)}
            </div>
          </div>
          <div className="safety-bottom"><span>“Slow is smart on an unfamiliar coast.”</span><span>LASTING ADVICE, NOT LIVE STATUS <i>•</i> CONFIRM OFFICIAL ALERTS</span></div>
        </div>
      </section>

      <footer><div className="shell footer-inner"><a className="brand" href="#planner"><span className="brand-mark">≈</span><span>BLUELINE <i>BUSAN</i></span></a><p>A friendly first layer for a safer Busan coast day.</p><a href="#planner">Back to route planner ↑</a></div></footer>
    </main>
  );
}
