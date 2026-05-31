"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Ship } from "lucide-react";

export default function AdminLandingsLog() {
  const [landings, setLandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLandings = async () => {
      const { data, error } = await supabase
        .from("landings")
        .select(`
          *,
          boat_owners ( name, boat_reg_no )
        `)
        .order("catch_time", { ascending: false });
        
      if (!error && data) setLandings(data);
      setLoading(false);
    };
    fetchLandings();
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Ship className="text-blue-600" size={32} />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Harbour Landings Log</h1>
          <p className="text-gray-500">Historical procurement data and fisherfolk payouts.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Date & Time</th>
              <th className="p-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Boat & Owner</th>
              <th className="p-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Species</th>
              <th className="p-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Weight</th>
              <th className="p-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Economics (₹/kg)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading audit trail...</td></tr>
            ) : landings.map((log) => {
              const diff = log.price_paid_per_kg - log.market_rate;
              return (
                <tr key={log.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-sm text-gray-900 font-medium">
                    {new Date(log.catch_time).toLocaleString()}
                  </td>
                  <td className="p-4 text-sm text-gray-700">
                    <span className="font-bold">{log.boat_owners?.name}</span> <br/>
                    <span className="text-xs text-gray-500">{log.boat_owners?.boat_reg_no}</span>
                  </td>
                  <td className="p-4 text-sm font-semibold text-gray-900">{log.species}</td>
                  <td className="p-4 text-sm text-gray-700">{log.weight_kg} kg</td>
                  <td className="p-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-green-700 font-semibold">Paid: ₹{log.price_paid_per_kg}</span>
                      <span className="text-gray-500 text-xs">Market: ₹{log.market_rate}</span>
                      {diff > 0 && <span className="text-blue-600 text-xs font-bold bg-blue-50 px-2 py-0.5 rounded w-fit">+₹{diff} Premium</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}