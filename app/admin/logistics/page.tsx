"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Truck } from "lucide-react";

export default function AdminLogisticsLog() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      const { data, error } = await supabase
        .from("logistics")
        .select("*")
        .order("trip_start", { ascending: false });
        
      if (!error && data) setTrips(data);
      setLoading(false);
    };
    fetchTrips();
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Truck className="text-blue-600" size={32} />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cold Chain Logistics Log</h1>
          <p className="text-gray-500">Historical fleet telemetry and operational expenses.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="p-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Departure (Malpe)</th>
              <th className="p-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Arrival (Bangalore)</th>
              <th className="p-4 text-sm font-bold text-gray-600 uppercase tracking-wider">HACCP Temp Check</th>
              <th className="p-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-right">Fuel OPEX</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading fleet telemetry...</td></tr>
            ) : trips.map((trip) => (
              <tr key={trip.id} className="hover:bg-gray-50 transition">
                <td className="p-4">
                  {trip.trip_end ? (
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">Completed</span>
                  ) : (
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded animate-pulse">In Transit</span>
                  )}
                </td>
                <td className="p-4 text-sm text-gray-700 font-mono">
                  {new Date(trip.trip_start).toLocaleString()}
                </td>
                <td className="p-4 text-sm text-gray-700 font-mono">
                  {trip.trip_end ? new Date(trip.trip_end).toLocaleString() : "--"}
                </td>
                <td className="p-4 text-sm font-semibold text-blue-700">
                  {trip.temp_check ? `${trip.temp_check}°C` : "--"}
                </td>
                <td className="p-4 text-sm font-mono font-semibold text-gray-900 text-right">
                  {trip.fuel_opex ? `₹${trip.fuel_opex}` : "--"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}