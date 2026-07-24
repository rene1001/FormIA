import React, { useState } from "react";
import { Sparkles, MessageSquare, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";
import { FormStructure } from "../types";

interface FormCreatorProps {
  onFormGenerated: (form: FormStructure) => void;
}

const TEMPLATES = [
  {
    title: "Satisfaction Client",
    prompt: "Sondage de satisfaction complet pour un restaurant gastronomique français évaluant l'accueil, la qualité des plats, le temps d'attente et le rapport qualité-prix.",
    theme: "Professionnel",
    icon: "🍽️",
  },
  {
    title: "Quiz Tech / Dev",
    prompt: "Un quiz de connaissances techniques de 5 questions sur React v19, les hooks (useState, useEffect, useMemo) et les Server Components avec des choix multiples.",
    theme: "Technologique",
    icon: "💻",
  },
  {
    title: "Retour Formation",
    prompt: "Formulaire d'évaluation d'une formation professionnelle de 3 jours : clarté du formateur, pertinence du contenu, rythme et suggestions d'amélioration.",
    theme: "Académique",
    icon: "📚",
  },
  {
    title: "Inscription Événement",
    prompt: "Formulaire d'inscription pour un séminaire d'entreprise avec collecte de coordonnées, préférences alimentaires, choix des ateliers et questions libres.",
    theme: "Amical",
    icon: "🎉",
  },
];

const THEMES = [
  { value: "Professionnel", label: "👔 Professionnel" },
  { value: "Académique", label: "🎓 Éducation / Académique" },
  { value: "Technologique", label: "🚀 Innovation / Tech" },
  { value: "Amical", label: "✨ Amical / Décontracté" },
  { value: "Créatif", label: "🎨 Artistique / Créatif" },
];

const LOADING_STEPS = [
  "Analyse de votre demande...",
  "Conception de la structure générale...",
  "Formulation de questions adaptées...",
  "Ajustement des options de choix...",
  "Polissage de la description du formulaire...",
  "Génération de l'aperçu dynamique...",
];

export default function FormCreator({
  onFormGenerated,
}: FormCreatorProps) {
  const [prompt, setPrompt] = useState("");
  const [theme, setTheme] = useState("Professionnel");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const startLoadingAnimation = () => {
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < LOADING_STEPS.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 1800);
    return interval;
  };

  const handleGenerate = async (e?: React.FormEvent, customPrompt?: string, customTheme?: string) => {
    if (e) e.preventDefault();

    const finalPrompt = customPrompt || prompt;
    const finalTheme = customTheme || theme;

    if (!finalPrompt.trim()) {
      setError("Veuillez saisir un sujet ou choisir un modèle.");
      return;
    }

    setLoading(true);
    setError(null);
    const interval = startLoadingAnimation();

    try {
      const res = await fetch("/api/generate-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt, theme: finalTheme }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "La génération a échoué. Veuillez réessayer.");
      }

      const formStructure: FormStructure = await res.json();
      onFormGenerated(formStructure);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur réseau est survenue.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const selectTemplate = (templatePrompt: string, templateTheme: string) => {
    setPrompt(templatePrompt);
    setTheme(templateTheme);
    handleGenerate(undefined, templatePrompt, templateTheme);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden relative">
      {/* Banner */}
      <div className="bg-slate-950 p-6 md:p-8 text-white relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none shrink-0">
          <Sparkles className="w-52 h-52 rotate-12" />
        </div>
        
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-slate-900 text-blue-300 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border border-slate-850 shadow-3xs">
              🤖 Propulsé par Gemini 2.5
            </span>
            <span className="bg-emerald-500/10 text-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border border-emerald-500/20 shadow-3xs flex items-center gap-1">
              ✨ 100% Gratuit & Illimité
            </span>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black font-display tracking-tight text-white leading-tight">
              Créateur de Google Forms Intelligent
            </h2>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-2xl">
              Décrivez simplement le formulaire que vous souhaitez créer. L'IA concevra instantanément un questionnaire optimisé avec les types de questions idéaux et les meilleures options de réponse.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 relative">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-start gap-3 text-xs animate-in fade-in">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-extrabold">Une erreur est survenue</p>
              <p className="mt-0.5 text-red-600/90">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="relative flex items-center justify-center">
              {/* Outer spinning ring */}
              <div className="w-14 h-14 border-4 border-slate-100 border-t-slate-950 rounded-full animate-spin"></div>
              {/* Central spark */}
              <div className="absolute text-slate-950 animate-pulse">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <h3 className="mt-6 text-sm font-bold font-display text-slate-800 transition-all duration-300">
              {LOADING_STEPS[loadingStep]}
            </h3>
            <p className="mt-1 text-[10px] text-slate-400 font-mono tracking-wider uppercase">
              Étape {loadingStep + 1} sur {LOADING_STEPS.length}
            </p>
            
            {/* Loading progress dots */}
            <div className="flex items-center gap-1.5 mt-4">
              {LOADING_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx <= loadingStep ? "w-4 bg-slate-900" : "w-1.5 bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => handleGenerate(e)}>
            <div className="space-y-6">
              {/* Prompt Input */}
              <div className="space-y-2">
                <label htmlFor="prompt-input" className="text-xs font-extrabold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  Sujet ou objectif de votre questionnaire
                </label>
                <textarea
                  id="prompt-input"
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 rounded-xl outline-hidden transition-all text-slate-800 placeholder-slate-400 text-xs leading-relaxed shadow-3xs"
                  placeholder="Ex : Créer un formulaire d'évaluation pour un cours de yoga en ligne. Demander l'expérience globale, l'appréciation du professeur, le confort de la plateforme et les créneaux préférés pour les prochaines séances..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              {/* Theme Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                  Ton et style du questionnaire
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTheme(t.value)}
                      className={`px-3 py-2 text-[11px] font-bold rounded-xl border transition-all cursor-pointer text-center ${
                        theme === t.value
                          ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!prompt.trim()}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] ${
                    prompt.trim()
                      ? "bg-slate-950 hover:bg-slate-900 text-white cursor-pointer hover:shadow-xs"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-blue-400 fill-blue-400 animate-pulse" />
                  Générer le questionnaire avec l'IA
                  <ChevronRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>

              {/* Templates / Quick Ideas */}
              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Idées rapides à essayer
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.title}
                      type="button"
                      onClick={() => selectTemplate(tpl.prompt, tpl.theme)}
                      className="flex items-start text-left p-4 bg-slate-50/50 hover:bg-slate-50/80 border border-slate-200/50 hover:border-slate-200 rounded-xl transition-all group shrink-0 cursor-pointer"
                    >
                      <span className="text-xl mr-3 bg-white p-2 rounded-lg border border-slate-200/60 shadow-3xs shrink-0 select-none">{tpl.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-xs font-bold text-slate-800 group-hover:text-slate-950 transition-colors truncate">
                            {tpl.title}
                          </h5>
                          <span className="text-[9px] font-extrabold bg-slate-150 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 font-mono">
                            {tpl.theme}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {tpl.prompt}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
