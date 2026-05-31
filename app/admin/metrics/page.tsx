"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  TrendingDown, TrendingUp, Users, Wallet, Target, Activity, Anchor, 
  AlertCircle, Compass, Scale, Crosshair, ShoppingCart, Clock 
} from "lucide-react";

// --- SERIES A TARGETS ---
const TARGET_REVENUE = 1500000; 
const TARGET_VOLUME_KG = 3000;  
const TARGET_CUSTOMERS = 250;   
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
    recentOrders: [] as any[]
  });

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        // Fetch core data
        const { data: orders } = await supabase.from("orders").select(`
          id, total_revenue, customer_id, created_at, status,
          order_items ( weight )
        `).order('created_at', { ascending: false });
        
        const { data: marketing } = await supabase.from("marketing").select("cost");
        const { data: landings } = await supabase.from("landings").select("price_paid_per_kg, market_rate");
        const { data: customers } = await supabase.from("customers").select("id, locality_id");
        const { data: localities } = await supabase.from("localities").select("units").eq("loi_signed", 1);

        const safeOrders = orders || [];
        const safeMarketing = marketing || [];
        const safeLandings = landings || [];
        const safeLocalities = localities || [];

        // 1. Core Financials
        const totalRev = safeOrders.reduce((sum, o) => sum + (o.total_revenue || 0), 0);
        const uniqueCustomers = new Set(safeOrders.map(o => o.customer_id)).size;
        
        // 2. Volume Math
        const totalWeight = safeOrders.reduce((sum, o) => {
          const itemWeight = o.order_items?.reduce((wSum: number, item: any) => wSum + (item.weight || 0), 0) || 0;
          return sum + itemWeight;
        }, 0);

        // 3. Marketing & CAC
        const totalSpend = safeMarketing.reduce((sum, m) => sum + (m.cost || 0), 0);
        const currentCac = uniqueCustomers > 0 ? (totalSpend / uniqueCustomers) : 0;

        // 4. Fisherfolk Premium
        let totalPremium = 0;
        safeLandings.forEach(l => {
          totalPremium += ((l.price_paid_per_kg || 0) - (l.market_rate || 0));
        });
        const avgFisherPremium = safeLandings.length > 0 ? (totalPremium / safeLandings.length) : 0;

        // 5. Penetration
        const totalAddressableUnits = safeLocalities.reduce((sum, loc) => sum + (loc.units || 0), 0);
        const penetrationRate = totalAddressableUnits > 0 ? (uniqueCustomers / totalAddressableUnits) * 100 : 0;

        // 6. BULLETPROOF DATE MATH
        let pilotDays = 1;
        const validOrders = safeOrders.filter(o => o.created_at); 
        
        if (validOrders.length > 0) {
          const oldestDateStr = validOrders.reduce((oldest, current) => {
            return new Date(current.created_at).getTime() < new Date(oldest).getTime() ? current.created_at : oldest;
          }, validOrders.created_at);

          const firstOrderTime = new Date(oldestDateStr).getTime();
          if (!isNaN(firstOrderTime)) {
            const now = new Date().getTime();
            pilotDays = Math.max(1, Math.ceil((now - firstOrderTime) / (1000 * 3600 * 24)));
          }
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
          totalWeightKg: totalWeight,
          recentOrders: safeOrders.slice(0, 4) 
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

  const daysRemaining = Math.max(1, PILOT_LENGTH_DAYS - metrics.daysActive);
  const revenueNeeded = Math.max(0, TARGET_REVENUE - metrics.totalRevenue);
  const volumeNeeded = Math.max(0, TARGET_VOLUME_KG - metrics.totalWeightKg);
  
  const dailyRevenueTarget = revenueNeeded / daysRemaining;
  const dailyVolumeTarget = volumeNeeded / daysRemaining;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Activity className="text-blue-600" size={36}/> Pilot Command Center
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Live unit economics & logistics telemetry.</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="font-mono text-sm font-bold text-gray-700">LIVE</span>
            </div>
            <div className="h-6 w-px bg-gray-200"></div>
            <span className="font-bold text-blue-900 text-sm">Day {metrics.daysActive} of {PILOT_LENGTH_DAYS}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-50 p-3 rounded-2xl text-blue-600"><Wallet size={20}/></div>
            </div>
            <h3 className="text-3xl font-black text-gray-900">₹{metrics.totalRevenue.toLocaleString()}</h3>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-1">Pilot Revenue</p>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-red-50 p-3 rounded-2xl text-red-600"><TrendingDown size={20}/></div>
            </div>
            <h3 className="text-3xl font-black text-gray-900">₹{metrics.cac.toFixed(2)}</h3>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-1">Current CAC</p>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-gray-900 p-6 rounded-3xl shadow-lg transform hover:-translate-y-1 transition duration-300 relative overflow-hidden">
             <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="bg-blue-800/50 backdrop-blur-md p-3 rounded-2xl text-green-400 border border-blue-700/50"><TrendingUp size={20}/></div>
            </div>
            <h3 className="text-3xl font-black text-white relative z-10">+₹{metrics.avgPremium.toFixed(2)}</h3>
            <p className="text-sm font-bold text-blue-200 uppercase tracking-wider mt-1 relative z-10">Fisherfolk Premium / kg</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><Users size={20}/></div>
            </div>
            <h3 className="text-3xl font-black text-gray-900">{metrics.activeCustomers}</h3>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-1">Active Buyers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Target size={20} className="text-blue-600"/> Beachhead Penetration</h3>
                  <p className="text-sm text-gray-500 mt-1">Targeting 25% of {metrics.totalUnits} signed complex units.</p>
                </div>
                <span className="text-3xl font-black text-blue-600">{metrics.penetrationTarget.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden relative">
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 h-4 rounded-full transition-all duration-1000" style={{ width: `${Math.min(metrics.penetrationTarget, 100)}%` }}></div>
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
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                <div className="bg-gradient-to-r from-red-400 to-red-600 h-4 rounded-full transition-all duration-1000" style={{ width: `${Math.min((metrics.marketingSpend / 1200000) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col h-full">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6"><Clock size={20} className="text-gray-400"/> Recent Activity</h3>
            <div className="flex-1 space-y-4">
              {metrics.recentOrders.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No orders yet.</p>
              ) : (
                metrics.recentOrders.map((order, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><ShoppingCart size={16}/></div>
                      <div>
                        {/* THE FIX IS RIGHT HERE: */}
                        <p className="text-sm font-bold text-gray-900">
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.created_at ? new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">₹{order.total_revenue?.toFixed(0)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl border border-gray-800 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-green-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>
          
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="bg-white/10 backdrop-blur-lg p-3 rounded-full text-white border border-white/20"><Compass size={28} /></div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Series A Operations Compass</h2>
              <p className="text-gray-400 text-sm mt-1">Calculated daily targets to hit a 10/10 investor traction score.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="bg-gray-800/40 backdrop-blur-xl p-6 rounded-3xl border border-gray-700 hover:border-blue-500/50 transition duration-300">
              <Scale className="text-blue-400 mb-4" size={24} />
              <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Logistics OPEX Goal</p>
              <p className="text-2xl font-black mt-1">{metrics.totalWeightKg.toFixed(1)} <span className="text-gray-500 text-lg font-medium">/ {TARGET_VOLUME_KG} kg</span></p>
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <p className="text-sm text-gray-300 leading-relaxed">
                  <span className="font-bold text-blue-400">{dailyVolumeTarget.toFixed(1)} kg</span> daily volume required to lock in the ₹10/kg truck rate.
                </p>
              </div>
            </div>

            <div className="bg-gray-800/40 backdrop-blur-xl p-6 rounded-3xl border border-gray-700 hover:border-green-500/50 transition duration-300">
              <TrendingUp className="text-green-400 mb-4" size={24} />
              <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Revenue Goal</p>
              <p className="text-2xl font-black mt-1">₹{(metrics.totalRevenue / 100000).toFixed(2)}L <span className="text-gray-500 text-lg font-medium">/ ₹15L</span></p>
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <p className="text-sm text-gray-300 leading-relaxed">
                  <span className="font-bold text-green-400">₹{dailyRevenueTarget.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> daily run-rate required to hit financial projections.
                </p>
              </div>
            </div>

            <div className="bg-gray-800/40 backdrop-blur-xl p-6 rounded-3xl border border-gray-700 hover:border-purple-500/50 transition duration-300">
              <Crosshair className="text-purple-400 mb-4" size={24} />
              <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Acquisition Goal</p>
              <p className="text-2xl font-black mt-1">{metrics.activeCustomers} <span className="text-gray-500 text-lg font-medium">/ {TARGET_CUSTOMERS}</span></p>
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <p className="text-sm text-gray-300 leading-relaxed">
                  Acquire <span className="font-bold text-purple-400">{TARGET_CUSTOMERS - metrics.activeCustomers} more users</span> in target complexes to achieve route density.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}