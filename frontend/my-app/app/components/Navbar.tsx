"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
    { href: "/", label: "Executive Dashboard", description: "Now", icon: "🛡️" },
    { href: "/predictor", label: "Predictor & Analytics", description: "Future", icon: "📈" },
    { href: "/regional", label: "Regional Deep-Dive", description: "Action", icon: "🗺️" },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm shadow group-hover:scale-105 transition-transform">
                        🇲🇾
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-gray-900 font-bold text-sm leading-tight">FoodSecure AI</p>
                        <p className="text-gray-400 text-xs leading-tight">Malaysia Early Warning System</p>
                    </div>
                </Link>

                {/* Nav Links */}
                <div className="flex items-center gap-1">
                    {navLinks.map((link) => {
                        const isActive =
                            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                        ? "bg-gray-100 text-gray-900"
                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                    }`}
                            >
                                <span className="text-base leading-none">{link.icon}</span>
                                <div className="hidden md:flex flex-col">
                                    <span className="leading-tight">{link.label}</span>
                                    <span className={`text-xs leading-tight ${isActive ? "text-emerald-600" : "text-gray-400"}`}>
                                        The &quot;{link.description}&quot; Page
                                    </span>
                                </div>
                                {isActive && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-px w-4/5 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Status pill */}
                <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-gray-500 text-xs font-medium">Live</span>
                </div>
            </div>
        </nav>
    );
}
