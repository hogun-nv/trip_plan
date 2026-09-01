export const ARRIVAL_OPTIONS = [
  { id: "fri-night", label: "9/18 밤 도착", short: "9/18 밤" },
  { id: "sat-morning", label: "9/19 오전 직항", short: "9/19 오전" },
  { id: "sat-late", label: "9/19 늦은 도착", short: "9/19 늦게" },
];

export const KIND_META = {
  REST: { label: "휴식", tone: "rest" },
  CULTURE: { label: "문화", tone: "culture" },
  VIEW: { label: "전망", tone: "view" },
  CITY: { label: "도심", tone: "city" },
  FOOD: { label: "식사", tone: "food" },
  NATURE: { label: "자연", tone: "nature" },
  TRANSIT: { label: "이동", tone: "transit" },
  LANDMARK: { label: "랜드마크", tone: "landmark" },
  MEMORIAL: { label: "추모", tone: "memorial" },
  ARCHITECTURE: { label: "건축", tone: "architecture" },
  SHOW: { label: "공연", tone: "show" },
  SPORT: { label: "스포츠", tone: "sports" },
  SPORTS: { label: "스포츠", tone: "sports" },
  SHOP: { label: "쇼핑", tone: "shop" },
  "ART & NATURE": { label: "예술·자연", tone: "culture" },
};

