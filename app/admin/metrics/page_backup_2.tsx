"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  TrendingDown, 
  TrendingUp, 
  Users, 
  Wallet, 
  Target, 
  Activity, 
  Anchor,
  AlertCircle
} from "lucide-react";

export default function AdminMetricsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    activeCustomers: 0,
    marketingSpend: 0,
    cac: 0,
    avgPremium: 0,
    penetrationTarget: 0,
    totalUnits: 0,
    daysActive: 0
  });

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        // 1. Fetch Orders for Revenue & Active Customers
        const { data: orders } = await supabase.from("orders").select("total_revenue, customer_id, created_at");
        
        // 2. Fetch Marketing Spend for CAC
        const { data: marketing } = await supabase.from("marketing").select("cost");
        
        // 3. Fetch Landings for Fisherfolk Premium
        const { data: landings } = await supabase.from("landings").select("price_paid_per_kg, market_rate");
        
        // 4. Fetch Customers & Localities for Penetration Target
        const { data: customers } = await supabase.from("customers").select("id, locality_id");
        const { data: localities } = await supabase.from("localities").select("id, name, units").eq("loi_signed", 1);

        // --- NUMBER CRUNCHING ---
        const safeOrders = orders || [];
        const safeMarketing = marketing || [];
        const safeLandings = landings || [];
        const safeCustomers = customers || [];
        const safeLocalities = localities || [];

        // Revenue & Customers
        const totalRev = safeOrders.reduce((sum, o) => sum + (o.total_revenue || 0), 0);
        const uniqueCustomers = new Set(safeOrders.map(o => o.customer_id)).size;

        // Marketing & CAC
        const totalSpend = safeMarketing.reduce((sum, m) => sum + (m.cost || 0), 0);
        const currentCac = uniqueCustomers > 0 ? (totalSpend / uniqueCustomers) : 0;

        // Fisherfolk Premium (Supply-side Alpha)
        let totalPremium = 0;
        safeLandings.forEach(l => {
          totalPremium += (l.price_paid_per_kg - l.market_rate);
        });
        const avgFisherPremium = safeLandings.length > 0 ? (totalPremium / safeLandings.length) : 0;

        // Penetration Metric (Total signed units vs active customers in those units)
        const totalAddressableUnits = safeLocalities.reduce((sum, loc) => sum + loc.units, 0);
        const penetrationRate = totalAddressableUnits > 0 ? (uniqueCustomers / totalAddressableUnits) * 100 : 0;

        // Pilot Duration
        let pilotDays = 1;
        if (safeOrders.length > 0) {
          const firstOrder = new Date(safeOrders[safeOrders.length - 1].created_at).getTime();
          const now = new Date().getTime();
          pilotDays = Math.max(1, Math.ceil((now - firstOrder) / (1000 * 3600 * 24)));
        }

        setMetrics({
          totalRevenue: totalRev,
          activeCustomers: uniqueCustomers,
          marketingSpend: totalSpend,
          cac: currentCac,
          avgPremium: avgFisherPremium,
          penetrationTarget: penetrationRate,
          totalUnits: totalAddressableUnits,
          daysActive: pilotDays
        });

      } catch (err) {
        console.error("Failed to load metrics", err);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-bold tracking-widest uppercase text-sm">Aggregating Pilot Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Activity className="text-blue-600" size={36}/> 90-Day Pilot Traction
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Live data aggregated from Supabase database.</p>
          </div>
          <div className="bg-white px-5 py-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="font-mono text-sm font-bold text-gray-700">Day {metrics.daysActive} of 90</span>
          </div>
        </div>

        {/* TOP KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          {/* Revenue */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition">
            <div className="absolute -right-6 -top-6 bg-blue-50 w-24 h-24 rounded-full group-hover:scale-110 transition duration-500"></div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 relative z-10">Pilot Revenue</p>
            <h3 className="text-3xl font-black text-gray-900 relative z-10">₹{metrics.totalRevenue.toLocaleString()}</h3>
            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-blue-600 relative z-10">
              <Wallet size={16} /> <span>Direct to Consumer</span>
            </div>
          </div>

          {/* CAC */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition">
            <div className="absolute -right-6 -top-6 bg-red-50 w-24 h-24 rounded-full group-hover:scale-110 transition duration-500"></div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 relative z-10">Current CAC</p>
            <h3 className="text-3xl font-black text-gray-900 relative z-10">₹{metrics.cac.toFixed(2)}</h3>
            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-green-600 relative z-10">
              <TrendingDown size={16} /> <span>Target: &lt;₹500</span>
            </div>
          </div>

          {/* Fisherfolk Premium */}
          <div className="bg-gradient-to-br from-blue-900 to-gray-900 p-6 rounded-3xl shadow-lg relative overflow-hidden group hover:shadow-xl transition">
            <div className="absolute -right-6 -top-6 bg-blue-800/50 w-24 h-24 rounded-full group-hover:scale-110 transition duration-500"></div>
            <p className="text-sm font-bold text-blue-200 uppercase tracking-wider mb-2 relative z-10">Fisherfolk Premium</p>
            <h3 className="text-3xl font-black text-white relative z-10">+₹{metrics.avgPremium.toFixed(2)}</h3>
            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-green-400 relative z-10">
              <TrendingUp size={16} /> <span>Per kg above auction</span>
            </div>
          </div>

          {/* Active Customers */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition">
            <div className="absolute -right-6 -top-6 bg-indigo-50 w-24 h-24 rounded-full group-hover:scale-110 transition duration-500"></div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 relative z-10">Active Buyers</p>
            <h3 className="text-3xl font-black text-gray-900 relative z-10">{metrics.activeCustomers}</h3>
            <div className="mt-4 flex items-center gap-2 text-sm font-bold text-indigo-600 relative z-10">
              <Users size={16} /> <span>Verified Accounts</span>
            </div>
          </div>

        </div>

        {/* PROGRESS CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Apartment Penetration */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Target size={20} className="text-blue-600"/> Beachhead Penetration</h3>
                <p className="text-sm text-gray-500 mt-1">Targeting 25% of {metrics.totalUnits} signed complex units.</p>
              </div>
              <span className="text-3xl font-black text-blue-600">{metrics.penetrationTarget.toFixed(1)}%</span>
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden mb-2 relative">
              <div 
                className="bg-blue-600 h-6 rounded-full transition-all duration-1000 ease-out relative" 
                style={{ width: `${Math.min(metrics.penetrationTarget, 100)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
              </div>
              {/* Target Marker */}
              <div className="absolute top-0 bottom-0 left-[25%] border-l-2 border-dashed border-gray-800 z-10"></div>
            </div>
            <div className="flex justify-between text-xs font-bold text-gray-400 mt-2">
              <span>0%</span>
              <span className="text-gray-800 pr-[70%]">25% Goal</span>
              <span>100%</span>
            </div>
          </div>

          {/* Working Capital Runway */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Anchor size={20} className="text-red-500"/> Working Capital Burn</h3>
                <p className="text-sm text-gray-500 mt-1">₹12 Lakh Pilot Budget Limit</p>
              </div>
              <span className="text-2xl font-black text-red-600">
                {((metrics.marketingSpend / 1200000) * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden mb-2">
              <div 
                className="bg-red-500 h-6 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min((metrics.marketingSpend / 1200000) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs font-bold text-gray-400 mt-2">
              <span>₹0</span>
              <span>Spent: ₹{metrics.marketingSpend.toLocaleString()}</span>
              <span>₹12,000,000 Max</span>
            </div>
          </div>

        </div>

        {/* WARNING STATE FOR EMPTY DB */}
        {metrics.activeCustomers === 0 && (
          <div className="mt-10 bg-orange-50 border border-orange-200 p-6 rounded-2xl flex items-start gap-4">
            <AlertCircle className="text-orange-500 shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-orange-900 text-lg">Awaiting Live Pilot Data</h4>
              <p className="text-orange-800 text-sm mt-1">Your metrics currently show zero active customers. To bring this dashboard to life for the presentation, create a few test accounts and push orders through the storefront to populate the graphs!</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}