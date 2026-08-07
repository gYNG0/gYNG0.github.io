"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Language } from "./GeminiGuide";

type Point = {
  id: string;
  name: string;
  nameKo?: string;
  nameJa?: string;
  nameZh?: string;
  lat: number;
  lon: number;
  risk: string;
  riskKo?: string;
};
type Tab = "route" | "food" | "care" | "safety";
type RouteData = {
  coordinates: [number, number][];
  distance: number;
  legs: { from: string; to: string; distance: number }[];
};
type Restaurant = {
  id: string;
  name: string;
  nameKo?: string;
  nameJa?: string;
  nameZh?: string;
  cuisine?: string;
  hours?: string;
  distance: number;
  lat: number;
  lon: number;
};
type Clinic = {
  id: string;
  name: string;
  nameKo?: string;
  nameJa?: string;
  nameZh?: string;
  kind: "hospital" | "clinic";
  specialty?: string;
  phone?: string;
  hours?: string;
  distance: number;
  lat: number;
  lon: number;
};
type Parking = {
  id: string;
  name: string;
  nameJa?: string;
  nameZh?: string;
  lat: number;
  lon: number;
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
  {
    id: "hwangnyeongsan",
    name: "Hwangnyeongsan Observatory",
    nameKo: "황령산 전망대",
    lat: 35.157,
    lon: 129.0828,
    risk: "Mountain roads and viewing paths can be dark, steep or icy. Use lit paths and check weather before visiting.",
    riskKo:
      "산길과 전망대 보행로가 어둡거나 가파르고 겨울에는 결빙될 수 있습니다. 조명 있는 길을 이용하고 날씨를 확인하세요.",
  },
  {
    id: "the-bay-101",
    name: "The Bay 101",
    nameKo: "더베이101",
    lat: 35.1567,
    lon: 129.152,
    risk: "Waterfront decks can be slippery in rain and crowded at night. Keep away from unguarded edges.",
    riskKo:
      "비가 오면 수변 데크가 미끄럽고 야간에는 혼잡할 수 있습니다. 수변 가장자리에서 거리를 두세요.",
  },
  {
    id: "cheongsapo",
    name: "Cheongsapo Daritdol Observatory",
    nameKo: "청사포 다릿돌전망대",
    lat: 35.1594,
    lon: 129.1917,
    risk: "Strong coastal wind may affect the skywalk. Follow closures and secure hats and loose belongings.",
    riskKo:
      "해안 강풍으로 전망대 출입이 통제될 수 있습니다. 현장 통제를 따르고 모자와 소지품을 단단히 관리하세요.",
  },
  {
    id: "blueline-park",
    name: "Haeundae Blueline Park",
    nameKo: "해운대 블루라인파크",
    lat: 35.1604,
    lon: 129.1701,
    risk: "Stay behind platform lines and use marked crossings around the coastal railway.",
    riskKo:
      "해안열차 승강장 안전선 안쪽에서 대기하고 철길 주변에서는 지정된 통행로만 이용하세요.",
  },
  {
    id: "oryukdo",
    name: "Oryukdo Skywalk",
    nameKo: "오륙도 스카이워크",
    lat: 35.1005721,
    lon: 129.1247309,
    risk: "The exposed skywalk may close in high wind, rain or snow. Follow staff instructions.",
    riskKo:
      "강풍·비·눈이 올 때 스카이워크가 통제될 수 있습니다. 현장 직원의 안내를 따르세요.",
  },
  {
    id: "igidae",
    name: "Igidae Coastal Walk",
    nameKo: "이기대 해안산책로",
    lat: 35.126,
    lon: 129.119,
    risk: "Rocky coastal paths include slopes and stairs. Avoid them during severe weather and wear suitable shoes.",
    riskKo:
      "해안 산책로에 바위·경사·계단 구간이 있습니다. 악천후에는 피하고 미끄럼 방지 신발을 착용하세요.",
  },
  {
    id: "dadaepo",
    name: "Dadaepo Beach",
    nameKo: "다대포 해수욕장",
    lat: 35.0467,
    lon: 128.9668,
    risk: "Tides expose wide mudflats and channels. Check tide times and keep children close to designated paths.",
    riskKo:
      "조수에 따라 넓은 갯벌과 물길이 생깁니다. 물때를 확인하고 어린이는 지정된 길에서 보호자와 이동하세요.",
  },
  {
    id: "haedong-yonggungsa",
    name: "Haedong Yonggungsa Temple",
    nameKo: "해동용궁사",
    lat: 35.1884335,
    lon: 129.2229764,
    risk: "The temple has many stone steps and crowded narrow paths. Use handrails and move carefully in rain.",
    riskKo:
      "돌계단과 좁은 길이 많고 혼잡할 수 있습니다. 난간을 이용하고 비가 올 때 천천히 이동하세요.",
  },
  {
    id: "busan-x-sky",
    name: "BUSAN X the SKY",
    nameKo: "부산 엑스 더 스카이",
    lat: 35.1595,
    lon: 129.1694,
    risk: "Elevator queues and surrounding roads can be crowded. Follow building evacuation guidance.",
    riskKo:
      "엘리베이터 대기 공간과 주변 도로가 혼잡할 수 있습니다. 건물의 비상 대피 안내를 확인하세요.",
  },
  {
    id: "dongbaekseom",
    name: "Dongbaekseom Island",
    nameKo: "동백섬",
    lat: 35.1540639,
    lon: 129.1520862,
    risk: "Coastal boardwalks and stairs can be slippery after rain. Stay on marked paths.",
    riskKo:
      "비가 온 뒤 해안 데크와 계단이 미끄러울 수 있습니다. 지정된 산책로를 이용하세요.",
  },
  {
    id: "jagalchi",
    name: "Jagalchi Market",
    nameKo: "자갈치시장",
    lat: 35.0967,
    lon: 129.0305,
    risk: "Market floors can be wet and surrounding traffic is busy. Wear stable shoes and use crossings.",
    riskKo:
      "시장 바닥이 젖어 있을 수 있고 주변 차량 통행이 많습니다. 미끄럼에 주의하고 횡단보도를 이용하세요.",
  },
  {
    id: "beomeosa",
    name: "Beomeosa Temple",
    nameKo: "범어사",
    lat: 35.2839,
    lon: 129.0684,
    risk: "Mountain paths and stone stairs require care, especially after rain or snow.",
    riskKo:
      "산길과 돌계단은 비나 눈이 온 뒤 미끄러울 수 있습니다. 천천히 이동하고 등산로 통제를 확인하세요.",
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
  hwangnyeongsan: [
    "hwangnyeongsan",
    "hwangnyeong mountain",
    "hwangnyeongsan observatory",
    "황령산",
    "황령산 전망대",
    "ファンニョンサン",
    "荒嶺山",
    "荒岭山",
  ],
  "the-bay-101": [
    "the bay 101",
    "thebay101",
    "더베이101",
    "더 베이 101",
    "ザ・ベイ101",
    "海湾101",
  ],
  cheongsapo: [
    "cheongsapo",
    "daritdol",
    "cheongsapo daritdol observatory",
    "청사포",
    "다릿돌전망대",
    "青沙浦",
    "チョンサポ",
  ],
  "blueline-park": [
    "haeundae blueline park",
    "blue line park",
    "블루라인파크",
    "해운대 블루라인파크",
    "海雲台ブルーラインパーク",
    "海云台蓝线公园",
  ],
  oryukdo: [
    "oryukdo",
    "oryukdo skywalk",
    "오륙도",
    "오륙도 스카이워크",
    "五六島",
    "五六岛",
  ],
  igidae: [
    "igidae",
    "igidae coastal walk",
    "이기대",
    "이기대 해안산책로",
    "二妓台",
  ],
  dadaepo: ["dadaepo", "dadaepo beach", "다대포", "다대포 해수욕장", "多大浦"],
  "haedong-yonggungsa": [
    "haedong yonggungsa",
    "yonggungsa temple",
    "해동용궁사",
    "海東龍宮寺",
    "海东龙宫寺",
  ],
  "busan-x-sky": [
    "busan x the sky",
    "x the sky",
    "부산 엑스 더 스카이",
    "엑스더스카이",
    "釜山X the SKY",
  ],
  dongbaekseom: [
    "dongbaekseom",
    "dongbaek island",
    "동백섬",
    "冬柏島",
    "冬柏岛",
  ],
  jagalchi: [
    "jagalchi",
    "jagalchi market",
    "자갈치",
    "자갈치시장",
    "チャガルチ市場",
    "札嘎其市场",
  ],
  beomeosa: ["beomeosa", "beomeosa temple", "범어사", "梵魚寺", "梵鱼寺"],
};
const PLACE_TRANSLATIONS: Record<string, { ja: string; zh: string }> = {
  haeundae: { ja: "海雲台海水浴場", zh: "海云台海水浴场" },
  gamcheon: { ja: "甘川文化村", zh: "甘川文化村" },
  gwangalli: { ja: "広安里海水浴場", zh: "广安里海水浴场" },
  "busan-station": { ja: "釜山駅", zh: "釜山站" },
  yongdusan: { ja: "龍頭山公園", zh: "龙头山公园" },
  huinnyeoul: { ja: "ヒンヨウル文化村", zh: "白浅文化村" },
  songdo: { ja: "松島海水浴場", zh: "松岛海水浴场" },
  taejongdae: { ja: "太宗台", zh: "太宗台" },
  hwangnyeongsan: { ja: "荒嶺山展望台", zh: "荒岭山观景台" },
  "the-bay-101": { ja: "ザ・ベイ101", zh: "The Bay 101" },
  cheongsapo: { ja: "青沙浦タリットル展望台", zh: "青沙浦踏石观景台" },
  "blueline-park": { ja: "海雲台ブルーラインパーク", zh: "海云台蓝线公园" },
  oryukdo: { ja: "五六島スカイウォーク", zh: "五六岛天空步道" },
  igidae: { ja: "二妓台海岸散策路", zh: "二妓台海岸步道" },
  dadaepo: { ja: "多大浦海水浴場", zh: "多大浦海水浴场" },
  "haedong-yonggungsa": { ja: "海東龍宮寺", zh: "海东龙宫寺" },
  "busan-x-sky": { ja: "釜山エックス・ザ・スカイ", zh: "釜山X the SKY" },
  dongbaekseom: { ja: "冬柏島", zh: "冬柏岛" },
  jagalchi: { ja: "チャガルチ市場", zh: "札嘎其市场" },
  beomeosa: { ja: "梵魚寺", zh: "梵鱼寺" },
};
const QUICK_FOOD: Record<string, Restaurant[]> = {
  haeundae: [
    {
      id: "quick-haemok",
      name: "Haemok Haeundae",
      nameKo: "해목 해운대점",
      nameJa: "ヘモク海雲台店",
      nameZh: "海木海云台店",
      cuisine: "japanese;eel",
      distance: 0,
      lat: 35.1609,
      lon: 129.1624,
    },
    {
      id: "quick-miryang",
      name: "Miryang Sundae Dwaeji Gukbap",
      nameKo: "밀양순대돼지국밥",
      cuisine: "korean;gukbap",
      distance: 0,
      lat: 35.1635,
      lon: 129.1632,
    },
    {
      id: "quick-ops",
      name: "OPS Haeundae",
      nameKo: "옵스 해운대",
      cuisine: "bakery;cafe",
      distance: 0,
      lat: 35.1599,
      lon: 129.1604,
    },
  ],
  cheongsapo: [
    {
      id: "quick-sumin",
      name: "Suminine",
      nameKo: "수민이네",
      cuisine: "korean;seafood",
      distance: 0,
      lat: 35.1607,
      lon: 129.1912,
    },
    {
      id: "quick-cheongsapo-end",
      name: "Cheongsapo End House",
      nameKo: "청사포끝집",
      cuisine: "korean;seafood",
      distance: 0,
      lat: 35.1608,
      lon: 129.1922,
    },
    {
      id: "quick-diarte",
      name: "Diarte Coffee",
      nameKo: "디아트커피",
      cuisine: "cafe;dessert",
      distance: 0,
      lat: 35.1602,
      lon: 129.191,
    },
  ],
  gwangalli: [
    {
      id: "quick-eonyang",
      name: "Eonyang Bulgogi Busan",
      nameKo: "언양불고기 부산집",
      cuisine: "korean;barbecue",
      distance: 0,
      lat: 35.1542,
      lon: 129.1197,
    },
    {
      id: "quick-millak",
      name: "Millak Raw Fish Town",
      nameKo: "민락회타운",
      cuisine: "korean;seafood",
      distance: 0,
      lat: 35.1539,
      lon: 129.1225,
    },
    {
      id: "quick-jaecheop",
      name: "Halmae Jaecheopguk",
      nameKo: "할매재첩국",
      cuisine: "korean;soup",
      distance: 0,
      lat: 35.1515,
      lon: 129.114,
    },
  ],
};
const genericRisk =
  "No place-specific alert is registered in this guide. Check weather, official closures and on-site safety signs before visiting.";
const minutes = (meters: number) =>
  Math.max(1, Math.round((meters / 1000) * 4));
const hasKnownClosureDuringTrip = (
  hours: string | undefined,
  start: string,
  end: string,
) => {
  if (!hours || !start || !end || hours.includes("24/7")) return false;
  const dayCodes = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const availability = new Map<string, boolean>();
  const expandDays = (text: string) => {
    const days = new Set<string>();
    for (const match of text.matchAll(
      /(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?/g,
    )) {
      const from = dayCodes.indexOf(match[1]);
      const to = dayCodes.indexOf(match[2] || match[1]);
      let cursor = from;
      for (let count = 0; count < 7; count += 1) {
        days.add(dayCodes[cursor]);
        if (cursor === to) break;
        cursor = (cursor + 1) % 7;
      }
    }
    return days;
  };
  for (const segment of hours.split(";")) {
    const days = expandDays(segment);
    if (!days.size) continue;
    const open = !/\b(off|closed)\b/i.test(segment);
    days.forEach((day) => availability.set(day, open));
  }
  if (!availability.size) return false;
  const first = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime()))
    return false;
  let checked = 0;
  for (
    const date = new Date(first);
    date <= last && checked < 370;
    date.setDate(date.getDate() + 1), checked += 1
  ) {
    if (availability.get(dayCodes[date.getDay()]) !== true) return true;
  }
  return false;
};
const distanceKm = (a: Point, lat: number, lon: number) => {
  const rad = (value: number) => (value * Math.PI) / 180;
  const dLat = rad(lat - a.lat);
  const dLon = rad(lon - a.lon);
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};
const clinicPriority = (name: string) => {
  const value = name.toLowerCase();
  if (/(화상|burn|응급|emergency|외상|trauma)/.test(value)) return 0;
  if (
    /(종합|general|medical center|내과|internal|정형|orthopedic|재활|rehabilitation)/.test(
      value,
    )
  )
    return 1;
  if (/(성형|plastic|cosmetic|미용|피부|dermatology)/.test(value)) return 4;
  return 2;
};
const clinicPriorityLabel = (name: string, language: Language) => {
  const priority = clinicPriority(name);
  const labels = {
    ko: [
      "화상·응급 우선",
      "일반·외상 진료 우선",
      "가까운 동네 병·의원",
      "가까운 동네 병·의원",
      "미용 진료 · 후순위",
    ],
    en: [
      "BURN / EMERGENCY PRIORITY",
      "GENERAL / TRAUMA CARE",
      "ACCESSIBLE LOCAL CLINIC",
      "ACCESSIBLE LOCAL CLINIC",
      "COSMETIC CARE · LOWER PRIORITY",
    ],
    ja: [
      "やけど・救急優先",
      "一般・外傷診療優先",
      "近隣の病院・クリニック",
      "近隣の病院・クリニック",
      "美容診療・優先度低",
    ],
    zh: [
      "烧伤・急救优先",
      "普通・外伤诊疗优先",
      "附近医院・诊所",
      "附近医院・诊所",
      "美容诊疗・低优先级",
    ],
  } as const;
  return labels[language][priority];
};
const foodCategory = (cuisine: string | undefined, language: Language) => {
  const value = (cuisine || "").toLowerCase();
  const key = /korean|gukbap|bibimbap|kimchi|samgyeopsal/.test(value)
    ? "korean"
    : /japanese|sushi|ramen|udon|soba|yakitori/.test(value)
      ? "japanese"
      : /chinese|dim_sum|malatang/.test(value)
        ? "chinese"
        : /italian|pizza|pasta/.test(value)
          ? "western"
          : /seafood|fish|sashimi/.test(value)
            ? "seafood"
            : /cafe|coffee|dessert|bakery/.test(value)
              ? "cafe"
              : /fast.food|burger|chicken/.test(value)
                ? "fastfood"
                : "other";
  const labels = {
    ko: {
      korean: "한식",
      japanese: "일식",
      chinese: "중식",
      western: "양식",
      seafood: "해산물",
      cafe: "카페·디저트",
      fastfood: "패스트푸드",
      other: "기타 음식",
    },
    en: {
      korean: "Korean",
      japanese: "Japanese",
      chinese: "Chinese",
      western: "Western",
      seafood: "Seafood",
      cafe: "Cafe & dessert",
      fastfood: "Fast food",
      other: "Other food",
    },
    ja: {
      korean: "韓国料理",
      japanese: "日本料理",
      chinese: "中華料理",
      western: "洋食",
      seafood: "海鮮",
      cafe: "カフェ・デザート",
      fastfood: "ファストフード",
      other: "その他",
    },
    zh: {
      korean: "韩餐",
      japanese: "日餐",
      chinese: "中餐",
      western: "西餐",
      seafood: "海鲜",
      cafe: "咖啡·甜点",
      fastfood: "快餐",
      other: "其他美食",
    },
  } as const;
  return labels[language][key];
};
const representativeDish = (
  cuisine: string | undefined,
  language: Language,
) => {
  const value = (cuisine || "").toLowerCase();
  const key = /eel/.test(value)
    ? "eel"
    : /gukbap/.test(value)
      ? "gukbap"
      : /barbecue|korean_bbq/.test(value)
        ? "bbq"
        : /sushi|japanese/.test(value)
          ? "sushi"
          : /seafood|fish|sashimi/.test(value)
            ? "seafood"
            : /pizza|italian/.test(value)
              ? "pizza"
              : /cafe|coffee|dessert|bakery/.test(value)
                ? "dessert"
                : /chinese/.test(value)
                  ? "noodle"
                  : "local";
  const dishes = {
    ko: {
      eel: "장어덮밥",
      gukbap: "돼지국밥",
      bbq: "불고기",
      sushi: "초밥",
      seafood: "모둠회",
      pizza: "피자",
      dessert: "커피와 디저트",
      noodle: "중화면 요리",
      local: "지역 대표 메뉴",
    },
    en: {
      eel: "Eel rice bowl",
      gukbap: "Pork soup with rice",
      bbq: "Korean barbecue",
      sushi: "Sushi",
      seafood: "Assorted sashimi",
      pizza: "Pizza",
      dessert: "Coffee and dessert",
      noodle: "Chinese noodles",
      local: "Local signature dish",
    },
    ja: {
      eel: "うなぎ丼",
      gukbap: "豚肉クッパ",
      bbq: "プルコギ",
      sushi: "寿司",
      seafood: "刺身盛り合わせ",
      pizza: "ピザ",
      dessert: "コーヒーとデザート",
      noodle: "中華麺料理",
      local: "地域の代表メニュー",
    },
    zh: {
      eel: "鳗鱼盖饭",
      gukbap: "猪肉汤饭",
      bbq: "烤肉",
      sushi: "寿司",
      seafood: "综合生鱼片",
      pizza: "披萨",
      dessert: "咖啡和甜点",
      noodle: "中式面食",
      local: "当地招牌菜",
    },
  } as const;
  const prefix = {
    ko: "대표 음식",
    en: "Signature dish",
    ja: "代表メニュー",
    zh: "招牌菜",
  }[language];
  return `${prefix}: ${dishes[language][key]}`;
};
const formatOpeningHours = (hours: string | undefined, language: Language) => {
  if (!hours) return "";
  if (language === "en") return hours;
  const replacements =
    language === "ko"
      ? {
          Mo: "월",
          Tu: "화",
          We: "수",
          Th: "목",
          Fr: "금",
          Sa: "토",
          Su: "일",
          off: "휴무",
        }
      : language === "ja"
        ? {
            Mo: "月",
            Tu: "火",
            We: "水",
            Th: "木",
            Fr: "金",
            Sa: "土",
            Su: "日",
            off: "休業",
          }
        : {
            Mo: "周一",
            Tu: "周二",
            We: "周三",
            Th: "周四",
            Fr: "周五",
            Sa: "周六",
            Su: "周日",
            off: "休息",
          };
  return Object.entries(replacements).reduce(
    (text, [from, to]) => text.replaceAll(from, to),
    hours,
  );
};
const specialtyLabel = (specialty: string | undefined, language: Language) => {
  const value = (specialty || "").toLowerCase();
  const key = /hospital/.test(value)
    ? "hospital"
    : /doctor|clinic/.test(value)
      ? "clinic"
      : "care";
  return {
    ko: {
      hospital: "병원 진료",
      clinic: "외래·의원 진료",
      care: "진료과 방문 전 확인",
    },
    en: {
      hospital: "Hospital care",
      clinic: "Outpatient clinic",
      care: "Confirm specialty before visiting",
    },
    ja: {
      hospital: "病院診療",
      clinic: "外来・クリニック診療",
      care: "診療科は訪問前に確認",
    },
    zh: {
      hospital: "医院诊疗",
      clinic: "门诊・诊所服务",
      care: "请在就诊前确认科室",
    },
  }[language][key];
};
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
const MAJOR_HOSPITALS = [
  {
    id: "haeundae-paik",
    name: "Haeundae Paik Hospital",
    nameKo: "해운대백병원",
    nameJa: "仁済大学海雲台白病院",
    nameZh: "仁济大学海云台白医院",
    lat: 35.1731,
    lon: 129.1825,
  },
  {
    id: "good-gangan",
    name: "Good GangAn Hospital",
    nameKo: "좋은강안병원",
    nameJa: "グッド江安病院",
    nameZh: "Good江安医院",
    lat: 35.1506,
    lon: 129.1092,
  },
  {
    id: "pnuh",
    name: "Pusan National University Hospital",
    nameKo: "부산대학교병원",
    nameJa: "釜山大学病院",
    nameZh: "釜山大学医院",
    lat: 35.1012,
    lon: 129.018,
  },
  {
    id: "kosin",
    name: "Kosin University Gospel Hospital",
    nameKo: "고신대학교복음병원",
    nameJa: "高神大学福音病院",
    nameZh: "高神大学福音医院",
    lat: 35.0807,
    lon: 129.0142,
  },
  {
    id: "donga",
    name: "Dong-A University Hospital",
    nameKo: "동아대학교병원",
    nameJa: "東亜大学病院",
    nameZh: "东亚大学医院",
    lat: 35.1203,
    lon: 129.0176,
  },
];

