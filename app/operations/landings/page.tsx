"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Ship, Scale, IndianRupee, Anchor, CheckCircle2 } from "lucide-react";

export default function LandingsPage() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  // Real Data State (Fetching from Supabase)
  const [boats, setBoats] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Form State (Using IDs for foreign keys)
  const [boatId, setBoatId] = useState("");
  const [speciesId, setSpeciesId] = useState(""); // <-- FIXED: Changed from 'species'
  const [weight, setWeight] = useState("");
  const [pricePaid, setPricePaid] = useState("");
  const [marketRate, setMarketRate] = useState("");

  useEffect(() => {
    const fetchDropdownData = async () => {
      // 1. Fetch Boat Owners
      const { data: boatData, error: boatError } = await supabase.from("boat_owners").select("id, name, boat_reg_no");
      if (!boatError && boatData) {
        setBoats(boatData);
      }

      // 2. Fetch Products (Species)
      const { data: productData, error: productError } = await supabase.from("products").select("id, name");
      if (!productError && productData) {
        setProducts(productData);
      }
    };
    fetchDropdownData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");

    // 1. Frontend Validation
    if (!boatId) {
      alert("Please select a Boat Owner.");
      setLoading(false);
      return;
    }
    if (!speciesId) {
      alert("Please select a Catch Type.");
      setLoading(false);
      return;
    }

    // 2. Insert with verified UUIDs and numeric parsing
    const { error } = await supabase.from("landings").insert({
      boat_id: boatId,             
      species: speciesId,          
      weight_kg: parseFloat(weight), 
      price_paid_per_kg: parseFloat(pricePaid),
      market_rate: parseFloat(marketRate),
      catch_time: new Date().toISOString()
    });

    if (error) {
      console.error("Error logging catch:", error);
      alert(`Database Error: ${error.message}`);
    } else {
      // Find the names for the success message
      const boatName = boats.find(b => b.id === boatId)?.name || "Boat";
      const fishName = products.find(p => p.id === speciesId)?.name || "Catch";
      
      setSuccessMsg(`Successfully logged ${weight}kg of ${fishName} from ${boatName}!`);
      
      // Reset form on success
      setBoatId("");
      setSpeciesId("");
      setWeight("");
      setPricePaid("");
      setMarketRate("");
    }
    setLoading(false);
  }; 

  const differential = (parseFloat(weight || "0") * parseFloat(pricePaid || "0")) - (parseFloat(weight || "0") * parseFloat(marketRate || "0"));

  return (
    <div className="max-w-3xl mx-auto p-6 mt-8">
      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <div className="bg-blue-100 p-3 rounded-full text-blue-700"><Anchor size={28} /></div>
        <div><h1 className="text-3xl font-bold">Log Harbour Landing</h1></div>
      </div>

      {successMsg && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 size={20} />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2"><Ship size={16} /> Select Boat</label>
            <select value={boatId} onChange={(e) => setBoatId(e.target.value)} className="w-full border rounded-lg p-3 bg-gray-50">
              <option value="" disabled>Select a Boat...</option>
              {boats.map(b => <option key={b.id} value={b.id}>{b.name} ({b.boat_reg_no})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Species (Catch Type)</label>
            {/* FIXED: Replaced text input with dynamic Product Dropdown */}
            <select value={speciesId} onChange={(e) => setSpeciesId(e.target.value)} className="w-full border rounded-lg p-3 bg-gray-50">
              <option value="" disabled>Select Catch...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2"><Scale size={16} /> Weight (Kg)</label>
            <input type="number" required step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full border rounded-lg p-3" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-blue-700 mb-2">Malpe Price (₹/kg)</label>
            <input type="number" required value={pricePaid} onChange={(e) => setPricePaid(e.target.value)} className="w-full border-blue-300 rounded-lg p-3 bg-blue-50" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Auction Price (₹/kg)</label>
            <input type="number" required value={marketRate} onChange={(e) => setMarketRate(e.target.value)} className="w-full border rounded-lg p-3" />
          </div>
        </div>

        {differential > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-4 text-green-800">
            <div className="bg-green-100 p-2 rounded-full"><IndianRupee size={20} /></div>
            <div>
              <p className="text-sm font-medium">Fisherfolk Income Differential</p>
              <p className="text-lg font-bold">+ ₹{differential.toFixed(2)} in the fisher's pocket.</p>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl hover:bg-blue-800 disabled:opacity-70 flex justify-center items-center gap-2">
          {loading ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Logging...</>
          ) : "Confirm Landing"}
        </button>
      </form>
    </div>
  );
}