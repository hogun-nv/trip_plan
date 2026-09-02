'use client';
/* eslint-disable @next/next/no-img-element */

import {
  ArrowUpRight, Bookmark, Building2, ChevronRight, CircleDollarSign,
  Clock3, Compass, ExternalLink, Glasses, Landmark, Map, MapPin,
  ShoppingBag, Sparkles, TicketCheck, TrainFront, Trees,
  UtensilsCrossed, X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { categoryMeta, guideItems, type CategoryId, type GuideItem } from './data';
import { costById, costNoteByCategory, displayName, featureMediaById } from './enrichment';

const categories: { id: CategoryId; icon: typeof Compass }[] = [
  { id: 'food', icon: UtensilsCrossed },
  { id: 'sights', icon: Compass },
  { id: 'culture', icon: Landmark },
  { id: 'shopping', icon: ShoppingBag },
  { id: 'daytrip', icon: Trees },
];

const categoryNotes: Record<CategoryId, string> = {
  food: '뉴욕다운 한 끼부터 예약할 가치가 있는 저녁까지',
  sights: '대표 명소를 걷기 편한 동선으로 정리한 도시 산책',
  culture: '뮤지컬·미술·재즈를 취향과 체력에 맞게',
  shopping: '백화점, 독립 숍, 마켓에서 만나는 뉴욕의 물건',
  daytrip: '기차와 버스로 닿는 자연·예술·작은 도시',
};

function mapEmbedUrl(item: GuideItem) {
  const { lat, lng } = item.coordinates;
  const spread = item.category === 'daytrip' ? 0.08 : 0.012;
  const bbox = [lng - spread, lat - spread, lng + spread, lat + spread].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;
}

function localImageUrl(item: GuideItem) {
  return `./images/${item.id}.jpg`;
}

function DetailView({ item, onClose, closeRef }: { item: GuideItem; onClose: () => void; closeRef: RefObject<HTMLButtonElement | null> }) {
  const meta = categoryMeta[item.category];
  const name = displayName(item);
  const featureMedia = featureMediaById[item.id];
  const featureHeading = item.category === 'food' ? '대표 메뉴와 가격' : '대표 작품과 관람 포인트';
  const mediaKindLabel = { actual: '해당 매장 메뉴', reference: '메뉴 참고 사진', generated: '생성 이미지', artwork: '대표 작품' } as const;
  return (
    <article className="detail" aria-labelledby="detail-title">
      <div className="detail-mobile-handle" aria-hidden="true" />
      <button ref={closeRef} className="detail-close" type="button" onClick={onClose} aria-label="상세 정보 닫기"><X size={20} /></button>
      <figure className="detail-visual">
        <img src={localImageUrl(item)} alt={item.imageAlt} />
        <figcaption>{item.imageCredit} · 화면용 축소</figcaption>
        <span className="visual-index">NYC / {meta.kicker}</span>
      </figure>
      <div className="detail-body">
        <header className="detail-heading">
          <div className="detail-meta"><p className="eyebrow">{item.eyebrow}</p><span>2026. 9. 3. 기준</span></div>
          <h2 id="detail-title">{name}</h2>
          <p className="detail-intro">{item.description}</p>
        </header>
        <dl className="fact-strip">
          <div><Clock3 /><dt>예상 소요 시간</dt><dd>{item.duration}</dd></div>
          <div><CircleDollarSign /><dt>1인 예상 비용</dt><dd>{costById[item.id]}</dd></div>
          <div><Sparkles /><dt>추천 시간</dt><dd>{item.bestTime}</dd></div>
          <div><TicketCheck /><dt>예약</dt><dd>{item.reservation}</dd></div>
        </dl>
        <p className="cost-note">{costNoteByCategory[item.category]}</p>
        {featureMedia ? (
          <section className="detail-section feature-section">
            <p className="section-number">01</p>
            <div>
              <h3>{featureHeading}</h3>
              <div className="feature-gallery" aria-label={featureHeading}>
                {featureMedia.map((media) => (
                  <figure className="feature-card" key={media.title}>
                    <div className="feature-image"><img src={media.image} alt={media.alt} loading="lazy" /><span>{mediaKindLabel[media.kind]}</span></div>
                    <figcaption><div><strong>{media.title}</strong>{media.price && <b>{media.price}</b>}</div><p>{media.caption}</p><small>{media.credit}</small></figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="detail-section essentials">
            <p className="section-number">01</p>
            <div><h3>{meta.essentialsLabel}</h3><ul className="essential-list">{item.essentials.map((entry) => <li key={entry}>{entry}</li>)}</ul></div>
          </section>
        )}
        <section className="detail-section">
          <p className="section-number">02</p>
          <div>
            <h3>알고 가면 좋은 것</h3>
            <div className="highlight-grid">{item.highlights.map((highlight) => <div key={highlight.title}><h4>{highlight.title}</h4><p>{highlight.text}</p></div>)}</div>
          </div>
        </section>
        <section className="detail-section route-section">
          <p className="section-number">03</p>
          <div>
            <h3>가는 방법과 동선</h3>
            <p className="transit-copy"><TrainFront />{item.transit}</p>
            <p className="route-tip"><Map />{item.routeTip}</p>
            <div className="map-frame">
              <iframe src={mapEmbedUrl(item)} title={`${name} 주변 지도`} loading="lazy" referrerPolicy="no-referrer" tabIndex={-1} />
              <div className="map-address"><MapPin />{item.address}</div>
            </div>
          </div>
        </section>
        <section className="detail-section">
          <p className="section-number">04</p>
          <div>
            <h3>현장에서 기억할 것</h3>
            <ul className="tip-list">{item.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
            <a className="official-link" href={item.officialUrl} target="_blank" rel="noreferrer">운영 정보 확인 <ExternalLink size={15} /></a>
            <p className="source-note">가격·운영시간·예약 방식처럼 바뀔 수 있는 정보는 방문 직전 공식 페이지에서 한 번 더 확인하세요.</p>
          </div>
        </section>
      </div>
    </article>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('food');
  const [selectedId, setSelectedId] = useState(guideItems[0].id);
  const [detailOpen, setDetailOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = window.localStorage.getItem('nyc-guide-saved');
    if (!stored) return [];
    try {
      const parsed: unknown = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.every((entry) => typeof entry === 'string') ? parsed : [];
    }
    catch { window.localStorage.removeItem('nyc-guide-saved'); return []; }
  });
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const detailPaneRef = useRef<HTMLElement>(null);
  const detailCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const requested = guideItems.find((item) => item.id === params.get('place'));
      if (requested) {
        setSelectedId(requested.id);
        setActiveCategory(requested.category);
      }
      if (params.get('detail') === '1' && window.matchMedia('(max-width: 767px)').matches) setDetailOpen(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!detailOpen) return;
    const mobile = window.matchMedia('(max-width: 767px)');
    if (!mobile.matches) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => detailCloseRef.current?.focus());
    const closeWhenDesktop = (event: MediaQueryListEvent) => { if (!event.matches) setDetailOpen(false); };
    const keepFocusInside = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDetailOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !detailPaneRef.current) return;
      const focusable = [...detailPaneRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], iframe, [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1) ?? first;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    mobile.addEventListener('change', closeWhenDesktop);
    window.addEventListener('keydown', keepFocusInside);
    return () => {
      mobile.removeEventListener('change', closeWhenDesktop);
      window.removeEventListener('keydown', keepFocusInside);
      document.body.style.overflow = previousOverflow;
      requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-place-id="${selectedId}"]`)?.focus());
    };
  }, [detailOpen, selectedId]);

  const visibleItems = useMemo(() => {
    return guideItems.filter((item) => item.category === activeCategory && (!showSavedOnly || saved.includes(item.id)));
  }, [activeCategory, saved, showSavedOnly]);

  const selectedItem = visibleItems.find((item) => item.id === selectedId) ?? visibleItems[0];
  const activeMeta = categoryMeta[activeCategory];

  function chooseCategory(category: CategoryId) {
    setActiveCategory(category);
    const first = guideItems.find((item) => item.category === category);
    if (first) setSelectedId(first.id);
    setShowSavedOnly(false);
    setDetailOpen(false);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function chooseItem(item: GuideItem) {
    setSelectedId(item.id);
    setDetailOpen(window.matchMedia('(max-width: 767px)').matches);
  }
  function toggleSaved(id: string) {
    const next = saved.includes(id) ? saved.filter((savedId) => savedId !== id) : [...saved, id];
    setSaved(next);
    window.localStorage.setItem('nyc-guide-saved', JSON.stringify(next));
  }

  return (
    <main className="site-shell">
      <header className="masthead">
        <a className="brand" href="#top" aria-label="뉴욕 시티 가이드 처음으로"><span>NEW YORK</span><strong>THE CITY INDEX</strong></a>
        <div className="trip-note"><span>SEP · 2026</span><p>두 사람을 위한 취향별 현장 가이드</p></div>
        <p className="guide-stats"><strong>48곳</strong><span>5개 카테고리</span><span>가격·동선 재확인</span></p>
      </header>
      <nav className="category-tabs" aria-label="뉴욕 가이드 카테고리">
        {categories.map(({ id, icon: Icon }, index) => (
          <button type="button" key={id} className={activeCategory === id ? 'active' : ''} onClick={() => chooseCategory(id)} aria-current={activeCategory === id ? 'page' : undefined}>
            <span className="tab-number">0{index + 1}</span><Icon size={19} strokeWidth={1.7} /><span className="tab-label">{categoryMeta[id].label}</span><span className="tab-short">{categoryMeta[id].shortLabel}</span>
          </button>
        ))}
      </nav>
      <section className="guide-layout" id="top">
        <div className="index-pane">
          <header className="index-heading">
            <p>{activeMeta.kicker} / NEW YORK</p>
            <h1>{activeMeta.lead}</h1>
            <span>{visibleItems.length}곳</span>
            <div className="index-subline"><span>{categoryNotes[activeCategory]}</span><button type="button" className={showSavedOnly ? 'active' : ''} onClick={() => setShowSavedOnly((current) => !current)} aria-pressed={showSavedOnly}><Bookmark size={14} fill={showSavedOnly ? 'currentColor' : 'none'} />저장한 곳만</button></div>
          </header>
          <div className="place-list" aria-live="polite">
            {visibleItems.map((item, index) => (
              <article className={`place-row ${selectedItem?.id === item.id ? 'selected' : ''}`} key={item.id}>
                <button className="place-select" type="button" onClick={() => chooseItem(item)} data-place-id={item.id}>
                  <span className="place-order">{String(index + 1).padStart(2, '0')}</span>
                  <span className="place-thumb"><img src={localImageUrl(item)} alt="" loading={index > 2 ? 'lazy' : 'eager'} /></span>
                  <span className="place-copy"><span className="place-area">{item.area}</span><strong>{displayName(item)}</strong><span className="place-summary">{item.summary}</span><span className="tag-line">{item.tags.map((tag) => <i key={tag}>{tag}</i>)}</span></span>
                  <ChevronRight className="row-arrow" size={20} />
                </button>
                <button className={`save-button ${saved.includes(item.id) ? 'saved' : ''}`} type="button" onClick={() => toggleSaved(item.id)} aria-label={`${displayName(item)} ${saved.includes(item.id) ? '저장 취소' : '저장'}`}><Bookmark size={17} fill={saved.includes(item.id) ? 'currentColor' : 'none'} /></button>
              </article>
            ))}
            {!visibleItems.length && <div className="empty-state"><Glasses /><p>아직 저장한 장소가 없어요.</p><button type="button" onClick={() => setShowSavedOnly(false)}>전체 목록 보기</button></div>}
          </div>
        </div>
        <aside ref={detailPaneRef} className={`detail-pane ${detailOpen && selectedItem ? 'open' : ''}`} role={detailOpen ? 'dialog' : 'region'} aria-modal={detailOpen || undefined} aria-labelledby={detailOpen ? 'detail-title' : undefined} aria-label={detailOpen ? undefined : '선택한 장소 상세 정보'} aria-live="polite">{selectedItem ? <DetailView key={selectedItem.id} item={selectedItem} onClose={() => setDetailOpen(false)} closeRef={detailCloseRef} /> : <div className="detail-empty"><MapPin /><p>목록에서 장소를 선택하면 사진, 핵심 정보와 지도가 여기에 표시됩니다.</p></div>}</aside>
      </section>
      <footer className="site-footer"><span><Building2 /> NYC FIELD NOTES · 2026</span><p>운영 시간과 가격은 방문 전 공식 페이지에서 마지막으로 확인하세요.</p><ArrowUpRight size={18} /></footer>
      {detailOpen && selectedItem && <button className="mobile-scrim" tabIndex={-1} aria-label="상세 정보 닫기" onClick={() => setDetailOpen(false)} />}
    </main>
  );
}