const BUSAN_STATION_ORIGIN: Point = {
  id: "busan-station-origin",
  name: "Busan Station",
  nameKo: "부산역",
  lat: 35.1151,
  lon: 129.0414,
  risk: "",
};
const GIMHAE_AIRPORT_ORIGIN: Point = {
  id: "gimhae-airport-origin",
  name: "Gimhae International Airport",
  nameKo: "김해국제공항",
  lat: 35.1796,
  lon: 128.9382,
  risk: "",
};
const isInBounds = (
  lat: number,
  lon: number,
  bounds: [number, number, number, number],
) =>
  lat >= bounds[0] && lat <= bounds[1] && lon >= bounds[2] && lon <= bounds[3];
const chooseRouteOrigin = (lat: number, lon: number): Point => {
  if (isInBounds(lat, lon, [34.83, 35.4, 128.75, 129.33]))
    return {
      id: "my-location",
      name: "My location",
      nameKo: "현재 위치",
      lat,
      lon,
      risk: "",
    };
  if (isInBounds(lat, lon, [33.0, 38.7, 124.5, 132.0]))
    return BUSAN_STATION_ORIGIN;
  return GIMHAE_AIRPORT_ORIGIN;
};
const resolveRouteOrigin = async (lat: number, lon: number): Promise<Point> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&zoom=10&accept-language=en&lat=${lat}&lon=${lon}`,
    );
    if (!response.ok) throw new Error("reverse geocoding unavailable");
    const address = (await response.json()).address || {};
    if (address.country_code !== "kr") return GIMHAE_AIRPORT_ORIGIN;
    const region = [address.state, address.city, address.county]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return region.includes("busan") || region.includes("부산")
      ? {
          id: "my-location",
          name: "My location",
          nameKo: "현재 위치",
          lat,
          lon,
          risk: "",
        }
      : BUSAN_STATION_ORIGIN;
  } catch {
    return chooseRouteOrigin(lat, lon);
  }
};

async function findBusanPlace(value: string): Promise<Point> {
  const clean = value.trim();
  const normalizePlaceName = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFKC")
      .replace(/(부산광역시|부산시|busan|관광지|명소|전망대|observatory)/g, "")
      .replace(/[^\p{L}\p{N}]/gu, "");
  const normalized = normalizePlaceName(clean);
  const known = normalized
    ? BUSAN_ATTRACTIONS.find(
        (place) =>
          normalizePlaceName(place.name).includes(normalized) ||
          normalized.includes(normalizePlaceName(place.name)) ||
          aliases[place.id]?.some(
            (alias) =>
              normalized.includes(normalizePlaceName(alias)) ||
              normalizePlaceName(alias).includes(normalized),
          ),
      )
    : undefined;
  if (known) return known;
  const queries = [`${clean}, Busan`, `${clean}, 부산광역시`, clean];
  let result: any = null;
  for (const query of queries) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&namedetails=1&accept-language=en,ko,ja,zh&limit=5&countrycodes=kr&q=${encodeURIComponent(query)}`,
    );
    if (!response.ok) continue;
    const results = await response.json();
    result = results.find((item: { lat: string; lon: string }) => {
      const lat = Number(item.lat);
      const lon = Number(item.lon);
      return lat >= 34.8 && lat <= 35.5 && lon >= 128.7 && lon <= 129.4;
    });
    if (result) break;
  }
  if (!result) throw new Error("not found");
  const names = result.namedetails || {};
  return {
    id: `search-${clean}-${result.lat}`,
    name:
      names["name:en"] ||
      names.name ||
      result.display_name.split(",")[0] ||
      clean,
    nameKo: names["name:ko"] || clean,
    nameJa: names["name:ja"],
    nameZh: names["name:zh"] || names["name:zh-Hans"],
    lat: Number(result.lat),
    lon: Number(result.lon),
    risk: genericRisk,
  };
}

