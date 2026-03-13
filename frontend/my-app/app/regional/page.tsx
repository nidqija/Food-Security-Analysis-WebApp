"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const STATES = [
    { name: "Johor", neighbors: ["Selangor", "Kedah"], region: "Southern" },
    { name: "Kedah", neighbors: ["Johor", "Selangor"], region: "Northern" },
    { name: "Selangor", neighbors: ["Johor", "Kedah"], region: "Central" },
    { name: "Sabah", neighbors: ["Sarawak", "Selangor"], region: "East Malaysia" },
    { name: "Sarawak", neighbors: ["Sabah", "Johor"], region: "East Malaysia" },
];







const CustomTooltip = ({
    active, payload, label,
}: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-sm shadow-lg">
                <p className="text-gray-500 font-medium mb-1">{label}</p>
                {payload.map((p) => (
                    <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
                ))}
            </div>
        );
    }
    return null;
};

function RegionalContent() {
    const searchParams = useSearchParams();
    const initialState = searchParams.get("state") ?? "Johor";
    const [selectedState, setSelectedState] = useState(initialState);
    const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
    const [tableData2 , setTableData2] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [yieldDrop, setYieldDrop] = useState<number | null>(null);
    const [riskScore , setRiskScore] = useState<number | null>(null);
    const [foodInflation , setFoodInflation] = useState<number | null>(null);
    const [predictedRainfall , setPredictedRainfall] = useState<number | null>(null);
    const [stateMetrics , setStateMetrics] = useState<Record<string, any>>({});

    const stateInfo = STATES.find((s) => s.name === selectedState);
    const columns = tableData.length > 0 ? Object.keys(tableData[0]).filter((k) => k !== "__typename") : [];
    const columns2 = tableData2.length > 0 ? Object.keys(tableData2[0]).filter((k) => k !== "__typename") : [];

    const getComparisonData = () => {
     const stateInfo = STATES.find((s) => s.name === selectedState);
     
     if (!stateInfo) return [];

     const base : Record<string, number[]> = {
        Johor: [ riskScore ?? 60, 65, yieldDrop ?? 18, 55],
        Kedah: [58, 71,  22, 78],
        Selangor: [81, 60, 14, 48],
        Sabah: [64, 55,  19, 63],
        Sarawak: [69, 58, 16, 57],
     };


     return [selectedState, ...stateInfo.neighbors].map((s) => ({
        state: s,
         // render the risk score and yield drop from the state metric from the promise if its available , otherwise use default value of 60
        "Risk Score": stateMetrics[s]?.riskScore ?? 60,
        "Rainfall Index":  stateMetrics[s]?.predictedRainfall ?? 10,
        "Yield Drop %": stateMetrics[s]?.yieldDrop ?? 15,
        "Food Price ↑%": stateMetrics[s]?.foodInflation ?? 50,
     }));
  }
    
      const comparisonData = getComparisonData();


    useEffect(() => {
        axios.get(`http://localhost:8000/load_raw_records/${selectedState}`)

        .then((r) => {
            console.log("Field Supply Index Record for", selectedState, "is", r.data.records) ;
            console.log("Field Crops Record for", selectedState, "is", r.data.training_data) ;
            setTableData(r.data.records || []);
            setTableData2(r.data.training_data || []);
        }
         )
        
        .catch(() => {
            console.log("Could not fetch predicted temp from backend API." , error)
            setTableData([])
        } )

    } , [selectedState])

useEffect(() =>{
    if (!stateInfo) return;

    const statestoFetch = [selectedState, ...stateInfo.neighbors];

    const fetchAllMetrics = async() =>{
        setLoading(true);
        try {
            const results = await Promise.all(
                statestoFetch.map( async (stateName) =>{
                    try {
                        const [yieldRes , riskRes , foodInflation , predictedRainfall] = await Promise.all([
                            axios.get(`http://localhost:8000/request_state_yield/${stateName}`),
                            axios.get(`http://localhost:8000/request_state_risk/${stateName}`),
                            axios.get(`http://localhost:8000/request_state_inflation/${stateName}`),
                            axios.get(`http://localhost:8000/request_state_predicted_rainfall/${stateName}`),
                        ]);

                         console.log(`Metrics for ${stateName}:`, {
                            yieldDrop: Math.round((yieldRes.data.predictions_jan || 0) * 100) / 100,
                            riskScore: Math.round((riskRes.data.risk_score || 0) * 100) / 100,
                            foodInflation: Math.round((foodInflation.data.predicted_price_change_jan || 0) * 100) / 100,
                            predictedRainfall: Math.round((predictedRainfall.data.predicted_rainfall || 0)),
                        });

                        return {
                            stateName,
                            yieldDrop: Math.round((yieldRes.data.predictions_jan || 0) * 100) / 100,
                            riskScore: Math.round((riskRes.data.risk_score || 0) * 100) / 100,
                            foodInflation: Math.round((foodInflation.data.predicted_price_change_jan || 0) * 100) / 100,
                            predictedRainfall: Math.round((predictedRainfall.data.predicted_rainfall || 0) / 100 * 100) / 100,
                        };

                       
                    } catch (err){
                        console.log(`Error fetching metrics for ${stateName}:`, err);
                        return {
                            stateName,
                            yieldDrop: 15,
                            riskScore: 60,
                            foodInflation: 50,
                            predictedRainfall: 10,
                        };
                    }
                })
            )

            const newMetrics: Record<string , any> = {};

            results.forEach((res) =>{
                newMetrics[res.stateName] = {
                    yieldDrop: res.yieldDrop,
                    riskScore: res.riskScore,
                    foodInflation: res.foodInflation,
                    predictedRainfall: res.predictedRainfall,
                }
            });

            setStateMetrics(newMetrics);
            setLoading(false);
        } catch (err) {
            console.log("Error fetching metrics:", err);
        }   
    };
    fetchAllMetrics();
} ,[selectedState , stateInfo])



 



    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Regional Deep-Dive</h1>
                        <p className="text-gray-500 mt-1 text-sm">State-level analysis, raw data, and AI-generated recommendations</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-gray-500 text-sm">State:</label>
                        <select
                            value={selectedState} onChange={(e) => setSelectedState(e.target.value)}
                            className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500 shadow-sm"
                        >
                            {STATES.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* State Banner */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-2xl shadow">
                            🏛️
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900">{selectedState}</p>
                            <p className="text-gray-400 text-sm">{stateInfo?.region} Malaysia</p>
                        </div>
                    </div>
                    <div className="flex gap-6 text-sm flex-wrap">
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider">Neighbors</p>
                            <p className="text-gray-800 font-medium mt-0.5">{stateInfo?.neighbors.join(", ")}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider">Data Records</p>
                            <p className="text-gray-800 font-medium mt-0.5">{loading ? "Loading…" : `${tableData.length + tableData2.length} rows`}</p>
                        </div>
                        
                    </div>
                </div>

                {/* Raw Data + AI Advice */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Table */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <h2 className="font-semibold text-gray-800 mb-4">📋 Raw Database Records — {selectedState}</h2>
                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                                ⚠️ {error}
                                <p className="text-xs mt-1 text-red-500">Make sure the backend is running at localhost:8000</p>
                            </div>
                        ) : tableData.length === 0 ? (
                            <p className="text-gray-400 text-sm">No data returned from API.</p>
                        ) : (
                            <>
                            <div className="overflow-auto max-h-72 rounded-xl border border-gray-100 mb-5">
                                <p className="p-2">Food Supply Index Records</p>
                                <table className="w-full text-xs">
                                    <thead>
                                        
                                        <tr className="bg-gray-50 sticky top-0">
                                            
                                            {columns.map((col) => (
                                                <>
                                                
                                                <th key={col} className="px-3 py-2 text-left text-gray-500 font-semibold capitalize whitespace-nowrap">
                                                    {col.replace(/_/g, " ")}
                                                </th>
                                                </>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableData.map((row, i) => (
                                            <tr key={i} className={`border-t border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-emerald-50 transition-colors`}>
                                                {columns.map((col) => (
                                                    <td key={col} className="px-3 py-2 text-gray-600 whitespace-nowrap">{String(row[col] ?? "—")}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                             <div className="overflow-auto max-h-72 rounded-xl border border-gray-100">
                                <p className="p-2">Field Crops Production Records</p>
                                <table className="w-full text-xs">
                                    <thead>
                                        
                                        <tr className="bg-gray-50 sticky top-0">
                                            
                                            {columns2.map((col) => (
                                                <>
                                                
                                                <th key={col} className="px-3 py-2 text-left text-gray-500 font-semibold capitalize whitespace-nowrap">
                                                    {col.replace(/_/g, " ")}
                                                </th>
                                                </>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableData2.map((row, i) => (
                                            <tr key={i} className={`border-t border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-emerald-50 transition-colors`}>
                                                {columns2.map((col) => (
                                                    <td key={col} className="px-3 py-2 text-gray-600 whitespace-nowrap">{String(row[col] ?? "—")}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            </>
                        )}
                    </div>

                    {/* AI Advice */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <h2 className="font-semibold text-gray-800 mb-4">Peer Review Food Supply Index Score</h2>
                        <div className="space-y-4">
                           
                        </div>
                        <div className="mt-4 p-3 bg-cyan-50 border border-cyan-100 rounded-xl text-xs text-cyan-700">
                            💡 Food Supply Index Score based on news fetching for {selectedState}.
                        </div>
                    </div>
                </div>

                {/* Comparison Chart */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="font-semibold text-gray-800 mb-1">
                        📊 Neighbor State Comparison — {selectedState} vs {stateInfo?.neighbors.join(" & ")}
                    </h2>
                    <p className="text-gray-400 text-xs mb-6">Side-by-side metrics across risk score, rainfall, yield drop, and food price inflation.</p>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={comparisonData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="state" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                            <YAxis 
  tick={{ fill: "#9ca3af", fontSize: 11 }} 
  axisLine={{ stroke: "#e5e7eb" }}
  label={{ value: 'mm', angle: -90, position: 'insideLeft' }} 
/>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ color: "#6b7280", fontSize: 12, paddingTop: 12 }} />
                            <Bar dataKey="Risk Score" fill="#f87171" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Rainfall Index" fill="#34d399" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Yield Drop %" fill="#fb923c" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Food Price ↑%" fill="#818cf8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

            </div>
        </div>
    );
}

export default function RegionalPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <RegionalContent />
        </Suspense>
    );
}
