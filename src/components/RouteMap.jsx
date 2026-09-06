import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapSync({ stops, anchors = [], selectedId }) {
  const map = useMap();
  const skipNextSelection = useRef(true);
  const allStops = [...stops, ...anchors];
  const routeKey = allStops.map((stop) => stop.id).join("|");

  useEffect(() => {
    skipNextSelection.current = true;
    map.invalidateSize();
    if (!allStops.length) return;
    const bounds = L.latLngBounds(allStops.map((stop) => stop.coords));
    if (allStops.length === 1) map.setView(allStops[0].coords, 14, { animate: false });
    else map.fitBounds(bounds, { padding: [38, 38], maxZoom: 14, animate: false });
  }, [map, routeKey]);

  useEffect(() => {
    if (skipNextSelection.current) {
      // 날짜를 바꾸면 App이 곧 새 날짜의 첫 일정을 선택합니다. 이전 날짜의
      // selectedId는 현재 stops에 없으므로, 실제 새 선택이 들어올 때까지
      // 한 번의 자동 pan을 보류해 전체 동선 fit을 유지합니다.
      if (!stops.some((stop) => stop.id === selectedId)) return;
      skipNextSelection.current = false;
      return;
    }
    const selected = stops.find((stop) => stop.id === selectedId);
    if (!selected) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    map.panInside(selected.coords, { animate: !reduced, duration: reduced ? 0 : 0.35, padding: [48, 48] });
  }, [map, selectedId, routeKey, stops]);

  useEffect(() => {
    let frame;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        map.invalidateSize({ pan: false });
        if (!allStops.length) return;
        const bounds = L.latLngBounds(allStops.map((stop) => stop.coords));
        if (allStops.length === 1) map.setView(allStops[0].coords, 14, { animate: false });
        else map.fitBounds(bounds, { padding: [38, 38], maxZoom: 14, animate: false });
      });
    });
    observer.observe(map.getContainer());
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [map, routeKey]);
  return null;
}

function markerIcon(number, selected, complete) {
  return L.divIcon({
    className: "marker-shell",
    html: `<span class="map-marker${selected ? " is-selected" : ""}${complete ? " is-complete" : ""}">${number}</span>`,
    iconAnchor: [22, 22],
    iconSize: [44, 44],
  });
}

function hotelIcon(extra = false) {
  return L.divIcon({
    className: "marker-shell",
    html: `<span class="map-hotel-marker${extra ? " is-extra" : ""}" aria-hidden="true">H</span>`,
    iconAnchor: [22, 22],
    iconSize: [44, 44],
  });
}

export function RouteMap({ items, places, selectedId, completed = [], hotels = [], onHotelSelect, onSelect }) {
  const stops = useMemo(() => items.map((item) => {
    const place = places[item.placeId];
    return place?.coords ? { ...item, ...place, id: item.id, time: item.time } : null;
  }).filter(Boolean), [items, places]);
  const hotelStops = useMemo(() => hotels.filter((hotel) => hotel?.coords).filter((hotel) => !stops.some((stop) => stop.type === "hotel" && Math.abs(stop.coords[0] - hotel.coords[0]) < 0.0001 && Math.abs(stop.coords[1] - hotel.coords[1]) < 0.0001)).map((hotel, index) => ({ ...hotel, id: `hotel-${hotel.id}`, extra: index > 0 })), [hotels, stops]);
  const center = stops[0]?.coords || hotelStops[0]?.coords || [40.754, -73.984];
  return (
    <MapContainer className="route-map" center={center} zoom={13} scrollWheelZoom={false} zoomControl keyboard>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {stops.length > 1 && <Polyline positions={stops.map((stop) => stop.coords)} pathOptions={{ color: "#173149", weight: 3, opacity: 0.76, dashArray: "2 8", lineCap: "round" }} />}
      {stops.map((stop, index) => (
        <Marker key={stop.id} position={stop.coords} icon={markerIcon(index + 1, stop.id === selectedId, completed.includes(stop.id))} zIndexOffset={stop.id === selectedId ? 1000 : index} eventHandlers={{ click: () => onSelect(stop.id) }} title={`${index + 1}. ${stop.time} ${stop.shortName}`}>
          <Tooltip direction="top" offset={[0, -13]} opacity={1}><strong>{stop.time}</strong> {stop.shortName}</Tooltip>
        </Marker>
      ))}
      {hotelStops.map((hotel) => <Marker key={hotel.id} position={hotel.coords} icon={hotelIcon(hotel.extra)} zIndexOffset={850} eventHandlers={{ click: () => onHotelSelect?.(hotel.id) }} title={`${hotel.extra ? "추가 체류" : "선택한 호텔"}: ${hotel.name}`}><Tooltip direction="top" offset={[0, -13]} opacity={1}><strong>{hotel.extra ? "추가 2박" : "선택한 호텔"}</strong> {hotel.name}</Tooltip></Marker>)}
      <MapSync stops={stops} anchors={hotelStops} selectedId={selectedId} />
    </MapContainer>
  );
}
