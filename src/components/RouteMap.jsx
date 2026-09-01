import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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

function numberIcon(number, selected, complete) {
  const state = [selected ? "is-selected" : "", complete ? "is-complete" : ""].filter(Boolean).join(" ");
  return L.divIcon({
    className: "route-marker-shell",
    html: `<span class="route-marker ${state}" aria-hidden="true">${number}</span>`,
    iconAnchor: [22, 22],
    iconSize: [44, 44],
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
          pathOptions={{ color: "#172b42", weight: 4, opacity: 0.86, lineJoin: "round" }}
        />
      )}
      {day.stops.map((stop, index) => (
        <Marker
          key={`${dayKey}-${stop.time}-${stop.title}`}
          position={markerPosition(day.stops, index)}
          icon={numberIcon(index + 1, index === selectedIndex, completed.includes(index))}
          zIndexOffset={index === selectedIndex ? 1000 : index}
          eventHandlers={{ click: () => onSelect(index) }}
          keyboard
          title={`${index + 1}. ${stop.time} ${stop.title}`}
          alt={`${index + 1}. ${stop.title}`}
        >
          <Tooltip direction="top" offset={[0, -14]} opacity={1}>
            <strong>{stop.time}</strong> {stop.title}
          </Tooltip>
        </Marker>
      ))}
      <MapSizeObserver stops={day.stops} />
      <RouteUpdater stops={day.stops} selectedIndex={selectedIndex} dayKey={dayKey} />
    </MapContainer>
  );
}
