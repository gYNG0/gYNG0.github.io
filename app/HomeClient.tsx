"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import RoutePlanner from "./RoutePlanner";
import UnifiedSearch from "./UnifiedSearch";
import GeminiGuide, { type Language } from "./GeminiGuide";

type PlaceKey = "haeundae" | "gwangalli" | "songdo" | "taejongdae";
type Screen =
  | "home"
  | "plan"
  | "discover"
  | "attractions"
  | "safety"
  | "planner"
  | "search";

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
  {
    id: "haeundae",
    name: "Haeundae Beach",
    aliases: ["haeundae", "해운대"],
    transport: "Metro Line 2 + 9 min walk",
    time: "38 min",
    fare: "₩1,550",
    hospital: {
      name: "Haeundae Paik Hospital",
      time: "15 min by taxi",
      query: "Haeundae Paik Hospital Busan",
    },
    restaurants: [
      { name: "Haemok Haeundae", score: "4.6", kind: "Japanese eel" },
      {
        name: "Miryang Sundae Dwaeji Gukbap",
        score: "4.5",
        kind: "Busan pork soup",
      },
      { name: "Obanjang", score: "4.4", kind: "Korean barbecue" },
    ],
  },
  {
    id: "gwangalli",
    name: "Gwangalli Beach",
    aliases: ["gwangalli", "광안리"],
    transport: "Metro Line 2 + 7 min walk",
    time: "31 min",
    fare: "₩1,550",
    hospital: {
      name: "Good GangAn Hospital",
      time: "12 min by taxi",
      query: "Good GangAn Hospital Busan",
    },
    restaurants: [
      { name: "Eonyang Bulgogi Busan", score: "4.6", kind: "Korean barbecue" },
      { name: "Millak Raw Fish Town", score: "4.5", kind: "Seafood" },
      {
        name: "Gwangalli Eobang Festival Table",
        score: "4.3",
        kind: "Local seafood",
      },
    ],
  },
  {
    id: "songdo",
    name: "Songdo Bay",
    aliases: ["songdo", "송도"],
    transport: "Bus 7 + 8 min walk",
    time: "42 min",
    fare: "₩1,550",
    hospital: {
      name: "Pusan National University Hospital",
      time: "15 min by taxi",
      query: "Pusan National University Hospital Busan",
    },
    restaurants: [
      { name: "Songdo 1913", score: "4.5", kind: "Coastal brunch" },
      { name: "Amnam Park Seafood", score: "4.4", kind: "Seafood" },
      { name: "Jagalchi Market Kitchen", score: "4.3", kind: "Market food" },
    ],
  },
  {
    id: "taejongdae",
    name: "Taejongdae",
    aliases: ["taejongdae", "태종대"],
    transport: "Bus 8 + Danubi train",
    time: "55 min",
    fare: "₩2,900",
    hospital: {
      name: "Pusan National University Hospital",
      time: "25 min by taxi",
      query: "Pusan National University Hospital Busan",
    },
    restaurants: [
      { name: "Taejongdae Jjamppong", score: "4.5", kind: "Korean-Chinese" },
      { name: "Yeongdo Haejangguk", score: "4.4", kind: "Korean soup" },
      { name: "Huinnyeoul Cafe Street", score: "4.3", kind: "Cafe & dessert" },
    ],
  },
];

