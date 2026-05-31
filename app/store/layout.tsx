"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Anchor, ShoppingBag, History, LogOut, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { CartProvider, useCart } from "./CartContext";

function StoreUI({ children }: { children: React.ReactNode }) {
  const { cartOpen, setCartOpen, items, total, removeFromCart, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsCheckingOut(true);

    try {
      // 1. Identify the logged-in customer
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      // 2. Create the main Order row
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: user.id,
          total_revenue: total,
          status: "Pending" // Must match your exact Enum
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Map the cart items into the order_items table
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        weight: item.weight
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 4. Success! Clear everything and redirect to history
      clearCart();
      setCartOpen(false);
      router.push("/store/order-history");

    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Something went wrong with the checkout. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.weight, 0);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <nav className="bg-white border-b border-blue-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/store" className="flex items-center gap-2 text-2xl font-bold text-blue-900 hover:opacity-80 transition">
            <Anchor className="text-blue-600" /> Malpe Meen
          </Link>
          
          <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/store/order-history" className="hover:text-blue-600 flex items-center gap-1 transition">
              <History size={18} /> Traceability
            </Link>
            
            <button onClick={handleLogout} className="hover:text-red-600 flex items-center gap-1 transition">
              <LogOut size={18} /> Sign Out
            </button>

            <button 
              onClick={() => setCartOpen(!cartOpen)}
              className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full hover:bg-blue-100 transition"
            >
              <ShoppingBag size={18} />
              <span>Cart ({totalItems})</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* Dynamic Slide-out Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 p-6 border-l flex flex-col animate-in slide-in-from-right-8 duration-300">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingBag size={20}/> Your Catch</h2>
            <button onClick={() => setCartOpen(false)} className="text-gray-500 hover:text-gray-900 text-2xl font-bold">&times;</button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {items.length === 0 ? (
              <p className="text-center text-gray-500 mt-10">Your cart is empty.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center group">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.weight} kg @ ₹{item.price}/kg</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-sm font-bold text-blue-700">₹{item.price * item.weight}</p>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-4 mt-4 bg-white">
            <div className="flex justify-between font-bold mb-4 text-lg">
              <span>Total</span>
              <span className="font-mono text-blue-700">₹{total}</span>
            </div>
            
            {/* <-- WIRE UP THE BUTTON HERE --> */}
            <button 
              onClick={handleCheckout}
              disabled={items.length === 0 || isCheckingOut}
              className="w-full text-center bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex justify-center items-center gap-2"
            >
              {isCheckingOut ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                "Proceed to Checkout"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <StoreUI>{children}</StoreUI>
    </CartProvider>
  );
}