import { useEffect, useMemo, useRef, useState } from "react";
import {
  AirplaneLanding, AirplaneTilt, ArrowRight, ArrowSquareOut, Baseball, Bed,
  Binoculars, Buildings, CalendarBlank, CaretDown, CaretLeft, CaretRight, Check, Circle, Clock,
  CloudRain, Copy, ForkKnife, Heart, Images, Info, List, MapPin, MapTrifold,
  MaskHappy, Moon, NavigationArrow, NotePencil, PaintBrush, PersonSimpleWalk,
  Printer, RoadHorizon, ShareNetwork, ShoppingBag, Sun, Ticket, Train, Tree, X,
} from "@phosphor-icons/react";
import tripData from "./data/trip-data.json";
import { RouteMap } from "./components/RouteMap.jsx";
import {
  ARRIVAL_OPTIONS, buildReservationText, dateParts, formatDuration,
  getArrivalAdvice, getDayView, getDurationMinutes, getGoogleRouteUrl,
  getImageCredit, getKindMeta, getMedia, getPlaceMapUrl, nextStopMove,
  reservationLabel, stripMarkup,
} from "./lib/trip.js";

const STORAGE_KEY = "nyc-couple-trip-v2-01";

const KIND_ICONS = {
  REST: Bed, CULTURE: Buildings, VIEW: Binoculars, CITY: RoadHorizon,
  FOOD: ForkKnife, NATURE: Tree, TRANSIT: Train, LANDMARK: MapPin,
  MEMORIAL: Info, ARCHITECTURE: Buildings, SHOW: MaskHappy,
  SHOP: ShoppingBag, SPORT: Baseball, SPORTS: Baseball, "ART & NATURE": PaintBrush,
};

const FLIGHT_TIMELINE = [
  { date: "9/18 금 · KST", time: "21:05", title: "인천 출발", note: "뉴욕행 직항 우선" },
  { date: "9/18 금 · EDT", time: "23:00", title: "JFK 도착", note: "입국 후 바로 숙소 이동" },
  { date: "9/26 토 · EDT", time: "11:45", title: "JFK 출발", note: "07:30 전후 호텔 출발" },
  { date: "9/27 일 · KST", time: "16:30", title: "인천 도착", note: "한국 기준 귀국" },
];

const ATLAS_ITEMS = [
  { key: "met", label: "The Met", sub: "교양 · 미술 · 역사" },
  { key: "times", label: "브로드웨이", sub: "오늘의 무대, 내일의 감동" },
  { key: "pizza", label: "뉴욕 피자", sub: "접어 먹는 한 조각" },
  { key: "lobster", label: "해산물", sub: "대서양의 맛" },
  { key: "porterhouse", label: "클래식 스테이크", sub: "둘이 나누는 저녁" },
  { key: "hero", label: "브루클린", sub: "물가에서 보는 맨해튼" },
];

const BOOKING_STEPS = [
  ["국제선 + 무료취소 호텔", "9/18 저녁 직항과 9/26 낮 직항을 먼저 묶고, UN 본부 동쪽은 피합니다."],
  ["Broadway 9/23 수 19:00", "Hamilton이 일정상 가장 안정적입니다. 공식 티켓을 우선하고 TKTS를 예비로 둡니다."],
  ["나이아가라 국내선·1박", "3안 선택 시 9/21–22 또는 9/22–23 왕복. 귀국편과 최소 이틀의 완충 시간을 둡니다."],
  ["Statue ferry·전망대", "자유의 여신상은 오전 공식 페리, 전망대는 일몰 60–75분 전 입장 슬롯이 좋습니다."],
  ["Storm King·Dia Beacon", "날씨를 본 뒤 결정. Storm King은 수·목, Dia Beacon은 금–월만 엽니다."],
  ["스테이크·인기 레스토랑", "Keens 등 저녁 예약 후 피자·델리·시장 음식은 현장 유연성을 남겨둡니다."],
];

const FIELD_NOTES = [
  ["하루 한 권역", "오전·점심·오후를 같은 동네에 두고 공연 전에는 90분 호텔 휴식을 확보합니다."],
  ["OMNY는 각자 한 결제수단", "2026년 지하철·버스 기본요금 $3, 같은 카드나 기기로 7일 $35 자동 상한이 적용됩니다."],
  ["JFK는 출국 3시간 전", "낮 직항이면 07:30 전후 호텔 출발을 기준으로 잡습니다. AirTrain은 편도 $8.75입니다."],
  ["우천 교체", "야외 일정과 미술관 일정을 바꿀 수 있도록 입장권 변경 조건을 확인합니다."],
];

function getInitialState() {
  const params = new URLSearchParams(window.location.search);
  let saved = {};
  try { saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}"); } catch { saved = {}; }
  const urlPlan = tripData.plans.findIndex((plan) => plan.id === params.get("plan"));
  const urlDay = Number(params.get("day")) - 1;
  const savedPlanIndex = Number.isInteger(saved.planIndex) ? saved.planIndex : 0;
  const savedDayIndex = Number.isInteger(saved.dayIndex) ? saved.dayIndex : 0;
  return {
    planIndex: urlPlan >= 0 ? urlPlan : Math.max(0, Math.min(savedPlanIndex, tripData.plans.length - 1)),
    dayIndex: Number.isInteger(urlDay) && urlDay >= 0 && urlDay < 7 ? urlDay : Math.max(0, Math.min(savedDayIndex, 6)),
    arrival: ARRIVAL_OPTIONS.some((option) => option.id === saved.arrival) ? saved.arrival : "fri-night",
    selectedIndex: Math.max(0, saved.selectedIndex || 0),
    favorites: saved.favorites || {}, completed: saved.completed || {}, notes: saved.notes || {},
    theme: saved.theme === "dark" ? "dark" : "light",
    city: ["nyc", "tennessee", "sanjose"].includes(saved.city) ? saved.city : "nyc",
    mobileView: saved.mobileView === "map" ? "map" : "itinerary",
  };
}

