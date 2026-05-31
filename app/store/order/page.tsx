"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Truck, CheckCircle2 } from "lucide-react";

export default function CheckoutPage() {
  const [localities, setLocalities] = useState<any[]>([]);
  const [selectedLocality, setSelectedLocality] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchLocalities = async () => {
      const { data, error } = await supabase.from("localities").select("id, name, units, loi_signed");
      if (!error && data) setLocalities(data);
    };
    fetchLocalities();
  }, []);

  const handleCheckout = async () => {
    // In a full build, this creates the `customer`, then the `order`, then `order_items`
    // using selectedLocality. For the UI flow prototype:
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <CheckCircle2 size={64} className="mx-auto text-green-500 mb-6" />
        <h2 className="text-3xl font-bold mb-2">Order Confirmed!</h2>
        <button onClick={() => window.location.href='/store/order-history'} className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg">Track Live Traceability</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3"><Truck className="text-blue-600" /> Secure Checkout</h1>
      <div className="bg-white p-8 rounded-2xl border shadow-sm">
        <h2 className="text-xl font-bold mb-6 border-b pb-4">Delivery Pilot Zone</h2>
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Select Your Apartment Complex</label>
          <select value={selectedLocality} onChange={(e) => setSelectedLocality(e.target.value)} className="w-full border rounded-xl p-3 bg-gray-50">
            <option value="" disabled>Choose verified locality...</option>
            {localities.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name} {loc.loi_signed ? " (LOI Signed)" : ""} - {loc.units} units
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleCheckout} className="w-full bg-gray-900 text-white font-bold text-lg py-4 rounded-xl mt-8">
          Confirm & Pay (UPI)
        </button>
      </div>
    </div>
  );
}