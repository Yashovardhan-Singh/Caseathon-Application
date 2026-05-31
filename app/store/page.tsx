"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Fish } from "lucide-react";
import { useCart } from "./CartContext"; // <-- Import the hook

export default function StorePage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // <-- Initialize the cart function
    const { addToCart } = useCart(); 

    useEffect(() => {
        const fetchProducts = async () => {
            const { data, error } = await supabase.from("products").select("id, name, retail_price, haccp_ready");
            if (!error && data) setProducts(data);
            setLoading(false);
        };
        fetchProducts();
    }, []);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            <header className="mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Today's Catch</h1>
                <p className="text-lg text-gray-500 mt-2">Zero middlemen. Straight from the harbour.</p>
            </header>

            {loading ? (
                <div className="flex items-center gap-3 text-gray-500 font-medium">
                  <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  Fetching harbour inventory...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {products.map((p) => (
                        <div key={p.id} className="bg-white p-5 rounded-2xl border hover:shadow-lg transition-all flex flex-col">
                            <div className="h-40 bg-gradient-to-tr from-blue-50 to-blue-100 rounded-xl mb-5 flex items-center justify-center text-blue-300">
                                <Fish size={48} />
                            </div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-gray-900">{p.name}</h3>
                                {p.haccp_ready && <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded whitespace-nowrap ml-2">Export Grade</span>}
                            </div>
                            <p className="font-mono text-xl text-blue-700 font-semibold mb-4 flex-1">₹{p.retail_price} / kg</p>
                            
                            {/* <-- Wire up the onClick event here */}
                            <button 
                                onClick={() => addToCart({ id: p.id, name: p.name, price: p.retail_price })}
                                className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-blue-600 transition-colors shadow-sm active:scale-95"
                            >
                                Add to Cart
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}