async function writeClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return; } catch { /* Safari·비보안 환경에서는 아래 호환 경로 사용 */ }
  }
  const input = document.createElement("textarea");
  input.value = text; input.setAttribute("readonly", "");
  input.style.position = "fixed"; input.style.opacity = "0";
  document.body.appendChild(input); input.select(); const copied = document.execCommand("copy"); input.remove();
  if (!copied) throw new Error("clipboard unavailable");
}

function PhotoFigure({ src, fallback, fallbackCredit, alt, credit, caption, className = "", priority = false }) {
  const [displayCredit, setDisplayCredit] = useState(credit);
  useEffect(() => { setDisplayCredit(credit); }, [credit, src]);
  const handleError = (event) => {
    if (event.currentTarget.dataset.fallback === "used") {
      event.currentTarget.closest("figure")?.classList.add("is-broken"); return;
    }
    event.currentTarget.dataset.fallback = "used";
    event.currentTarget.src = fallback || tripData.images.hero;
    setDisplayCredit(fallbackCredit || tripData.credits.hero);
  };
  return (
    <figure className={`photo-figure ${className}`}>
      <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" onError={handleError} />
      <figcaption><strong>{caption}</strong>{displayCredit && <a href={displayCredit} target="_blank" rel="noreferrer">사진 출처</a>}</figcaption>
    </figure>
  );
}

function IconAction({ label, children, className = "", ...props }) {
  return <button className={`icon-action ${className}`} type="button" aria-label={label} title={label} {...props}>{children}</button>;
}

function CityEmpty({ city, onBack }) {
  const content = city === "tennessee" ? {
    eyebrow: "TENNESSEE · 출장 구간", title: "산의 리듬으로 넘어가는 다음 장",
    text: "뉴욕 여행 뒤 이어지는 출장 일정입니다. 정확한 도시와 이동 시간이 확정되면 같은 시간표·지도 구조로 연결됩니다.",
    image: tripData.images.tennessee, credit: tripData.credits.tennessee,
  } : {
    eyebrow: "SAN JOSE · 출장 구간", title: "서부의 빛으로 이어지는 마지막 장",
    text: "산호세 구간은 출장 일정이 확정되기 전까지 장소와 이동 정보를 임의로 채우지 않았습니다.",
    image: tripData.images.sanjose, credit: tripData.credits.sanjose,
  };
  return (
    <main id="primary-content" className="city-empty" tabIndex={-1}>
      <PhotoFigure src={content.image} alt={content.title} credit={content.credit} caption={content.eyebrow} className="city-empty-photo" />
      <div className="city-empty-copy"><p className="eyebrow">{content.eyebrow}</p><h1>{content.title}</h1><p>{content.text}</p><div className="data-assurance"><Info size={20} />확정된 정보만 표시합니다.</div><button className="text-button" type="button" onClick={onBack}><ArrowRight size={18} /> 뉴욕 일정으로 돌아가기</button></div>
    </main>
  );
}

function DayRail({ plan, dayIndex, arrival, completed, onChange }) {
  useEffect(() => {
    if (!window.matchMedia("(max-width: 820px)").matches) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => document.getElementById(`day-tab-${dayIndex}`)?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth", block: "nearest", inline: "center",
    }));
  }, [dayIndex, plan.id]);
  const onKeyDown = (event, index) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault(); let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % plan.days.length;
    if (event.key === "ArrowLeft") next = (index - 1 + plan.days.length) % plan.days.length;
    if (event.key === "Home") next = 0; if (event.key === "End") next = plan.days.length - 1;
    onChange(next); window.requestAnimationFrame(() => document.getElementById(`day-tab-${next}`)?.focus());
  };
  return (
    <nav className="day-rail" aria-label="7일 여행 날짜">
      <button className="day-arrow" type="button" aria-label="이전 날짜" onClick={() => onChange((dayIndex - 1 + 7) % 7)}><CaretLeft size={18} /></button>
      <div className="day-tabs" role="tablist" aria-label="날짜별 일정">
        {plan.days.map((day, index) => {
          const parts = dateParts(day.date); const stateKey = `${plan.id}-${index}${arrival === "sat-late" && index === 0 ? "-late" : ""}`; const count = completed[stateKey]?.length || 0;
          return <button id={`day-tab-${index}`} key={day.date} className="day-tab" type="button" role="tab" aria-selected={index === dayIndex} tabIndex={index === dayIndex ? 0 : -1} onClick={() => onChange(index)} onKeyDown={(event) => onKeyDown(event, index)}><span>{parts.dayCode || `D${index + 1}`} · {parts.dateAndWeekday}</span><strong>{day.title}</strong>{count > 0 && <small>{count}/{day.stops.length} 완료</small>}</button>;
        })}
      </div>
      <button className="day-arrow" type="button" aria-label="다음 날짜" onClick={() => onChange((dayIndex + 1) % 7)}><CaretRight size={18} /></button>
    </nav>
  );
}

