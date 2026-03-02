"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import axios from "axios";
import Link from "next/link";

function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(position, 10); }, [position, map]);
  return null;
}

const STATES = [
  { name: "Johor", coords: [1.4927, 103.7414] as [number, number] },
  { name: "Kedah", coords: [6.125, 100.3678] as [number, number] },
  { name: "Selangor", coords: [3.0738, 101.5183] as [number, number] },
  { name: "Sabah", coords: [5.9804, 116.0735] as [number, number] },
  { name: "Sarawak", coords: [2.2151, 113.9436] as [number, number] },
];

const AI_ALERTS = [
  { level: "red", message: "Warning: Kedah rainfall is 20% below average for March.", time: "2 min ago" },
  { level: "yellow", message: "Caution: Selangor temperature 1.8°C above seasonal norm.", time: "15 min ago" },
  { level: "yellow", message: "Caution: Rice supply buffer at 78% — monitor closely.", time: "1 hr ago" },
  { level: "green", message: "OK: Johor harvest season on track — yield stable.", time: "3 hr ago" },
];

const alertStyle = {
  red: "bg-red-50 border-red-200 text-red-700",
  yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
  green: "bg-emerald-50 border-emerald-200 text-emerald-700",
};
const alertDot = { red: "bg-red-500", yellow: "bg-yellow-400", green: "bg-emerald-500" };

export default function Home() {
  const [selectedState, setSelectedState] = useState("Johor");
  const [positionState, setPositionState] = useState<[number, number]>([1.4927, 103.7414]);
  const [stateData, setStateData] = useState<Record<string, unknown>[]>([]);
  const [yieldScore, setYieldScore] = useState(0);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    axios.get("http://localhost:8000/greetings")
      .then((r) => setGreeting(r.data.message))
      .catch(() => { });
  }, []);

  const chooseState = (state: string) => {
    setSelectedState(state);
    const found = STATES.find((s) => s.name === state);
    if (found) setPositionState(found.coords);
    axios.get(`http://localhost:8000/state/${state}`)
      .then((r) => {
        const data = r.data.data ?? [];
        setStateData(data);
        setYieldScore(data[0]?.yield ?? 0);
      })
      .catch(() => { });
  };

  const riskColor =
    yieldScore > 60 ? "text-red-600" : yieldScore > 30 ? "text-yellow-600" : "text-emerald-600";
  const riskBg =
    yieldScore > 60 ? "bg-red-50 border-red-200 text-red-700" :
      yieldScore > 30 ? "bg-yellow-50 border-yellow-200 text-yellow-700" :
        "bg-emerald-50 border-emerald-200 text-emerald-700";
  const riskLabel =
    yieldScore > 60 ? "HIGH RISK" : yieldScore > 30 ? "MODERATE" : "STABLE";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Real-time food security status for Malaysia
              {greeting && <span className="ml-2 text-emerald-600 font-medium">• {greeting}</span>}
            </p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p className="font-semibold text-gray-700 text-sm">March 2026</p>
            <p>Live monitoring active</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Risk Score */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">Total Risk Score</p>
            <div className="flex items-end gap-3 mt-1">
              <span className={`text-5xl font-black ${riskColor}`}>{yieldScore || "—"}</span>
              <span className={`mb-1 px-3 py-1 rounded-full text-xs font-bold border ${riskBg}`}>{riskLabel}</span>
            </div>
            <p className="text-gray-400 text-xs mt-3">{selectedState} — current composite score</p>
          </div>

          {/* Predicted Yield Drop */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">Predicted Yield Drop</p>
            <div className="flex items-end gap-3 mt-1">
              <span className="text-5xl font-black text-red-500">18%</span>
              <span className="mb-1 px-3 py-1 rounded-full text-xs font-bold bg-red-50 border border-red-200 text-red-700">▼ BELOW AVG</span>
            </div>
            <p className="text-gray-400 text-xs mt-3">Versus previous season average</p>
          </div>

          {/* Market Pressure */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">Market Price Inflation</p>
            <div className="flex items-end gap-3 mt-1">
              <span className="text-5xl font-black text-yellow-500">+12%</span>
              <span className="mb-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-50 border border-yellow-200 text-yellow-700">▲ RISING</span>
            </div>
            <p className="text-gray-400 text-xs mt-3">Food price increase this month</p>
          </div>
        </div>

        {/* Map + AI Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Map */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Regional Risk Map</h2>
              <select
                value={selectedState}
                onChange={(e) => chooseState(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                {STATES.map((s) => <option key={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="h-72 rounded-xl overflow-hidden border border-gray-100">
              <MapContainer center={positionState} zoom={10} scrollWheelZoom={false} className="h-full w-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={positionState}>
                  <Popup><strong>{selectedState}</strong><br />Yield Score: {yieldScore || "N/A"}</Popup>
                </Marker>
                <RecenterMap position={positionState} />
              </MapContainer>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Link
                href={`/regional?state=${selectedState}`}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                🗺️ View {selectedState} Deep-Dive →
              </Link>
              {stateData.length > 0 && (
                <span className="text-gray-400 text-xs">{stateData.length} records loaded</span>
              )}
            </div>
          </div>

          {/* AI Alerts */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              🔔 AI Alert Feed
              <span className="ml-auto text-xs bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded-full font-normal">
                {AI_ALERTS.filter((a) => a.level === "red").length} critical
              </span>
            </h2>
            <div className="space-y-3 flex-1">
              {AI_ALERTS.map((alert, i) => (
                <div key={i} className={`border rounded-xl p-3 text-sm ${alertStyle[alert.level as keyof typeof alertStyle]}`}>
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${alertDot[alert.level as keyof typeof alertDot]}`} />
                    <div>
                      <p>{alert.message}</p>
                      <p className="text-xs opacity-60 mt-1">{alert.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Latest State Data + AI Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">Latest Data — {selectedState}</h2>
            {stateData.length > 0 ? (
              <pre className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-4 overflow-auto max-h-48">
                {JSON.stringify(stateData[0], null, 2)}
              </pre>
            ) : (
              <div className="text-gray-400 text-sm bg-gray-50 rounded-xl p-4 border border-gray-100">
                Select a state above to load data from the API.
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">🤖 AI Risk Analysis</h2>
            <div className="space-y-3 text-sm text-gray-600">
              {[
                "Reduced rainfall combined with increased temperature is contributing to crop stress in northern states.",
                "Market price surge indicates a possible supply disruption in Q2.",
                "Recommended: Implement irrigation support and monitor vegetable supply chains.",
                "Government intervention may be required if composite risk score exceeds 70.",
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold text-xs mt-0.5 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <p>{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}