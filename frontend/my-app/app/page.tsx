"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { AiRiskAnalysis , AiInsightAnalysis } from "./factory/Fixer";
import axios from "axios";
import Link from "next/link";

const Map = dynamic(() => import("./components/Map"), { ssr: false });

const getGroqEndpoint = () => {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY?.trim();
  if (!apiKey || apiKey === "your_groq_api_key_here") return "";
  return "https://api.groq.com/openai/v1/chat/completions";
};

const buildGroqBody = (systemPrompt: string, userMessage: string) => JSON.stringify({
  model: "llama-3.3-70b-versatile",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ],
  temperature: 0.3,
  max_tokens: 512,
});

const extractGroqText = (data: any): string =>
  data?.choices?.[0]?.message?.content?.trim() ?? "";

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
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const aiCooldownUntil = useRef<number>(0);
  const aiCache = useRef<Record<string, { insights: string; production: string }>>({});
  const AI_INSIGHTS_EXPERT = AiInsightAnalysis;


  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const AI_URL = getGroqEndpoint();
  const isAiConfigured = AI_URL.length > 0;

  //====================================================================================================================== //

  useEffect(() => {
    axios.get(`${API_URL}/greetings`)
      .then((r) => setGreeting(r.data.message))
      .catch(() => { });
  }, []);

  const chooseState = (state: string) => {
    setSelectedState(state);
    const found = STATES.find((s) => s.name === state);
    if (found) setPositionState(found.coords);
    axios.get(`${API_URL}/state/${state}`)
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
  axios.get(`${API_URL}/request_state_yield/${selectedState}`)
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
   axios.get(`${API_URL}/request_state_risk/${selectedState}`)
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
  axios.get(`${API_URL}/request_state_inflation/${selectedState}`)
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
  const runAiInsights = async () => {
    if (!isAiConfigured || aiUnavailable) return;
    if (yieldData === 0 || riskData === 0 || inflationData === 0) return;

    // serve from cache if we already fetched for this state
    if (aiCache.current[selectedState]) {
      setAiInsights(aiCache.current[selectedState].insights);
      setProductionData(aiCache.current[selectedState].production);
      return;
    }

    // respect cooldown from a previous 429
    if (Date.now() < aiCooldownUntil.current) {
      setAiInsights("Rate limit reached. Please wait a moment before switching states.");
      return;
    }

    const groqHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY?.trim()}`,
    };

    try {
      // --- Risk Analysis ---
      const riskRes = await fetch(AI_URL, {
        method: "POST",
        headers: groqHeaders,
        body: buildGroqBody(
          AiRiskAnalysis.content,
          `Given the current data for ${selectedState} — predicted yield drop of ${yieldData}%, risk score of ${riskData}, and market price inflation of ${inflationData}% — provide a concise analysis of the food security outlook for the next quarter. Highlight key risks, potential impacts on supply chains, and recommended mitigation strategies.`
        ),
      });

      if (riskRes.status === 429) {
        aiCooldownUntil.current = Date.now() + 60_000;
        setAiInsights("Rate limit reached. Please wait a moment before switching states.");
        return;
      }

      let insightsText = "";
      if (riskRes.ok) {
        const data = await riskRes.json();
        insightsText = extractGroqText(data) || "AI insights response was empty.";
        setAiInsights(insightsText);
      } else {
        setAiInsights("AI insights could not be generated right now.");
        return;
      }

      // small gap between the two calls
      await new Promise((r) => setTimeout(r, 1000));

      // --- Production / Farmer's Guide ---
      const analysisRes = await axios.get(`${API_URL}/request_state_analysis/${selectedState}`);
      const prodRes = await fetch(AI_URL, {
        method: "POST",
        headers: groqHeaders,
        body: buildGroqBody(
          AI_INSIGHTS_EXPERT.content,
          `Analyze the following state data for ${selectedState}: ${JSON.stringify(analysisRes.data.analysis)}`
        ),
      });

      if (prodRes.status === 429) {
        aiCooldownUntil.current = Date.now() + 60_000;
        setProductionData("Rate limit reached. Farmer's guide will retry shortly.");
        return;
      }
      if (prodRes.ok) {
        const data = await prodRes.json();
        const productionText = extractGroqText(data) || "AI production analysis response was empty.";
        setProductionData(productionText);
        aiCache.current[selectedState] = { insights: insightsText, production: productionText };
      } else {
        setProductionData("AI production analysis could not be generated right now.");
      }
    } catch (e) {
      setAiUnavailable(true);
      setAiInsights("AI insights unavailable.");
      setProductionData("AI production analysis unavailable.");
    }
  };

  const timer = setTimeout(runAiInsights, 2500);
  return () => clearTimeout(timer);
}, [selectedState, yieldData, riskData, inflationData]);

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
              <Map position={positionState} selectedState={selectedState} yieldData={yieldData} />
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