function TravelNote({ note, onNoteChange }) {
  const [open, setOpen] = useState(Boolean(note));
  return (
    <details className="travel-note" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary><NotePencil size={19} /> 여행 노트 <span>{note ? "저장됨" : "메모 남기기"}</span></summary>
      <textarea value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder="오늘 기억하고 싶은 장면이나 예약 메모를 적어 두세요." aria-label="선택한 날 여행 노트" />
    </details>
  );
}

function EditorialGallery({ plan, day, dayIndex, note, onNoteChange }) {
  const candidates = day.stops
    .map((stop) => ({ ...getMedia(stop.title, tripData, day.photo, day.credit), title: stop.title, kind: stop.kind }))
    .filter((item) => item.key)
    .filter((item, index, array) => array.findIndex((other) => other.src === item.src) === index);
  const main = plan.id === "classic" && dayIndex === 0 ? { src: tripData.images.central, credit: tripData.credits.central, title: "Central Park · The Mall" } : { src: day.photo, credit: day.credit, title: day.title };
  const available = candidates.filter((item) => item.src !== main.src);
  const first = available.find((item) => ["SHOW", "VIEW", "CITY", "CULTURE", "NATURE", "LANDMARK"].includes(item.kind)) || available[0] || { src: tripData.images.times, credit: tripData.credits.times, title: "브로드웨이의 밤" };
  const second = available.find((item) => item.kind === "FOOD" && item.src !== first.src) || available.find((item) => item.src !== first.src) || { src: tripData.images.keens, credit: tripData.credits.keens, title: "Keens Steakhouse" };
  return (
    <aside className="editorial-gallery" aria-label="선택한 날의 분위기">
      <PhotoFigure src={main.src} fallback={tripData.images.hero} fallbackCredit={tripData.credits.hero} alt={`${main.title} 풍경`} credit={main.credit} caption={main.title} className="photo-main" priority />
      <div className="photo-pair">{[first, second].map((item, index) => <PhotoFigure key={`${item.src}-${index}`} src={item.src} fallback={tripData.images.hero} alt={`${item.title} 분위기`} credit={item.credit} caption={item.title} className="photo-secondary" />)}</div>
      <TravelNote key={`${plan.id}-${day.date}`} note={note} onNoteChange={onNoteChange} />
    </aside>
  );
}

function Itinerary({ day, dayIndex, selectedIndex, expandedIndices, favorites, completed, advice, itemRefs, onSelect, onToggleFavorite, onToggleComplete, onCopy }) {
  return (
    <section className="itinerary-panel" aria-labelledby="day-heading">
      <header className="day-heading-row"><div><p className="eyebrow">D{dayIndex + 1} · {day.date.split("·")[0].trim()}</p><h1 id="day-heading">{day.title}</h1><p>{day.subtitle}</p></div><div className="day-facts" aria-label="하루 요약"><span><PersonSimpleWalk size={16} />{day.walk}</span><span><Bed size={16} />{day.rest}</span></div></header>
      {advice && <div className="arrival-advice"><AirplaneLanding size={18} /><span><strong>선택한 도착편 반영</strong>{advice}</span></div>}
      <ol className="itinerary-list">
        {day.stops.map((stop, index) => {
          const meta = getKindMeta(stop.kind); const KindIcon = KIND_ICONS[stop.kind] || Circle;
          const media = getMedia(stop.title, tripData, day.photo, day.credit); const isSelected = index === selectedIndex;
          const isExpanded = expandedIndices.includes(index); const isFavorite = favorites.includes(index); const isComplete = completed.includes(index);
          const duration = formatDuration(getDurationMinutes(stop.time, stop.end));
          return (
            <li key={`${stop.time}-${stop.title}`} ref={(node) => { itemRefs.current[index] = node; }} className={`itinerary-stop ${isSelected ? "is-selected" : ""} ${isComplete ? "is-complete" : ""}`} data-tone={meta.tone}>
              <button className="stop-select" type="button" aria-expanded={isExpanded} aria-current={isSelected ? "step" : undefined} onClick={() => onSelect(index, true)}>
                <span className="stop-time">{stop.time}<small>{stop.end}</small></span><span className="stop-marker">{index + 1}</span><span className="stop-thumb"><img src={media.src} alt="" loading="lazy" decoding="async" /></span>
                <span className="stop-copy"><span className="stop-meta"><KindIcon size={15} />{meta.label}{duration && ` · ${duration}`}</span><strong>{stop.title}</strong><small>{stop.move}</small></span>
                {stop.reserve && <span className="reservation">{reservationLabel(stop.reserve)}</span>}
              </button>
              <div className="stop-actions" aria-label={`${stop.title} 동작`}><IconAction label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기"} aria-pressed={isFavorite} onClick={() => onToggleFavorite(index)}><Heart size={20} weight={isFavorite ? "fill" : "regular"} /></IconAction><IconAction label={isComplete ? "완료 취소" : "완료 표시"} aria-pressed={isComplete} onClick={() => onToggleComplete(index)}>{isComplete ? <Check size={20} weight="bold" /> : <Circle size={20} />}</IconAction></div>
              {isExpanded && <div className="stop-detail"><p>{stop.detail}</p><dl><div><dt>다음 이동</dt><dd>{nextStopMove(day, index)}</dd></div><div><dt>예약</dt><dd>{stop.reserve || "현장 상황에 맞춰 진행"}</dd></div></dl><div className="detail-actions"><button type="button" onClick={() => onCopy(stop)}><Copy size={17} /> 예약 정보 복사</button>{stop.url && <a href={stop.url} target="_blank" rel="noreferrer">공식 정보 <ArrowSquareOut size={16} /></a>}</div></div>}
              {index < day.stops.length - 1 && <div className="route-connector" aria-hidden="true"><span /><small>{day.stops[index + 1].move || "다음 장소"}</small></div>}
            </li>
          );
        })}
      </ol>
      <footer className="day-total"><span><NavigationArrow size={17} /> {day.stops.length}개 장소</span><span><PersonSimpleWalk size={17} /> {day.walk}</span><span><CloudRain size={17} /> {day.weather}</span></footer>
      <details className="swap-note"><summary><CloudRain size={17} /> 날씨·일정 교체 팁</summary><p>{day.swap}</p></details>
    </section>
  );
}

