"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Ship, ThermometerSnowflake, Truck, Home, PackageCheck, Anchor, AlertCircle, Bug } from "lucide-react";

export default function OrderHistoryPage() {
  const [traceData, setTraceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTraceabilityData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // QUERY 1: Fetch the Order and Product (Safe Join)
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          status,
          order_items (
            weight,
            products ( id, name )
          )
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (orderError) {
        if (orderError.code !== 'PGRST116') { // PGRST116 just means no rows found, which is fine
          setDebugError(`Order Query Failed: ${orderError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!order) {
        setLoading(false);
        return;
      }

      // Safely extract the product details
const firstItem = order.order_items ? order.order_items : null;
const product = firstItem ? firstItem.products : null;
const productId = product ? product.id : null;
      
      let landing = null;

      // QUERY 2: Fetch the specific Landing data for that Product
      if (productId) {
        const { data: landingData, error: landingError } = await supabase
          .from("landings")
          .select(`
            catch_time,
            market_rate,
            price_paid_per_kg,
            boat_owners ( name, boat_reg_no )
          `)
          .eq("species", productId)
          .order("catch_time", { ascending: false })
          .limit(1)
          .single();

        if (landingError && landingError.code !== 'PGRST116') {
          console.error("Landing Query Error:", landingError);
        } else {
          landing = landingData;
        }
      }

      // Package it all together for the UI
      setTraceData({ order, product, landing });
      setLoading(false);
    };

    fetchTraceabilityData();
  }, []);

  // Loading State
  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium italic">Verifying Malpe Harbour telemetry...</p>
      </div>
    );
  }

  // Debug State
  if (debugError) {
    return (
      <div className="max-w-2xl mx-auto p-8 mt-10 bg-red-50 border-2 border-red-500 rounded-3xl text-red-900 shadow-xl">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4"><Bug /> Query Failed</h2>
        <p className="font-mono text-sm bg-red-100 p-4 rounded-xl">{debugError}</p>
      </div>
    );
  }

  // Empty State
  if (!traceData) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 shadow-sm mt-10">
        <AlertCircle className="mx-auto text-gray-300 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-900">No active pilot data found</h2>
        <p className="text-gray-500 mt-2 max-w-xs mx-auto">
          Place an order in the store to generate a live Day 0 traceability signal.
        </p>
        <a href="/store" className="inline-block mt-8 bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition">
          Return to Store
        </a>
      </div>
    );
  }

  // DATA EXTRACTION FOR UI
  const { order, product, landing } = traceData;
  const productName = product?.name || "Premium Catch";
  const catchDate = landing ? new Date(landing.catch_time).toLocaleString() : "Verified at Harbour";
  const orderDate = new Date(order.created_at).toLocaleString();

  // TIMELINE
  const timeline = [
    { 
      time: catchDate, 
      title: `Source: ${productName}`, 
      desc: landing 
        ? `Harvested by ${landing.boat_owners?.name} (${landing.boat_owners?.boat_reg_no}). Direct procurement verified.` 
        : "Direct procurement from Malpe collective boat owners.", 
      icon: <Ship size={20} /> 
    },
    { 
      time: "Quality Grade", 
      title: "HACCP Processing Simulation", 
      desc: `Graded and Iced. Fisherfolk Premium: ₹${
        landing ? (landing.price_paid_per_kg - landing.market_rate).toFixed(2) : "0"
      }/kg.`, 
      icon: <ThermometerSnowflake size={20} /> 
    },
    { 
      time: orderDate, 
      title: "Transit: Malpe → Bangalore", 
      desc: "380km overnight cold-chain logistics. Proven OPEX: ₹8-12/kg.", 
      icon: <Truck size={20} /> 
    },
    { 
      time: "Real-time", 
      title: "Pilot Zone Distribution", 
      desc: `Status: ${order.status}. Final delivery to South Bangalore apartment units.`, 
      icon: <Home size={20} /> 
    },
  ];

  return (
    <div className="max-w-2xl mx-auto py-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-8 px-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Supply Chain Proof
          </h1>
          <p className="text-gray-500 mt-1 font-mono text-xs text-blue-600 font-bold tracking-widest uppercase">
            Order: {order.id.split('-')}
          </p>
        </div>
        <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-xl shadow-blue-100 ring-8 ring-blue-50">
          <PackageCheck size={28} />
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100">
        <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-600 before:via-blue-300 before:to-transparent">
          {timeline.map((item, i) => (
            <div key={i} className="relative flex items-start gap-6 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white shrink-0 shadow-lg z-10 ring-4 ring-white">
                {item.icon}
              </div>
              <div className="flex-1 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 transition-all hover:bg-white hover:shadow-xl hover:border-blue-100">
                <span className="font-mono text-[10px] uppercase tracking-widest text-blue-600 font-black">
                  {item.time}
                </span>
                <h3 className="font-bold text-gray-900 mt-1 text-lg">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}