export default function UnifiedSearch({
  initialQuery,
  initialPlaces = [],
  onClose,
  language,
  travelStart,
  travelEnd,
}: {
  initialQuery: string;
  initialPlaces?: string[];
  onClose: () => void;
  language: Language;
  travelStart: string;
  travelEnd: string;
}) {
  const ko = language === "ko";
  const displayName = (point: Point) =>
    language === "ko"
      ? point.nameKo || point.name
      : language === "ja"
        ? point.nameJa || PLACE_TRANSLATIONS[point.id]?.ja || point.name
        : language === "zh"
          ? point.nameZh || PLACE_TRANSLATIONS[point.id]?.zh || point.name
          : point.name;
  const displayRestaurantName = (restaurant: Restaurant) =>
    language === "ko"
      ? restaurant.nameKo || restaurant.name
      : language === "ja"
        ? restaurant.nameJa || restaurant.nameKo || restaurant.name
        : language === "zh"
          ? restaurant.nameZh || restaurant.nameKo || restaurant.name
          : restaurant.name;
  const displayClinicName = (clinic: Clinic) =>
    language === "ko"
      ? clinic.nameKo || clinic.name
      : language === "ja"
        ? clinic.nameJa ||
          (clinic.nameKo || clinic.name)
            .replaceAll("종합병원", "総合病院")
            .replaceAll("응급의료센터", "救急医療センター")
            .replaceAll("정형외과", "整形外科")
            .replaceAll("피부과", "皮膚科")
            .replaceAll("내과", "内科")
            .replaceAll("의원", "クリニック")
            .replaceAll("병원", "病院")
        : language === "zh"
          ? clinic.nameZh ||
            (clinic.nameKo || clinic.name)
              .replaceAll("종합병원", "综合医院")
              .replaceAll("응급의료센터", "急救医疗中心")
              .replaceAll("정형외과", "骨科")
              .replaceAll("피부과", "皮肤科")
              .replaceAll("내과", "内科")
              .replaceAll("의원", "诊所")
              .replaceAll("병원", "医院")
          : clinic.name;
  const say = (en: string, korean: string, japanese = en, chinese = en) =>
    language === "ko"
      ? korean
      : language === "ja"
        ? japanese
        : language === "zh"
          ? chinese
          : en;
  const ui = {
    ko: {
      home: "홈",
      guide: "검색 관광지 안내",
      placeholder: "부산 지명 또는 관광지를 검색하세요",
      search: "검색",
      wait: "잠시만요…",
      selected: "선택한 장소",
      choose: "관광지 선택",
      route: "경로 안내",
      food: "주변 음식점",
      care: "주변 병원",
      safety: "안전 정보",
      foodLabel: "추가한 모든 장소 주변 음식점",
      foodTitle: (n: number) => `${n}개 장소의 음식점 찾기`,
      foodLoading: "인근 음식점 정보를 찾고 있습니다…",
      foodError:
        "공개 지도 음식점 정보를 불러오지 못했습니다. 아래 네이버 지도 검색을 이용해 주세요.",
      destinationNear: "목적지 주변",
      waypointNear: "경유지 주변",
      noFood: "등록된 음식점 상세 정보가 없습니다.",
      naverCheck: "네이버 지도에서 평점·휴무 확인 →",
      naverMore: "네이버 지도에서 더 보기 →",
      cuisineMissing: "음식 종류 정보 없음",
      parking: "주차장",
      hospital: "병원",
      restaurant: "음식점",
      convenience: "편의점",
    },
    en: {
      home: "Home",
      guide: "SEARCHED PLACE GUIDE",
      placeholder: "Search any Busan place or attraction",
      search: "Search",
      wait: "Please wait…",
      selected: "SELECTED PLACE",
      choose: "Choose an attraction",
      route: "Route planner",
      food: "Find food",
      care: "Nearby care",
      safety: "Safety board",
      foodLabel: "FOOD NEAR ALL ADDED PLACES",
      foodTitle: (n: number) =>
        `Restaurants near ${n} added place${n === 1 ? "" : "s"}`,
      foodLoading: "Finding nearby restaurant details…",
      foodError:
        "Public restaurant data is temporarily unavailable. Use the Naver Map links below.",
      destinationNear: "Near destination",
      waypointNear: "Near waypoint",
      noFood: "No detailed restaurant records found.",
      naverCheck: "Check rating & closures on Naver Map →",
      naverMore: "See more on Naver Map →",
      cuisineMissing: "Cuisine not listed",
      parking: "Parking",
      hospital: "Hospital",
      restaurant: "Food",
      convenience: "Convenience store",
    },
    ja: {
      home: "ホーム",
      guide: "検索した観光地ガイド",
      placeholder: "釜山の地名または観光地を検索",
      search: "検索",
      wait: "処理中…",
      selected: "選択した場所",
      choose: "観光地を選択",
      route: "ルート案内",
      food: "周辺グルメ",
      care: "周辺の病院",
      safety: "安全情報",
      foodLabel: "追加した全場所の周辺グルメ",
      foodTitle: (n: number) => `${n}か所周辺の飲食店`,
      foodLoading: "周辺の飲食店を検索しています…",
      foodError:
        "公開地図の飲食店情報を取得できません。NAVERマップの検索をご利用ください。",
      destinationNear: "目的地周辺",
      waypointNear: "経由地周辺",
      noFood: "登録された飲食店情報がありません。",
      naverCheck: "NAVERマップで評価・休業日を確認 →",
      naverMore: "NAVERマップでもっと見る →",
      cuisineMissing: "料理ジャンル情報なし",
      parking: "駐車場",
      hospital: "病院",
      restaurant: "飲食店",
      convenience: "コンビニ",
    },
    zh: {
      home: "首页",
      guide: "搜索景点指南",
      placeholder: "搜索釜山地名或旅游景点",
      search: "搜索",
      wait: "处理中…",
      selected: "已选地点",
      choose: "选择旅游景点",
      route: "路线规划",
      food: "附近美食",
      care: "附近医院",
      safety: "安全信息",
      foodLabel: "所有已添加地点的附近美食",
      foodTitle: (n: number) => `${n}个地点附近的餐厅`,
      foodLoading: "正在查找附近餐厅…",
      foodError: "无法读取公共地图的餐厅信息，请使用NAVER地图搜索。",
      destinationNear: "目的地附近",
      waypointNear: "途经点附近",
      noFood: "没有已登记的餐厅详细信息。",
      naverCheck: "在NAVER地图查看评分和休息日 →",
      naverMore: "在NAVER地图查看更多 →",
      cuisineMissing: "暂无菜系信息",
      parking: "停车场",
      hospital: "医院",
      restaurant: "餐厅",
      convenience: "便利店",
    },
  }[language];
  const careCopy = {
    ko: {
      label: "관광지별 의료기관",
      title: "대형병원과 가까운 동네 병원",
      description: `${travelStart}~${travelEnd} 여행기간에 알려진 휴무가 겹치는 동네 의료기관은 제외합니다. 가까운 응급병원과 화상·응급·외상 진료를 우선하며, 최신 네이버 지도 평점과 실제 진료 여부는 링크에서 확인하세요.`,
      loading: "주변 병원을 찾고 있습니다…",
      error:
        "공개 지도 병원 정보를 불러오지 못했습니다. 네이버 지도 검색 링크를 이용해 주세요.",
      major: "대형 응급병원",
    },
    en: {
      label: "CARE NEAR ALL ADDED PLACES",
      title: "Major hospitals and accessible local clinics",
      description: `Local clinics with a known closure during ${travelStart}–${travelEnd} are excluded. Nearby emergency, burn and trauma care rank first; verify current Naver Map ratings and availability through each link.`,
      loading: "Finding nearby hospitals and clinics…",
      error:
        "Public clinic data is temporarily unavailable. Use the Naver Map search links.",
      major: "MAJOR EMERGENCY HOSPITAL",
    },
    ja: {
      label: "追加した全場所周辺の医療機関",
      title: "大病院と近隣のクリニック",
      description: `${travelStart}～${travelEnd}の旅行期間と既知の休診日が重なる地域医療機関は除外します。救急・やけど・外傷診療を優先し、最新の評価と診療状況はNAVERマップで確認してください。`,
      loading: "周辺の病院を検索しています…",
      error:
        "公開地図の病院情報を取得できません。NAVERマップの検索をご利用ください。",
      major: "大規模救急病院",
    },
    zh: {
      label: "所有已添加地点附近的医疗机构",
      title: "大型医院和附近诊所",
      description: `将排除在${travelStart}～${travelEnd}旅行期间存在已知休诊日的社区医疗机构。优先推荐急救、烧伤和外伤诊疗机构，请在NAVER地图确认最新评分和接诊情况。`,
      loading: "正在查找附近医院…",
      error: "无法读取公共地图的医院信息，请使用NAVER地图搜索。",
      major: "大型急救医院",
    },
  }[language];
  const foodPeriodDescription = {
    ko: `${travelStart}~${travelEnd} 여행기간과 공개 영업시간을 비교해 알려진 휴무가 겹치는 음식점은 제외했습니다. 최신 평점·임시휴무는 네이버 지도에서 확인하세요.`,
    en: `Known closures overlapping ${travelStart}–${travelEnd} are excluded using public hours. Check current ratings and temporary closures on Naver Map.`,
    ja: `${travelStart}～${travelEnd}の旅行期間と公開営業時間を比較し、既知の休業日が重なる飲食店は除外しました。最新の評価・臨時休業はNAVERマップで確認してください。`,
    zh: `已根据公开营业时间排除在${travelStart}～${travelEnd}旅行期间存在已知休息日的餐厅。请在NAVER地图确认最新评分和临时停业信息。`,
  }[language];
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<Point | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [tab, setTab] = useState<Tab>("route");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Searching Busan…");
  const [origin, setOrigin] = useState<Point | null>(null);
  const [stops, setStops] = useState<Point[]>([]);
  const [reorderingStop, setReorderingStop] = useState<number | null>(null);
  const reorderLockedUntil = useRef(0);
  const [stopInput, setStopInput] = useState("");
  const [route, setRoute] = useState<RouteData | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [foodResults, setFoodResults] = useState<Record<string, Restaurant[]>>(
    {},
  );
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodError, setFoodError] = useState(false);
  const [clinicResults, setClinicResults] = useState<Record<string, Clinic[]>>(
    {},
  );
  const [clinicLoading, setClinicLoading] = useState(false);
  const [clinicError, setClinicError] = useState(false);
  const [parkingResults, setParkingResults] = useState<Parking[]>([]);
  const [convenienceResults, setConvenienceResults] = useState<Parking[]>([]);
  const recommendedFoodResults = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(foodResults).map(([id, restaurants]) => [
          id,
          restaurants
            .filter(
              (restaurant) =>
                !hasKnownClosureDuringTrip(
                  restaurant.hours,
                  travelStart,
                  travelEnd,
                ),
            )
            .slice(0, 4),
        ]),
      ),
    [foodResults, travelStart, travelEnd],
  );
  const recommendedClinicResults = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(clinicResults).map(([id, clinics]) => {
          const major = clinics
            .filter((clinic) => clinic.kind === "hospital")
            .slice(0, 1);
          const local = clinics
            .filter(
              (clinic) =>
                clinic.kind === "clinic" &&
                !hasKnownClosureDuringTrip(
                  clinic.hours,
                  travelStart,
                  travelEnd,
                ),
            )
            .slice(0, 3);
          return [id, [...major, ...local]];
        }),
      ),
    [clinicResults, travelStart, travelEnd],
  );
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
          "釜山の地名または観光地を入力してください。",
          "请输入釜山的地名或旅游景点。",
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
          "釜山の代表的な観光地を地図に表示しました。場所を選ぶとルート・グルメ・安全情報を確認できます。",
          "已在地图上显示釜山代表性景点。选择地点即可查看路线、美食和安全信息。",
        ),
      );
      setLoading(false);
      return;
    }
    const requestedPlaces = clean
      .split(/[,;\n]+/)
      .map((place) => place.trim())
      .filter(Boolean)
      .filter(
        (place, index, places) =>
          places.findIndex(
            (other) => other.toLowerCase() === place.toLowerCase(),
          ) === index,
      );
    if (requestedPlaces.length > 1) {
      const results = await Promise.allSettled(
        requestedPlaces.map((place) => findBusanPlace(place)),
      );
      const found = results
        .filter(
          (result): result is PromiseFulfilledResult<Point> =>
            result.status === "fulfilled",
        )
        .map((result) => result.value)
        .filter(
          (place, index, places) =>
            places.findIndex((other) => other.id === place.id) === index,
        );
      if (found.length) {
        setPoints(found);
        setSelected(found[0]);
        setStops(found);
        setQuery(found.map((place) => place.name).join(", "));
        setMessage(
          say(
            `${found.length} attractions are shown on the map and added as route stops.`,
            `${found.length}개의 관광지를 지도에 표시하고 경유지로 추가했습니다.`,
            `${found.length}か所の観光地を地図に表示し、経由地に追加しました。`,
            `已在地图上显示 ${found.length} 个景点并添加为途经点。`,
          ),
        );
      } else {
        setPoints([]);
        setSelected(null);
        setStops([]);
        setMessage(
          say(
            "The places could not be found. Check each Busan place name and try again.",
            "장소를 찾지 못했습니다. 부산 지명을 각각 확인한 뒤 다시 검색해 주세요.",
            "場所が見つかりませんでした。各釜山の地名を確認して再検索してください。",
            "未找到地点。请检查每个釜山地名后重试。",
          ),
        );
      }
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
          `${displayName(found)}を選択しました。経由地を追加してから現在地でルートを計算してください。`,
          `已选择${displayName(found)}。添加途经点后，请使用当前位置计算路线。`,
        ),
      );
    } catch {
      setMessage(
        say(
          "The place could not be found. Try a more specific Busan place name.",
          "장소를 찾지 못했습니다. 더 구체적인 부산 지명을 입력해 주세요.",
          "場所が見つかりませんでした。より具体的な釜山の地名を入力してください。",
          "找不到该地点，请输入更具体的釜山地名。",
        ),
      );
      setPoints([]);
      setSelected(null);
      setStops([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!initialPlaces.length) {
      runSearch(undefined, initialQuery);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.allSettled(initialPlaces.map((place) => findBusanPlace(place)))
      .then((results) => {
        const found = results
          .filter(
            (result): result is PromiseFulfilledResult<Point> =>
              result.status === "fulfilled",
          )
          .map((result) => result.value);
        if (cancelled) return;
        if (!found.length) {
          void runSearch(undefined, initialQuery);
          return;
        }
        const unique = found.filter(
          (place, index, items) =>
            items.findIndex((item) => item.id === place.id) === index,
        );
        setPoints(unique);
        setStops(unique);
        setSelected(unique[0]);
        setQuery(unique.map((place) => place.name).join(", "));
        setMessage(
          say(
            `${unique.length} AI-recommended attractions were added in suggested visit order. They are ready as the destination and waypoints.`,
            `AI 추천 관광지 ${unique.length}곳을 추천 순서대로 목적지와 경유지에 추가했습니다.`,
            `AIおすすめ観光地${unique.length}か所を、おすすめ順に目的地と経由地へ追加しました。`,
            `已按推荐顺序将${unique.length}个AI推荐景点添加为目的地和途经点。`,
          ),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
      window.L.control
        .scale({ metric: true, imperial: false, position: "bottomleft" })
        .addTo(map.current);
      const legend = window.L.control({ position: "bottomright" });
      legend.onAdd = () => {
        const node = window.L.DomUtil.create("div", "map-poi-legend");
        node.innerHTML = `<span><i class="food-marker-dot"></i>${ui.restaurant}</span><span><i class="hospital-marker-dot"></i>${ui.hospital}</span><span><i class="parking-marker-dot"></i>${ui.parking}</span><span><i class="convenience-marker-dot"></i>${ui.convenience}</span>`;
        return node;
      };
      legend.addTo(map.current);
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
    if (!mapReady) return;
    const legend = document.querySelector(".map-poi-legend");
    if (legend)
      legend.innerHTML = `<span><i class="food-marker-dot"></i>${ui.restaurant}</span><span><i class="hospital-marker-dot"></i>${ui.hospital}</span><span><i class="parking-marker-dot"></i>${ui.parking}</span><span><i class="convenience-marker-dot"></i>${ui.convenience}</span>`;
  }, [language, mapReady]);
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
        .bindTooltip(`${index + 1}. ${displayName(point)}`, {
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
          .bindTooltip(`${index + 1}. ${displayName(point)}`)
          .on("click", () => setSelected(point))
          .addTo(group),
      );
    if (route)
      window.L.polyline(
        route.coordinates.map(([lon, lat]) => [lat, lon]),
        { color: "#177f84", weight: 6 },
      ).addTo(group);
    new Map(
      Object.values(recommendedFoodResults)
        .flat()
        .map((restaurant) => [restaurant.id, restaurant]),
    ).forEach((restaurant) =>
      window.L.circleMarker([restaurant.lat, restaurant.lon], {
        radius: 7,
        color: "#ffffff",
        fillColor: "#e5483f",
        fillOpacity: 1,
        weight: 2,
      })
        .bindTooltip(`${ui.restaurant} · ${displayRestaurantName(restaurant)}`)
        .addTo(group),
    );
    new Map(
      Object.values(recommendedClinicResults)
        .flat()
        .map((clinic) => [clinic.id, clinic]),
    ).forEach((clinic) =>
      window.L.circleMarker([clinic.lat, clinic.lon], {
        radius: 7,
        color: "#ffffff",
        fillColor: "#1d9b62",
        fillOpacity: 1,
        weight: 2,
      })
        .bindTooltip(`${ui.hospital} · ${displayClinicName(clinic)}`)
        .addTo(group),
    );
    parkingResults.forEach((parking) =>
      window.L.circleMarker([parking.lat, parking.lon], {
        radius: 7,
        color: "#6d5700",
        fillColor: "#ffd84d",
        fillOpacity: 1,
        weight: 2,
      })
        .bindTooltip(
          `${ui.parking} · ${language === "ja" ? parking.nameJa || parking.name : language === "zh" ? parking.nameZh || parking.name : parking.name}`,
        )
        .on("click", () => {
          window.open(
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${parking.name} ${parking.lat},${parking.lon}`)}`,
            "_blank",
            "noopener,noreferrer",
          );
        })
        .addTo(group),
    );
    convenienceResults.forEach((store) =>
      window.L.circleMarker([store.lat, store.lon], {
        radius: 8,
        color: "#ffffff",
        fillColor: "#1267d6",
        fillOpacity: 1,
        weight: 3,
      })
        .bindTooltip(
          `${ui.convenience} · ${language === "ja" ? store.nameJa || store.name : language === "zh" ? store.nameZh || store.name : store.name}`,
        )
        .addTo(group),
    );
    group.addTo(map.current);
    layer.current = group;
    const bounds = group.getBounds();
    if (bounds.isValid()) map.current.fitBounds(bounds, { padding: [35, 35] });
  }, [
    points,
    selected,
    route,
    stops,
    origin,
    mapReady,
    recommendedFoodResults,
    recommendedClinicResults,
    parkingResults,
    convenienceResults,
    ko,
    language,
  ]);

  useEffect(() => {
    if (selected && stops.length === 0) setStops([selected]);
  }, [selected, stops.length]);

  const moveStop = (from: number, to: number) => {
    if (
      from === to ||
      to < 0 ||
      to >= stops.length ||
      performance.now() < reorderLockedUntil.current
    )
      return false;
    reorderLockedUntil.current = performance.now() + 300;
    const previousPositions = new Map(
      Array.from(
        document.querySelectorAll<HTMLElement>(
          ".waypoint-list [data-stop-key]",
        ),
      ).map((element) => [
        element.dataset.stopKey || "",
        element.getBoundingClientRect().top,
      ]),
    );
    setStops((items) => {
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          document
            .querySelectorAll<HTMLElement>(".waypoint-list [data-stop-key]")
            .forEach((element) => {
              const previousTop = previousPositions.get(
                element.dataset.stopKey || "",
              );
              if (previousTop === undefined) return;
              const distance =
                previousTop - element.getBoundingClientRect().top;
              if (Math.abs(distance) < 1) return;
              element
                .getAnimations()
                .forEach((animation) => animation.cancel());
              element.animate(
                [
                  { transform: `translateY(${distance}px)` },
                  { transform: "translateY(0)" },
                ],
                { duration: 340, easing: "cubic-bezier(.22,.8,.22,1)" },
              );
            });
        }),
      );
    setRoute(null);
    return true;
  };

  const stopInstanceKey = (stop: Point, index: number) =>
    `${stop.id}-${stops.slice(0, index).filter((item) => item.id === stop.id).length}`;

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
      setStops((items) => [...items, found]);
      setPoints((items) =>
        items.some((item) => item.id === found.id) ? items : [...items, found],
      );
      setSelected(found);
      setRoute(null);
      setStopInput("");
      setMessage(
        say(
          `${found.name} added as waypoint ${stops.length + 1}. Duplicate visits are allowed.`,
          `${displayName(found)}을(를) ${stops.length + 1}번째 경유지로 추가했습니다. 같은 장소도 여러 번 추가할 수 있습니다.`,
        ),
      );
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
          `Route calculated from ${start.name} through ${destinations.length} destination${destinations.length > 1 ? "s" : ""}.`,
          `${displayName(start)}에서 출발해 ${destinations.length}개 목적지를 지나는 경로를 계산했습니다.`,
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
      calculateRoute(BUSAN_STATION_ORIGIN);
      return;
    }
    setLoading(true);
    setMessage(
      say("Waiting for location permission…", "위치 권한을 기다리고 있습니다…"),
    );
    navigator.geolocation.getCurrentPosition(
      async (position) =>
        calculateRoute(
          await resolveRouteOrigin(
            position.coords.latitude,
            position.coords.longitude,
          ),
        ),
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
        setMessage(
          `${detail} ${say("Using Busan Station as the starting point instead.", "대신 부산역을 출발지로 사용합니다.")}`,
        );
        calculateRoute(BUSAN_STATION_ORIGIN);
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 },
    );
  };

  const roadKm = route ? route.distance / 1000 : null;
  const infoPlaces = stops.length ? stops : selected ? [selected] : [];
  useEffect(() => {
    if (!infoPlaces.length) {
      setParkingResults([]);
      return;
    }
    let cancelled = false;
    fetch("/api/parking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        places: infoPlaces.map((place) => ({
          lat: place.lat,
          lon: place.lon,
        })),
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("parking unavailable");
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        const parking = Array.isArray(data.parking)
          ? (data.parking as Parking[])
          : [];
        // Show no more than the three nearest parking lots for each stop.
        const nearest = infoPlaces.flatMap((place) =>
          parking
            .map((item) => ({
              item,
              distance: distanceKm(place, item.lat, item.lon),
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3)
            .map(({ item }) => item),
        );
        setParkingResults(
          nearest.filter(
            (item, index, items) =>
              items.findIndex((other) => other.id === item.id) === index,
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setParkingResults([]);
      });
    return () => {
      cancelled = true;
    };
  }, [stops, selected, ko]);
  useEffect(() => {
    if (!infoPlaces.length) {
      setConvenienceResults([]);
      return;
    }
    let cancelled = false;
    fetch("/api/nearby", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "convenience",
        places: infoPlaces.map((place) => ({
          lat: place.lat,
          lon: place.lon,
        })),
      }),
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) throw new Error("convenience unavailable");
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        const stores = Array.isArray(data.places)
          ? (data.places as Parking[])
          : [];
        // Keep the closest stores around every attraction so markers remain
        // relevant and visible instead of being lost in a city-wide cluster.
        const nearest = infoPlaces.flatMap((place) =>
          stores
            .map((item) => ({
              item,
              distance: distanceKm(place, item.lat, item.lon),
            }))
            .filter(({ distance }) => distance <= 1.25)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 8)
            .map(({ item }) => item),
        );
        setConvenienceResults(
          nearest.filter(
            (item, index, items) =>
              items.findIndex((other) => other.id === item.id) === index,
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setConvenienceResults([]);
      });
    return () => {
      cancelled = true;
    };
  }, [stops, selected]);
  useEffect(() => {
    if (!infoPlaces.length) return;
    let cancelled = false;
    const instantEntries = infoPlaces.map(
      (place) =>
        [
          place.id,
          (QUICK_FOOD[place.id] || []).map((restaurant) => ({
            ...restaurant,
            distance: distanceKm(place, restaurant.lat, restaurant.lon),
          })),
        ] as const,
    );
    let instantResults = Object.fromEntries(instantEntries);
    try {
      const cached = JSON.parse(
        localStorage.getItem("blueline-food-cache") || "null",
      );
      if (cached && typeof cached === "object")
        instantResults = { ...instantResults, ...cached };
    } catch {
      // Curated instant results remain available.
    }
    setFoodResults(instantResults);
    setFoodLoading(true);
    setFoodError(false);
    fetch("/api/nearby", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "food",
        places: infoPlaces.map((place) => ({
          lat: place.lat,
          lon: place.lon,
        })),
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("food unavailable");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          const nearby = Array.isArray(data.places) ? data.places : [];
          const entries = infoPlaces.map((place) => {
            const restaurants: Restaurant[] = nearby
              .map((item: any) => ({
                id: item.id,
                name: item.name,
                nameKo: item.nameKo,
                nameJa: item.nameJa,
                nameZh: item.nameZh,
                cuisine:
                  item.cuisine ||
                  (item.amenity === "cafe"
                    ? "cafe"
                    : item.amenity === "fast_food"
                      ? "fast food"
                      : "local food"),
                hours: item.hours,
                distance: distanceKm(place, item.lat, item.lon),
                lat: item.lat,
                lon: item.lon,
              }))
              .filter((item: Restaurant) => item.distance <= 3)
              .sort((a: Restaurant, b: Restaurant) => a.distance - b.distance);
            return [place.id, restaurants] as const;
          });
          const next = Object.fromEntries(entries);
          setFoodResults(next);
          try {
            localStorage.setItem("blueline-food-cache", JSON.stringify(next));
          } catch {
            // Recommendations still work when browser storage is unavailable.
          }
          setFoodError(
            entries.every(([, restaurants]) => restaurants.length === 0),
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFoodResults(instantResults);
          setFoodError(
            Object.values(instantResults).every(
              (restaurants) => !restaurants.length,
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setFoodLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stops, selected]);
  useEffect(() => {
    if (!infoPlaces.length) return;
    let cancelled = false;
    setClinicLoading(true);
    setClinicError(false);
    (async () => {
      const entries: Array<readonly [string, Clinic[]]> = [];
      for (const place of infoPlaces) {
        const major = MAJOR_HOSPITALS.map((hospital) => ({
          ...hospital,
          kind: "hospital" as const,
          distance: distanceKm(place, hospital.lat, hospital.lon),
        })).sort((a, b) => a.distance - b.distance)[0];
        let local: Clinic[] = [];
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&namedetails=1&extratags=1&accept-language=en&limit=16&q=${encodeURIComponent(`hospital near ${place.name}, Busan`)}`,
          );
          if (response.ok) {
            const results = await response.json();
            local = results
              .map((item: any) => {
                const names = item.namedetails || {};
                return {
                  id: `nominatim-${item.place_id}`,
                  name:
                    names["name:en"] ||
                    names.name ||
                    item.display_name.split(",")[0],
                  nameKo: names["name:ko"] || names.name,
                  kind: "clinic" as const,
                  specialty: item.type,
                  hours: item.extratags?.opening_hours,
                  phone:
                    item.extratags?.phone || item.extratags?.["contact:phone"],
                  distance: distanceKm(
                    place,
                    Number(item.lat),
                    Number(item.lon),
                  ),
                  lat: Number(item.lat),
                  lon: Number(item.lon),
                };
              })
              .filter(
                (clinic: Clinic) =>
                  clinic.distance <= 5 && clinic.name !== major.name,
              )
              .sort(
                (a: Clinic, b: Clinic) =>
                  clinicPriority(a.nameKo || a.name) -
                    clinicPriority(b.nameKo || b.name) ||
                  a.distance - b.distance,
              );
          }
        } catch {
          /* keep the major emergency hospital and Naver Map search link */
        }
        entries.push([
          place.id,
          [
            {
              id: major.id,
              name: major.name,
              nameKo: major.nameKo,
              nameJa: major.nameJa,
              nameZh: major.nameZh,
              kind: major.kind,
              distance: major.distance,
              lat: major.lat,
              lon: major.lon,
            },
            ...local,
          ],
        ]);
      }
      return entries;
    })()
      .then((entries) => {
        if (!cancelled) {
          setClinicResults(Object.fromEntries(entries));
          setClinicError(entries.every(([, clinics]) => clinics.length === 0));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setClinicResults({});
          setClinicError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setClinicLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stops, selected]);
  return (
    <section className="unified-search">
      <header>
        <button onClick={onClose}>← {ui.home}</button>
        <div>
          <b>BLUE LINE BUSAN</b>
          <span>{ui.guide}</span>
        </div>
      </header>
      <div className="unified-inner">
        <form className="unified-form" onSubmit={runSearch}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={ui.placeholder}
            aria-label={ko ? "부산 장소 검색" : "Search any Busan place"}
          />
          <button disabled={loading}>{loading ? ui.wait : ui.search}</button>
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
                <small>{ui.selected}</small>
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
                  aria-label={ui.choose}
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
                {ui.route}
              </button>
              <button
                className={tab === "food" ? "active" : ""}
                onClick={() => setTab("food")}
              >
                {ui.food}
              </button>
              <button
                className={tab === "care" ? "active" : ""}
                onClick={() => setTab("care")}
              >
                {ui.care}
              </button>
              <button
                className={tab === "safety" ? "active" : ""}
                onClick={() => setTab("safety")}
              >
                {ui.safety}
              </button>
            </nav>
            <div className="result-panel tab-slide-panel" key={tab}>
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
                      <li
                        key={stopInstanceKey(stop, index)}
                        data-stop-key={stopInstanceKey(stop, index)}
                        data-stop-index={index}
                        className={reorderingStop === index ? "reordering" : ""}
                      >
                        <b>{index + 1}</b>
                        <button
                          type="button"
                          className="waypoint-drag-handle"
                          aria-label={
                            ko
                              ? `${displayName(stop)} 순서 변경`
                              : `Reorder ${displayName(stop)}`
                          }
                          title={
                            ko
                              ? "끌거나 마우스 휠로 순서 변경"
                              : "Drag or scroll to reorder"
                          }
                          onWheel={(event) => {
                            event.preventDefault();
                            moveStop(
                              index,
                              index + (event.deltaY > 0 ? 1 : -1),
                            );
                          }}
                          onPointerDown={(event) => {
                            event.currentTarget.setPointerCapture(
                              event.pointerId,
                            );
                            setReorderingStop(index);
                          }}
                          onPointerMove={(event) => {
                            if (reorderingStop === null) return;
                            const target = document
                              .elementFromPoint(event.clientX, event.clientY)
                              ?.closest<HTMLElement>("[data-stop-index]");
                            const nextIndex = Number(target?.dataset.stopIndex);
                            if (
                              Number.isInteger(nextIndex) &&
                              nextIndex !== reorderingStop
                            ) {
                              if (moveStop(reorderingStop, nextIndex))
                                setReorderingStop(nextIndex);
                            }
                          }}
                          onPointerUp={() => setReorderingStop(null)}
                          onPointerCancel={() => setReorderingStop(null)}
                        >
                          ↕
                        </button>
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
                        <span className="waypoint-step-buttons">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveStop(index, index - 1)}
                            aria-label={ko ? "위로 이동" : "Move up"}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={index === stops.length - 1}
                            onClick={() => moveStop(index, index + 1)}
                            aria-label={ko ? "아래로 이동" : "Move down"}
                          >
                            ↓
                          </button>
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
                      ? "부산 안에서는 현재 위치, 국내의 부산 밖에서는 부산역, 해외에서는 김해국제공항을 출발지로 사용합니다. 예상 시간은 도로 1km당 4분이며 실시간 교통과 신호 대기는 포함하지 않습니다."
                      : "Origin rule: current location in Busan, Busan Station elsewhere in Korea, and Gimhae Airport outside Korea. Time is estimated at 4 minutes per road kilometer and excludes live traffic and signals."}
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
                  <small>{ui.foodLabel}</small>
                  <h3>{ui.foodTitle(infoPlaces.length)}</h3>
                  <p>{foodPeriodDescription}</p>
                  {foodLoading && (
                    <p className="food-loading">{ui.foodLoading}</p>
                  )}
                  {foodError && <p className="food-error">{ui.foodError}</p>}
                  <div className="place-info-grid">
                    {infoPlaces.map((place, index) => (
                      <section key={`food-${place.id}-${index}`}>
                        <b>
                          {index + 1}. {displayName(place)}
                        </b>
                        <span>
                          {index === 0 ? ui.destinationNear : ui.waypointNear}
                        </span>
                        <div className="restaurant-briefs">
                          {(recommendedFoodResults[place.id] || []).map(
                            (restaurant) => (
                              <article key={restaurant.id}>
                                <strong>
                                  {displayRestaurantName(restaurant)}
                                  <em className="food-kind-badge">
                                    {foodCategory(restaurant.cuisine, language)}
                                  </em>
                                </strong>
                                <p>
                                  {representativeDish(
                                    restaurant.cuisine,
                                    language,
                                  )}
                                </p>
                                <small>
                                  {restaurant.distance.toFixed(1)} km
                                  {restaurant.hours
                                    ? ` · ${formatOpeningHours(
                                        restaurant.hours,
                                        language,
                                      )}`
                                    : ""}
                                </small>
                                <a
                                  href={`https://map.naver.com/p/search/${encodeURIComponent(`${restaurant.nameKo || restaurant.name} 부산`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {ui.naverCheck}
                                </a>
                              </article>
                            ),
                          )}
                        </div>
                        {!foodLoading &&
                          !(recommendedFoodResults[place.id] || []).length && (
                            <p className="no-food-data">{ui.noFood}</p>
                          )}
                        <a
                          href={`https://map.naver.com/p/search/${encodeURIComponent(`${place.name} 맛집`)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {ui.naverMore}
                        </a>
                      </section>
                    ))}
                  </div>
                </article>
              )}
              {tab === "care" && (
                <article className="all-place-info">
                  <small>{careCopy.label}</small>
                  <h3>{careCopy.title}</h3>
                  <p>{careCopy.description}</p>
                  {clinicLoading && (
                    <p className="food-loading">{careCopy.loading}</p>
                  )}
                  {clinicError && (
                    <p className="food-error">{careCopy.error}</p>
                  )}
                  <div className="care-place-list">
                    {infoPlaces.map((place, index) => (
                      <section key={`care-${place.id}-${index}`}>
                        <h4>
                          {index + 1}. {displayName(place)}
                        </h4>
                        <div className="clinic-grid">
                          {(recommendedClinicResults[place.id] || []).map(
                            (clinic) => (
                              <article
                                key={clinic.id}
                                className={
                                  clinic.kind === "hospital"
                                    ? "major-clinic"
                                    : "local-clinic"
                                }
                              >
                                <span>
                                  {clinic.kind === "hospital"
                                    ? careCopy.major
                                    : clinicPriorityLabel(
                                        clinic.nameKo || clinic.name,
                                        language,
                                      )}
                                </span>
                                <strong>{displayClinicName(clinic)}</strong>
                                <p>
                                  {specialtyLabel(clinic.specialty, language)}
                                </p>
                                <small>
                                  {clinic.distance.toFixed(1)} km
                                  {clinic.hours
                                    ? ` · ${formatOpeningHours(
                                        clinic.hours,
                                        language,
                                      )}`
                                    : ""}
                                  {clinic.phone ? ` · ${clinic.phone}` : ""}
                                </small>
                                <a
                                  href={`https://map.naver.com/p/search/${encodeURIComponent(`${clinic.nameKo || clinic.name} 부산`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {
                                    {
                                      ko: "네이버 지도 평점·휴무 확인 →",
                                      en: "Check rating & closures on Naver Map →",
                                      ja: "NAVERマップで評価・休診日を確認 →",
                                      zh: "在NAVER地图查看评分和休诊日 →",
                                    }[language]
                                  }
                                </a>
                              </article>
                            ),
                          )}
                        </div>
                        {!clinicLoading &&
                          !(recommendedClinicResults[place.id] || [])
                            .length && (
                            <p className="no-food-data">
                              {
                                {
                                  ko: "반경 5km 안에서 등록된 의료기관을 찾지 못했습니다.",
                                  en: "No mapped care facility found within 5 km.",
                                  ja: "半径5km以内に登録された医療機関が見つかりません。",
                                  zh: "在5公里范围内未找到已登记的医疗机构。",
                                }[language]
                              }
                            </p>
                          )}
                        <a
                          className="goodoc-area-link"
                          href={`https://map.naver.com/p/search/${encodeURIComponent(`${displayName(place)} 병원`)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {
                            {
                              ko: `${displayName(place)} 주변 네이버 지도 병원 더 찾기 →`,
                              en: `Find more hospitals on Naver Map near ${displayName(place)} →`,
                              ja: `${displayName(place)}周辺の病院をNAVERマップでもっと見る →`,
                              zh: `在NAVER地图查找${displayName(place)}附近更多医院 →`,
                            }[language]
                          }
                        </a>
                      </section>
                    ))}
                  </div>
                  <p className="medical-note">
                    {
                      {
                        ko: "응급 상황에서는 평점보다 119 또는 가까운 응급실을 우선 이용하세요. 운영시간과 진료 가능 여부는 방문 전에 병원에 확인해야 합니다.",
                        en: "In an emergency, call 119 or use the nearest emergency department rather than choosing by rating. Confirm opening hours and availability before visiting.",
                        ja: "緊急時は評価より119または最寄りの救急外来を優先してください。診療時間と受診可否は訪問前に病院へ確認してください。",
                        zh: "紧急情况下请优先拨打119或前往最近的急诊室，不要只依据评分选择。就诊前请向医院确认营业时间和接诊情况。",
                      }[language]
                    }
                  </p>
                </article>
              )}
              {tab === "safety" && (
                <article className="all-place-info">
                  <small>
                    {ko
                      ? "추가한 모든 장소의 안전 정보"
                      : "SAFETY FOR ALL ADDED PLACES"}
                  </small>
                  <h3>
                    {ko
                      ? `${infoPlaces.length}개 장소에서 주의할 점`
                      : `Safety near ${infoPlaces.length} added place${infoPlaces.length === 1 ? "" : "s"}`}
                  </h3>
                  <p>
                    {ko
                      ? "목적지와 경유지별 기본 주의사항을 확인하고, 방문 직전 최신 보도와 공식 안내를 다시 확인하세요."
                      : "Review a safety note for every destination and waypoint, then check current reporting and official notices before visiting."}
                  </p>
                  <div className="place-info-grid safety-grid">
                    {infoPlaces.map((place, index) => (
                      <section key={`safety-${place.id}-${index}`}>
                        <b>
                          {index + 1}. {displayName(place)}
                        </b>
                        <p>
                          {ko
                            ? place.riskKo ||
                              "등록된 장소별 주의사항이 없습니다. 현장 안내판과 날씨, 출입 통제를 확인하세요."
                            : place.risk}
                        </p>
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(`${place.name} 부산 안전 주의`)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {ko
                            ? "최근 안전 정보 확인 →"
                            : "Check recent safety information →"}
                        </a>
                      </section>
                    ))}
                  </div>
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
