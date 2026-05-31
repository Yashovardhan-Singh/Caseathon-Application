"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Anchor, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  const [localities, setLocalities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localityId, setLocalityId] = useState("");
  const [flatNumber, setFlatNumber] = useState("");

  // Fetch active pilot zones on mount
  useEffect(() => {
    const fetchLocalities = async () => {
      const { data, error } = await supabase.from("localities").select("id, name");
      if (!error && data && data.length > 0) {
        setLocalities(data);
        setLocalityId(data.id); // Safely setting the default to the first array item
      }
    };
    fetchLocalities();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Create the Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Insert into the `profiles` table
        const { error: profileError } = await supabase.from("profiles").insert([{
          id: authData.user.id,
          name: fullName,
          role: "Customer"
        }]);

        if (profileError) throw profileError;

        // 3. Silently fetch a pilot campaign ID to satisfy the CAC Foreign Key constraint
        const { data: campaigns } = await supabase.from("marketing").select("id").limit(1);
        
        // BULLETPROOF EXTRACTION: No optional chaining syntax errors
        const fallbackCampaignId = (campaigns && campaigns.length > 0) ? campaigns.id : null;

        // 4. Insert into the `customers` table for unit economics tracking
        const { error: customerError } = await supabase.from("customers").insert([{
          id: authData.user.id,
          locality_id: localityId,
          campaign_id: fallbackCampaignId, 
          type: "Complex" // Matches the Postgres ENUM
        }]);

        if (customerError) throw customerError;

        // 5. Success! Redirect to storefront
        window.location.href = "/store";
      }
    } catch (err: any) {
      console.error("Signup Failed:", err);
      setError(err.message || "Failed to create account. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-600 mb-4">
          <div className="bg-blue-100 p-4 rounded-full shadow-sm"><Anchor size={48} /></div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">Join the Malpe Pilot</h2>
        <p className="mt-3 text-center text-sm font-medium text-green-700 flex items-center justify-center gap-1.5 bg-green-50 w-fit mx-auto px-4 py-1.5 rounded-full border border-green-200">
          <ShieldCheck size={16} /> Guaranteed Day-0 Freshness
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow-xl shadow-blue-900/5 sm:rounded-3xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSignUp}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>

            <div className="border-t border-gray-100 pt-6 mt-6">
              <h3 className="text-lg font-extrabold text-gray-900 mb-4">Delivery Verification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Select Pilot Locality</label>
                  <select value={localityId} onChange={(e) => setLocalityId(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition cursor-pointer">
                    {localities.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Flat / Unit Number</label>
                  <input type="text" required value={flatNumber} onChange={(e) => setFlatNumber(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" placeholder="e.g. A-402" />
                </div>
              </div>
              <p className="text-xs font-medium text-gray-500 mt-3 leading-relaxed">
                We strictly limit delivery to active pilot zones to maintain our 2.0°C cold-chain standard.
              </p>
            </div>

            {error && (
              <div className="text-red-700 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-200 flex items-start gap-2">
                <span className="shrink-0 text-red-500">⚠</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full flex justify-center py-4 rounded-xl shadow-md text-lg font-extrabold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 items-center gap-2">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Provisioning Account...</>
              ) : "Create Account & Enter Store"}
            </button>
            
            <p className="text-center text-sm font-medium text-gray-600">
              Already have an account? <Link href="/login" className="font-extrabold text-blue-600 hover:text-blue-700 hover:underline transition">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}