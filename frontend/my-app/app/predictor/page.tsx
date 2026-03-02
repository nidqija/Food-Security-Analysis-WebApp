"use client";

import { useState, useMemo } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const BASE_MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const HISTORICAL_AVG = [82, 79, 76, 74, 77, 80, 83, 85, 84, 80, 78, 81];
const BASE_PREDICTED = [79, 74, 69, 65, 68, 71, 74, 76, 75, 70, 67, 72];

const BASE_RADAR = [
    { subject: "Climate Risk", value: 68 },
    { subject: "Disease Index", value: 45 },
    { subject: "Econ. Pressure", value: 72 },
    { subject: "Supply Chain", value: 55 },
    { subject: "Water Stress", value: 80 },
];

const CustomTooltip = ({
    active, payload, label,
}: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-sm shadow-lg">
                <p className="text-gray-500 font-medium mb-1">{label}</p>
                {payload.map((p) => (
                    <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value.toFixed(1)}</strong></p>
                ))}
            </div>
        );
    }
    return null;
};

export default function PredictorPage() {
    const [tempDelta, setTempDelta] = useState(0);

    const chartData = useMemo(() =>
        BASE_MONTHS.map((month, i) => ({
            month,
            "Historical Avg": HISTORICAL_AVG[i],
            "AI Predicted": parseFloat(Math.max(30, BASE_PREDICTED[i] - tempDelta * 4.2).toFixed(1)),
        })), [tempDelta]);

    const radarData = useMemo(() =>
        BASE_RADAR.map((item) =>
            item.subject === "Climate Risk" || item.subject === "Water Stress"
                ? { ...item, value: Math.min(100, item.value + tempDelta * 5) }
                : item
        ), [tempDelta]);

    const totalRisk = useMemo(
        () => (radarData.reduce((s, d) => s + d.value, 0) / radarData.length).toFixed(0),
        [radarData]
    );

    const riskLevel =
        Number(totalRisk) > 65
            ? { label: "HIGH RISK", color: "text-red-600", bg: "bg-red-50 border-red-200 text-red-700" }
            : Number(totalRisk) > 45
                ? { label: "MODERATE", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200 text-yellow-700" }
                : { label: "STABLE", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 text-emerald-700" };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Predictor &amp; Analytics</h1>
                    <p className="text-gray-500 mt-1 text-sm">12-month AI yield forecast and risk breakdown for Malaysia</p>
                </div>

                {/* What-If Simulator */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                                🌡️ What-If Temperature Simulator
                            </h2>
                            <p className="text-gray-400 text-xs mt-1">
                                Increase mean temperature to see how predicted yield drops in real time.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-400">+0°C</span>
                            <input
                                type="range" min={0} max={4} step={0.5} value={tempDelta}
                                onChange={(e) => setTempDelta(Number(e.target.value))}
                                className="w-48 accent-emerald-600"
                            />
                            <span className="text-sm text-gray-400">+4°C</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold border ${riskLevel.bg}`}>
                                +{tempDelta}°C
                            </span>
                        </div>
                    </div>
                    {tempDelta > 0 && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                            ⚠️ At +{tempDelta}°C, predicted yield drops by an additional{" "}
                            <strong>{(tempDelta * 4.2).toFixed(1)}%</strong>. National food security
                            composite risk: <span className={`font-bold ${riskLevel.color}`}>{totalRisk}/100 — {riskLevel.label}</span>
                        </div>
                    )}
                </div>

                {/* Trend Chart */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-6 flex-wrap gap-2">
                        <div>
                            <h2 className="font-semibold text-gray-800">📊 Seasonal Yield Forecast — 12-Month Outlook</h2>
                            <p className="text-gray-400 text-xs mt-1">AI-predicted yield index vs historical seasonal average</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1.5">
                                <span className="w-6 h-0.5 bg-cyan-500 inline-block rounded-full" />
                                <span className="text-gray-500">AI Predicted</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-6 h-0.5 bg-emerald-500 inline-block rounded-full" style={{ borderTop: "2px dashed" }} />
                                <span className="text-gray-500">Historical Avg</span>
                            </span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                            <YAxis domain={[30, 100]} tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={{ stroke: "#e5e7eb" }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="Historical Avg" stroke="#10b981" strokeWidth={2}
                                strokeDasharray="5 5" dot={{ fill: "#10b981", r: 3 }} activeDot={{ r: 5 }} />
                            <Line type="monotone" dataKey="AI Predicted" stroke="#06b6d4" strokeWidth={2.5}
                                dot={{ fill: "#06b6d4", r: 3 }} activeDot={{ r: 5 }} />
                            <Legend wrapperStyle={{ display: "none" }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Radar + Breakdown List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="font-semibold text-gray-800 mb-1">🎯 Risk Breakdown Radar</h2>
                        <p className="text-gray-400 text-xs mb-4">Composite risk across five dimensions — higher = more critical</p>
                        <ResponsiveContainer width="100%" height={280}>
                            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                                <Radar name="Risk" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} strokeWidth={2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="font-semibold text-gray-800 mb-1">📋 Risk Factor Summary</h2>
                        <p className="text-gray-400 text-xs mb-5">Individual scores (0–100). Values update with temperature simulator.</p>
                        <div className="space-y-4">
                            {radarData.map((item) => {
                                const pct = Math.min(100, item.value);
                                const barColor = pct > 70 ? "bg-red-500" : pct > 50 ? "bg-yellow-400" : "bg-emerald-500";
                                const textColor = pct > 70 ? "text-red-600" : pct > 50 ? "text-yellow-600" : "text-emerald-600";
                                return (
                                    <div key={item.subject}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">{item.subject}</span>
                                            <span className={`font-bold ${textColor}`}>{pct.toFixed(0)}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className={`h-2 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={`mt-6 p-4 rounded-xl border ${riskLevel.bg}`}>
                            <p className="text-xs text-gray-500 mb-1">Overall Risk Index</p>
                            <p className={`text-3xl font-black ${riskLevel.color}`}>
                                {totalRisk}<span className="text-base font-normal ml-1">/100</span>
                            </p>
                            <p className={`text-xs mt-1 font-semibold ${riskLevel.color}`}>{riskLevel.label}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
