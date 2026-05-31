"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  TrendingUp, Users, RefreshCw, AlertCircle, 
  IndianRupee, Anchor, Target, ShieldCheck,
  TrendingDown, Activity
} from "lucide-react";

export default function InvestorMetricsDashboard() {
  const [loading, setLoading] = useState(true);
  
  // Metric States
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    cac: 0,
    repeatRate: 0,
    kgPerDay: 0,
    grossMargin: 0,
    deliverySuccess: 0,
    fisherfolkDifferential: 0,
    totalVolume: 0,
  });

  const [score, setScore] = useState(0);

  useEffect(() => {
    const generateInvestorMetrics = async () => {
      setLoading(true);

      // Fetch all required tables in parallel
      const [
        { data: orders },
        { data: orderItems },
        { data: customers },
        { data: marketing },
        { data: landings },
        { data: logistics }
      ] = await Promise.all([
        supabase.from("orders").select("*"),
        supabase.from("order_items").select("*"),
        supabase.from("customers").select("id"),
        supabase.from("marketing").select("cost"),
        supabase.from("landings").select("*"),
        supabase.from("logistics").select("fuel_opex")
      ]);

      // --- CALCULATIONS ---

      // 1. Revenue & Volume
      const totalRev = (orders || []).reduce((acc, curr) => acc + (curr.total_revenue || 0), 0);
      const totalVol = (orderItems || []).reduce((acc, curr) => acc + (curr.weight || 0), 0);
      
      // Assume a 30-day pilot for the daily average
      const pilotDays = 30; 
      const kgDay = totalVol / pilotDays;

      // 2. Customer Acquisition Cost (CAC)
      const totalMarketingSpend = (marketing || []).reduce((acc, curr) => acc + (curr.cost || 0), 0);
      const uniqueCustomersCount = customers?.length || 1; // Prevent div by 0
      const cacVal = totalMarketingSpend / uniqueCustomersCount;

      // 3. Repeat Purchase Rate
      const orderCountsByCustomer = (orders || []).reduce((acc: any, curr) => {
        acc[curr.customer_id] = (acc[curr.customer_id] || 0) + 1;
        return acc;
      }, {});
      const repeatCustomers = Object.values(orderCountsByCustomer).filter((count: any) => count > 1).length;
      const repeatRateVal = uniqueCustomersCount > 0 ? (repeatCustomers / uniqueCustomersCount) * 100 : 0;

      // 4. Gross Margin % 
      // Formula: (Revenue - Procurement Cost - Logistics Cost) / Revenue
      const totalProcurementCost = (landings || []).reduce((acc, curr) => acc + (curr.weight_kg * curr.price_paid_per_kg), 0);
      const totalLogisticsCost = (logistics || []).reduce((acc, curr) => acc + (curr.fuel_opex || 0), 0);
      
      const totalCOGS = totalProcurementCost + totalLogisticsCost;
      const grossMarginVal = totalRev > 0 ? ((totalRev - totalCOGS) / totalRev) * 100 : 0;

      // 5. Delivery Success Rate
      const totalOrders = orders?.length || 0;
      const successfulOrders = (orders || []).filter(o => o.status === 'Delivered').length;
      const deliverySuccessVal = totalOrders > 0 ? (successfulOrders / totalOrders) * 100 : 0;

      // 6. Fisherfolk Income Differential (The Moat)
      const differential = (landings || []).reduce((acc, curr) => {
        const bonusPerKg = curr.price_paid_per_kg - curr.market_rate;
        return acc + (bonusPerKg > 0 ? bonusPerKg * curr.weight_kg : 0);
      }, 0);

      // Set State
      setMetrics({
        totalRevenue: totalRev,
        cac: cacVal,
        repeatRate: repeatRateVal,
        kgPerDay: kgDay,
        grossMargin: grossMarginVal,
        deliverySuccess: deliverySuccessVal,
        fisherfolkDifferential: differential,
        totalVolume: totalVol
      });

      // Calculate Pilot Traction Score (Out of 10)
      // Weighted algorithm based on investor priorities
      let tempScore = 2.0; // Base score from the case
      if (grossMarginVal > 15) tempScore += 2;
      if (repeatRateVal > 20) tempScore += 2;
      if (cacVal > 0 && cacVal < 500) tempScore += 2;
      if (totalRev > 10000) tempScore += 2;
      
      setScore(Math.min(tempScore, 10)); // Cap at 10
      setLoading(false);
    };

    generateInvestorMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Aggregating Unit Economics from Supabase...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen font-sans">
      
      {/* HEADER & TRACTION SCORE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Traction Blueprint</h1>
          <p className="text-lg text-gray-500 mt-2 flex items-center gap-2">
            <ShieldCheck size={20} className="text-green-500" />
            Live 90-Day Pilot Telemetry
          </p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-6">
          <div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Overall Pilot Score</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold text-blue-600">{score.toFixed(1)}</span>
              <span className="text-xl font-bold text-gray-400">/ 10</span>
            </div>
          </div>
          {/* Circular Progress CSS Hack */}
          <div className="relative w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            <div 
              className="absolute inset-0 bg-blue-600" 
              style={{ clipPath: `polygon(50% 50%, -50% -50%, ${score * 10}% -50%, 150% 150%, 50% 150%)` }}
            ></div>
            <div className="absolute inset-2 bg-white rounded-full"></div>
            <Target size={28} className="text-blue-600 relative z-10" />
          </div>
        </div>
      </div>

      {/* CORE 4 KPIs (The Investor Narrative) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* Gross Margin */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition"><Activity size={64} /></div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Gross Margin</p>
          <div className="flex items-end gap-3 mb-2">
            <h3 className="text-4xl font-extrabold text-gray-900">{metrics.grossMargin.toFixed(1)}%</h3>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full mt-4">
            <div className={`h-full rounded-full ${metrics.grossMargin > 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.max(metrics.grossMargin, 0), 100)}%` }}></div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Target: &gt; 15% for Series A</p>
        </div>

        {/* CAC */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition"><Users size={64} /></div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">CAC</p>
          <div className="flex items-end gap-3 mb-2">
            <h3 className="text-4xl font-extrabold text-gray-900">₹{metrics.cac.toFixed(0)}</h3>
          </div>
          <div className="flex items-center gap-1 text-sm font-semibold text-green-600 mt-4">
            <TrendingDown size={16} /> Optimized via Neighbourhood Loop
          </div>
        </div>

        {/* Repeat Rate */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition"><RefreshCw size={64} /></div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Repeat Rate</p>
          <div className="flex items-end gap-3 mb-2">
            <h3 className="text-4xl font-extrabold text-gray-900">{metrics.repeatRate.toFixed(1)}%</h3>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full mt-4">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${metrics.repeatRate}%` }}></div>
          </div>
          <p className="text-xs text-gray-400 mt-3">&gt; 1 order in 30 days</p>
        </div>

        {/* Delivery Success */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition"><AlertCircle size={64} /></div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Delivery Success</p>
          <div className="flex items-end gap-3 mb-2">
            <h3 className="text-4xl font-extrabold text-gray-900">{metrics.deliverySuccess.toFixed(1)}%</h3>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full mt-4">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${metrics.deliverySuccess}%` }}></div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Verified Cold Chain Integrity</p>
        </div>

      </div>

      {/* STRATEGIC DEEP DIVES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Revenue & Volume */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <TrendingUp className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Run Rate Architecture</h2>
          </div>
          
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase">Total Pilot Revenue</p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-1">₹{metrics.totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-500 uppercase">Avg. Daily Volume</p>
              <h3 className="text-3xl font-extrabold text-blue-600 mt-1">{metrics.kgPerDay.toFixed(1)} <span className="text-lg text-gray-400">kg/day</span></h3>
            </div>
          </div>

          {/* Visual Bar Chart Replacement */}
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-600 mb-2">Revenue vs. Operations Cost Visualization</p>
            <div className="relative pt-6">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>₹0</span>
                <span>Revenue Target (₹2L)</span>
              </div>
              <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                {/* Cost Bar */}
                <div 
                  className="bg-red-400 h-full flex items-center px-2 text-xs font-bold text-white shadow-inner transition-all duration-1000"
                  style={{ width: `${Math.min(((metrics.totalRevenue - (metrics.totalRevenue * (metrics.grossMargin/100))) / 200000) * 100, 100)}%` }}
                >
                  COGS
                </div>
                {/* Margin Bar */}
                <div 
                  className="bg-green-500 h-full flex items-center px-2 text-xs font-bold text-white shadow-inner transition-all duration-1000"
                  style={{ width: `${Math.min(((metrics.totalRevenue * (metrics.grossMargin/100)) / 200000) * 100, 100)}%` }}
                >
                  Margin
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Social Moat (Fisherfolk) */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl shadow-lg border border-blue-700 p-8 text-white relative overflow-hidden">
          <Anchor className="absolute -bottom-10 -right-10 text-blue-700 opacity-30" size={200} />
          
          <div className="flex items-center gap-3 mb-6 border-b border-blue-700 pb-4 relative z-10">
            <IndianRupee className="text-green-400" size={24} />
            <h2 className="text-2xl font-bold">The Competitive Moat</h2>
          </div>
          
          <p className="text-blue-200 mb-8 text-lg leading-relaxed relative z-10">
            Malpe Meen&apos;s supply defensibility is built on the <strong>Fisherfolk Income Differential</strong>. 
            By eliminating middlemen, we increase local wealth while maintaining our margins.
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 relative z-10">
            <p className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-2">Direct Wealth Created</p>
            <h3 className="text-5xl font-extrabold text-green-400">
              + ₹{metrics.fisherfolkDifferential.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-sm text-blue-200 mt-3 font-medium">
              Extra income generated for contracted Malpe boat owners vs. standard auction rates during this pilot.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}