function ContextPanel({ plan, day, selectedIndex, favorites, completed, onSelect, onToggleFavorite, onToggleComplete, onCopy }) {
  const stop = day.stops[selectedIndex] || day.stops[0]; const media = getMedia(stop.title, tripData, day.photo, day.credit);
  const meta = getKindMeta(stop.kind); const KindIcon = KIND_ICONS[stop.kind] || Circle;
  const photoCaption = media.key === "hotelRoom" ? "뉴욕 호텔 객실 · 분위기 참고" : stop.title;
  return (
    <aside className="context-panel" aria-label="지도와 선택 장소 상세">
      <div className="context-title"><h2>{day.date.split("·")[1]?.trim()} · {day.date.split("·")[0].trim()} 동선</h2><span>{day.stops.length}곳</span></div>
      <RouteMap day={day} selectedIndex={selectedIndex} onSelect={onSelect} completed={completed} />
      <div className="map-tools"><span>지도 번호와 일정 번호가 같습니다.</span><a href={getGoogleRouteUrl(day)} target="_blank" rel="noreferrer">전체 동선 <ArrowSquareOut size={14} /></a></div>
      <div className="mobile-place-command"><span><small>선택 장소</small><strong>{stop.title}</strong></span><a href={getPlaceMapUrl(stop)} target="_blank" rel="noreferrer"><NavigationArrow size={18} /> 길찾기</a></div>
      <article className="place-dossier"><p className="sr-only" role="status" aria-live="polite">{stop.time} {stop.title} 선택됨</p><div className="place-kicker"><span>{selectedIndex + 1}</span><KindIcon size={16} />{meta.label}</div><div className="place-heading"><div><h3>{stop.title}</h3><p>{stop.time}{stop.end && `–${stop.end}`} · {stop.move}</p></div><span className="place-reserve">{stop.reserve || "유연 일정"}</span></div><PhotoFigure src={media.src} fallback={day.photo} fallbackCredit={day.credit} alt={media.key === "hotelRoom" ? "뉴욕 호텔 객실 분위기 참고 사진" : `${stop.title} 분위기`} credit={media.credit} caption={photoCaption} className="place-photo" /><h4>왜 여기인가</h4><p>{stop.detail}</p><div className="place-stats"><span><Clock size={16} />{formatDuration(getDurationMinutes(stop.time, stop.end)) || "시간 여유"}</span><span><Ticket size={16} />{stop.reserve || "현장 진행"}</span>{stop.url && <a className="official-link" href={stop.url} target="_blank" rel="noreferrer">공식 정보 <ArrowSquareOut size={14} /></a>}</div><div className="place-actions"><a className="primary-action" href={getPlaceMapUrl(stop)} target="_blank" rel="noreferrer"><NavigationArrow size={18} /> 길찾기</a><IconAction label="예약 정보 복사" onClick={() => onCopy(stop)}><Copy size={20} /></IconAction><IconAction label={favorites.includes(selectedIndex) ? "즐겨찾기 해제" : "즐겨찾기"} aria-pressed={favorites.includes(selectedIndex)} onClick={() => onToggleFavorite(selectedIndex)}><Heart size={20} weight={favorites.includes(selectedIndex) ? "fill" : "regular"} /></IconAction><IconAction label={completed.includes(selectedIndex) ? "완료 취소" : "완료 표시"} aria-pressed={completed.includes(selectedIndex)} onClick={() => onToggleComplete(selectedIndex)}>{completed.includes(selectedIndex) ? <Check size={20} /> : <Circle size={20} />}</IconAction></div></article>
    </aside>
  );
}

function AtlasStrip({ onOpen }) {
  return <section className="atlas-strip" aria-labelledby="atlas-strip-title"><header><h2 id="atlas-strip-title">동네와 맛의 아틀라스</h2><button type="button" onClick={() => onOpen("places")}>모두 보기 <ArrowRight size={17} /></button></header><div className="atlas-cards">{ATLAS_ITEMS.map((item) => <button key={item.key} className="atlas-card" type="button" onClick={() => onOpen(["pizza", "lobster", "porterhouse"].includes(item.key) ? "food" : "places")}><img src={tripData.images[item.key]} alt={`${item.label} 분위기`} loading="lazy" decoding="async" /><span><strong>{item.label}</strong><small>{item.sub}</small></span></button>)}</div></section>;
}

