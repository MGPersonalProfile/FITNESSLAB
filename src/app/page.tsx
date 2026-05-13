"use client";

import { useRef, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type Macros = {
  nombre: string;
  calorias: number;
  proteinas: number;
  grasas: number;
  carbohidratos: number;
} | null;

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [macros, setMacros] = useState<Macros>(null);
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('scans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    setHistory(data || []);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setMacros(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: base64Image }),
        });

        if (response.ok) {
          const data = await response.json();
          setMacros(data);
          
          await supabase.from('scans').insert([{ 
            nombre_comida: data.nombre, 
            calorias: data.calorias, 
            proteinas: data.proteinas, 
            grasas: data.grasas, 
            carbohidratos: data.carbohidratos 
          }]);
          await fetchHistory();
        } else {
          console.error("Failed to analyze image");
        }
      } catch (error) {
        console.error("Error calling analyze API:", error);
      } finally {
        setIsAnalyzing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="min-h-screen flex flex-col bg-black text-white">
      <header className="py-6 text-center">
        <h1 className="font-anton text-4xl text-primary tracking-widest uppercase">FitnessLAB</h1>
      </header>
      
      <section className="flex-1 flex flex-col items-center justify-center p-4">
        {isAnalyzing ? (
          <div className="w-full max-w-md aspect-square bg-zinc-900 border-2 border-zinc-800 rounded-xl flex items-center justify-center">
            <span className="text-red-500 font-bold tracking-widest text-2xl uppercase animate-pulse">ANALIZANDO COMBUSTIBLE...</span>
          </div>
        ) : macros ? (
          <div className="w-full max-w-md flex flex-col gap-4">
            <h2 className="text-3xl font-black text-center uppercase text-white mb-2">{macros.nombre}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-600 p-6 rounded-xl flex flex-col items-center justify-center border-2 border-red-500">
                <span className="text-sm font-bold uppercase tracking-wider text-red-200">Calorías</span>
                <span className="text-4xl font-black text-white">{macros.calorias}</span>
              </div>
              <div className="bg-zinc-900 p-6 rounded-xl flex flex-col items-center justify-center border-2 border-zinc-800">
                <span className="text-sm font-bold uppercase tracking-wider text-zinc-400">Proteínas</span>
                <span className="text-3xl font-black text-white">{macros.proteinas}g</span>
              </div>
              <div className="bg-zinc-900 p-6 rounded-xl flex flex-col items-center justify-center border-2 border-zinc-800">
                <span className="text-sm font-bold uppercase tracking-wider text-zinc-400">Grasas</span>
                <span className="text-3xl font-black text-white">{macros.grasas}g</span>
              </div>
              <div className="bg-zinc-900 p-6 rounded-xl flex flex-col items-center justify-center border-2 border-zinc-800">
                <span className="text-sm font-bold uppercase tracking-wider text-zinc-400">Carbos</span>
                <span className="text-3xl font-black text-white">{macros.carbohidratos}g</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md aspect-square bg-zinc-900 border-2 border-zinc-800 rounded-xl flex items-center justify-center">
            <span className="text-zinc-500 font-bold tracking-widest">[CAMERA VIEW]</span>
          </div>
        )}
      </section>

      <div className="w-full mt-auto">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          className="hidden" 
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:text-red-400 text-white font-black text-xl py-6 rounded-none uppercase transition-colors"
        >
          {isAnalyzing ? "PROCESANDO..." : "ESCANEAR MACROS"}
        </button>
      </div>

      {history.length > 0 && (
        <section className="w-full p-4 flex flex-col gap-4">
          <h3 className="text-xl font-black uppercase text-red-600 tracking-widest border-b-2 border-red-600 pb-2">Historial de Combustible</h3>
          <div className="flex flex-col gap-3">
            {history.map((item) => (
              <div key={item.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                <span className="font-black uppercase text-white truncate max-w-[50%]">{item.nombre_comida}</span>
                <div className="flex gap-3 text-sm font-bold">
                  <span className="text-red-500">{item.calorias} CAL</span>
                  <span className="text-zinc-400">{item.proteinas}P</span>
                  <span className="text-zinc-400">{item.grasas}G</span>
                  <span className="text-zinc-400">{item.carbohidratos}C</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}