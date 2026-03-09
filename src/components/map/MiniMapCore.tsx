"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";

const icon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:14px;height:14px;border-radius:50%;background:#3B82F6;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function MiniMapCore({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={17}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={icon} />
    </MapContainer>
  );
}