function PlanOverview({ plan, onJumpToDay, onPrint }) {
  return (
    <div className="plan-overview-layout">
      <section className="plan-editorial-intro">
        <PhotoFigure src={plan.thumbnail} fallback={plan.days[0].photo} fallbackCredit={plan.days[0].credit} alt={`${plan.short} 대표 풍경`} credit={getImageCredit(plan.thumbnail, tripData, plan.days[0].credit)} caption={`PLAN ${plan.number} · ${plan.short}`} className="plan-cover-photo" priority />
        <p className="eyebrow">{plan.bestFor}</p>
        <h3>{plan.title}</h3>
        <p>{plan.subtitle}</p>
        <dl className="plan-metrics"><div><dt>강도</dt><dd>{plan.pace}</dd></div><div><dt>자연</dt><dd>{plan.nature}</dd></div><div><dt>숙박 이동</dt><dd>{plan.hotelMoves}</dd></div></dl>
        <blockquote>{stripMarkup(plan.verdict)}</blockquote>
        <button className="print-guide-button" type="button" onClick={onPrint}><Printer size={18} /> 7일 가이드 인쇄·PDF 저장</button>
      </section>
      <section className="flight-overview" aria-labelledby="flight-overview-title">
        <p className="eyebrow">9박 10일 · 국제선 기준안</p>
        <h3 id="flight-overview-title">인천에서 뉴욕, 다시 인천까지</h3>
        <ol>{FLIGHT_TIMELINE.map((flight) => <li key={`${flight.date}-${flight.time}`}><time>{flight.time}</time><span><small>{flight.date}</small><strong>{flight.title}</strong><em>{flight.note}</em></span></li>)}</ol>
        <p className="flight-caption">항공 시간은 발권 직전 항공사 화면에서 다시 확인하세요.</p>
      </section>
      <section className="seven-day-index" aria-labelledby="seven-day-title">
        <header><div><p className="eyebrow">9/19–9/25 · NEW YORK</p><h3 id="seven-day-title">7일 전체 흐름</h3></div><span>하루 한 권역 · 충분한 휴식</span></header>
        <ol>{plan.days.map((day, index) => <li key={day.date}><button type="button" onClick={() => onJumpToDay(index, day.stops[0])}><span>D{index + 1}</span><div><small>{dateParts(day.date).dateAndWeekday}</small><strong>{day.title}</strong><p>{day.subtitle}</p><em><CloudRain size={14} /> {day.swap}</em></div><ArrowRight size={18} /></button></li>)}</ol>
      </section>
    </div>
  );
}

