"use client";

import Link from "next/link";
import { Anchor, LineChart, Package, LogOut, Ship, Truck } from "lucide-react"; // Added Ship and Truck
import { supabase } from "@/lib/supabaseClient";

export default function AdminLayout({ children }: { children: React.ReactNode }) {

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      {/* Admin Navigation */}
      <nav className="bg-gray-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xl font-bold text-blue-400 mr-4">
              <Anchor /> Admin
            </div>
            <Link href="/admin/metrics" className="hover:text-blue-300 flex items-center gap-2 text-sm font-medium transition">
              <LineChart size={18} /> Metrics
            </Link>
            <Link href="/admin/products" className="hover:text-blue-300 flex items-center gap-2 text-sm font-medium transition">
              <Package size={18} /> Catalog
            </Link>
            {/* --- NEW LOGBOOK LINKS --- */}
            <Link href="/admin/landings" className="hover:text-blue-300 flex items-center gap-2 text-sm font-medium transition border-l border-gray-700 pl-6 ml-2">
              <Ship size={18} /> Landings Log
            </Link>
            <Link href="/admin/logistics" className="hover:text-blue-300 flex items-center gap-2 text-sm font-medium transition">
              <Truck size={18} /> Logistics Log
            </Link>
          </div>
          
          <button onClick={handleLogout} className="text-gray-300 hover:text-red-400 flex items-center gap-2 text-sm font-medium transition">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </nav>

      {/* Admin Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}