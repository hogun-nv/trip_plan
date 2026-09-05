import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapSync({ stops, selectedId }) {
  const map = useMap();
  const routeKey = stops.map((stop) => stop.id).join("|");

  useEffect(() => {
    map.invalidateSize();
    if (!stops.length) return;
    const bounds = L.latLngBounds(stops.map((stop) => stop.coords));
    if (stops.length === 1) map.setView(stops[0].coords, 14, { animate: false });
    else map.fitBounds(bounds, { padding: [38, 38], maxZoom: 14, animate: false });
  }, [map, routeKey, stops]);

  useEffect(() => {
    const selected = stops.find((stop) => stop.id === selectedId);
    if (!selected) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    map.panTo(selected.coords, { animate: !reduced, duration: reduced ? 0 : 0.4 });
  }, [map, selectedId, routeKey, stops]);

  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function markerIcon(number, selected, complete) {
  return L.divIcon({
    className: "marker-shell",
    html: `<span class="map-marker${selected ? " is-selected" : ""}${complete ? " is-complete" : ""}">${number}</span>`,
    iconAnchor: [16, 16],
    iconSize: [32, 32],
  });
}

export function RouteMap({ items, places, selectedId, completed = [], onSelect }) {
  const stops = useMemo(() => items.map((item) => {
    const place = places[item.placeId];
    return place?.coords ? { ...item, ...place, id: item.id, time: item.time } : null;
  }).filter(Boolean), [items, places]);
  const center = stops[0]?.coords || [40.754, -73.984];
  return (
    <MapContainer className="route-map" center={center} zoom={13} scrollWheelZoom={false} zoomControl keyboard>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {stops.length > 1 && <Polyline positions={stops.map((stop) => stop.coords)} pathOptions={{ color: "#173149", weight: 3, opacity: 0.76, dashArray: "2 8", lineCap: "round" }} />}
      {stops.map((stop, index) => (
        <Marker key={stop.id} position={stop.coords} icon={markerIcon(index + 1, stop.id === selectedId, completed.includes(stop.id))} zIndexOffset={stop.id === selectedId ? 1000 : index} eventHandlers={{ click: () => onSelect(stop.id) }} title={`${index + 1}. ${stop.time} ${stop.shortName}`}>
          <Tooltip direction="top" offset={[0, -13]} opacity={1}><strong>{stop.time}</strong> {stop.shortName}</Tooltip>
        </Marker>
      ))}
      <MapSync stops={stops} selectedId={selectedId} />
    </MapContainer>
  );
}