function AtlasOverlay({ plan, activeTab, onTab, onClose, onJumpToDay, onPrint }) {
  const uniquePlaces = useMemo(() => { const seen = new Set(); return plan.days.flatMap((day, dayIndex) => day.stops.map((stop) => ({ day, dayIndex, stop }))).filter(({ stop }) => { if (seen.has(stop.title)) return false; seen.add(stop.title); return true; }); }, [plan]);
  const tabs = [["overview", "여행안"], ["places", "장소"], ["food", "맛"], ["stays", "숙소"], ["booking", "예약"], ["sources", "출처"]];
  const dialogRef = useRef(null); const tabRefs = useRef([]); const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const siblings = [...document.querySelectorAll(".app-shell > :not(.overlay-backdrop):not(.toast)")];
    const originalOverflow = document.body.style.overflow;
    siblings.forEach((node) => { node.inert = true; });
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => dialogRef.current?.querySelector(".overlay-header button")?.focus());
    const trapFocus = (event) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== "Tab") return;
      const focusable = [...dialogRef.current.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), summary')].filter((node) => node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trapFocus);
    return () => {
      document.removeEventListener("keydown", trapFocus);
      siblings.forEach((node) => { node.inert = false; });
      document.body.style.overflow = originalOverflow;
      previousFocus?.focus?.();
    };
  }, []);
  const onTabKeyDown = (event, index) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault(); let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0; if (event.key === "End") next = tabs.length - 1;
    onTab(tabs[next][0]); window.requestAnimationFrame(() => tabRefs.current[next]?.focus());
  };
  return (
    <div className="overlay-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="atlas-overlay" role="dialog" aria-modal="true" aria-labelledby="atlas-title"><header className="overlay-header"><div><p className="eyebrow">PLAN {plan.number} · VISUAL INDEX</p><h2 id="atlas-title">{plan.short} 아틀라스</h2></div><IconAction label="아틀라스 닫기" onClick={onClose}><X size={24} /></IconAction></header><nav className="overlay-tabs" role="tablist" aria-label="아틀라스 범주">{tabs.map(([id, label], index) => <button ref={(node) => { tabRefs.current[index] = node; }} id={`atlas-tab-${id}`} key={id} type="button" role="tab" aria-selected={activeTab === id} aria-controls="atlas-panel" tabIndex={activeTab === id ? 0 : -1} onClick={() => onTab(id)} onKeyDown={(event) => onTabKeyDown(event, index)}>{label}</button>)}</nav>
        <div id="atlas-panel" className="overlay-content" role="tabpanel" aria-labelledby={`atlas-tab-${activeTab}`}>
          {activeTab === "overview" && <PlanOverview plan={plan} onJumpToDay={onJumpToDay} onPrint={onPrint} />}
          {activeTab === "places" && <div className="place-atlas-grid">{uniquePlaces.map(({ day, dayIndex, stop }) => { const media = getMedia(stop.title, tripData, day.photo, day.credit); return <button key={`${dayIndex}-${stop.time}-${stop.title}`} type="button" className="place-atlas-item" onClick={() => onJumpToDay(dayIndex, stop)}><img src={media.src} alt="" loading="lazy" decoding="async" /><span><small>D{dayIndex + 1} · {stop.time}</small><strong>{stop.title}</strong><em>{getKindMeta(stop.kind).label}</em></span></button>; })}</div>}
          {activeTab === "food" && <div className="editorial-catalog food-catalog">{plan.foods.map((food) => { const media = getMedia(food.name, tripData, tripData.images.pizza, tripData.credits.pizza); return <article key={food.name}><PhotoFigure src={media.src} fallback={tripData.images.pizza} fallbackCredit={tripData.credits.pizza} alt={`${food.name} 음식과 공간`} credit={media.credit} caption={food.name} /><p className="eyebrow">{food.cuisine}</p><h3>{food.name}</h3><p>{food.text}</p><dl><div><dt>추천 메뉴</dt><dd>{food.dish}</dd></div><div><dt>예약 팁</dt><dd>{food.tip}</dd></div></dl><a href={food.site} target="_blank" rel="noreferrer">메뉴·예약 <ArrowSquareOut size={16} /></a></article>; })}</div>}
          {activeTab === "stays" && <div className="stay-layout"><PhotoFigure src={plan.area.photo} fallback={plan.days[0].photo} fallbackCredit={plan.days[0].credit} alt={`${plan.area.name} 숙박 권역`} credit={getImageCredit(plan.area.photo, tripData, plan.days[0].credit)} caption={plan.area.name} className="stay-area-photo" /><div className="stay-area-copy"><p className="eyebrow">추천 숙박 권역</p><h3>{plan.area.name}</h3><p>{plan.area.text}</p><div className="caution"><Info size={19} />{plan.area.caution}</div></div><div className="editorial-catalog hotel-catalog">{plan.hotels.map((hotel) => <article key={hotel.name}><p className="eyebrow">{hotel.tier}</p><h3>{hotel.name}</h3><p>{hotel.text}</p><ul>{hotel.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul><div><a href={hotel.site} target="_blank" rel="noreferrer">호텔 보기</a><a href={hotel.map} target="_blank" rel="noreferrer">지도</a></div></article>)}</div></div>}
          {activeTab === "booking" && <div className="booking-layout"><section><p className="eyebrow">예약 순서</p><h3>지금 먼저 확정할 것</h3><ol className="booking-list">{BOOKING_STEPS.map(([title, text], index) => <li key={title}><span>{index + 1}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol><button className="print-guide-button" type="button" onClick={onPrint}><Printer size={18} /> 전체 가이드 인쇄·PDF 저장</button></section><aside><p className="eyebrow">현장 원칙</p><h3>덜 지치는 여행</h3><dl>{FIELD_NOTES.map(([title, text]) => <div key={title}><dt>{title}</dt><dd>{text}</dd></div>)}</dl><div className="notice-stack"><details open><summary>UN 총회와 정확히 겹칩니다</summary><p>고위급 주간 9/18–28, 일반토의 9/22–26. Midtown East·UN 본부 주변 차량 통제와 호텔 수요가 큽니다. 차보다 지하철을 쓰고 숙소는 Bryant Park 서쪽·NoMad·Chelsea·Downtown을 우선하세요.</p></details><details><summary>귀국 구간은 추석 연휴입니다</summary><p>한국 추석 연휴 9/24–26과 겹쳐 좌석·운임 변동 가능성이 큽니다. 국제선을 먼저 확정하고 발권 직전 항공사 화면에서 시간을 재확인하세요.</p></details><details><summary>해질녘은 18:47–18:58입니다</summary><p>9/19 일몰 18:58, 9/25 일몰 18:47. 전망대·브루클린 수변은 일몰 60–75분 전 예약하면 낮 풍경과 야경을 모두 보기 좋습니다.</p></details></div></aside></div>}
          {activeTab === "sources" && <div className="sources-layout">{[["core", "항공·행사·교통"], ["places", "관광·공연"], ["images", "사진·라이선스"]].map(([key, label]) => <section key={key}><h3>{label}</h3><ol>{tripData.sources[key].map(([title, url]) => <li key={`${title}-${url}`}><a href={url} target="_blank" rel="noreferrer">{title}<ArrowSquareOut size={14} /></a></li>)}</ol></section>)}</div>}
        </div>
      </section>
    </div>
  );
}

function PrintGuide({ plan }) {
  return (
    <article className="print-guide" aria-hidden="true">
      <header><p>NYC · 둘이서 천천히</p><h1>{plan.number}. {plan.title}</h1><p>2026년 9월 18–27일 · 9박 10일 · {plan.bestFor}</p><p>{plan.subtitle}</p></header>
      <section><h2>국제선 기준안</h2><ol className="print-flights">{FLIGHT_TIMELINE.map((flight) => <li key={`${flight.date}-${flight.time}`}><strong>{flight.time}</strong> · {flight.date} · {flight.title} — {flight.note}</li>)}</ol></section>
      <section><h2>플랜 판단</h2><p>{stripMarkup(plan.verdict)}</p><dl><div><dt>강도</dt><dd>{plan.pace}</dd></div><div><dt>자연</dt><dd>{plan.nature}</dd></div><div><dt>숙박 이동</dt><dd>{plan.hotelMoves}</dd></div></dl></section>
      {plan.days.map((day, dayIndex) => <section className="print-day" key={day.date}><header><p>D{dayIndex + 1} · {day.date}</p><h2>{day.title}</h2><p>{day.subtitle}</p><p>{day.walk} · {day.rest} · {day.weather}</p></header><ol>{day.stops.map((stop) => <li key={`${stop.time}-${stop.title}`}><time>{stop.time}{stop.end && `–${stop.end}`}</time><div><h3>{stop.title}</h3><p>{stop.detail}</p><p><strong>이동</strong> {stop.move || "—"}</p><p><strong>예약</strong> {stop.reserve || "현장 진행"}</p>{stop.url && <p>{stop.url}</p>}</div></li>)}</ol><aside><strong>일정 교체 팁</strong> {day.swap}</aside></section>)}
      <section><h2>추천 숙박 권역</h2><h3>{plan.area.name}</h3><p>{plan.area.text}</p><p><strong>주의</strong> {plan.area.caution}</p>{plan.hotels.map((hotel) => <article key={hotel.name}><h3>{hotel.name} · {hotel.tier}</h3><p>{hotel.text}</p><ul>{hotel.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul><p>{hotel.site}</p></article>)}</section>
      <section><h2>맛의 목록</h2>{plan.foods.map((food) => <article key={food.name}><h3>{food.name} · {food.cuisine}</h3><p>{food.text}</p><p><strong>추천 메뉴</strong> {food.dish}</p><p><strong>예약 팁</strong> {food.tip}</p><p>{food.site}</p></article>)}</section>
      <section><h2>예약 우선순위</h2><ol>{BOOKING_STEPS.map(([title, text]) => <li key={title}><strong>{title}</strong> — {text}</li>)}</ol><h2>현장 원칙</h2><dl>{FIELD_NOTES.map(([title, text]) => <div key={title}><dt>{title}</dt><dd>{text}</dd></div>)}</dl></section>
      <section><h2>공식 출처</h2>{Object.values(tripData.sources).flat().map(([title, url]) => <p key={`${title}-${url}`}>{title}: {url}</p>)}</section>
    </article>
  );
}

export function App() {
  const initial = useMemo(getInitialState, []);
  const [planIndex, setPlanIndex] = useState(initial.planIndex), [dayIndex, setDayIndex] = useState(initial.dayIndex), [arrival, setArrival] = useState(initial.arrival), [selectedIndex, setSelectedIndex] = useState(initial.selectedIndex), [expandedIndices, setExpandedIndices] = useState([]);
  const [favorites, setFavorites] = useState(initial.favorites), [completed, setCompleted] = useState(initial.completed), [notes, setNotes] = useState(initial.notes), [theme, setTheme] = useState(initial.theme);
  const [city, setCity] = useState(initial.city), [mobileView, setMobileView] = useState(initial.mobileView), [planMenuOpen, setPlanMenuOpen] = useState(false), [arrivalOpen, setArrivalOpen] = useState(false), [atlasOpen, setAtlasOpen] = useState(false), [atlasTab, setAtlasTab] = useState("places"), [toast, setToast] = useState("");
  const itemRefs = useRef([]); const plan = tripData.plans[planIndex]; const day = useMemo(() => getDayView(plan, dayIndex, arrival), [plan, dayIndex, arrival]);
  const dayKey = `${plan.id}-${dayIndex}${arrival === "sat-late" && dayIndex === 0 ? "-late" : ""}`;
  const favoriteList = favorites[dayKey] || [], completedList = completed[dayKey] || [], note = notes[dayKey] || "";
  const activeIndex = Math.max(0, Math.min(selectedIndex, day.stops.length - 1));
  const selectedStop = day.stops[activeIndex] || day.stops[0], nextStop = day.stops[activeIndex + 1] || null;

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => { if (selectedIndex !== activeIndex) setSelectedIndex(activeIndex); }, [activeIndex, selectedIndex]);
  useEffect(() => { const payload = { planIndex, dayIndex, arrival, selectedIndex: activeIndex, favorites, completed, notes, theme, city, mobileView }; window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); const params = new URLSearchParams(window.location.search); params.set("plan", plan.id); params.set("day", String(dayIndex + 1)); window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`); }, [planIndex, dayIndex, arrival, activeIndex, favorites, completed, notes, theme, city, mobileView, plan.id]);
  useEffect(() => { if (!toast) return undefined; const timer = window.setTimeout(() => setToast(""), 2200); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => { const onKeyDown = (event) => { if (event.key === "Escape") { setPlanMenuOpen(false); setArrivalOpen(false); setAtlasOpen(false); } }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, []);

  const changePlan = (index) => { setPlanIndex(index); setDayIndex(0); setSelectedIndex(0); setExpandedIndices([]); setPlanMenuOpen(false); setMobileView("itinerary"); };
  const changeDay = (index) => { setDayIndex(index); setSelectedIndex(0); setExpandedIndices([]); setMobileView("itinerary"); };
  const scrollToStop = (index) => { const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; window.requestAnimationFrame(() => itemRefs.current[index]?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" })); };
  const selectStop = (index, toggleExpand = false, scroll = false) => { setSelectedIndex(index); if (toggleExpand) setExpandedIndices((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]); if (scroll && !window.matchMedia("(max-width: 820px)").matches) scrollToStop(index); };
  const switchMobileView = (view) => { setMobileView(view); if (view === "map") { window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" })); } else { window.requestAnimationFrame(() => scrollToStop(activeIndex)); } };
  const toggleIndex = (setter, index) => { setter((current) => { const currentList = current[dayKey] || []; const next = currentList.includes(index) ? currentList.filter((item) => item !== index) : [...currentList, index]; return { ...current, [dayKey]: next }; }); };
  const copyStop = async (stop) => { try { await writeClipboard(buildReservationText(plan, day, stop)); setToast("예약·이동 정보를 복사했습니다."); } catch { setToast("복사하지 못했습니다. 다시 시도해 주세요."); } };
  const copyShareLink = async () => { try { await writeClipboard(window.location.href); setToast("현재 플랜과 날짜 링크를 복사했습니다."); } catch { setToast("링크를 복사하지 못했습니다."); } };
  const openAtlas = (tab) => { setAtlasTab(tab); setAtlasOpen(true); };
  const jumpFromAtlas = (targetDay, stop) => { const targetIndex = plan.days[targetDay].stops.findIndex((item) => item.time === stop.time && item.title === stop.title); const safeTarget = Math.max(0, targetIndex); setDayIndex(targetDay); setSelectedIndex(safeTarget); setExpandedIndices([safeTarget]); setAtlasOpen(false); setMobileView("itinerary"); window.requestAnimationFrame(() => scrollToStop(safeTarget)); };

  return (
    <div className={`app-shell mobile-mode-${mobileView}`}>
      <a className="skip-link" href="#primary-content">선택한 날 일정으로 건너뛰기</a>
      <header className="app-header"><div className="brand-lockup"><span>NYC</span><strong>둘이서 천천히</strong></div><span className="header-divider" /><div className="trip-dates"><CalendarBlank size={17} />9박 10일 · 9/18–9/27, 2026</div><div className="city-route"><AirplaneTilt size={16} /> 인천 → 뉴욕 → 테네시 → 산호세</div><div className="header-spacer" />
        <label className="city-select"><span className="sr-only">도시 선택</span><select value={city} onChange={(event) => setCity(event.target.value)}><option value="nyc">뉴욕</option><option value="tennessee">테네시</option><option value="sanjose">산호세</option></select><CaretDown size={14} /></label>
        <div className="header-menu-wrap"><button className="header-plan" type="button" aria-haspopup="true" aria-expanded={planMenuOpen} onClick={() => { setPlanMenuOpen((open) => !open); setArrivalOpen(false); }}><span>{plan.number}</span>{plan.short}<CaretDown size={14} /></button>{planMenuOpen && <div className="plan-menu" aria-label="여행 플랜 선택">{tripData.plans.map((item, index) => <button key={item.id} type="button" aria-pressed={index === planIndex} onClick={() => changePlan(index)}><img src={item.thumbnail} alt="" /><span><small>PLAN {item.number} · 강도 {item.pace}</small><strong>{item.short}</strong><em>{item.bestFor} · {item.nature}</em></span>{index === planIndex && <Check size={18} />}</button>)}</div>}</div>
        <div className="header-menu-wrap arrival-wrap"><IconAction label="뉴욕 도착 시간 선택" aria-expanded={arrivalOpen} onClick={() => { setArrivalOpen((open) => !open); setPlanMenuOpen(false); }}><AirplaneLanding size={20} /><span className="action-label">{ARRIVAL_OPTIONS.find((option) => option.id === arrival)?.short}</span></IconAction>{arrivalOpen && <div className="arrival-menu" role="radiogroup" aria-label="뉴욕 도착 시간">{ARRIVAL_OPTIONS.map((option) => <label key={option.id}><input type="radio" name="arrival" value={option.id} checked={arrival === option.id} onChange={() => { setArrival(option.id); setSelectedIndex(0); setExpandedIndices([]); setArrivalOpen(false); }} /><span>{option.label}</span></label>)}</div>}</div>
        <IconAction label={theme === "dark" ? "밝은 화면" : "어두운 화면"} onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}</IconAction><IconAction label="현재 일정 링크 복사" onClick={copyShareLink}><ShareNetwork size={20} /></IconAction><IconAction label="인쇄 또는 PDF 저장" onClick={() => window.print()}><Printer size={20} /></IconAction>
      </header>
      {city !== "nyc" ? <CityEmpty city={city} onBack={() => setCity("nyc")} /> : <><DayRail plan={plan} dayIndex={dayIndex} arrival={arrival} completed={completed} onChange={changeDay} /><section className="mobile-operational" aria-label="현재 선택과 다음 일정"><div><small>선택</small><strong>{selectedStop.time}</strong></div><div><small>다음</small><strong>{nextStop?.time || "마무리"}</strong></div><div><small>이동</small><strong>{nextStop?.move || "오늘 일정 마무리"}</strong></div></section>
        <main id="primary-content" tabIndex={-1} className={`primary-grid mobile-view-${mobileView}`}><EditorialGallery plan={plan} day={day} dayIndex={dayIndex} note={note} onNoteChange={(value) => setNotes((current) => ({ ...current, [dayKey]: value }))} /><Itinerary day={day} dayIndex={dayIndex} selectedIndex={activeIndex} expandedIndices={expandedIndices} favorites={favoriteList} completed={completedList} advice={getArrivalAdvice(arrival, dayIndex)} itemRefs={itemRefs} onSelect={selectStop} onToggleFavorite={(index) => toggleIndex(setFavorites, index)} onToggleComplete={(index) => toggleIndex(setCompleted, index)} onCopy={copyStop} /><ContextPanel plan={plan} day={day} selectedIndex={activeIndex} favorites={favoriteList} completed={completedList} onSelect={(index) => selectStop(index, false, true)} onToggleFavorite={(index) => toggleIndex(setFavorites, index)} onToggleComplete={(index) => toggleIndex(setCompleted, index)} onCopy={copyStop} /></main><AtlasStrip onOpen={openAtlas} />
        <nav className="mobile-bottom-nav" aria-label="현장용 주요 화면"><button type="button" aria-current={mobileView === "itinerary" ? "page" : undefined} onClick={() => switchMobileView("itinerary")}><List size={21} />일정</button><button type="button" aria-current={mobileView === "map" ? "page" : undefined} onClick={() => switchMobileView("map")}><MapTrifold size={21} />지도</button><button type="button" onClick={() => openAtlas("places")}><Images size={21} />아틀라스</button></nav></>}
      {atlasOpen && <AtlasOverlay plan={plan} activeTab={atlasTab} onTab={setAtlasTab} onClose={() => setAtlasOpen(false)} onJumpToDay={jumpFromAtlas} onPrint={() => window.print()} />}{toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}<PrintGuide plan={plan} />
    </div>
  );
}
