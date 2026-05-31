"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Anchor, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Authenticate the user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Fetch their role from your profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError.message);
        // Safe fallback if the profile query fails
        window.location.href = "/store";
        return;
      }

      // 3. Hard redirect based on their exact role
      const userRole = profile?.role;
      
      if (userRole === "Admin") {
        window.location.href = "/admin/metrics";
      } else if (userRole === "Driver") { 
        window.location.href = "/operations/logistics";
      } else if (userRole === "Fisherman") {
        window.location.href = "/operations/landings";
      } else if (userRole === "Customer") {
        window.location.href = "/store"
      } else {
        // Default catch-all for Customers
        window.location.href = "/login";
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-blue-600 mb-4">
          <Anchor size={48} />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Welcome back</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or <Link href="/sign-up" className="font-medium text-blue-600 hover:text-blue-500">join the D2C Pilot</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-blue-500" 
              />
            </div>

            {error && <div className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-lg">{error}</div>}

            <button 
              type="submit" disabled={loading}
              className="w-full flex justify-center py-3 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in to your account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}