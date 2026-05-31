"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

// Update this interface if your schema differs slightly
interface Product {
  id: string;
  name: string;
  category: string;
  retail_price: number;
  haccp_ready: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("D2C Premium");
  const [price, setPrice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // 1. READ: Fetch products on load
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });
      
    if (error) console.error("Error fetching products:", error);
    else setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 2. CREATE & 3. UPDATE: Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name,
      category,
      retail_price: parseFloat(price),
      haccp_ready: false
    };

    if (editingId) {
      // UPDATE
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingId);
        
      if (error) console.error("Error updating:", error);
      setEditingId(null);
    } else {
      // CREATE
      const { error } = await supabase
        .from("products")
        .insert([payload]);
        
      if (error) console.error("Error inserting:", error);
    }

    // Reset form and refresh list
    setName("");
    setPrice("");
    setCategory("D2C Premium");
    fetchProducts();
  };

  // 4. DELETE: Remove a product
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);
      
    if (error) console.error("Error deleting:", error);
    else fetchProducts();
  };

  // Populate form for editing
  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setCategory(product.category);
    setPrice(product.retail_price.toString());
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Manage Catalog</h1>

      {/* CRUD Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border mb-8 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input 
            type="text" 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="e.g., White Pomfret (Whole)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="D2C">D2C Premium</option>
            <option value="B2B">B2B Export</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price (₹)</label>
          <input 
            type="number" 
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="e.g., 450"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          {editingId ? "Update Product" : "Add Product"}
        </button>
        {editingId && (
          <button 
            type="button" 
            onClick={() => { setEditingId(null); setName(""); setPrice(""); }}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
          >
            Cancel
          </button>
        )}
      </form>

      {/* Product List (Read & Delete) */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-600">Product</th>
              <th className="p-4 font-medium text-gray-600">Category</th>
              <th className="p-4 font-medium text-gray-600">Price</th>
              <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">Loading inventory...</td></tr>
            ) : products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{product.name}</td>
                <td className="p-4 text-gray-600"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm">{product.category}</span></td>
                <td className="p-4 font-mono">₹{product.retail_price}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleEdit(product)} className="text-blue-600 hover:underline mr-4">Edit</button>
                  <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {!loading && products.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">No products found. Add your first catch.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}