const MEDIA_RULES = [
  [/Keens/i, "keens"],
  [/Grand Central Oyster Bar/i, "oysterBar"],
  [/Katz/i, "katz"],
  [/Sylvia/i, "sylvia"],
  [/Peter Luger/i, "peterLuger"],
  [/Arthur Avenue/i, "arthurAvenue"],
  [/Juliana|Scarr|Joe's Pizza|John's of Bleecker|pizza/i, "pizza"],
  [/Russ & Daughters|Zabar|bagel/i, "bagel"],
  [/Nom Wah|dim sum/i, "dimsum"],
  [/Lobster Place|lobster roll/i, "lobster"],
  [/Semma|South Indian|dosa/i, "dosa"],
  [/Arepa/i, "arepa"],
  [/Anchor Bar|Duff's|Buffalo wings/i, "wings"],
  [/Jacob's Pickles|Soul food|Tatiana/i, "comfort"],
  [/Red Coach Inn/i, "redCoach"],
  [/Gallaghers/i, "porterhouse"],
  [/The Fulton/i, "lobster"],
  [/Tenement Museum|Lower East Side/i, "tenement"],
  [/Flushing Meadows|Unisphere/i, "unisphere"],
  [/Madison Square Park|Original Shake Shack/i, "madison"],
  [/Wall St|Wall Street/i, "wallStreet"],
  [/Bryant Park|NY Public Library|NYPL/i, "bryant"],
  [/Grand Central/i, "grandCentral"],
  [/Top of the Rock|Empire State/i, "topRock"],
  [/Little Island/i, "littleIsland"],
  [/High Line|Hudson Yards|Vessel/i, "highLine"],
  [/Chelsea Market/i, "chelsea"],
  [/MoMA|The Modern Bar Room/i, "moma"],
  [/Whitney/i, "whitney"],
  [/Cloisters|Fort Tryon/i, "cloisters"],
  [/The Met|Museum 카페/i, "met"],
  [/9\/11|Oculus/i, "memorial"],
  [/Liberty Island|Ellis Island|The Battery|Battery Park|Statue/i, "statue"],
  [/DUMBO|Brooklyn Bridge|Brooklyn Heights|Williamsburg waterfront|Brooklyn Ferry/i, "dumbo"],
  [/Dia Beacon|Beacon Main Street|Long Dock Park|The Roundhouse|Kitchen Sink|Metro-North Hudson/i, "dia"],
  [/Storm King|South Fields|Museum Hill|Meadows/i, "storm"],
  [/Niagara|Maid of the Mist|Cave of the Winds|Goat Island|Prospect Point|Table Rock|Rainbow Bridge/i, "niagara"],
  [/Roosevelt Island Tram|Four Freedoms/i, "tram"],
  [/Governors Island/i, "governors"],
  [/Citi Field|Mets vs/i, "citi"],
  [/Wave Hill/i, "waveHill"],
  [/Times Square|Hamilton|Richard Rodgers|극장가/i, "times"],
  [/호텔|체크인|낮잠|객실|샤워|짐 정리|완전한 빈 저녁|숙소 복귀/i, "hotelRoom"],
  [/Central Park|Bow Bridge|Bethesda|Conservatory Water|North Woods|Riverside Park/i, "central"],
  [/Seaport/i, "hero"],
];

export function getKindMeta(kind) {
  return KIND_META[kind] || { label: kind || "일정", tone: "city" };
}

export function getMediaKey(title = "") {
  return MEDIA_RULES.find(([pattern]) => pattern.test(title))?.[1] || null;
}

export function getMedia(title, data, fallback, fallbackCredit) {
  const key = getMediaKey(title);
  return {
    key,
    src: (key && data.images[key]) || fallback || data.images.hero,
    credit: (key && data.credits[key]) || fallbackCredit || data.credits.hero,
  };
}

export function getImageCredit(src, data, fallbackCredit = "") {
  const imageKey = Object.entries(data.images).find(([, url]) => url === src)?.[0];
  return (imageKey && data.credits[imageKey]) || fallbackCredit || data.credits.hero;
}

export function stripMarkup(value = "") {
  return value.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
}

export function lateArrivalStops(plan) {
  const base = plan.days[0].stops[0].coords;
  return [
    {
      time: "20:30",
      end: "21:15",
      title: "호텔 체크인 · 샤워",
      kind: "REST",
      detail: "입국심사와 시내 이동 뒤에는 관광을 넣지 않습니다. 커튼을 닫고 다음 날 07:30 기상을 목표로 쉬세요.",
      move: "공항에서 택시 또는 대중교통",
      coords: base,
      url: "",
      reserve: "늦은 체크인 사전 통보",
    },
    {
      time: "21:15",
      end: "22:00",
      title: "호텔 주변에서 가벼운 저녁",
      kind: "FOOD",
      detail: "샌드위치·수프·피자처럼 빨리 먹을 수 있는 메뉴만 고르고, 술과 과식은 피합니다.",
      move: "호텔에서 도보 5–10분",
      coords: [base[0] + 0.0015, base[1] + 0.001],
      url: "",
      reserve: "호텔에 늦게 여는 곳 문의",
    },
  ];
}

export function getDayView(plan, dayIndex, arrival) {
  const day = plan.days[dayIndex];
  if (dayIndex !== 0 || arrival !== "sat-late") return day;
  return {
    ...day,
    title: "늦은 도착, 체크인만",
    subtitle: "첫날 관광은 과감히 비우고 다음 날부터 정상 일정",
    walk: "1km 미만",
    rest: "즉시 취침",
    weather: "날씨 영향 없음",
    stops: lateArrivalStops(plan),
  };
}

export function getArrivalAdvice(arrival, dayIndex) {
  if (dayIndex !== 0) return "";
  if (arrival === "fri-night") return "숙면 후 첫 일정은 14:00에 시작합니다. 오전은 충분히 쉬고 호텔 주변만 가볍게 걷습니다.";
  if (arrival === "sat-morning") return "약 10:00 도착, 13:00–13:30 호텔 도착을 기준으로 잡았습니다. 객실이 준비되지 않았다면 짐만 맡기세요.";
  return "첫날 관광을 모두 비웠습니다. 원래 D1 핵심 장소는 일정 교체 팁에 따라 다른 날로 옮기세요.";
}

export function getGoogleRouteUrl(day) {
  if (!day.stops.length) return "https://maps.google.com";
  const mode = day.mapMode === "driving" ? "driving" : day.mapMode === "walking" ? "walking" : "transit";
  const toText = (coords) => coords.join(",");
  const origin = toText(day.stops[0].coords);
  const destination = toText(day.stops[day.stops.length - 1].coords);
  const waypointStops = day.stops.slice(1, -1).slice(0, 8);
  const waypoints = waypointStops.length ? `&waypoints=${encodeURIComponent(waypointStops.map((stop) => toText(stop.coords)).join("|"))}` : "";
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypoints}&travelmode=${mode}`;
}

export function getPlaceMapUrl(stop) {
  const destination = Array.isArray(stop.coords) ? stop.coords.join(",") : stop.title;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=transit`;
}

export function getDurationMinutes(start, end) {
  if (!start || !end) return null;
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

export function formatDuration(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}분`;
  if (!remainder) return `${hours}시간`;
  return `${hours}시간 ${remainder}분`;
}

export function reservationLabel(reserve = "") {
  if (!reserve) return "예약 없음";
  if (/예약|티켓|사전|시간|입장|선택 일정|1박/i.test(reserve)) return reserve;
  return reserve;
}

export function dateParts(date = "") {
  const [dateAndWeekday = "", dayCode = ""] = date.split("·").map((part) => part.trim());
  return { dateAndWeekday, dayCode };
}

export function nextStopMove(day, index) {
  if (index >= day.stops.length - 1) return "오늘 일정 마무리";
  const next = day.stops[index + 1];
  return `${next.move || "다음 장소로 이동"} · ${next.time}`;
}

export function buildReservationText(plan, day, stop) {
  return [
    `여행 플랜: ${plan.number} ${plan.short}`,
    `날짜: ${day.date}`,
    `시간: ${stop.time}${stop.end ? `–${stop.end}` : ""}`,
    `장소: ${stop.title}`,
    stop.reserve ? `예약: ${stop.reserve}` : "",
    stop.move ? `이동: ${stop.move}` : "",
    stop.url ? `공식 링크: ${stop.url}` : "",
  ].filter(Boolean).join("\n");
}
