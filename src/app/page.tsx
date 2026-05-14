"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";

type AnalysisResult = {
  nombre: string;
  calorias: number;
  proteinas: number;
  grasas: number;
  carbohidratos: number;
  fibra: number;
  azucar: number;
  tipo_comida: string;
  calidad_nutricional: number;
  comentario_coach: string;
};

type FoodLog = {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  meal_type: string;
  created_at: string;
};

type SavedMeal = {
  id: string;
  meal_name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  meal_type: string;
};

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<FoodLog[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"scan" | "saved">("scan");
  const router = useRouter();

  const fetchHistory = async () => {
    const { data } = await supabase
      .from("food_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory((data as FoodLog[]) || []);
  };

  const fetchSavedMeals = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data } = await supabase
        .from("saved_meals")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      setSavedMeals((data as SavedMeal[]) || []);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setSession(session);
        fetchHistory();
        fetchSavedMeals();
      }
    };
    checkSession();
  }, [router]);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setResult(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image }),
        });

        if (response.ok) {
          const data: AnalysisResult = await response.json();
          setResult(data);

          // Save to food_logs with English column names
          if (session?.user?.id) {
            await supabase.from("food_logs").insert([
              {
                user_id: session.user.id,
                food_name: data.nombre,
                calories: data.calorias,
                protein: data.proteinas,
                fat: data.grasas,
                carbs: data.carbohidratos,
                fiber: data.fibra,
                sugar: data.azucar,
                meal_type: data.tipo_comida,
                is_ai_estimated: true,
              },
            ]);
            await fetchHistory();
          }
        } else {
          console.error("Failed to analyze image");
        }
      } catch (error) {
        console.error("Error calling analyze API:", error);
      } finally {
        setIsAnalyzing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMeal = async () => {
    if (!result || !session?.user?.id) return;
    try {
      await supabase.from("saved_meals").insert([
        {
          user_id: session.user.id,
          meal_name: result.nombre,
          calories: result.calorias,
          protein: result.proteinas,
          fat: result.grasas,
          carbs: result.carbohidratos,
          fiber: result.fibra,
          sugar: result.azucar,
          meal_type: result.tipo_comida,
        },
      ]);
      await fetchSavedMeals();
    } catch (error) {
      console.error("Error saving meal:", error);
    }
  };

  const handleAddSavedMeal = async (meal: SavedMeal) => {
    if (!session?.user?.id) return;
    try {
      await supabase.from("food_logs").insert([
        {
          user_id: session.user.id,
          food_name: meal.meal_name,
          calories: meal.calories,
          protein: meal.protein,
          fat: meal.fat,
          carbs: meal.carbs,
          fiber: meal.fiber,
          sugar: meal.sugar,
          meal_type: meal.meal_type,
          is_ai_estimated: false,
        },
      ]);
      await fetchHistory();
    } catch (error) {
      console.error("Error adding saved meal:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse font-anton text-2xl text-red-600 tracking-[0.2em] uppercase">
          CARGANDO...
        </div>
      </main>
    );
  }

  // Calculate daily totals
  const today = new Date().toISOString().split("T")[0];
  const todayLogs = history.filter(
    (item) => item.created_at?.startsWith(today)
  );
  const totals = todayLogs.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein || 0),
      fat: acc.fat + (item.fat || 0),
      carbs: acc.carbs + (item.carbs || 0),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  return (
    <main className="min-h-screen flex flex-col bg-black text-white relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-red-600/3 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 py-4 px-4 flex items-center justify-between border-b border-zinc-900">
        <h1 className="font-anton text-2xl text-red-600 tracking-[0.15em] uppercase">
          FitnessLAB
        </h1>
        <button
          onClick={handleSignOut}
          className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] hover:text-red-500 transition-colors px-3 py-2"
        >
          SALIR
        </button>
      </header>

      {/* Daily Summary Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-4 py-3 bg-zinc-950/80 border-b border-zinc-900"
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="text-center flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">Cal</p>
            <p className="font-anton text-xl text-red-500">{totals.calories}</p>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-center flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">Prot</p>
            <p className="font-anton text-xl text-white">{totals.protein}g</p>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-center flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">Grasa</p>
            <p className="font-anton text-xl text-white">{totals.fat}g</p>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-center flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">Carbs</p>
            <p className="font-anton text-xl text-white">{totals.carbs}g</p>
          </div>
        </div>
      </motion.div>

      {/* Tab Switcher */}
      <div className="relative z-10 flex border-b border-zinc-900">
        <button
          onClick={() => setActiveTab("scan")}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-[0.2em] transition-colors ${
            activeTab === "scan"
              ? "text-red-500 border-b-2 border-red-600"
              : "text-zinc-600 hover:text-zinc-400"
          }`}
        >
          ESCANEAR
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-[0.2em] transition-colors relative ${
            activeTab === "saved"
              ? "text-red-500 border-b-2 border-red-600"
              : "text-zinc-600 hover:text-zinc-400"
          }`}
        >
          FRECUENTES
          {savedMeals.length > 0 && (
            <span className="absolute top-2 right-[30%] bg-red-600 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {savedMeals.length}
            </span>
          )}
        </button>
      </div>

      {/* Content Area */}
      <section className="relative z-10 flex-1 flex flex-col items-center p-4 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {activeTab === "scan" ? (
            <motion.div
              key="scan"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full max-w-lg flex flex-col gap-4"
            >
              {isAnalyzing ? (
                /* Analyzing State */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full aspect-[4/3] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-4"
                >
                  <div className="relative">
                    <div className="w-16 h-16 border-2 border-red-600/30 rounded-full" />
                    <div className="absolute inset-0 w-16 h-16 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <span className="text-red-500 font-black tracking-[0.3em] text-sm uppercase animate-pulse">
                    ANALIZANDO...
                  </span>
                </motion.div>
              ) : result ? (
                /* Results */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-3"
                >
                  {/* Food Name + Type */}
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-red-500/70 uppercase tracking-[0.3em]">
                      {result.tipo_comida} • {result.calidad_nutricional}/10
                    </span>
                    <h2 className="font-anton text-3xl uppercase text-white mt-1 leading-tight">
                      {result.nombre}
                    </h2>
                  </div>

                  {/* Coach Comment */}
                  {result.comentario_coach && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-r from-red-950/40 to-red-900/20 border-l-2 border-red-600 p-4 rounded-r-xl"
                    >
                      <p className="text-red-100/80 text-sm italic leading-relaxed">
                        &ldquo;{result.comentario_coach}&rdquo;
                      </p>
                    </motion.div>
                  )}

                  {/* Macro Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Calories - Full width accent */}
                    <div className="col-span-3 bg-gradient-to-r from-red-700 to-red-600 p-4 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">
                        Calorías
                      </span>
                      <span className="font-anton text-4xl text-white">
                        {result.calorias}
                      </span>
                    </div>
                    {/* Main macros */}
                    <MacroCard label="Proteína" value={result.proteinas} unit="g" />
                    <MacroCard label="Grasas" value={result.grasas} unit="g" />
                    <MacroCard label="Carbos" value={result.carbohidratos} unit="g" />
                    {/* Micro macros */}
                    <MacroCard label="Fibra" value={result.fibra} unit="g" small />
                    <MacroCard label="Azúcar" value={result.azucar} unit="g" small />
                    <div className="bg-zinc-950 border border-zinc-800/50 p-3 rounded-xl flex flex-col items-center justify-center">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-600">
                        Calidad
                      </span>
                      <span className="font-anton text-lg text-red-500">
                        {result.calidad_nutricional}/10
                      </span>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveMeal}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs py-3 rounded-xl uppercase tracking-[0.2em] transition-all active:scale-[0.98]"
                  >
                    ★ GUARDAR COMO FRECUENTE
                  </button>

                  {/* Scan Again */}
                  <button
                    onClick={() => setResult(null)}
                    className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-zinc-400 transition-colors"
                  >
                    ESCANEAR OTRO
                  </button>
                </motion.div>
              ) : (
                /* Empty State - Camera */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full aspect-[4/3] bg-zinc-950 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-red-900/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 rounded-full border-2 border-zinc-700 flex items-center justify-center">
                    <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                    </svg>
                  </div>
                  <p className="text-zinc-600 font-bold text-xs uppercase tracking-[0.2em]">
                    Toca para escanear
                  </p>
                </motion.div>
              )}

              {/* History */}
              {history.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full" />
                    HISTORIAL
                  </h3>
                  <div className="flex flex-col gap-2">
                    {history.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl flex justify-between items-center"
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-bold text-sm text-white truncate">
                            {item.food_name}
                          </span>
                          <span className="text-[9px] text-zinc-600 uppercase tracking-wider">
                            {item.meal_type}
                          </span>
                        </div>
                        <div className="flex gap-3 text-xs font-bold shrink-0 ml-3">
                          <span className="text-red-500">{item.calories}</span>
                          <span className="text-zinc-500">{item.protein}P</span>
                          <span className="text-zinc-600">{item.fat}G</span>
                          <span className="text-zinc-600">{item.carbs}C</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* Saved Meals Tab */
            <motion.div
              key="saved"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-lg flex flex-col gap-3"
            >
              {savedMeals.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-zinc-700 font-bold text-xs uppercase tracking-[0.2em]">
                    Sin comidas guardadas
                  </p>
                  <p className="text-zinc-800 text-[10px] mt-2">
                    Escanea algo y pulsa &quot;Guardar como frecuente&quot;
                  </p>
                </div>
              ) : (
                savedMeals.map((meal, i) => (
                  <motion.div
                    key={meal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-sm text-white">{meal.meal_name}</p>
                        <p className="text-[9px] text-zinc-600 uppercase tracking-wider">
                          {meal.meal_type} • {meal.calories} cal
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddSavedMeal(meal)}
                        className="bg-red-600 hover:bg-red-500 text-white font-black text-[10px] px-4 py-2 rounded-lg uppercase tracking-wider transition-colors active:scale-95"
                      >
                        + HOY
                      </button>
                    </div>
                    <div className="flex gap-3 text-[10px] font-bold text-zinc-500">
                      <span>{meal.protein}P</span>
                      <span>{meal.fat}G</span>
                      <span>{meal.carbs}C</span>
                      <span>{meal.fiber}F</span>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Bottom Scan Button */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
        />
        <button
          onClick={() => {
            setActiveTab("scan");
            fileInputRef.current?.click();
          }}
          disabled={isAnalyzing}
          className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:text-red-700 text-white font-black text-lg py-5 uppercase tracking-[0.2em] transition-all active:scale-[0.98]"
        >
          {isAnalyzing ? "PROCESANDO..." : "ESCANEAR MACROS"}
        </button>
      </div>
    </main>
  );
}

/* Macro Card Component */
function MacroCard({
  label,
  value,
  unit,
  small,
}: {
  label: string;
  value: number;
  unit: string;
  small?: boolean;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-800/50 p-3 rounded-xl flex flex-col items-center justify-center">
      <span className={`font-bold uppercase tracking-wider text-zinc-600 ${small ? "text-[8px]" : "text-[9px]"}`}>
        {label}
      </span>
      <span className={`font-anton text-white ${small ? "text-lg" : "text-2xl"}`}>
        {value}
        <span className="text-zinc-600 text-xs">{unit}</span>
      </span>
    </div>
  );
}