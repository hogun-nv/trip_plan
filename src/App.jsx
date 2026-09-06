import { useEffect, useMemo, useRef, useState } from "react";
import {
  AirplaneTilt, ArrowDown, ArrowSquareOut, ArrowUp, Bed, BookOpen, Buildings,
  CalendarBlank, CaretDown, CaretLeft, CaretRight, Check, CheckCircle, Clock,
  Coffee, Copy, CurrencyDollar, ForkKnife, Heart, Info, ListBullets, MapPin,
  MapTrifold, Minus, NavigationArrow, NotePencil, Plus, ShareNetwork, ShoppingBag,
  Sparkle, Star, Ticket, Train, Trash, Tree, Users, Wallet, Warning, X,
} from "@phosphor-icons/react";
import { RouteMap } from "./components/RouteMap.jsx";
import {
  FX_RATE, HOTELS, MUSICALS, PLACES, PRACTICAL_NOTES, SOURCES, SPECIAL_EVENTS,
  THEME_PARKS, TOUR_OPTIONS, TRIP_META, TYPE_META, VERIFIED_AT,
} from "./data/nyc-planner-data.js";
import { useSharedPlan } from "./hooks/useSharedPlan.js";

const TYPE_ICONS = {
  flight: AirplaneTilt, hotel: Bed, sight: MapPin, culture: Buildings,
  food: ForkKnife, cafe: Coffee, shopping: ShoppingBag, transit: Train, event: Sparkle,
};
const MUSEUM_IDS = new Set([
  "the-met", "moma", "guggenheim", "amnh", "whitney", "met-cloisters",
  "tenement-museum", "nine-eleven-museum", "intrepid-museum", "morgan-library", "frick-collection",
]);
const NATURE_IDS = new Set([
  "central-park", "little-island", "madison-square", "pebble-beach", "high-line",
  "prospect-park", "brooklyn-botanic", "governors-island", "roosevelt-island", "long-beach-ny",
]);
const EXPLORE_SECTIONS = [
  { id: "overview", label: "전체 계획", caption: "7일 일정을 한 화면에서", icon: CalendarBlank, code: "A" },
  { id: "schedule", label: "일자별 계획", caption: "시간·순서·이동 편집", icon: ListBullets, code: "B" },
  { id: "food", label: "맛집", caption: "식당·베이커리·카페", icon: ForkKnife, code: "C" },
  { id: "sights", label: "관광명소", caption: "첫 뉴욕의 대표 장면", icon: MapPin, code: "D" },
  { id: "museums", label: "박물관·미술관", caption: "대표 작품과 관람 정보", icon: Buildings, code: "E" },
  { id: "nature", label: "자연 명소", caption: "공원·강변·섬", icon: Tree, code: "F" },
  { id: "culture", label: "문화", caption: "공연·건축·뉴욕의 역사", icon: Ticket, code: "G" },
  { id: "shopping", label: "쇼핑", caption: "브랜드·서점·마켓", icon: ShoppingBag, code: "H" },
  { id: "daytrip", label: "근교 여행지", caption: "기차로 다녀오는 하루", icon: Train, code: "I" },
  { id: "hotels", label: "호텔", caption: "도심 6박·공항 근처 2박", icon: Bed, code: "J" },
];
const EXPLORE_COPY = {
  food: ["EAT", "뉴욕에서 기억할 한 끼", "오래된 뉴욕식 식당부터 요즘 주목받는 베이커리까지, 두 분의 적은 식사량을 고려한 대표 주문도 함께 정리했습니다."],
  sights: ["SEE", "첫 뉴욕의 대표 장면", "대표 명소를 나열하는 데 그치지 않고, 같은 동네를 자연스럽게 이어 걸을 수 있는 장소를 모았습니다."],
  museums: ["ART & HISTORY", "작품과 공간으로 읽는 뉴욕", "대표 작품, 권장 체류 시간, 휴관일을 먼저 확인하고 규모가 큰 박물관은 하루 한두 곳만 선택하세요."],
  nature: ["BREATHE", "도시 안에서 쉬어 가는 풍경", "공원과 강변, 섬을 실내 일정 사이에 배치하면 걷는 피로를 줄이면서도 뉴욕의 규모감을 느낄 수 있습니다."],
  culture: ["FEEL", "무대와 건축, 뉴욕의 이야기", "Broadway 외에도 jazz, 역사적인 공연장, 이민자의 생활사를 만나는 문화 경험을 골랐습니다."],
  shopping: ["SHOP", "뉴욕다운 쇼핑", "대형 매장과 독립 서점, 주말 마켓을 동네별로 묶었습니다. 쇼핑 시간은 60–90분 단위로 잡는 편이 편합니다."],
  daytrip: ["ESCAPE", "도시를 벗어나는 하루", "이번 6박 일정에는 무리해서 넣지 않아도 됩니다. 추가 체류일이나 다음 뉴욕 여행 후보로 비교하세요."],
  saved: ["SAVED", "저장한 장소", "두 분이 즐겨찾기에 추가한 장소만 모았습니다. 원하는 날짜를 골라 바로 일정에 넣을 수 있습니다."],
};

