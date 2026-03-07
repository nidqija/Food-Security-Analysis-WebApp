"use client";

import { use, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import {AiRiskAnalysis , AiInsightAnalysis } from "./factory/Fixer";
import axios from "axios";
import Link from "next/link";
import { get } from "http";

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
  const [yieldData , setYieldData] = useState<number>(0);
  const [riskData, setRiskData] = useState<number>(0);
  const [inflationData, setInflationData] = useState<number>(0);
  const [aiInsights, setAiInsights] = useState<string>("");
  const [productionData , setProductionData] = useState<any>(null);
  const expert = AiRiskAnalysis;
  const AI_INSIGHTS_EXPERT = AiInsightAnalysis;

  //====================================================================================================================== //

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

//====================================================================================================================== //


  useEffect(() => {
  axios.get(`http://localhost:8000/request_state_yield/${selectedState}`)
    .then((r) => {
      console.log("New API Response:", r.data);
      
      // Access the new keys we defined in FastAPI
      const janPrediction = r.data.predictions_jan;
      
      if (janPrediction !== undefined) {
        // Rounding to 1 decimal place for a clean UI
        const cleanScore = Math.round(janPrediction * 10) / 10;
        setYieldData(cleanScore);
      }
    })
    .catch((e) => {
      console.error("Error fetching state yield data:", e);
    });
}, [selectedState]);

//====================================================================================================================== //


useEffect(() => {
   axios.get(`http://localhost:8000/request_state_risk/${selectedState}`)
    .then((r) => {
      console.log("Risk API Response:", r.data);
      
      const riskScore = r.data.risk_score;
      
      if (riskScore !== undefined) {
        const cleanRisk = Math.round(riskScore * 10) / 10;
        setRiskData(cleanRisk);
      }
    })
    .catch((e) => {
      console.error("Error fetching state risk data:", e);
    });
}, [selectedState]);

//====================================================================================================================== //

useEffect(() => {
  axios.get(`http://localhost:8000/request_state_inflation/${selectedState}`)
    .then((r) => {
      console.log("Inflation API Response:", r.data);
      // Access the predicted price change for January from the API response
      const predictedChange = r.data.predicted_price_change_jan;
      
      if (predictedChange !== undefined) {
        // rounding to 1 decimal place for more clearer display
        const cleanInflation = Math.round(predictedChange * 10) / 10;
        setInflationData(cleanInflation);
        console.log(`Predicted Price Change for ${selectedState}: ${cleanInflation}%`);
      }
    })
    .catch((e) => {
      console.error("Error fetching state inflation data:", e);
    });
}, [selectedState]);

//====================================================================================================================== //


useEffect(() => {
   const riskAnalysisInsights = async() =>{

     if (yieldData === 0 || riskData === 0 || inflationData === 0) {
      return;
     }
     try {
       const response = await fetch(`http://localhost:11434/api/chat` , {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
          },
         body: JSON.stringify({

          model :"gemma3:1b" ,
          messages :[
            {
              role: AiRiskAnalysis.role,
              content: AiRiskAnalysis.content,
            
            },
            {
              role: "user",
              content: `Given the current data for ${selectedState} — predicted yield drop of ${yieldData}%, risk score of ${riskData}, and market price inflation of ${inflationData}% — 
              provide a concise analysis of the food security outlook for the next quarter. Highlight key risks, potential impacts on supply chains, and recommended mitigation strategies.`

            }
          ],
          stream : false,
         })

       });

       if(response.ok){
         const data = await response.json();
         console.log("AI Risk Analysis Insights:", data);
         const content = data.message.content;

         setAiInsights(content);

         
       } else {
         console.error("Error from AI API:", response.statusText);
        }
     } catch (error) {
       console.error("Error during AI risk analysis fetch:", error);
     }
   }
   
   const delayDebounceFn = setTimeout(() => {
    riskAnalysisInsights();
  }, 1500);

  return () => clearTimeout(delayDebounceFn);

},[selectedState, yieldData, riskData, inflationData]);

//====================================================================================================================== //

useEffect(() => {

  axios.get(`http://localhost:8000/request_state_analysis/${selectedState}`)
    .then(async (r) => {
      console.log("AI Data Insights API Response:", r.data);
      try {
       const response = await fetch(`http://localhost:11434/api/chat` , {
          method: "POST",
          headers:{
            "Content-Type": "application/json",
          } ,
          body: JSON.stringify({
            model :"gemma3:1b" ,
            messages :[
              {
                role: AI_INSIGHTS_EXPERT.role,
                content: AI_INSIGHTS_EXPERT.content,
              },
              {
                role: "user",
                content: `Analyze the following state data for ${selectedState}:
                ${JSON.stringify(r.data.analysis)}`
              }
            ],
            stream : false,
          })
       });

       if (response.ok){
          const data = await response.json();
          console.log("AI Data Production Insights:", data);
          setProductionData(data.message.content);
        
       }

      } catch (e) {
        console.error("Error processing AI data insights:", e);
      }
    }
    )
    .catch((e) => {
      console.error("Error fetching AI data insights:", e);
    });
      
}, [selectedState]);

