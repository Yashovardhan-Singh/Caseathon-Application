"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Truck, Play, CheckCircle, ThermometerSnowflake, MapPin, Fuel, History, Navigation } from "lucide-react";

export default function LogisticsTracker() {
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [tripHistory, setTripHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [view, setView] = useState<'active' | 'history'>('active');

  // Form state for arrival
  const [tempCheck, setTempCheck] = useState("");
  const [fuelOpex, setFuelOpex] = useState("");

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Fetch Active Trip
    const { data: active } = await supabase
      .from("logistics")
      .select("*")
      .is("trip_end", null)
      .order("trip_start", { ascending: false })
      .limit(1)
      .single();

    setActiveTrip(active || null);

    // 2. Fetch Completed Trips (History)
    const { data: history } = await supabase
      .from("logistics")
      .select("*")
      .not("trip_end", "is", null)
      .order("trip_end", { ascending: false })
      .limit(10); // Keep the UI light, just show the last 10 trips

    setTripHistory(history || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartTrip = async () => {
    setActionLoading(true);
    const { error } = await supabase
      .from("logistics")
      .insert([{ trip_start: new Date().toISOString() }]);

    if (error) alert("Error starting trip.");
    else fetchData();
    setActionLoading(false);
  };

  const handleEndTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    setActionLoading(true);

    const { error } = await supabase
      .from("logistics")
      .update({
        trip_end: new Date().toISOString(),
        temp_check: parseFloat(tempCheck),
        fuel_opex: parseFloat(fuelOpex),
      })
      .eq("id", activeTrip.id);

    if (error) {
      alert("Error logging arrival.");
    } else {
      setTempCheck("");
      setFuelOpex("");
      fetchData();
      setView('history'); // Bounce them to the history view to see their completed log
    }
    setActionLoading(false);
  };

  if (loading) return <div className="max-w-md mx-auto mt-10 p-6 text-center text-gray-500">Connecting to fleet telemetry...</div>;

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      
      {/* Tab Navigation */}
      <div className="flex border-b">
        <button 
          onClick={() => setView('active')}
          className={`flex-1 py-4 font-bold flex justify-center items-center gap-2 transition ${view === 'active' ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Navigation size={18} /> Active Dispatch
        </button>
        <button 
          onClick={() => setView('history')}
          className={`flex-1 py-4 font-bold flex justify-center items-center gap-2 transition ${view === 'history' ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <History size={18} /> Logbook
        </button>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 border-b pb-4 mb-6">
          <div className={`p-3 rounded-full ${activeTrip && view === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            <Truck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Cold Truck KA-20-C-4451</h2>
            <p className="text-sm text-gray-500">Malpe Harbour ⇄ Bangalore</p>
          </div>
        </div>

        {view === 'active' ? (
          /* --- ACTIVE TRIP VIEW --- */
          !activeTrip ? (
            <div className="animate-in fade-in duration-300">
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center mb-6">
                <MapPin size={32} className="mx-auto text-gray-400 mb-2" />
                <h3 className="font-bold text-gray-700">Vehicle is Idle at Malpe</h3>
                <p className="text-sm text-gray-500 mt-1">Ready for dispatch.</p>
              </div>
              <button onClick={handleStartTrip} disabled={actionLoading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex justify-center items-center gap-2 transition disabled:opacity-70">
                <Play size={20} /> {actionLoading ? "Starting..." : "Depart Malpe Harbour"}
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                <div className="flex items-center gap-2 text-blue-800 font-bold mb-1">
                  <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span></span>
                  In Transit to Bangalore
                </div>
                <p className="text-sm text-blue-600 font-mono">Departed: {new Date(activeTrip.trip_start).toLocaleTimeString()}</p>
              </div>

              <form onSubmit={handleEndTrip} className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"><ThermometerSnowflake size={16} className="text-blue-500" /> Arrival Temp (°C)</label>
                  <input type="number" step="0.1" required value={tempCheck} onChange={(e) => setTempCheck(e.target.value)} className="w-full border-gray-300 rounded-lg p-3" placeholder="Target: 2.0°C" />
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2"><Fuel size={16} className="text-red-500" /> Fuel Opex (₹)</label>
                  <input type="number" required value={fuelOpex} onChange={(e) => setFuelOpex(e.target.value)} className="w-full border-gray-300 rounded-lg p-3" placeholder="Total fuel cost for trip" />
                </div>
                <button type="submit" disabled={actionLoading} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex justify-center items-center gap-2 transition disabled:opacity-70">
                  <CheckCircle size={20} /> {actionLoading ? "Logging..." : "Log Bangalore Arrival"}
                </button>
              </form>
            </div>
          )
        ) : (
          /* --- TRIP HISTORY VIEW --- */
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
            {tripHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No completed trips yet.</p>
            ) : (
              tripHistory.map((trip) => (
                <div key={trip.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col gap-2">
                  <div className="flex justify-between items-start border-b border-gray-200 pb-2">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Completed Route</p>
                      <p className="font-semibold text-gray-800">{new Date(trip.trip_end).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-mono text-sm text-gray-700">
                        {Math.round((new Date(trip.trip_end).getTime() - new Date(trip.trip_start).getTime()) / (1000 * 60 * 60))} hrs
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="flex items-center gap-1 text-sm font-medium text-blue-700">
                      <ThermometerSnowflake size={14} /> {trip.temp_check}°C
                    </span>
                    <span className="flex items-center gap-1 text-sm font-medium text-red-700">
                      <Fuel size={14} /> ₹{trip.fuel_opex}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}