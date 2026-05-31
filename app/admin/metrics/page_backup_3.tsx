"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  TrendingDown, TrendingUp, Users, Wallet, Target, Activity, Anchor, AlertCircle, Compass, Scale, Crosshair
} from "lucide-react";

// --- SERIES A PILOT TARGETS ---
const TARGET_REVENUE = 1500000; // ₹15 Lakhs
const TARGET_VOLUME_KG = 3000;  // 3,000 kg needed to keep truck OPEX at ₹8-12/kg
const TARGET_CUSTOMERS = 250;   // 250 active buyers for density
const PILOT_LENGTH_DAYS = 90;

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
    daysActive: 0,
    totalWeightKg: 0,
  });

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        // 1. Fetch Orders WITH item weights for volume tracking
        const { data: orders } = await supabase.from("orders").select(`
          total_revenue, 
          customer_id, 
          created_at,
          order_items ( weight )
        `);
        
        const { data: marketing } = await supabase.from("marketing").select("cost");
        const { data: landings } = await supabase.from("landings").select("price_paid_per_kg, market_rate");
        const { data: customers } = await supabase.from("customers").select("id, locality_id");
        const { data: localities } = await supabase.from("localities").select("id, name, units").eq("loi_signed", 1);

        const safeOrders = orders || [];
        const safeMarketing = marketing || [];
        const safeLandings = landings || [];
        const safeLocalities = localities || [];

        // Core Metrics
        const totalRev = safeOrders.reduce((sum, o) => sum + (o.total_revenue || 0), 0);
        const uniqueCustomers = new Set(safeOrders.map(o => o.customer_id)).size;
        
        // Volume Calculation
        const totalWeight = safeOrders.reduce((sum, o) => {
          const itemWeight = o.order_items?.reduce((wSum: number, item: any) => wSum + (item.weight || 0), 0) || 0;
          return sum + itemWeight;
        }, 0);

        const totalSpend = safeMarketing.reduce((sum, m) => sum + (m.cost || 0), 0);
        const currentCac = uniqueCustomers > 0 ? (totalSpend / uniqueCustomers) : 0;

        let totalPremium = 0;
        safeLandings.forEach(l => {
          totalPremium += (l.price_paid_per_kg - l.market_rate);
        });
        const avgFisherPremium = safeLandings.length > 0 ? (totalPremium / safeLandings.length) : 0;

        const totalAddressableUnits = safeLocalities.reduce((sum, loc) => sum + loc.units, 0);
        const penetrationRate = totalAddressableUnits > 0 ? (uniqueCustomers / totalAddressableUnits) * 100 : 0;

        let pilotDays = 1;
        if (safeOrders.length > 0) {
          // Find the oldest order to calculate days active
          const oldestOrderDate = safeOrders.reduce((oldest, current) => {
            return new Date(current.created_at) < new Date(oldest) ? current.created_at : oldest;
          }, safeOrders.created_at);
          
          const firstOrderTime = new Date(oldestOrderDate).getTime();
          const now = new Date().getTime();
          pilotDays = Math.max(1, Math.ceil((now - firstOrderTime) / (1000 * 3600 * 24)));
        }

        setMetrics({
          totalRevenue: totalRev,
          activeCustomers: uniqueCustomers,
          marketingSpend: totalSpend,
          cac: currentCac,
          avgPremium: avgFisherPremium,
          penetrationTarget: penetrationRate,
          totalUnits: totalAddressableUnits,
          daysActive: pilotDays,
          totalWeightKg: totalWeight
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

  // --- PROJECTIONS MATH ---
  const daysRemaining = Math.max(1, PILOT_LENGTH_DAYS - metrics.daysActive);
  const revenueNeeded = Math.max(0, TARGET_REVENUE - metrics.totalRevenue);
  const volumeNeeded = Math.max(0, TARGET_VOLUME_KG - metrics.totalWeightKg);
  
  const dailyRevenueTarget = revenueNeeded / daysRemaining;
  const dailyVolumeTarget = volumeNeeded / daysRemaining;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Activity className="text-blue-600" size={36}/> 90-Day Pilot Traction
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Live data aggregated from Malpe Harbour to BLR.</p>
          </div>
          <div className="bg-white px-5 py-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="font-mono text-sm font-bold text-gray-700">Day {metrics.daysActive} of {PILOT_LENGTH_DAYS}</span>
          </div>
        </div>

        {/* TOP KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Pilot Revenue</p>
            <h3 className="text-3xl font-black text-gray-900">₹{metrics.totalRevenue.toLocaleString()}</h3>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Current CAC</p>
            <h3 className="text-3xl font-black text-gray-900">₹{metrics.cac.toFixed(2)}</h3>
          </div>
          <div className="bg-gradient-to-br from-blue-900 to-gray-900 p-6 rounded-3xl shadow-lg">
            <p className="text-sm font-bold text-blue-200 uppercase tracking-wider mb-2">Fisherfolk Premium</p>
            <h3 className="text-3xl font-black text-white">+₹{metrics.avgPremium.toFixed(2)}</h3>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Active Buyers</p>
            <h3 className="text-3xl font-black text-gray-900">{metrics.activeCustomers}</h3>
          </div>
        </div>

        {/* PROGRESS CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Target size={20} className="text-blue-600"/> Beachhead Penetration</h3>
                <p className="text-sm text-gray-500 mt-1">Targeting 25% of {metrics.totalUnits} signed complex units.</p>
              </div>
              <span className="text-3xl font-black text-blue-600">{metrics.penetrationTarget.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden relative">
              <div className="bg-blue-600 h-6 rounded-full" style={{ width: `${Math.min(metrics.penetrationTarget, 100)}%` }}></div>
              <div className="absolute top-0 bottom-0 left-[25%] border-l-2 border-dashed border-gray-800 z-10"></div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Anchor size={20} className="text-red-500"/> Capital Burn vs Output</h3>
                <p className="text-sm text-gray-500 mt-1">₹12 Lakh Pilot Budget Limit</p>
              </div>
              <span className="text-2xl font-black text-red-600">{((metrics.marketingSpend / 1200000) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
              <div className="bg-red-500 h-6 rounded-full" style={{ width: `${Math.min((metrics.marketingSpend / 1200000) * 100, 100)}%` }}></div>
            </div>
          </div>
        </div>

        {/* --- NEW: SERIES A OPERATIONS COMPASS --- */}
        <div className="bg-gray-900 p-8 rounded-[2rem] shadow-2xl border border-gray-800 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="bg-blue-600/20 p-3 rounded-full text-blue-400"><Compass size={28} /></div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Series A Operations Compass</h2>
              <p className="text-gray-400 text-sm">Calculated daily targets to hit a 10/10 investor traction score.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Volume Target */}
            <div className="bg-gray-800/50 p-6 rounded-3xl border border-gray-700 hover:border-blue-500/50 transition">
              <Scale className="text-blue-400 mb-4" size={24} />
              <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Logistics OPEX Goal</p>
              <p className="text-2xl font-black mt-1">{metrics.totalWeightKg.toFixed(1)} <span className="text-gray-500 text-lg">/ {TARGET_VOLUME_KG} kg</span></p>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-300">
                  <span className="font-bold text-blue-400">{dailyVolumeTarget.toFixed(1)} kg</span> daily volume required to lock in the ₹10/kg truck rate.
                </p>
              </div>
            </div>

            {/* Revenue Target */}
            <div className="bg-gray-800/50 p-6 rounded-3xl border border-gray-700 hover:border-green-500/50 transition">
              <TrendingUp className="text-green-400 mb-4" size={24} />
              <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Revenue Goal</p>
              <p className="text-2xl font-black mt-1">₹{(metrics.totalRevenue / 100000).toFixed(2)}L <span className="text-gray-500 text-lg">/ ₹15L</span></p>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-300">
                  <span className="font-bold text-green-400">₹{dailyRevenueTarget.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> daily run-rate required to hit financial projections.
                </p>
              </div>
            </div>

            {/* Acquisition Target */}
            <div className="bg-gray-800/50 p-6 rounded-3xl border border-gray-700 hover:border-purple-500/50 transition">
              <Crosshair className="text-purple-400 mb-4" size={24} />
              <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Acquisition Goal</p>
              <p className="text-2xl font-black mt-1">{metrics.activeCustomers} <span className="text-gray-500 text-lg">/ {TARGET_CUSTOMERS} users</span></p>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-300">
                  Acquire <span className="font-bold text-purple-400">{TARGET_CUSTOMERS - metrics.activeCustomers} more users</span> in target complexes to achieve density.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}