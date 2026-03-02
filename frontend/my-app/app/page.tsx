"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import axios from "axios";



function RecenterMap({position} : {position: [number, number]}) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 13);
  }, [position, map]);
  return null;

}



export default function Home() {
  const [selectedState, setSelectedState] = useState("Johor");
  var position: [number, number] = [1.4927, 103.7414]; // Default to Johor coordinates
  const [positionState, setPositionState] = useState(position);
  const riskScore = 72;
  const riskLevel = riskScore > 60 ? "High Risk" : riskScore > 30 ? "Moderate Risk" : "Stable";
  const [ text , setText ] = useState("");
  const [ stateData , setStateData ] = useState([]);

  const riskColor =
    riskScore > 60
      ? "bg-red-500"
      : riskScore > 30
      ? "bg-yellow-500"
      : "bg-green-500";


  useEffect(() => {
  // Fetch risk score from backend API
  axios.get("http://localhost:8000/greetings")
    .then(response => {
      console.log("Greetings:", response.data.message);
      setText(response.data.message);
    })
    .catch(error => {
      console.error("Error fetching greetings:", error);
    });
});


   const chooseState = (state: string) => {
    setSelectedState(state);
    if (state === "Johor") {
      setPositionState([1.4927, 103.7414]);
    
    } else if (state === "Kedah") {
      setPositionState([6.1250, 100.3678]);
    } else if (state === "Selangor") {
      setPositionState([3.0738, 101.5183]);
    } else if (state === "Sabah") {
      setPositionState([5.9804, 116.0735]);
    } else if (state === "Sarawak") {
      setPositionState([2.2151, 113.9436]);
    }

    axios.get(`http://localhost:8000/state/${state}`)
      .then(response => {
        console.log(`Data for ${state}:`, response.data.data);
        setStateData(response.data.data);
        setText(`Data for ${state}: ${response.data.data.length} rows`);
      })
      .catch(error => {
        console.error(`Error fetching data for ${state}:`, error);
      });
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-black p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold" >
            Food Security Early Warning System 🇲🇾
          </h1>
          <p className="text-zinc-600 mt-2">
            AI-powered monitoring for agricultural risk and food stability.
          </p>
          <p className="text-zinc-600 mt-2">
            {text}
          </p>
          <p>
            {stateData.length > 0 && (
              <div className="mt-4 p-4 bg-green-100 rounded-lg">
                <h3 className="font-semibold mb-2">Latest Data:</h3>
                <pre className="text-sm text-zinc-700 max-h-40 overflow-auto">
                  {JSON.stringify(stateData[0], null, 2)}
                </pre>
                
              </div>
            )}
          </p>
        </div>

        {/* State Selector */}
        <div className="flex gap-4 items-center">
          <label className="font-medium">Select State:</label>
          <select
            value={selectedState}
            onChange={(e) => chooseState(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option>Johor</option>
            <option>Kedah</option>
            <option>Selangor</option>
            <option>Sabah</option>
            <option>Sarawak</option>
          </select>
        </div>

        {/* Risk Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Risk Score */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Risk Score</h2>
            <div className="flex items-center justify-between">
              <div className="text-5xl font-bold">{riskScore}</div>
              <div
                className={`px-4 py-2 rounded-full text-white ${riskColor}`}
              >
                {riskLevel}
              </div>
            </div>
          </div>

          {/* Yield Prediction */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              Predicted Yield Drop
            </h2>
            <div className="text-4xl font-bold text-red-500">18%</div>
            <p className="text-sm text-zinc-500 mt-2">
              Compared to previous season
            </p>
          </div>

          {/* Market Pressure */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              Market Price Change
            </h2>
            <div className="text-4xl font-bold text-yellow-500">+12%</div>
            <p className="text-sm text-zinc-500 mt-2">
              Food price increase this month
            </p>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            Regional Risk Map
          </h2>
          <div className="h-80 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-400">
            <MapContainer 
      center={positionState} 
      zoom={13} 
      scrollWheelZoom={false} 
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={positionState}>
        <Popup>
          Current Location: {selectedState} <br /> Risk Score: {riskScore}
        </Popup>
      </Marker>

      <RecenterMap position={positionState} />
    </MapContainer>
          </div>
        </div>

        {/* Trend + AI Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Trend Graph Placeholder */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              Yield Trend (Last 6 Months)
            </h2>
            <div className="h-64 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-400">
              Chart Component Here (Recharts)
            </div>
          </div>

          {/* AI Insights Panel */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              AI Risk Analysis
            </h2>
            <div className="space-y-3 text-sm text-zinc-700">
              <p>
                • Reduced rainfall combined with increased temperature is
                contributing to crop stress.
              </p>
              <p>
                • Market price surge indicates possible supply disruption.
              </p>
              <p>
                • Recommended: Implement irrigation support and monitor
                vegetable supply chains.
              </p>
              <p>
                • Government intervention may be required if risk
                escalates next month.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}