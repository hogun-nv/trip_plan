import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import tripData from "../data/trip-data.json";
import { getMedia } from "../lib/trip.js";

function RouteUpdater({ stops, selectedIndex, dayKey }) {
  const map = useMap();

  useEffect(() => {
    const points = stops.map((stop) => stop.coords);
    if (!points.length) return;
    map.invalidateSize();
    if (points.length === 1) {
      map.setView(points[0], 14, { animate: false });
      return;
    }
    map.fitBounds(L.latLngBounds(points), {
      paddingTopLeft: [42, 42],
      paddingBottomRight: [42, 42],
      maxZoom: 14,
      animate: false,
    });
  }, [dayKey, map, stops]);

  useEffect(() => {
    const selected = stops[selectedIndex];
    if (!selected) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    map.panTo(selected.coords, { animate: !reduceMotion, duration: reduceMotion ? 0 : 0.45 });
  }, [map, selectedIndex, stops]);

  return null;
}

function MapSizeObserver({ stops }) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    let frame = 0;
    const refresh = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        map.invalidateSize({ pan: false });
        const points = stops.map((stop) => stop.coords);
        if (points.length > 1 && container.clientWidth > 0 && container.clientHeight > 0) {
          map.fitBounds(L.latLngBounds(points), {
            paddingTopLeft: [42, 42], paddingBottomRight: [42, 42], maxZoom: 14, animate: false,
          });
        }
      });
    };
    const observer = new ResizeObserver(refresh);
    observer.observe(container);
    window.addEventListener("orientationchange", refresh);
    refresh();
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("orientationchange", refresh);
    };
  }, [map, stops]);

  return null;
}

function escapeAttribute(value) {
  return String(value).replace(/[&"'<>]/g, (character) => ({
    "&": "&amp;", "\"": "&quot;", "'": "&#39;", "<": "&lt;", ">": "&gt;",
  })[character]);
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [query]);
  return matches;
}

function postcardIcon(number, photo, selected, complete, showPhoto) {
  const state = [selected ? "is-selected" : "", complete ? "is-complete" : "", showPhoto ? "" : "is-compact"].filter(Boolean).join(" ");
  const imageMarkup = showPhoto ? `<img src="${escapeAttribute(photo)}" alt="">` : "";
  return L.divIcon({
    className: "route-marker-shell postcard-marker-shell",
    html: `<span class="map-postcard-marker ${state}" aria-hidden="true">${imageMarkup}<b>${number}</b></span>`,
    iconAnchor: showPhoto ? [36, 58] : [22, 22],
    iconSize: showPhoto ? [72, 58] : [44, 44],
  });
}

function markerPosition(stops, index) {
  const stop = stops[index];
  const peers = stops
    .map((candidate, candidateIndex) => ({ candidate, candidateIndex }))
    .filter(({ candidate }) => candidate.coords[0] === stop.coords[0] && candidate.coords[1] === stop.coords[1]);
  if (peers.length < 2) return stop.coords;
  const rank = peers.findIndex(({ candidateIndex }) => candidateIndex === index);
  const angle = (Math.PI * 2 * rank) / peers.length - Math.PI / 2;
  const radius = 0.00018;
  return [stop.coords[0] + Math.sin(angle) * radius, stop.coords[1] + Math.cos(angle) * radius];
}

export function RouteMap({ day, selectedIndex, onSelect, completed = [] }) {
  const center = day.stops[0]?.coords || [40.754, -73.984];
  const positions = useMemo(() => day.stops.map((stop) => stop.coords), [day.stops]);
  const media = useMemo(() => day.stops.map((stop) => getMedia(stop.title, tripData, day.photo, day.credit)), [day]);
  const compactMap = useMediaQuery("(max-width: 820px)");
  const dayKey = `${day.date}-${day.stops.length}`;

  return (
    <MapContainer
      className="route-map"
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      zoomControl
      attributionControl
      keyboard
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {positions.length > 1 && (
        <Polyline
          positions={positions}
          pathOptions={{ color: "#a53b32", weight: 3, opacity: 0.92, lineJoin: "round", dashArray: "1 0" }}
        />
      )}
      {day.stops.map((stop, index) => {
        const firstPhotoUse = media.findIndex((candidate) => candidate.src === media[index].src) === index;
        const showPhoto = index === selectedIndex || (!compactMap && firstPhotoUse);
        return (
        <Marker
          key={`${dayKey}-${stop.time}-${stop.title}`}
          position={markerPosition(day.stops, index)}
          icon={postcardIcon(index + 1, media[index].src, index === selectedIndex, completed.includes(index), showPhoto)}
          zIndexOffset={index === selectedIndex ? 1000 : compactMap ? 1200 + index : index}
          eventHandlers={{ click: () => onSelect(index) }}
          keyboard
          title={`${index + 1}. ${stop.time} ${stop.title}`}
          alt={`${index + 1}. ${stop.title}`}
        >
          <Tooltip direction="top" offset={[0, -14]} opacity={1}>
            <strong>{stop.time}</strong> {stop.title}
          </Tooltip>
        </Marker>
        );
      })}
      <MapSizeObserver stops={day.stops} />
      <RouteUpdater stops={day.stops} selectedIndex={selectedIndex} dayKey={dayKey} />
    </MapContainer>
  );
}