const hazards = [
  {
    place: "Haeundae Beach",
    risk: "Rip currents",
    detail:
      "Rip currents can form in changing sea and weather conditions. Use designated swimming zones and follow lifeguard instructions.",
    source: "National Oceanographic Survey",
    url: "https://www.isafe.go.kr/DATA/bbs/86/20220707104246087.pdf",
  },
  {
    place: "Gwangalli Beach",
    risk: "High waves and wind",
    detail:
      "Wind and wave conditions can change quickly around the open beach. Stay off barriers and follow official beach controls.",
    source: "Official beach safety notice",
    url: "https://www.opm.go.kr/opm/news/press-release.do?articleNo=155874",
  },
  {
    place: "Songdo coast",
    risk: "Wet rocks and sea-wall edges",
    detail:
      "Sea spray and tide changes make rocks and edges slippery. Do not cross safety barriers or approach the waterline.",
    source: "Busan tourism information",
    url: "https://www.busan.go.kr/depart/ahsongdo",
  },
  {
    place: "Taejongdae",
    risk: "Cliff paths and tourist train",
    detail:
      "Use marked cliff paths in high wind and follow on-site instructions. Recent reporting also covered a tourist-train accident, so remain seated and follow staff guidance.",
    source: "KBS news report",
    url: "https://v.daum.net/v/7w0TWX8ByG",
  },
];
const restaurantCoordinates: Record<string, { lat: number; lon: number }> = {
  "Haemok Haeundae": { lat: 35.1609, lon: 129.1624 },
  "Miryang Sundae Dwaeji Gukbap": { lat: 35.1635, lon: 129.1632 },
  Obanjang: { lat: 35.1598, lon: 129.1587 },
  "Eonyang Bulgogi Busan": { lat: 35.1542, lon: 129.1197 },
  "Millak Raw Fish Town": { lat: 35.1539, lon: 129.1225 },
  "Gwangalli Eobang Festival Table": { lat: 35.1531, lon: 129.1175 },
  "Songdo 1913": { lat: 35.0761, lon: 129.0208 },
  "Amnam Park Seafood": { lat: 35.0736, lon: 129.0188 },
  "Jagalchi Market Kitchen": { lat: 35.0978, lon: 129.0305 },
  "Taejongdae Jjamppong": { lat: 35.0525, lon: 129.0883 },
  "Yeongdo Haejangguk": { lat: 35.0792, lon: 129.0452 },
  "Huinnyeoul Cafe Street": { lat: 35.0784, lon: 129.0444 },
};
const walkingDistance = (
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
) => {
  const radians = (value: number) => (value * Math.PI) / 180;
  const r = 6371;
  const dLat = radians(to.lat - from.lat);
  const dLon = radians(to.lon - from.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.lat)) *
      Math.cos(radians(to.lat)) *
      Math.sin(dLon / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const attractions = [
  { name: "Haeundae Beach", rating: "4.6", type: "Beach · skyline views" },
  { name: "Songdo Sky Park", rating: "4.6", type: "Park · cable-car views" },
  { name: "Dongbaekseom", rating: "4.6", type: "Island · coastal walk" },
  { name: "Gwangalli Beach", rating: "4.5", type: "Beach · bridge night view" },
  {
    name: "Haeundae Blueline Park",
    rating: "4.5",
    type: "Tourist attraction · coastal train",
  },
  { name: "Songdo Beach", rating: "4.4", type: "Tourist attraction · skywalk" },
];

export default function HomeClient() {
  const today = new Date().toISOString().slice(0, 10);
  const [language, setLanguage] = useState<Language>("ko");
  const [screen, setScreen] = useState<Screen>("home");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PlaceKey>("haeundae");
  const [history, setHistory] = useState<string[]>([]);
  const [notice, setNotice] = useState(
    "Search a Busan coast or attraction to start.",
  );
  const [userPosition, setUserPosition] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [locationMessage, setLocationMessage] = useState(
    "Use your location to see estimated distance and walking time.",
  );
  const [locationHelpOpen, setLocationHelpOpen] = useState(false);
  const [locationPromptOpen, setLocationPromptOpen] = useState(true);
  const [travelPeriodOpen, setTravelPeriodOpen] = useState(false);
  const [travelStart, setTravelStart] = useState(today);
  const [travelEnd, setTravelEnd] = useState(today);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [aiQuestion, setAiQuestion] = useState("");
  const place = useMemo(
    () => places.find((item) => item.id === selected) ?? places[0],
    [selected],
  );

  useEffect(() => {
    try {
      setHistory(
        JSON.parse(localStorage.getItem("blueline-search-history") || "[]"),
      );
      const savedLanguage = localStorage.getItem("blueline-language");
      setLanguage(
        savedLanguage === "en" ||
          savedLanguage === "ja" ||
          savedLanguage === "zh"
          ? savedLanguage
          : "ko",
      );
      const savedPeriod = JSON.parse(
        localStorage.getItem("blueline-travel-period") || "null",
      );
      if (savedPeriod?.start) setTravelStart(savedPeriod.start);
      if (savedPeriod?.end) setTravelEnd(savedPeriod.end);
    } catch {
      setHistory([]);
    }
  }, []);
  const changeLanguage = (next: Language) => {
    setLanguage(next);
    localStorage.setItem("blueline-language", next);
  };
  const ko = language === "ko";
  const homeCopy = {
    ko: {
      guide: "부산 해안 여행 가이드",
      eyebrow: "대한민국 부산 · 해안 여행 도우미",
      line1: "부산의 바다를 찾고,",
      line2: "안전하게 여행하세요.",
      lead: "한 번의 검색으로 효율적인 경로와 비용, 주변 음식점과 안전 정보를 확인하세요.",
      placeholder: "해운대, 야간 명소, 분위기 좋은 곳을 검색하세요",
      button: "여행 검색 →",
      recent: "최근 검색",
    },
    en: {
      guide: "SEARCH-LED COAST GUIDE",
      eyebrow: "BUSAN, KOREA · COASTAL TRAVEL COMPANION",
      line1: "Find your sea.",
      line2: "Keep your way.",
      lead: "One search gives you efficient routes, costs, nearby care, food and tailored AI recommendations.",
      placeholder: "Search Haeundae, night views, atmospheric places…",
      button: "Plan trip →",
      recent: "Saved searches",
    },
    ja: {
      guide: "釜山海岸旅行ガイド",
      eyebrow: "韓国・釜山 · 海岸旅行アシスタント",
      line1: "釜山の海を見つけ、",
      line2: "安全に旅しましょう。",
      lead: "一度の検索で効率的なルート、費用、周辺グルメ、安全情報、AIのおすすめを確認できます。",
      placeholder: "海雲台、夜景、雰囲気の良い場所を検索",
      button: "旅行を検索 →",
      recent: "最近の検索",
    },
    zh: {
      guide: "釜山海岸旅行指南",
      eyebrow: "韩国釜山 · 海岸旅行助手",
      line1: "寻找釜山的海，",
      line2: "安心开启旅程。",
      lead: "一次搜索即可查看高效路线、费用、附近美食、安全信息和AI推荐。",
      placeholder: "搜索海云台、夜景或氛围好的地点",
      button: "搜索行程 →",
      recent: "最近搜索",
    },
  }[language];
  const saveHistory = (value: string) => {
    const next = [
      value,
      ...history.filter((item) => item.toLowerCase() !== value.toLowerCase()),
    ].slice(0, 5);
    setHistory(next);
    localStorage.setItem("blueline-search-history", JSON.stringify(next));
  };
  const search = (event?: FormEvent, value = query) => {
    event?.preventDefault();
    const clean = value.trim();
    if (!clean) {
      setNotice("Enter Haeundae, Gwangalli, Songdo or Taejongdae.");
      return;
    }
    saveHistory(clean);
    const abstractTravelQuestion =
      /(야간|야경|분위기|데이트|로맨틱|추천|night|nightlife|atmospher|romantic|date spot|recommend|夜景|雰囲気|おすすめ|夜间|氛围|推荐)/i.test(
        clean,
      );
    if (abstractTravelQuestion) {
      setAiQuestion(clean);
      setNotice(
        language === "ko"
          ? "AI 관광 도우미가 장소를 찾고 있습니다."
          : language === "ja"
            ? "AI観光ガイドがおすすめを探しています。"
            : language === "zh"
              ? "AI旅游助手正在查找推荐地点。"
              : "The AI travel guide is finding a recommendation.",
      );
      return;
    }
    setSearchedQuery(clean);
    setNotice(`Searching every feature for “${clean}”.`);
    setScreen("search");
  };
  const choose = (id: PlaceKey) => {
    setSelected(id);
    setScreen("plan");
    setNotice(`${places.find((item) => item.id === id)?.name} plan updated.`);
  };
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage(
        "This browser does not support location. Open the site in a current mobile browser or Chrome.",
      );
      setLocationPromptOpen(false);
      setTravelPeriodOpen(true);
      return;
    }
    if (!window.isSecureContext) {
      setLocationMessage("Location requires a secure HTTPS connection.");
      setLocationPromptOpen(false);
      setTravelPeriodOpen(true);
      return;
    }
    setLocationMessage(
      "Requesting your location… Choose Allow in the browser permission prompt.",
    );
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLocationMessage(
          "Location connected. Walking estimates use 5 minutes per kilometer.",
        );
        setLocationPromptOpen(false);
        setTravelPeriodOpen(true);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED)
          setLocationMessage(
            "Location is blocked. Use the lock icon in the browser address bar, allow Location for this site, then press this button again.",
          );
        else if (error.code === error.TIMEOUT)
          setLocationMessage(
            "Location request timed out. Check your network or GPS, then try again.",
          );
        else
          setLocationMessage(
            "Your location could not be determined. Check device location settings, then try again.",
          );
        setLocationPromptOpen(false);
        setTravelPeriodOpen(true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const saveTravelPeriod = (event: FormEvent) => {
    event.preventDefault();
    if (!travelStart || !travelEnd || travelEnd < travelStart) return;
    localStorage.setItem(
      "blueline-travel-period",
      JSON.stringify({ start: travelStart, end: travelEnd }),
    );
    setTravelPeriodOpen(false);
  };

  return (
    <main className="app-shell" lang={language}>
      <header className="app-topbar">
        <button
          className="brand-button"
          onClick={() => setScreen("home")}
          aria-label={ko ? "블루라인 부산 홈" : "BlueLine Busan home"}
        >
          <b>B</b> BLUE LINE <i>BUSAN</i>
        </button>
        <div className="topbar-right">
          <span className="guide-label">
            <span className="online-dot" /> {homeCopy.guide}
          </span>
          <div
            className="global-language"
            role="group"
            aria-label="Language / 언어 / 言語 / 语言"
          >
            <button
              className={language === "ko" ? "active" : ""}
              onClick={() => changeLanguage("ko")}
            >
              한국어
            </button>
            <button
              className={language === "en" ? "active" : ""}
              onClick={() => changeLanguage("en")}
            >
              EN
            </button>
            <button
              className={language === "ja" ? "active" : ""}
              onClick={() => changeLanguage("ja")}
            >
              日本語
            </button>
            <button
              className={language === "zh" ? "active" : ""}
              onClick={() => changeLanguage("zh")}
            >
              中文
            </button>
          </div>
        </div>
      </header>

      {locationPromptOpen && (
        <div
          className="location-consent"
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-consent-title"
        >
          <div>
            <span className="location-pin">●</span>
            <div>
              <small>BLUE LINE BUSAN</small>
              <h2 id="location-consent-title">
                {ko
                  ? "위치 권한을 허용해 주세요"
                  : "Please allow location access"}
              </h2>
              <p>
                {ko
                  ? "현재 위치에서 관광지까지의 도로 경로와 거리를 계산하려면 위치 권한이 필요합니다. 위치는 서버에 저장되지 않습니다."
                  : "Location access is needed to calculate road routes and distance from where you are. Your location is not stored on our server."}
              </p>
              <div className="location-consent-actions">
                <button onClick={requestLocation}>
                  {ko ? "위치 허용" : "Allow location"}
                </button>
                <button
                  className="secondary"
                  onClick={() => {
                    setLocationPromptOpen(false);
                    setTravelPeriodOpen(true);
                  }}
                >
                  {ko ? "나중에" : "Not now"}
                </button>
              </div>
              <p className="location-consent-status" aria-live="polite">
                {locationMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {travelPeriodOpen && (
        <div
          className="location-consent travel-period-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="travel-period-title"
        >
          <form onSubmit={saveTravelPeriod}>
            <span className="location-pin">◆</span>
            <div>
              <small>BLUE LINE BUSAN</small>
              <h2 id="travel-period-title">
                {ko
                  ? "부산 여행기간을 입력해 주세요"
                  : "Enter your Busan travel dates"}
              </h2>
              <p>
                {ko
                  ? "공개된 영업시간과 여행기간을 비교해 휴무가 겹치는 음식점과 의료기관을 추천 목록에서 제외합니다. 영업정보가 없는 장소는 방문 전에 네이버 지도에서 확인해 주세요."
                  : "We compare public opening hours with your trip and remove places with a known closure. Verify places without hours on Naver Map before visiting."}
              </p>
              <div className="travel-date-fields">
                <label>
                  <span>{ko ? "여행 시작일" : "Start date"}</span>
                  <input
                    type="date"
                    min={today}
                    value={travelStart}
                    onChange={(event) => {
                      setTravelStart(event.target.value);
                      if (travelEnd < event.target.value)
                        setTravelEnd(event.target.value);
                    }}
                    required
                  />
                </label>
                <label>
                  <span>{ko ? "여행 종료일" : "End date"}</span>
                  <input
                    type="date"
                    min={travelStart || today}
                    value={travelEnd}
                    onChange={(event) => setTravelEnd(event.target.value)}
                    required
                  />
                </label>
              </div>
              <div className="location-consent-actions">
                <button
                  disabled={
                    !travelStart || !travelEnd || travelEnd < travelStart
                  }
                >
                  {ko ? "여행기간 저장" : "Save travel dates"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {screen === "home" && (
        <section className="home-screen">
          <div className="photo-panorama" aria-label="Busan coast panorama">
            <div className="photo-track">
              <div
                style={{ backgroundImage: "url('/busan-panorama-night.png')" }}
              />
              <div
                style={{ backgroundImage: "url('/busan-panorama-dusk.png')" }}
              />
              <div
                style={{ backgroundImage: "url('/busan-panorama-cliff.png')" }}
              />
              <div
                style={{ backgroundImage: "url('/busan-panorama-night.png')" }}
              />
            </div>
            <div className="photo-overlay" />
          </div>
          <div className="home-content">
            <p className="eyebrow">{homeCopy.eyebrow}</p>
            <h1>
              {homeCopy.line1}
              <br />
              <em>{homeCopy.line2}</em>
            </h1>
            <p className="hero-lead">{homeCopy.lead}</p>
            <form className="main-search" onSubmit={(event) => search(event)}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={homeCopy.placeholder}
                aria-label={
                  ko ? "부산 관광지 검색" : "Search Busan coastal destination"
                }
              />
              <button>{homeCopy.button}</button>
            </form>
            <p className="notice" aria-live="polite">
              {ko && notice === "Search a Busan coast or attraction to start."
                ? "부산의 바다나 관광지를 검색해 보세요."
                : notice}
            </p>
            {history.length > 0 && (
              <div className="recent">
                <strong>{homeCopy.recent}</strong>
                {history.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setQuery(item);
                      search(undefined, item);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {screen === "planner" && (
        <RoutePlanner onClose={() => setScreen("home")} />
      )}
      {screen === "search" && (
        <UnifiedSearch
          initialQuery={searchedQuery}
          onClose={() => setScreen("home")}
          language={language}
          travelStart={travelStart}
          travelEnd={travelEnd}
        />
      )}

      {screen !== "home" && screen !== "planner" && screen !== "search" && (
        <section className="app-view">
          <nav className="view-nav">
            <button onClick={() => setScreen("home")}>← Home</button>
            <button
              className={screen === "plan" ? "active" : ""}
              onClick={() => setScreen("plan")}
            >
              Trip plan
            </button>
            <button
              className={screen === "attractions" ? "active" : ""}
              onClick={() => setScreen("attractions")}
            >
              Attractions
            </button>
            <button
              className={screen === "discover" ? "active" : ""}
              onClick={() => setScreen("discover")}
            >
              Food nearby
            </button>
            <button
              className={screen === "safety" ? "active" : ""}
              onClick={() => setScreen("safety")}
            >
              Safety
            </button>
          </nav>
          {screen === "plan" && (
            <section className="plan-view">
              <p className="eyebrow dark">YOUR SMART COAST ROUTE</p>
              <h2>
                {place.name}
                <span> optimized for time & fare</span>
              </h2>
              <form
                className="compact-search"
                onSubmit={(event) => search(event)}
              >
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search another destination"
                />
                <button>Search</button>
              </form>
              <p className="notice dark-notice">{notice}</p>
              <div className="place-tabs">
                {places.map((item) => (
                  <button
                    key={item.id}
                    className={item.id === selected ? "active" : ""}
                    onClick={() => choose(item.id)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              <div className="plan-cards">
                <article className="route-result">
                  <small>BEST VALUE ROUTE</small>
                  <h3>{place.transport}</h3>
                  <p>
                    Recommended for a straightforward coastal visit with the
                    lowest usual public-transport cost.
                  </p>
                  <div className="metrics">
                    <div>
                      <b>{place.time}</b>
                      <span>Estimated time</span>
                    </div>
                    <div>
                      <b>{place.fare}</b>
                      <span>Transport fare</span>
                    </div>
                    <div>
                      <b>1 transfer</b>
                      <span>Simple connection</span>
                    </div>
                  </div>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, Busan, South Korea`)}`}
                  >
                    Open in Google Maps →
                  </a>
                </article>
                <article className="hospital-result">
                  <small>NEARBY HOSPITAL</small>
                  <span className="hospital-symbol">+</span>
                  <h3>{place.hospital.name}</h3>
                  <p>Emergency care option · {place.hospital.time}</p>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.hospital.query)}`}
                  >
                    View directions →
                  </a>
                </article>
              </div>
              <button
                className="next-view"
                onClick={() => setScreen("discover")}
              >
                See highly rated food near {place.name} →
              </button>
            </section>
          )}

          {screen === "discover" && (
            <section className="discover-view">
              <p className="eyebrow dark">LOCAL FOOD DISCOVERY</p>
              <h2>Near {place.name}</h2>
              <p className="section-lead">
                Restaurant suggestions ordered by displayed Naver rating.
                Ratings are reference values—check Naver Map for the current
                score, hours and availability.
              </p>
              <div className="location-bar">
                <div>
                  <b>GPS distance</b>
                  <span>{locationMessage}</span>
                </div>
                <div className="location-actions">
                  <button onClick={requestLocation}>Use my location</button>
                  <button
                    className="location-help"
                    onClick={() => setLocationHelpOpen((open) => !open)}
                  >
                    🔒 Location help
                  </button>
                </div>
              </div>
              {locationHelpOpen && (
                <div className="location-help-panel">
                  <b>Allow location access</b>
                  <p>
                    In Chrome or Edge, select the site controls icon beside the
                    address, choose Location, then select Allow. In the in-app
                    browser, try opening this site in your regular browser if no
                    permission control is shown.
                  </p>
                </div>
              )}
              <div className="restaurant-grid">
                {place.restaurants.map((restaurant, index) => {
                  const coordinates = restaurantCoordinates[restaurant.name];
                  const distance =
                    userPosition && coordinates
                      ? walkingDistance(userPosition, coordinates)
                      : null;
                  return (
                    <article key={restaurant.name}>
                      <span>0{index + 1}</span>
                      <div className="score">
                        ★ {restaurant.score}
                        <small>Naver rating guide</small>
                      </div>
                      <h3>{restaurant.name}</h3>
                      <p>
                        {restaurant.kind} · near {place.name}
                      </p>
                      {distance !== null && (
                        <p className="distance-info">
                          {distance.toFixed(1)} km away · about{" "}
                          {Math.max(1, Math.round(distance * 5))} min on foot
                        </p>
                      )}
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={`https://map.naver.com/p/search/${encodeURIComponent(restaurant.name)}`}
                      >
                        View Naver Map photos & details →
                      </a>
                    </article>
                  );
                })}
              </div>
              <button className="next-view" onClick={() => setScreen("plan")}>
                ← Back to route & hospital
              </button>
            </section>
          )}

          {screen === "attractions" && (
            <section className="discover-view">
              <p className="eyebrow dark">
                GOOGLE MAPS · BUSAN TOURIST ATTRACTIONS
              </p>
              <h2>Top-rated places to visit.</h2>
              <p className="section-lead">
                Results are presented in Google rating order. Open any card to
                see its current Google Maps details, reviews and directions.
              </p>
              <div className="restaurant-grid">
                {attractions.map((attraction, index) => (
                  <article key={attraction.name}>
                    <span>0{index + 1}</span>
                    <div className="score">
                      ★ {attraction.rating}
                      <small>Google rating</small>
                    </div>
                    <h3>{attraction.name}</h3>
                    <p>{attraction.type}</p>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${attraction.name}, Busan, South Korea`)}`}
                    >
                      Open in Google Maps →
                    </a>
                  </article>
                ))}
              </div>
              <a
                className="next-view tourist-map-link"
                target="_blank"
                rel="noreferrer"
                href="https://www.google.com/maps/search/?api=1&query=top%20tourist%20attractions%20in%20Busan%2C%20South%20Korea"
              >
                Search all Busan attractions on Google Maps →
              </a>
            </section>
          )}

          {screen === "safety" && (
            <section className="safety-view">
              <p className="eyebrow dark">COASTAL CAUTION BOARD</p>
              <h2>Safety first, always.</h2>
              <p className="section-lead">
                These are place-specific caution prompts based on official
                notices and news reporting, not a live incident feed. Follow
                local emergency instructions in immediate danger.
              </p>
              <div className="hazard-grid">
                {hazards.map((item, index) => (
                  <article key={item.place}>
                    <span>0{index + 1}</span>
                    <p className="hazard-risk">{item.risk}</p>
                    <h3>{item.place}</h3>
                    <p>{item.detail}</p>
                    <a target="_blank" rel="noreferrer" href={item.url}>
                      Source: {item.source} →
                    </a>
                  </article>
                ))}
              </div>
              <button className="next-view" onClick={() => setScreen("home")}>
                Back to home →
              </button>
            </section>
          )}
        </section>
      )}
      <GeminiGuide
        language={language}
        initialQuestion={aiQuestion}
        onQuestionConsumed={() => setAiQuestion("")}
        onRecommend={(recommendedPlace) => {
          setQuery(recommendedPlace);
          setSearchedQuery(recommendedPlace);
          saveHistory(recommendedPlace);
          setScreen("search");
        }}
      />
    </main>
  );
}
