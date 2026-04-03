"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(position, 10); }, [position, map]);
  return null;
}

export default function Map({ position, selectedState, yieldData }: any) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // leaflet-defaulticon-compatibility accesses `window` at import time,
    // so it must be loaded client-side only
    require("leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css");
    require("leaflet-defaulticon-compatibility");
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <MapContainer center={position} zoom={10} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup><strong>{selectedState}</strong><br />Yield Score: {yieldData}%</Popup>
      </Marker>
      <RecenterMap position={position} />
    </MapContainer>
  );
}