function placeInSection(place, section) {
  const explicit = Array.isArray(place.collections) ? place.collections : place.collection ? [place.collection] : [];
  if (section === "saved") return true;
  if (explicit.length) return explicit.includes(section);
  if (section === "food") return ["food", "cafe"].includes(place.type);
  if (section === "museums") return MUSEUM_IDS.has(place.id);
  if (section === "nature") return NATURE_IDS.has(place.id);
  if (section === "shopping") return place.type === "shopping";
  if (section === "culture") return ["culture", "event"].includes(place.type) && !MUSEUM_IDS.has(place.id);
  if (section === "sights") return place.type === "sight" && !NATURE_IDS.has(place.id);
  return false;
}
const ACCESS_GUIDE = {
  "jfk-arrival": "JFK 공식 택시 승강장에서 Midtown까지 45–90분, 약 $93–110입니다. 대중교통을 이용하면 AirTrain으로 Jamaica까지 이동한 뒤 LIRR로 갈아타 Penn Station까지 총 55–80분, 1인 약 $14가 듭니다.",
  "midtown-hotel": "42 St–Bryant Park역(B·D·F·M) 또는 Times Sq–42 St역에서 도보로 닿는 W 39–42 St 권역을 권합니다.",
  "bryant-park": "42 St–Bryant Park역(B·D·F·M) 5th Ave 출구가 가장 가깝습니다.",
  nypl: "42 St–Bryant Park역 5th Ave 출구에서 도보 약 2분. Fifth Avenue 정문으로 들어갑니다.",
  "grand-central": "Grand Central–42 St역(4·5·6·7·S)에서 Main Concourse 표지를 따릅니다.",
  "st-patricks": "5 Av/53 St역(E·M)에서 도보 약 5분, 또는 Rockefeller Center에서 Fifth Avenue를 건넙니다.",
  rockefeller: "47–50 Sts–Rockefeller Ctr역(B·D·F·M)에서 도보 약 3분입니다.",
  ellens: "50 St역(1) 또는 49 St역(N·R·W)에서 도보 약 3분. 큰 짐 없이 방문합니다.",
  "times-square": "Times Sq–42 St역(1·2·3·7·N·Q·R·W·S)에서 Broadway Plaza 표지를 따릅니다.",
  "statue-liberty": "1선 South Ferry, R·W선 Whitehall St, 4·5선 Bowling Green역에서 Battery Park의 공식 Statue City Cruises 보안검색대로 갑니다.",
  "wall-street": "2·3선 Wall St역 또는 4·5선 Wall St역에서 NYSE와 Federal Hall까지 도보 약 2–4분입니다.",
  oculus: "WTC Cortlandt(1), Cortlandt St(R·W), Fulton St 여러 노선이 연결됩니다. Oculus 안에서 표지를 확인합니다.",
  "brooklyn-bridge": "Manhattan 쪽은 Brooklyn Bridge–City Hall역(4·5·6)에서 보행자 입구까지 도보 약 5분입니다.",
  "pebble-beach": "F선 York St역에서 도보 약 10분, A·C선 High St역에서 약 12분입니다.",
  "river-cafe": "Pebble Beach에서 Water Street를 따라 도보 약 8분. 귀가는 A·C선 High St역 또는 taxi를 이용합니다.",
  "tal-bagels": "4·5·6선 86 St역 Lexington Avenue 출구에서 도보 약 4분입니다.",
  "central-park": "6선 77 St역에서 Fifth Avenue 79th Street 입구까지 도보 약 10분. 산책은 East 72nd Street 출구에서 마칩니다.",
  guggenheim: "4·5·6선 86 St역에서 도보 약 12분. Central Park에서 오면 East 72nd Street 출구 기준 도보 18–22분 또는 taxi 8–12분입니다.",
  "the-met": "4·5·6선 86 St역에서 M1·M2·M3·M4 bus로 갈아타거나 도보 약 15분입니다.",
  "met-eatery": "The Met 입장 뒤 Ground Floor 식음 안내를 따릅니다. 재입장 동선을 만들지 않는 것이 목적입니다.",
  moma: "5 Av/53 St역(E·M)에서 도보 약 4분, 47–50 Sts역(B·D·F·M)에서 약 7분입니다.",
  "moma-lunch": "MoMA 관람 구역 안 2층입니다. 당일 식음 안내와 입장 동선을 따릅니다.",
  "lincoln-center": "1선 66 St–Lincoln Center역에서 plaza까지 도보 약 2분입니다.",
  broadway: "Belasco Theatre는 42 St–Bryant Park역에서 도보 약 5분. 공연 30분 전까지 입장합니다.",
  "union-greenmarket": "14 St–Union Sq역(4·5·6·L·N·Q·R·W)에서 공원 서쪽 Greenmarket로 나옵니다.",
  "harry-potter": "R·W선 23 St역에서 Broadway를 따라 남쪽으로 도보 약 3분입니다.",
  "madison-square": "R·W선 23 St역 바로 옆. Harry Potter New York에서 도보 약 5분입니다.",
  "chelsea-market": "14 St–8 Av역(A·C·E·L)에서 도보 약 5분입니다.",
  "little-island": "Chelsea Market에서 10th Avenue를 건너 Hudson River 방향으로 도보 약 10분입니다.",
  "empire-state": "34 St–Herald Sq역(B·D·F·M·N·Q·R·W)에서 도보 약 5분입니다.",
  keens: "34 St–Herald Sq역에서 도보 약 3분. Empire State Building에서 약 6분입니다.",
  soho: "Prince St역(N·R·W) 또는 Spring St역(6)에서 cast-iron district로 들어갑니다.",
  stussy: "Prince St역(N·R·W)에서 Prince Street를 따라 도보 약 4분입니다.",
  "san-gennaro": "Canal St역(6·N·Q·R·W·J·Z)에서 Mulberry Street 북쪽 방향으로 들어갑니다.",
  "greenwich-village": "W 4 St–Washington Sq역(A·C·E·B·D·F·M)에서 Washington Square까지 도보 약 3분입니다.",
  "joes-pizza": "W 4 St–Washington Sq역에서 Carmine Street까지 도보 약 3분입니다.",
  "jfk-departure": "교통 상황이 평온하면 taxi 45–90분·약 $93–110, 정체가 심하면 Penn Station에서 LIRR+AirTrain 55–80분·1인 약 $14를 권합니다.",
};
function money(value) {
  return `$${Math.round(Number(value) || 0).toLocaleString("en-US")}`;
}
function won(value, rate) {
  const rounded = Math.round(((Number(value) || 0) * rate) / 1000) * 1000;
  return `₩${rounded.toLocaleString("ko-KR")}`;
}
function itemCost(item, place) {
  return Number.isFinite(Number(item.costUsd)) ? Number(item.costUsd) : Number(place?.costUsd || 0);
}
function writeClipboard(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const area = document.createElement("textarea");
  area.value = value; area.style.position = "fixed"; area.style.opacity = "0";
  document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove();
  return Promise.resolve();
}
function toRad(value) { return value * Math.PI / 180; }
function milesBetween(a, b) {
  if (!a || !b) return 0;
  const earth = 3958.8; const dLat = toRad(b[0] - a[0]); const dLon = toRad(b[1] - a[1]);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
function routeAdvice(from, to) {
  if (!from || !to) return [];
  if (from.id === "statue-liberty") return [
    { icon: Train, name: "공식 ferry", detail: "Battery Park 복귀 · 약 25–45분 · 입장권에 포함" },
    { icon: NavigationArrow, name: "하선 뒤 도보", detail: "Wall Street까지 약 10–15분 · 무료" },
  ];
  const airport = from.id?.startsWith("jfk") || to.id?.startsWith("jfk");
  if (airport) return [
    { icon: NavigationArrow, name: "Yellow Taxi", detail: "45–90분 · 2인 $93–110 예상" },
    { icon: Train, name: "AirTrain + LIRR", detail: "55–80분 · 1인 $14" },
  ];
  const miles = milesBetween(from.coords, to.coords);
  const walk = Math.max(4, Math.round((miles / 2.8) * 60));
  if (miles < 0.65) return [
    { icon: NavigationArrow, name: "도보", detail: `${walk}분 · ${miles.toFixed(1)}mi · 무료` },
    { icon: Train, name: "Taxi", detail: "교통에 따라 8–18분 · $13–22" },
  ];
  return [
    { icon: Train, name: "지하철·버스", detail: `약 ${Math.max(15, Math.round(walk * 0.52))}–${Math.max(22, Math.round(walk * 0.7))}분 · 2인 $6` },
    { icon: NavigationArrow, name: "Taxi", detail: `약 12–30분 · $15–35` },
    { icon: NavigationArrow, name: "도보", detail: `약 ${walk}분 · ${miles.toFixed(1)}mi` },
  ];
}
function dayBudget(day, places) {
  let activity = 0;
  let transit = 0;
  day.items.forEach((item) => {
    const place = places[item.placeId];
    if (!place) return;
    const cost = itemCost(item, place);
    if (place.id === "jfk-departure") transit += cost;
    else if (!["flight", "hotel", "transit"].includes(place.type)) activity += cost;
  });
  for (let index = 0; index < day.items.length - 1; index += 1) {
    const from = places[day.items[index].placeId];
    const to = places[day.items[index + 1].placeId];
    if (!from || !to || from.id === "statue-liberty" || to.id === "jfk-departure") continue;
    if (from.id === "jfk-arrival") { transit += 100; continue; }
    if (milesBetween(from.coords, to.coords) >= 0.65) transit += 6;
  }
  return { activity, transit, total: activity + transit };
}
function photoSrc(src) {
  if (!src) return `${import.meta.env.BASE_URL}images/broadway.jpg`;
  if (/^https?:/.test(src)) return src;
  return `${import.meta.env.BASE_URL}${src.replace(/^\//, "")}`;
}

function Image({ src, alt = "", className = "", priority = false }) {
  const fallback = `${import.meta.env.BASE_URL}images/broadway.jpg`;
  return <img className={className} src={photoSrc(src)} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" onError={(event) => { if (event.currentTarget.src !== fallback) event.currentTarget.src = fallback; }} />;
}

function IconButton({ label, children, className = "", ...props }) {
  return <button type="button" className={`icon-button ${className}`} aria-label={label} title={label} {...props}>{children}</button>;
}

function getResolvedPlaces(plan) {
  const musical = MUSICALS.find((entry) => entry.id === plan.selectedMusical) || MUSICALS[0];
  const selectedHotel = HOTELS.find((entry) => entry.id === plan.selectedHotel)
    || HOTELS.find((entry) => entry.id === "hie-midtown-west")
    || HOTELS.find((entry) => entry.group === "city");
  const hotelPlace = (id, shortName) => ({
    ...PLACES[id],
    name: selectedHotel?.name || PLACES[id]?.name,
    shortName,
    area: selectedHotel?.area || PLACES[id]?.area,
    coords: selectedHotel?.coords || PLACES[id]?.coords,
    address: selectedHotel?.address || PLACES[id]?.address,
    image: selectedHotel?.image || PLACES[id]?.image,
    imageAlt: `${selectedHotel?.name || "선택한 호텔"} 실제 모습`,
    imageCredit: selectedHotel?.imageCredit || PLACES[id]?.imageCredit,
    description: id === "midtown-hotel"
      ? `${selectedHotel?.name || "선택한 호텔"}에서 여섯 밤을 머무는 구성입니다. 호텔을 바꾸면 일정과 지도에 표시되는 숙소 위치도 함께 바뀝니다.`
      : `${selectedHotel?.name || "선택한 호텔"}에서 쉬거나 짐을 찾는 시간입니다. 현재 선택한 객실과 숙소 위치가 지도에 반영됩니다.`,
  });
  return {
    ...PLACES,
    ...(plan.customPlaces || {}),
    "midtown-hotel": hotelPlace("midtown-hotel", `${selectedHotel?.name || "호텔"} · 체크인`),
    "hotel-rest": hotelPlace("hotel-rest", `${selectedHotel?.name || "호텔"} · 휴식`),
    "hotel-bags": hotelPlace("hotel-bags", `${selectedHotel?.name || "호텔"} · 짐 찾기`),
    broadway: {
      ...PLACES.broadway,
      name: `Broadway Musical · ${musical.title}`,
      shortName: `Broadway · ${musical.title}`,
      costUsd: musical.budgetUsd,
      costNote: `권장 좌석 2인 예산 · ${musical.prices[0][1]} / ${musical.prices.at(-1)[1]}`,
      hours: `${musical.schedule} · ${musical.runtime}`,
      reservation: musical.seat,
      description: musical.verdict,
      officialUrl: musical.url,
    },
  };
}

function DayRail({ days, active, onChange }) {
  const railRef = useRef(null);
  useEffect(() => {
    railRef.current?.querySelector(`[data-day="${active}"]`)?.scrollIntoView({ block: "nearest", inline: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [active]);
  return (
    <nav className="day-rail" aria-label="여행 날짜">
      <IconButton label="이전 날짜" onClick={() => onChange(Math.max(0, active - 1))}><CaretLeft /></IconButton>
      <div className="day-strip" ref={railRef} role="tablist">
        {days.map((day, index) => <button key={day.id} data-day={index} type="button" role="tab" aria-selected={active === index} className="day-tab" onClick={() => onChange(index)}><span>{day.dayCode}</span><strong>{day.dateLabel.replace(/^\d+\//, "SEP ")}</strong><small>{day.title}</small></button>)}
      </div>
      <IconButton label="다음 날짜" onClick={() => onChange(Math.min(days.length - 1, active + 1))}><CaretRight /></IconButton>
    </nav>
  );
}

function TransitConnector({ from, to }) {
  const [open, setOpen] = useState(false); const options = routeAdvice(from, to);
  if (!to) return null;
  return (
    <div className="transit-connector">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}><span className="connector-line" /><Train />{options[0]?.detail}<CaretDown className={open ? "turn" : ""} /></button>
      {open && <div className="transit-options">{options.map(({ icon: ChoiceIcon, name, detail }) => <div key={name}><ChoiceIcon /><strong>{name}</strong><span>{detail}</span></div>)}</div>}
    </div>
  );
}

function TimelineItem({ item, place, index, previousTime, nextPlace, selected, expanded, completed, favorite, rate, onSelect, onExpand, onUpdate, onMove, onRemove, onToggleDone, onToggleFavorite, onOpenDetail }) {
  const MetaIcon = TYPE_ICONS[place.type] || MapPin;
  const cost = itemCost(item, place);
  return (
    <li className={`timeline-stop ${selected ? "is-selected" : ""} ${completed ? "is-complete" : ""}`} data-tone={TYPE_META[place.type]?.tone || "sight"}>
      <article>
        <button type="button" className="stop-lead" onClick={() => { onSelect(); onExpand(); }} aria-expanded={expanded}>
          <span className="stop-number">{completed ? <Check weight="bold" /> : index + 1}</span>
          <Image src={place.image} alt="" className="stop-image" />
          <span className="stop-copy">
            <span className="stop-kicker"><MetaIcon />{TYPE_META[place.type]?.label} · {place.area}</span>
            <strong>{place.shortName}</strong>
            <small>{item.note || place.description}</small>
          </span>
          <span className="stop-essential"><b>{item.time}</b><em>{money(cost)} · {won(cost, rate)}</em></span>
        </button>
        <div className="stop-tools">
          <IconButton label={completed ? "완료 표시 해제" : "완료 표시"} aria-pressed={completed} onClick={onToggleDone}><CheckCircle weight={completed ? "fill" : "regular"} /></IconButton>
          <IconButton label={favorite ? "즐겨찾기 해제" : "즐겨찾기에 추가"} aria-pressed={favorite} onClick={onToggleFavorite}><Heart weight={favorite ? "fill" : "regular"} /></IconButton>
          <IconButton label="한 순서 위로" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp /></IconButton>
          <IconButton label="한 순서 아래로" disabled={!nextPlace} onClick={() => onMove(1)}><ArrowDown /></IconButton>
          <IconButton label="일정에서 빼기" onClick={onRemove}><Trash /></IconButton>
        </div>
        {expanded && <div className="stop-expanded">
          <div className="quick-edit"><label><Clock />시각<input type="time" value={item.time} onChange={(event) => onUpdate({ time: event.target.value })} /></label><label><CurrencyDollar />2인 예상<input type="number" min="0" step="1" value={cost} onChange={(event) => onUpdate({ costUsd: Number(event.target.value) })} /></label></div>
          {previousTime && item.time < previousTime && <p className="time-warning"><Warning /> 앞 일정보다 이른 시각입니다. 시각을 다시 확인해 주세요.</p>}
          <p>{place.description}</p>
          <div className="expanded-actions"><button type="button" onClick={onOpenDetail}><BookOpen /> 사진과 상세 정보</button><button type="button" onClick={() => writeClipboard(`${place.name}\n${item.time} · ${place.address}\n${place.reservation || "예약 불필요"}`)}><Copy /> 예약 메모 복사</button></div>
        </div>}
      </article>
      <TransitConnector from={place} to={nextPlace} />
    </li>
  );
}

function CandidateCard({ place, rate, favorite, onAdd, onDetail, onFavorite }) {
  return <article className="candidate-card">
    <button type="button" className="candidate-photo" onClick={onDetail}><Image src={place.image} alt={`${place.shortName} 분위기`} /><span>{place.area}</span></button>
    <div><button type="button" className="candidate-title" onClick={onDetail}>{place.shortName}</button><p>{place.description}</p><span>{money(place.costUsd)} · {won(place.costUsd, rate)}</span></div>
    <div className="candidate-actions"><IconButton label={favorite ? "즐겨찾기 해제" : "즐겨찾기에 추가"} onClick={onFavorite}><Heart weight={favorite ? "fill" : "regular"} /></IconButton><button type="button" onClick={onAdd}><Plus /> 일정에 추가</button></div>
  </article>;
}

function NavigationDrawer({ active, places, favorites, onNavigate, onClose, onGuide }) {
  const counts = Object.fromEntries(EXPLORE_SECTIONS.map((section) => [
    section.id,
    section.id === "overview" || section.id === "schedule" || section.id === "hotels"
      ? null
      : Object.values(places).filter((place) => !["flight", "hotel", "transit"].includes(place.type) && placeInSection(place, section.id)).length,
  ]));
  return <div className="nav-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="nav-drawer" role="dialog" aria-modal="true" aria-labelledby="nav-title">
      <header><div><span className="eyebrow">NEW YORK · SEP 2026</span><h2 id="nav-title">여행 가이드</h2><p>일정과 장소를 원하는 방식으로 살펴보세요.</p></div><IconButton label="메뉴 닫기" onClick={onClose}><X /></IconButton></header>
      <div className="nav-quick-links"><button type="button" onClick={() => onGuide("hotels")}><Bed /><span><strong>호텔</strong><small>가격순 11곳</small></span></button><button type="button" onClick={() => onGuide("shows")}><Ticket /><span><strong>공연·투어</strong><small>공연 6편 비교</small></span></button></div>
      <nav aria-label="여행 가이드 메뉴">
        {EXPLORE_SECTIONS.map(({ id, label, caption, icon: MenuIcon, code }) => <button type="button" key={id} className={active === id ? "active" : ""} aria-current={active === id ? "page" : undefined} onClick={() => id === "hotels" ? onGuide("hotels") : onNavigate(id)}><span className="menu-code">{code}</span><MenuIcon /><span><strong>{label}</strong><small>{caption}</small></span>{counts[id] != null && <em>{counts[id]}</em>}<CaretRight /></button>)}
      </nav>
      <div className="nav-tools"><button type="button" onClick={() => onGuide("shows")}><Ticket />공연·투어</button><button type="button" onClick={() => onGuide("events")}><Sparkle />기간 한정</button><button type="button" onClick={() => onGuide("budget")}><Wallet />전체 예산</button><button type="button" onClick={() => onNavigate("saved")}><Heart />저장한 장소 <span>{favorites.length}</span></button></div>
    </aside>
  </div>;
}

function OverviewView({ days, places, dayBudgets, rate, onOpenDay, onDetail }) {
  const totalStops = days.reduce((sum, entry) => sum + entry.items.length, 0);
  const total = dayBudgets.reduce((sum, entry) => sum + entry.total, 0);
  return <main className="overview-workspace" id="itinerary">
    <header className="workspace-heading"><div><span className="eyebrow">FULL ITINERARY · 7 DAYS</span><h1>뉴욕에서 보내는<br />일곱 개의 장면</h1><p>공항 도착부터 출국까지, 날짜별 동선과 예상 경비를 한 화면에서 확인할 수 있습니다.</p></div><dl><div><dt>방문 장소</dt><dd>{totalStops}곳</dd></div><div><dt>현지 예상 경비</dt><dd>{money(total)}</dd><small>{won(total, rate)} · 숙박 제외</small></div></dl></header>
    <div className="overview-days">{days.map((entry, dayIndex) => <article key={entry.id} className="overview-day">
      <button type="button" className="overview-day-lead" onClick={() => onOpenDay(dayIndex)}><Image src={entry.hero} alt="" /><span><small>{entry.dayCode} · {entry.dateLabel}</small><strong>{entry.title}</strong><em>{entry.area}</em></span><span className="overview-cost">{money(dayBudgets[dayIndex].total)}<CaretRight /></span></button>
      <ol>{entry.items.map((item) => { const place = places[item.placeId]; if (!place) return null; return <li key={item.id}><button type="button" onClick={() => onDetail(place.id)}><time>{item.time}</time><Image src={place.image} alt="" /><span><strong>{place.shortName}</strong><small>{TYPE_META[place.type]?.label} · {place.area}</small></span><em>{money(itemCost(item, place))}</em></button></li>; })}</ol>
    </article>)}</div>
  </main>;
}

function ExploreCard({ place, days, scheduledDays, rate, favorite, onAdd, onDetail, onFavorite }) {
  const firstAvailable = Math.max(1, days.findIndex((_, index) => index > 0 && !scheduledDays.includes(index)));
  const [targetDay, setTargetDay] = useState(firstAvailable);
  const alreadyAdded = scheduledDays.includes(Number(targetDay));
  return <article className="explore-card">
    <button type="button" className="explore-image" onClick={onDetail}><Image src={place.image} alt={`${place.shortName} 전경`} /><span>{place.area}</span>{place.must && <b>꼭 가고 싶은 곳</b>}</button>
    <div className="explore-copy"><div><span>{TYPE_META[place.type]?.label || "장소"}</span><button type="button" onClick={onDetail}>{place.shortName}</button></div><p>{place.description}</p><dl><div><dt>예상 금액</dt><dd>{money(place.costUsd)} · {won(place.costUsd, rate)}</dd></div><div><dt>운영</dt><dd>{place.hours}</dd></div></dl></div>
    <div className="explore-actions"><IconButton label={favorite ? "즐겨찾기 해제" : "즐겨찾기에 추가"} aria-pressed={favorite} onClick={onFavorite}><Heart weight={favorite ? "fill" : "regular"} /></IconButton><label><span className="sr-only">추가할 날짜</span><select value={targetDay} onChange={(event) => setTargetDay(Number(event.target.value))}>{days.map((entry, index) => <option key={entry.id} value={index}>{entry.dayCode} · {entry.dateLabel}{scheduledDays.includes(index) ? " · 추가됨" : ""}</option>)}</select></label><button type="button" disabled={alreadyAdded} onClick={() => onAdd(place.id, Number(targetDay))}>{alreadyAdded ? <Check /> : <Plus />}{alreadyAdded ? "일정에 있음" : "이 날짜에 추가"}</button></div>
  </article>;
}

function ExploreView({ section, places, plan, rate, onAdd, onDetail, onFavorite }) {
  const copy = EXPLORE_COPY[section] || EXPLORE_COPY.sights;
  const visible = Object.values(places)
    .filter((place) => !["flight", "hotel", "transit"].includes(place.type))
    .filter((place) => placeInSection(place, section))
    .filter((place) => section !== "saved" || plan.favorites.includes(place.id))
    .sort((a, b) => Number(Boolean(b.must)) - Number(Boolean(a.must)) || a.area.localeCompare(b.area, "ko") || a.shortName.localeCompare(b.shortName, "ko"));
  return <main className="explore-workspace" id="itinerary">
    <header className="workspace-heading"><div><span className="eyebrow">{copy[0]} · {visible.length} PLACES</span><h1>{copy[1]}</h1><p>{copy[2]}</p></div><div className="workspace-note"><Plus /><span><strong>날짜를 선택해 일정에 추가</strong><small>다른 기기에도 몇 초 안에 반영됩니다.</small></span></div></header>
    {visible.length ? <div className="explore-list">{visible.map((place) => <ExploreCard key={place.id} place={place} days={plan.days} scheduledDays={plan.days.flatMap((entry, index) => entry.items.some((item) => item.placeId === place.id) ? [index] : [])} rate={rate} favorite={plan.favorites.includes(place.id)} onAdd={onAdd} onDetail={() => onDetail(place.id)} onFavorite={() => onFavorite(place.id)} />)}</div> : <div className="explore-empty"><Heart /><h2>아직 저장한 장소가 없습니다.</h2><p>맛집이나 관광명소에서 하트 버튼을 누르면 이곳에 모입니다.</p></div>}
  </main>;
}

function DetailSheet({ place, days, scheduledDays, rate, favorite, onAdd, onFavorite, onClose }) {
  const [targetDay, setTargetDay] = useState(() => Math.max(1, days.findIndex((_, index) => index > 0 && !scheduledDays.includes(index))));
  if (!place) return null;
  const MetaIcon = TYPE_ICONS[place.type] || MapPin;
  const alreadyAdded = scheduledDays.includes(Number(targetDay));
  return <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="detail-sheet" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <div className="sheet-handle" aria-hidden="true" />
      <Image src={place.image} alt={`${place.name} 전경`} className="detail-hero" />
      <header><div><span className="eyebrow"><MetaIcon />{TYPE_META[place.type]?.label} · {place.area}</span><h2 id="detail-title">{place.name}</h2><p>{place.address}</p></div><IconButton label="닫기" onClick={onClose}><X /></IconButton></header>
      <div className="detail-body">
        <div className="detail-facts"><div><Clock /><span>운영 시간<strong>{place.hours}</strong></span></div><div><Wallet /><span>2인 예상 금액<strong>{money(place.costUsd)} · {won(place.costUsd, rate)}</strong><small>{place.costNote}</small></span></div><div><Ticket /><span>예약<strong>{place.reservation || "예약 불필요"}</strong></span></div></div>
        <p className="detail-description">{place.description}</p>
        <section className="detail-access"><h3>가는 방법</h3><p><MapPin />{place.access || ACCESS_GUIDE[place.id] || `${place.address}. 현재 일정에 맞춘 예상 이동 시간은 각 일정 사이의 ‘이동 안내’에서 확인할 수 있습니다.`}</p></section>
        {place.gallery?.length > 0 && <section><h3>대표 작품과 공간</h3><div className="media-grid">{place.gallery.map((entry) => <figure key={entry.title}><Image src={entry.image} alt={entry.title} /><figcaption><strong>{entry.title}</strong><span>{entry.caption}</span></figcaption></figure>)}</div></section>}
        {place.menu?.length > 0 && <section><h3>대표 메뉴</h3><div className="media-grid">{place.menu.map((entry) => <figure key={entry.name}><Image src={entry.image} alt={entry.name} /><figcaption><strong>{entry.name} · {entry.price}</strong><span>{entry.note}</span></figcaption></figure>)}</div></section>}
        {place.highlights?.length > 0 && <section><h3>이곳에서 볼 것</h3><div className="highlight-list">{place.highlights.map((entry) => <div key={entry.title}><strong>{entry.title}</strong><p>{entry.text}</p></div>)}</div></section>}
        {place.tips?.length > 0 && <section><h3>여행 팁</h3><ul className="tips-list">{place.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul></section>}
        {place.google && <section className="review-panel"><div><Star weight="fill" /><strong>{place.google.score}</strong><span>Google · {place.google.volume}</span></div>{place.google.summary.map((text) => <p key={text}>{text}</p>)}<small>{place.google.checked}</small></section>}
        <div className="sheet-actions"><button type="button" onClick={onFavorite}><Heart weight={favorite ? "fill" : "regular"} />{favorite ? "즐겨찾기에 저장됨" : "즐겨찾기에 추가"}</button>{place.officialUrl && <a href={place.officialUrl} target="_blank" rel="noreferrer">공식 정보 확인 <ArrowSquareOut /></a>}</div>
        {place.imageCredit && <p className="photo-credit">사진: {place.imageCredit}</p>}
      </div>
      {!['flight', 'hotel', 'transit'].includes(place.type) && <div className="detail-add-bar"><label><span>추가할 날짜</span><select value={targetDay} onChange={(event) => setTargetDay(Number(event.target.value))}>{days.map((entry, index) => <option key={entry.id} value={index}>{entry.dayCode} · {entry.dateLabel}{scheduledDays.includes(index) ? " · 일정에 있음" : ""}</option>)}</select></label><button type="button" disabled={alreadyAdded} onClick={() => onAdd(place.id, Number(targetDay))}>{alreadyAdded ? <Check /> : <Plus />}{alreadyAdded ? "이미 추가됨" : "선택한 날짜에 추가"}</button></div>}
    </section>
  </div>;
}

function LibrarySheet({ places, currentIds, rate, favorites, onAdd, onDetail, onFavorite, onClose, onAddCustom }) {
  const [type, setType] = useState("all");
  const [customOpen, setCustomOpen] = useState(false);
  const visible = Object.values(places).filter((place) => !currentIds.includes(place.id) && !["flight", "hotel", "transit"].includes(place.type) && (type === "all" || place.type === type));
  return <div className="sheet-backdrop"><section className="library-sheet" role="dialog" aria-modal="true" aria-label="장소 후보">
    <header><div><span className="eyebrow">PLACE LIBRARY</span><h2>오늘 일정에 더할 장소</h2></div><IconButton label="닫기" onClick={onClose}><X /></IconButton></header>
    <div className="type-tabs" role="tablist">{[["all", "전체"], ["sight", "관광"], ["culture", "문화"], ["food", "맛집"], ["cafe", "카페"], ["shopping", "쇼핑"]].map(([key, label]) => <button type="button" key={key} aria-selected={type === key} onClick={() => setType(key)}>{label}</button>)}</div>
    <div className="library-grid">{visible.map((place) => <CandidateCard key={place.id} place={place} rate={rate} favorite={favorites.includes(place.id)} onAdd={() => onAdd(place.id)} onDetail={() => onDetail(place.id)} onFavorite={() => onFavorite(place.id)} />)}</div>
    <button type="button" className="custom-toggle" onClick={() => setCustomOpen(!customOpen)}><Plus /> 목록에 없는 장소를 직접 추가</button>
    {customOpen && <CustomPlaceForm onSubmit={onAddCustom} />}
  </section></div>;
}

function CustomPlaceForm({ onSubmit }) {
  const [form, setForm] = useState({ name: "", area: "", address: "", time: "15:00", cost: 0, type: "sight", lat: "40.754", lng: "-73.984" });
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return <form className="custom-form" onSubmit={(event) => { event.preventDefault(); if (form.name.trim()) onSubmit(form); }}>
    <label>장소 이름<input required value={form.name} onChange={(event) => change("name", event.target.value)} /></label><label>동네<input value={form.area} onChange={(event) => change("area", event.target.value)} /></label><label className="wide">주소<input value={form.address} onChange={(event) => change("address", event.target.value)} /></label><label>시간<input type="time" value={form.time} onChange={(event) => change("time", event.target.value)} /></label><label>2인 예상 $<input type="number" min="0" value={form.cost} onChange={(event) => change("cost", event.target.value)} /></label><label>분류<select value={form.type} onChange={(event) => change("type", event.target.value)}><option value="sight">관광</option><option value="culture">문화</option><option value="food">식사</option><option value="cafe">카페</option><option value="shopping">쇼핑</option></select></label><label>위도<input type="number" step="any" value={form.lat} onChange={(event) => change("lat", event.target.value)} /></label><label>경도<input type="number" step="any" value={form.lng} onChange={(event) => change("lng", event.target.value)} /></label><button type="submit"><Plus /> 일정에 추가</button>
  </form>;
}

function hotelNightlyRange(hotel, room) {
  const extras = Number(hotel.mandatoryFeePerNight || 0) + Number(hotel.breakfastExtraPerNight || 0);
  return [room.nightly[0] + extras, room.nightly[1] + extras];
}

function HotelOption({ hotel, selected, selectedRoom, rate, expanded, onToggle, onChoose }) {
  const firstRange = hotelNightlyRange(hotel, hotel.roomTypes[0]);
  return <article className={`hotel-option ${selected ? "selected" : ""}`}>
    <button type="button" className="hotel-summary" onClick={onToggle} aria-expanded={expanded}>
      <Image src={hotel.image} alt={`${hotel.name} 실제 모습`} />
      <span><small>{hotel.area}</small><strong>{hotel.name}</strong><em>{hotel.priceLabel} · 세금 등 포함 예상 {money(firstRange[0])}부터</em><b>{selected ? "지도에 표시 중" : hotel.breakfastExtraPerNight ? "조식 비용 반영" : "무료 조식 포함"}</b></span>
      <CaretDown className={expanded ? "turn" : ""} />
    </button>
    {expanded && <div className="hotel-detail"><p>{hotel.why}</p><div className="breakfast-note"><Coffee /><span><strong>조식·이동 조건</strong>{hotel.breakfast}</span></div><small>{hotel.rating}</small><small>{hotel.note}</small><div className="room-options">{hotel.roomTypes.map((room, index) => { const nightly = hotelNightlyRange(hotel, room); return <button type="button" key={room.name} className={selected && selectedRoom === index ? "selected" : ""} onClick={() => onChoose(index)}><strong>{room.name}</strong><span>조식·세금·필수요금 포함 1박 예상 {money(nightly[0])}–{money(nightly[1])}</span><small>검색 당시 표시 요금 {room.shown} · {won(nightly[0], rate)}부터</small></button>; })}</div><a className="hotel-source" href={hotel.url} target="_blank" rel="noreferrer">공식 호텔 정보 <ArrowSquareOut /></a>{hotel.imageCredit && <span className="hotel-credit">사진: {hotel.imageCredit}</span>}</div>}
  </article>;
}

function GuidePanel({ mode, initialHotelGroup = "city", plan, setPlan, rate, dayBudgets, onClose }) {
  const lowestAllIn = (hotel) => hotelNightlyRange(hotel, hotel.roomTypes[0])[0];
  const cityHotels = HOTELS.filter((hotel) => hotel.group === "city").sort((a, b) => lowestAllIn(a) - lowestAllIn(b));
  const airportHotels = HOTELS.filter((hotel) => hotel.group === "airport").sort((a, b) => lowestAllIn(a) - lowestAllIn(b));
  const [hotelGroup, setHotelGroup] = useState(initialHotelGroup);
  const [expandedHotel, setExpandedHotel] = useState(() => initialHotelGroup === "airport" ? plan.selectedExtensionHotel || airportHotels[0]?.id : plan.selectedHotel || cityHotels[0]?.id);
  const selectedHotel = HOTELS.find((hotel) => hotel.id === plan.selectedHotel) || cityHotels.find((hotel) => hotel.id === "hie-midtown-west") || cityHotels[0];
  const hotelRoom = selectedHotel.roomTypes[plan.selectedRoom] || selectedHotel.roomTypes[0];
  const hotelRange = hotelNightlyRange(selectedHotel, hotelRoom).map((value) => value * TRIP_META.nights);
  const extensionHotel = HOTELS.find((hotel) => hotel.id === plan.selectedExtensionHotel);
  const extensionRoom = extensionHotel?.roomTypes[plan.selectedExtensionRoom || 0] || extensionHotel?.roomTypes[0];
  const extensionRange = extensionRoom ? hotelNightlyRange(extensionHotel, extensionRoom).map((value) => value * 2) : [0, 0];
  const activity = dayBudgets.reduce((sum, value) => sum + value.activity, 0);
  const transit = dayBudgets.reduce((sum, value) => sum + value.transit, 0);
  const tripRange = [activity + transit + hotelRange[0] + extensionRange[0], activity + transit + hotelRange[1] + extensionRange[1]];
  return <div className="sheet-backdrop"><section className="guide-sheet" role="dialog" aria-modal="true" aria-labelledby="guide-title"><header><div><span className="eyebrow">TRIP NOTES</span><h2 id="guide-title">{mode === "hotels" ? "숙소 비교" : mode === "shows" ? "공연과 투어" : mode === "budget" ? "전체 예상 경비" : "여행 기간의 특별한 장면"}</h2></div><IconButton label="닫기" onClick={onClose}><X /></IconButton></header>
    {mode === "hotels" && <div className="hotel-list">
      <div className="hotel-group-switch" role="tablist" aria-label="호텔 지역"><button type="button" role="tab" aria-selected={hotelGroup === "city"} onClick={() => { setHotelGroup("city"); setExpandedHotel(selectedHotel.id); }}><Buildings />Manhattan 6박 <span>{cityHotels.length}</span></button><button type="button" role="tab" aria-selected={hotelGroup === "airport"} onClick={() => { setHotelGroup("airport"); setExpandedHotel(extensionHotel?.id || airportHotels[0]?.id); }}><AirplaneTilt />공항 근처 추가 2박 <span>{airportHotels.length}</span></button></div>
      {hotelGroup === "city" ? <><section className="hotel-group-heading"><span>MANHATTAN · 6 NIGHTS</span><h3>여행 동선에 맞는 호텔</h3><p>조식·세금·필수요금을 포함한 1박 예상 최저액 순입니다. 2인 1실, 9월 18일 체크인·9월 24일 체크아웃을 기준으로 조사했습니다. 취소 가능 여부와 회원 할인가는 예약 단계에서 다시 확인해 주세요. 일부 날짜에는 $200대 요금이 검색되지만 UN General Assembly 고위급 주간인 9/22–23에는 크게 오릅니다.</p></section>{cityHotels.map((hotel) => <HotelOption key={hotel.id} hotel={hotel} selected={selectedHotel.id === hotel.id} selectedRoom={plan.selectedRoom} rate={rate} expanded={expandedHotel === hotel.id} onToggle={() => setExpandedHotel((current) => current === hotel.id ? null : hotel.id)} onChoose={(index) => setPlan((current) => ({ ...current, selectedHotel: hotel.id, selectedRoom: index }))} />)}</> : <><section className="hotel-group-heading airport"><span>AIRPORT ACCESS · EXTRA 2 NIGHTS</span><h3>혼자 더 머무는 2박 · 공항 이동이 편한 호텔</h3><p>조식·세금·필수요금을 포함한 1박 예상 최저액 순입니다. Tennessee행 항공편의 출발 공항이 LGA인지 JFK인지 확인한 뒤 선택하세요. Manhattan을 계속 오간다면 Jamaica Station 인근이, 공항 이동을 우선한다면 JFK 또는 LGA 무료 셔틀 호텔이 편합니다. EWR 후보는 출발 공항 확정 뒤 별도로 비교하세요.</p>{extensionHotel && <button type="button" onClick={() => setPlan((current) => ({ ...current, selectedExtensionHotel: null, selectedExtensionRoom: 0 }))}><X /> 추가 체류 호텔 선택 해제</button>}</section>{airportHotels.map((hotel) => <HotelOption key={hotel.id} hotel={hotel} selected={extensionHotel?.id === hotel.id} selectedRoom={plan.selectedExtensionRoom || 0} rate={rate} expanded={expandedHotel === hotel.id} onToggle={() => setExpandedHotel((current) => current === hotel.id ? null : hotel.id)} onChoose={(index) => setPlan((current) => ({ ...current, selectedExtensionHotel: hotel.id, selectedExtensionRoom: index }))} />)}</>}
    </div>}
    {mode === "shows" && <>
      <section className="show-section">
        <h3>Broadway 후보 · 9/22 화요일</h3>
        <div className="show-grid">{MUSICALS.map((show, index) => (
          <article key={show.id} className={plan.selectedMusical === show.id ? "selected" : ""}>
            <span>0{index + 1}</span><h4>{show.title}</h4><p>{show.fit}</p>
            <dl><div><dt>공연</dt><dd>{show.schedule}</dd></div><div><dt>러닝타임</dt><dd>{show.runtime}</dd></div><div><dt>권장 좌석</dt><dd>{show.seat}</dd></div></dl>
            <div className="price-lines">{show.prices.map(([label, price]) => <div key={label}><span>{label}</span><strong>{price}</strong></div>)}</div>
            <p>{show.verdict}</p>
            <button type="button" onClick={() => setPlan((current) => ({
              ...current,
              selectedMusical: show.id,
              days: current.days.map((entry) => ({ ...entry, items: entry.items.map((item) => item.placeId === "broadway" ? { ...item, costUsd: show.budgetUsd } : item) })),
            }))}>{plan.selectedMusical === show.id ? <Check /> : <Ticket />}{plan.selectedMusical === show.id ? "일정에 선택됨" : "이 공연으로 바꾸기"}</button>
          </article>
        ))}</div>
      </section>
      <section className="tour-list"><h3>편하게 둘러보는 투어</h3>{TOUR_OPTIONS.map((tour) => <article key={tour.title}><div><h4>{tour.title}</h4><p>{tour.fit}</p></div><strong>{tour.price}</strong><span>{tour.time}</span><small>{tour.caution}</small></article>)}</section>
    </>}
      {mode === "budget" && <div className="budget-panel"><div className="fx-edit"><label>적용 환율 · $1 = ₩<input type="number" min="900" max="2000" value={rate} onChange={(event) => setPlan((current) => ({ ...current, fxRate: Number(event.target.value) || FX_RATE }))} /></label><small>2026. 9. 4 종가 부근을 둥글게 적용했습니다.</small></div><div className="budget-total"><span>{extensionHotel ? "부부 6박 + 1인 추가 2박 예상" : "2인 총 예상 경비"}</span><strong>{money(tripRange[0])}–{money(tripRange[1])}</strong><em>{won(tripRange[0], rate)}–{won(tripRange[1], rate)}</em><small>항공권·쇼핑 제외 · 숙소는 조사된 1박 최저·최고 요금을 전체 숙박일에 적용한 보수적 범위</small></div><div className="budget-table"><div className="head"><span>날짜</span><span>관광·식사</span><span>예상 교통비</span><span>합계</span></div>{plan.days.map((day, index) => <div key={day.id}><span>{day.dateLabel}</span><span>{money(dayBudgets[index].activity)}</span><span>{money(dayBudgets[index].transit)}</span><strong>{money(dayBudgets[index].total)}<small>{won(dayBudgets[index].total, rate)}</small></strong></div>)}<div><span>도심 숙소 · 6박</span><span>{selectedHotel.name}<small>{hotelRoom.name}</small></span><span>조식·세금·필수요금 포함 보수적 범위</span><strong>{money(hotelRange[0])}–{money(hotelRange[1])}<small>{won(hotelRange[0], rate)}–{won(hotelRange[1], rate)}</small></strong></div>{extensionHotel && <div><span>추가 체류 · 2박</span><span>{extensionHotel.name}<small>{extensionRoom.name}</small></span><span>1인 객실 · 조식·세금·필수요금 포함</span><strong>{money(extensionRange[0])}–{money(extensionRange[1])}<small>{won(extensionRange[0], rate)}–{won(extensionRange[1], rate)}</small></strong></div>}</div></div>}
    {mode === "events" && <div className="events-layout"><section><h3>날짜가 맞는 행사</h3>{SPECIAL_EVENTS.map((event) => <article key={`${event.date}-${event.title}`}><time>{event.date}</time><div><h4>{event.title}</h4><span>{event.place}</span><p>{event.note}</p></div><b>{event.status}</b></article>)}</section><section><h3>놀이공원은 어떨까?</h3>{THEME_PARKS.map((park) => <article key={park.name}><div><h4>{park.name}</h4><span>{park.distance}</span><p>{park.verdict}</p></div><strong>{park.price}</strong></article>)}</section><section><h3>출발 전에 다시 확인</h3>{PRACTICAL_NOTES.map((note) => <article key={note.title}><Info /><div><h4>{note.title}</h4><p>{note.text}</p></div></article>)}</section></div>}
  </section></div>;
}

export function App() {
  const { plan, setPlan, resetPlan, shareId, sync } = useSharedPlan();
  const params = new URLSearchParams(window.location.search);
  const [activeDay, setActiveDay] = useState(() => Math.min(6, Math.max(0, Number(params.get("day") || 1) - 1)));
  const [selectedId, setSelectedId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [guide, setGuide] = useState(null);
  const [hotelInitialGroup, setHotelInitialGroup] = useState("city");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileView, setMobileView] = useState("schedule");
  const [toast, setToast] = useState("");
  const places = useMemo(() => getResolvedPlaces(plan), [plan.selectedMusical, plan.selectedHotel, plan.customPlaces]);
  const day = plan.days[activeDay] || plan.days[0];
  const rate = plan.fxRate || FX_RATE;
  const dayBudgets = useMemo(() => plan.days.map((entry) => dayBudget(entry, places)), [plan.days, places]);
  const selectedItem = day.items.find((item) => item.id === selectedId) || day.items[0];
  const selectedPlace = places[selectedItem?.placeId];
  const candidatePlaces = day.candidateIds.map((id) => places[id]).filter(Boolean).filter((place) => !day.items.some((item) => item.placeId === place.id));

  useEffect(() => { setSelectedId(day.items[0]?.id || null); setExpandedId(null); const url = new URL(location.href); url.searchParams.set("day", String(activeDay + 1)); history.replaceState({}, "", url); }, [activeDay, day.id]);
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(""), 2400); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { document.body.style.overflow = detailId || guide || libraryOpen || menuOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [detailId, guide, libraryOpen, menuOpen]);
  useEffect(() => {
    const closeTopLayer = (event) => {
      if (event.key !== "Escape") return;
      if (detailId) setDetailId(null);
      else if (libraryOpen) setLibraryOpen(false);
      else if (guide) setGuide(null);
      else if (menuOpen) setMenuOpen(false);
    };
    window.addEventListener("keydown", closeTopLayer);
    return () => window.removeEventListener("keydown", closeTopLayer);
  }, [detailId, guide, libraryOpen, menuOpen]);

  const updateDay = (updater) => setPlan((current) => ({ ...current, days: current.days.map((entry, index) => index === activeDay ? updater(entry) : entry) }));
  const updateItem = (id, changes) => updateDay((current) => ({ ...current, items: current.items.map((item) => item.id === id ? { ...item, ...changes } : item) }));
  const moveItem = (index, delta) => updateDay((current) => {
    const items = [...current.items]; const target = index + delta;
    if (target < 0 || target >= items.length) return current;
    const source = items[index]; const destination = items[target];
    items[index] = { ...destination, time: source.time };
    items[target] = { ...source, time: destination.time };
    return { ...current, items };
  });
  const removeItem = (item) => updateDay((current) => ({ ...current, items: current.items.filter((entry) => entry.id !== item.id), candidateIds: Array.from(new Set([...current.candidateIds, item.placeId])) }));
  const addPlaceToDay = (placeId, targetDay = activeDay, time) => {
    const place = places[placeId];
    const suggestedTime = time || (place?.type === "food" ? "12:30" : place?.type === "cafe" ? "10:30" : "15:00");
    if (plan.days[targetDay]?.items.some((item) => item.placeId === placeId)) {
      setToast(`${place?.shortName || "장소"} · ${plan.days[targetDay].dayCode} 일정에 이미 있습니다.`);
      return;
    }
    setPlan((current) => ({
      ...current,
      days: current.days.map((entry, index) => index === targetDay ? {
        ...entry,
        items: [...entry.items, { id: `${placeId}-${Date.now()}`, placeId, time: suggestedTime, costUsd: place?.costUsd || 0, note: "" }].sort((a, b) => a.time.localeCompare(b.time)),
        candidateIds: entry.candidateIds.filter((id) => id !== placeId),
      } : entry),
    }));
    setLibraryOpen(false);
    setToast(`${place?.shortName || "장소"} · ${plan.days[targetDay]?.dateLabel || "선택한 날짜"} 일정에 추가했습니다.`);
  };
  const addPlace = (placeId, time = "15:00") => { addPlaceToDay(placeId, activeDay, time); setMobileView("schedule"); };
  const addCustom = (form) => {
    const id = `custom-${Date.now()}`; const place = { id, name: form.name.trim(), shortName: form.name.trim(), type: form.type, area: form.area || "New York", coords: [Number(form.lat), Number(form.lng)], address: form.address || "주소를 확인해 주세요", image: "images/broadway.jpg", imageAlt: "New York 거리", imageCredit: "사용자 추가 장소", description: "직접 추가한 장소입니다. 메모와 예상 비용을 일정에서 수정할 수 있습니다.", durationMin: 60, costUsd: Number(form.cost) || 0, costNote: "직접 입력한 2인 예상", hours: "방문 전 확인", reservation: "방문 전 확인", tips: ["주소와 영업시간을 방문 전에 확인합니다."], highlights: [] };
    setPlan((current) => ({ ...current, customPlaces: { ...(current.customPlaces || {}), [id]: place }, days: current.days.map((entry, index) => index === activeDay ? { ...entry, items: [...entry.items, { id: `${id}-item`, placeId: id, time: form.time, costUsd: place.costUsd, note: "" }] } : entry) })); setLibraryOpen(false); setMobileView("schedule"); setToast("직접 만든 장소를 추가했습니다.");
  };
  const toggleListValue = (key, value) => setPlan((current) => ({ ...current, [key]: current[key]?.includes(value) ? current[key].filter((entry) => entry !== value) : [...(current[key] || []), value] }));
  const changeDay = (index) => { setActiveDay(index); setMobileView("schedule"); };
  const share = async () => { await writeClipboard(location.href); setToast("공유 링크를 복사했습니다. 같은 링크를 열면 일정이 함께 바뀝니다."); };
  const openGuide = (mode) => { setMenuOpen(false); if (mode === "hotels") setHotelInitialGroup("city"); setGuide(mode); };
  const navigate = (view) => { setMenuOpen(false); setMobileView(view); };
  const catalogViews = new Set(["food", "sights", "museums", "nature", "culture", "shopping", "daytrip", "saved"]);
  const selectedHotel = HOTELS.find((hotel) => hotel.id === plan.selectedHotel) || HOTELS.find((hotel) => hotel.id === "hie-midtown-west") || HOTELS[0];
  const selectedExtensionHotel = HOTELS.find((hotel) => hotel.id === plan.selectedExtensionHotel);

  return <div className="app-shell" data-view={mobileView}>
    <a className="skip-link" href="#itinerary">일정으로 바로가기</a>
    <header className="topbar"><button type="button" className="top-menu-trigger" onClick={() => setMenuOpen(true)} aria-label="전체 메뉴 열기"><ListBullets /></button><div className="brand"><span>NYC / 2026</span><strong>{plan.title || TRIP_META.title}</strong></div><div className="trip-route" aria-label="여행 개요"><span><CalendarBlank />SEP 18</span><i /> <span><MapPin />NEW YORK</span><i /> <span><AirplaneTilt />SEP 25</span></div><nav className="utility-nav" aria-label="여행 도구"><button type="button" onClick={() => setMenuOpen(true)}><BookOpen />장소 가이드</button><button type="button" onClick={() => setGuide("hotels")}><Bed />호텔</button><button type="button" onClick={() => setGuide("shows")}><Ticket />공연·투어</button><button type="button" onClick={() => setGuide("budget")}><Wallet />예산</button></nav><button type="button" className="share-button" onClick={share}><ShareNetwork />공유<span className={`sync-dot ${sync.state}`} /> <small>{sync.message}</small></button></header>
    <section className="trip-overview"><div><span>ARRIVAL</span><strong>9/18 금 · 23:00</strong><small>JFK 도착 예정</small></div><div><span>SELECTED HOTEL</span><strong>{selectedHotel?.name || "호텔 선택 전"}</strong><small>6박 · 조식 조건 확인</small></div><div><span>DEPARTURE</span><strong>9/25 금 · 01:30</strong><small>9/24 20:30 호텔 출발</small></div><p><Warning /> 9/21–25 UN General Assembly 기간에는 Midtown East 차량 이동에 30–60분의 여유를 두세요.</p></section>
    <DayRail days={plan.days} active={activeDay} onChange={changeDay} />
    {mobileView === "overview" ? <OverviewView days={plan.days} places={places} dayBudgets={dayBudgets} rate={rate} onOpenDay={changeDay} onDetail={setDetailId} /> : catalogViews.has(mobileView) ? <ExploreView section={mobileView} places={places} plan={plan} rate={rate} onAdd={addPlaceToDay} onDetail={setDetailId} onFavorite={(id) => toggleListValue("favorites", id)} /> : <main className="planner" data-mobile-view={mobileView}>
      <aside className="day-journal mobile-candidates" aria-label="오늘의 사진과 후보 장소">
        <figure className="day-hero"><Image src={day.hero} alt={`${day.title} 대표 풍경`} priority /><figcaption><span>{day.dayCode} · {day.dateLabel}</span><h1>{day.title}</h1><p>{day.subtitle}</p></figcaption></figure>
        <div className="day-metrics"><div><span>2인 예상 경비</span><strong>{money(dayBudgets[activeDay].total)}</strong><small>{won(dayBudgets[activeDay].total, rate)} · 예상 교통비 포함</small></div><div><span>페이스</span><strong>{["도착만", "가벼움", "여유", "보통"][day.energy] || "보통"}</strong><small>{day.items.length}개 일정 · {day.area}</small></div></div>
        <section className="candidate-section"><header><div><span className="eyebrow">NEARBY EDITS</span><h2>이날 함께 들르기 좋은 곳</h2></div><button type="button" onClick={() => setLibraryOpen(true)}><Plus /> 모든 후보</button></header>{candidatePlaces.length ? candidatePlaces.map((place) => <CandidateCard key={place.id} place={place} rate={rate} favorite={plan.favorites.includes(place.id)} onAdd={() => addPlace(place.id)} onDetail={() => setDetailId(place.id)} onFavorite={() => toggleListValue("favorites", place.id)} />) : <p className="empty-copy">기본 후보를 모두 일정에 넣었습니다. 모든 후보에서 다른 장소를 선택할 수 있습니다.</p>}</section>
      </aside>

      <section className="itinerary" id="itinerary" aria-labelledby="day-title">
        <header className="itinerary-heading"><div><span className="eyebrow">{day.dayCode} · {day.dateLabel} · {day.area}</span><h2 id="day-title">{day.title}</h2><p>{day.subtitle}</p></div><button type="button" onClick={() => setLibraryOpen(true)}><Plus /> 장소 추가</button></header>
        <ol className="timeline">{day.items.map((item, index) => { const place = places[item.placeId]; if (!place) return null; const next = places[day.items[index + 1]?.placeId]; return <TimelineItem key={item.id} item={item} place={place} index={index} previousTime={day.items[index - 1]?.time} nextPlace={next} selected={selectedItem?.id === item.id} expanded={expandedId === item.id} completed={plan.completed.includes(item.id)} favorite={plan.favorites.includes(place.id)} rate={rate} onSelect={() => setSelectedId(item.id)} onExpand={() => setExpandedId(expandedId === item.id ? null : item.id)} onUpdate={(changes) => updateItem(item.id, changes)} onMove={(delta) => moveItem(index, delta)} onRemove={() => removeItem(item)} onToggleDone={() => toggleListValue("completed", item.id)} onToggleFavorite={() => toggleListValue("favorites", place.id)} onOpenDetail={() => setDetailId(place.id)} />; })}</ol>
        <details className="day-note"><summary><NotePencil /> 이날의 메모</summary><textarea value={plan.notes?.[day.id] || ""} onChange={(event) => setPlan((current) => ({ ...current, notes: { ...(current.notes || {}), [day.id]: event.target.value } }))} placeholder="예약 번호, 꼭 사고 싶은 것, 둘만의 메모를 적어 두세요." /></details>
      </section>

      <aside className="map-panel mobile-map" aria-label="오늘의 이동 지도"><div className="map-heading"><div><span className="eyebrow">LIVE ROUTE</span><h2>일정 순서와 호텔을 한 지도에서</h2></div><span>{day.items.length}곳</span></div><div className="map-frame"><RouteMap items={day.items} places={places} selectedId={selectedItem?.id} completed={plan.completed} hotels={[selectedHotel, ...(activeDay === plan.days.length - 1 && selectedExtensionHotel ? [selectedExtensionHotel] : [])].filter(Boolean)} onHotelSelect={(hotelMarkerId) => { setHotelInitialGroup(selectedExtensionHotel && hotelMarkerId.includes(selectedExtensionHotel.id) ? "airport" : "city"); setGuide("hotels"); }} onSelect={(id) => { setSelectedId(id); setExpandedId(id); }} /></div>{selectedPlace && <button type="button" className="map-selection" onClick={() => setDetailId(selectedPlace.id)}><Image src={selectedPlace.image} alt="" /><span><small>{selectedItem.time} · {selectedPlace.area}</small><strong>{selectedPlace.shortName}</strong><em>{money(itemCost(selectedItem, selectedPlace))} · 상세 보기</em></span><CaretRight /></button>}<div className="map-legend"><span><i className="must" />일정에 넣은 장소</span><span><i className="hotel" />선택한 호텔</span><span><i className="route" />방문 순서</span><small>경로선은 실제 도로 경로가 아니라 일정에 넣은 순서를 보여줍니다.</small></div></aside>
    </main>}

    <nav className="mobile-nav" aria-label="모바일 화면"><button type="button" onClick={() => setMenuOpen(true)}><ListBullets />메뉴</button><button type="button" aria-current={mobileView === "schedule" ? "page" : undefined} onClick={() => setMobileView("schedule")}><Clock />일자별</button><button type="button" aria-current={mobileView === "map" ? "page" : undefined} onClick={() => setMobileView("map")}><MapTrifold />지도</button><button type="button" aria-current={mobileView === "overview" ? "page" : undefined} onClick={() => setMobileView("overview")}><CalendarBlank />전체 계획</button></nav>

    <footer className="site-footer"><div><strong>확인 기준 {VERIFIED_AT}</strong><span>운영시간·가격·평점은 예약 직전 공식 페이지에서 다시 확인하세요.</span></div><details><summary>조사 출처 {SOURCES.length}개</summary><ul>{SOURCES.map(([label, url]) => <li key={url}><a href={url} target="_blank" rel="noreferrer">{label}</a></li>)}</ul></details><button type="button" onClick={() => { if (window.confirm("편집한 내용을 모두 지우고 처음 일정으로 되돌릴까요?")) resetPlan(); }}><Trash />초기 일정으로 되돌리기</button><small>공유 코드 {shareId.slice(-8)}</small></footer>

    {detailId && <DetailSheet place={places[detailId]} days={plan.days} scheduledDays={plan.days.flatMap((entry, index) => entry.items.some((item) => item.placeId === detailId) ? [index] : [])} rate={rate} favorite={plan.favorites.includes(detailId)} onAdd={addPlaceToDay} onFavorite={() => toggleListValue("favorites", detailId)} onClose={() => setDetailId(null)} />}
    {menuOpen && <NavigationDrawer active={mobileView} places={places} favorites={plan.favorites} onNavigate={navigate} onGuide={openGuide} onClose={() => setMenuOpen(false)} />}
    {libraryOpen && <LibrarySheet places={places} currentIds={day.items.map((item) => item.placeId)} rate={rate} favorites={plan.favorites} onAdd={addPlace} onDetail={(id) => { setLibraryOpen(false); setDetailId(id); }} onFavorite={(id) => toggleListValue("favorites", id)} onClose={() => setLibraryOpen(false)} onAddCustom={addCustom} />}
    {guide && <GuidePanel mode={guide} initialHotelGroup={hotelInitialGroup} plan={plan} setPlan={setPlan} rate={rate} dayBudgets={dayBudgets} onClose={() => setGuide(null)} />}
    {toast && <div className="toast" role="status"><Check />{toast}</div>}
  </div>;
}