//====================================================================================================================== //

const getSection = (title: string) => {
  if (!aiInsights) return null;

  const regex = new RegExp(`\\*\\*${title}.*?\\*\\*([\\s\\S]*?)(?=\\n\\*\\*|$)`, "i");
  const match = aiInsights.match(regex);

  if (match && match[1]) {
    return match[1]
      .trim()
      .replace(/\*/g, "")     
      .replace(/^-\s*/gm, "• ") 
      .split('\n')            
      .filter(line => !line.toLowerCase().includes('outlook for the next quarter'))
      .join('\n');
  }

  if (title.toLowerCase().includes("assessment")) {
    const firstParagraph = aiInsights.split('\n\n')[1] || aiInsights.split('\n')[1];
    return firstParagraph?.replace(/[*#]/g, "").trim();
  }

  return null;
};

const getProductionSection = (title : string) => {
  if (!productionData) return null;
  
  const regex = new RegExp(`\\*\\*${title}.*?\\*\\*([\\s\\S]*?)(?=\\n\\*\\*|$)`, "i");
  const match = productionData.match(regex);

  if (match && match[1]) {
    return match[1]
      .trim()
      .replace(/\*/g, "")     
      .replace(/^-\s*/gm, "• ") 
      .split('\n')            
      .join('\n');
  }
  
   if (title.toLowerCase().includes("production")) {
    const firstParagraph = productionData.split('\n\n')[1] || productionData.split('\n')[1];
    return firstParagraph?.replace(/[*#]/g, "").trim();
  }
}

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
            {yieldData > 0 && 
            <>
            <p className="text-emerald-600 font-medium text-xs mt-1">AI Predictions Updated</p>
            <p className="text-xs text-gray-500 mt-1">{yieldData}% predicted yield drop</p>
            </>
            }
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Risk Score */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">Total Risk Score</p>
            <div className="flex items-end gap-3 mt-1">
              <span className={`text-5xl font-black ${riskColor}`}>{riskData || "—"}</span>
              <span className={`mb-1 px-3 py-1 rounded-full text-xs font-bold border ${riskBg}`}>{riskLabel}</span>
            </div>
            <p className="text-gray-400 text-xs mt-3">{selectedState} — current composite score</p>
          </div>

          {/* Predicted Yield Drop */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">Predicted Yield Drop</p>
            <div className="flex items-end gap-3 mt-1">
              <span className="text-5xl font-black text-red-500">{yieldData}%</span>
              <span className="mb-1 px-3 py-1 rounded-full text-xs font-bold bg-red-50 border border-red-200 text-red-700">▼ BELOW AVG</span>
            </div>
            <p className="text-gray-400 text-xs mt-3">Versus previous season average</p>
          </div>

          {/* Market Pressure */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">Market Price Inflation</p>
            <div className="flex items-end gap-3 mt-1">
              <span className="text-5xl font-black text-yellow-500">{inflationData}%</span>
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
                  <Popup><strong>{selectedState}</strong><br />Yield Score: {yieldData}%</Popup>
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
            <h2 className="font-semibold text-gray-800 mb-4">    👨‍🌾 Farmer's Guide — {selectedState}</h2>
           <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
 
  {productionData ? (
    <div className="space-y-4">
      <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-r-lg">
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-tight">Status Update</p>
        <p className="text-sm text-emerald-900">
          {productionData.split('.')[0]}.
        </p>
      </div>
      
      <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
        {getProductionSection("Advice") || getProductionSection("Insights")}
      </div>
    </div>
  ) : (
    <div className="animate-pulse flex space-y-4 flex-col">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  )}
</div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">🤖 AI Risk Analysis</h2>
  
  {/* Card 1: Assessment */}
  <div className="bg-white border-t-4 border-blue-500 p-5 rounded-xl shadow-sm mb-5">
    <h3 className="font-bold text-gray-800 mb-2">📋 Overall Assessment</h3>
    <div className="text-sm text-gray-600 whitespace-pre-line">
      {getSection("Assessment") || "Parsing..."}
    </div>
  </div>

  {/* Card 2: Key Risks */}
  <div className="bg-white border-t-4 border-red-500 p-5 rounded-xl shadow-sm mb-5">
    <h3 className="font-bold text-gray-800 mb-2">⚠️ Key Risks</h3>
    <div className="text-sm text-gray-600 whitespace-pre-line">
      {getSection("Key Risks") || "Parsing..."}
    </div>
  </div>

  {/* Card 3: Mitigation */}
  <div className="bg-white border-t-4 border-emerald-500 p-5 rounded-xl shadow-sm mb-5">
    <h3 className="font-bold text-gray-800 mb-2">✅ Mitigation Plan</h3>
    <div className="text-sm text-gray-600 whitespace-pre-line">
      {getSection("Recommended Mitigation Strategies") || "Parsing..."}
    </div>
  </div>

          </div>

          
        </div>

      </div>
    </div>
  );
}