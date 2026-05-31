"use client";

import { usePathname } from "next/navigation";
import { Anchor, Ship, Truck, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col text-gray-900">
      {/* Ops Navigation */}
      <nav className="bg-blue-800 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="bg-blue-900 p-2 rounded-lg">
              <Anchor size={20} className="text-blue-300" />
            </div>
            
            {/* Dynamic Title based on the active route */}
            {pathname?.includes('/landings') ? (
              <div className="flex items-center gap-2 font-bold text-lg">
                <Ship size={20} className="text-blue-200" />
                <span>Harbour Landings</span>
              </div>
            ) : pathname?.includes('/logistics') ? (
              <div className="flex items-center gap-2 font-bold text-lg">
                <Truck size={20} className="text-blue-200" />
                <span>Cold Chain Logistics</span>
              </div>
            ) : (
              <div className="font-bold text-lg">Operations</div>
            )}
          </div>
          
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 bg-blue-900 hover:bg-red-600 px-3 py-2 text-sm font-medium rounded-lg transition" 
            title="Sign Out"
          >
            <LogOut size={16} /> <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Ops Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto">
        {children}
      </main>
    </div>
  );
}