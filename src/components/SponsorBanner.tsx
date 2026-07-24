import React, { useState, useEffect } from "react";
import { Sparkles, Megaphone, X, Crown, ShieldAlert, ArrowRight } from "lucide-react";

interface SponsorBannerProps {
  isPremium: boolean;
  onOpenPricing: () => void;
}

const MOCK_ADS = [
  {
    id: 1,
    tag: "Sponsorisé • HostLite Cloud",
    title: "Hébergez vos projets web en 1 clic dès 1.20$ / mois !",
    description: "Infrastructure CDN mondiale ultra-rapide, certificats SSL gratuits et bande passante illimitée. Offre exclusive membres FormFlow.",
    cta: "Découvrir HostLite",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-100",
    btnColor: "bg-teal-600 hover:bg-teal-700 active:bg-teal-800",
  },
  {
    id: 2,
    tag: "Partenaire • MailApex",
    title: "Automatisez vos suivis de formulaires par e-mail et SMS",
    description: "Associez vos Google Forms à des newsletters et relances automatiques professionnelles. Essayez gratuitement pendant 14 jours.",
    cta: "Essayer gratuitement",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-100",
    btnColor: "bg-purple-600 hover:bg-purple-700 active:bg-purple-800",
  },
  {
    id: 3,
    tag: "Sponsorisé • CodeForge Academy",
    title: "Devenez Développeur Web Full-Stack en 12 semaines 🚀",
    description: "Formations en ligne de premier plan sur React, Node.js, et l'intégration de modèles d'IA comme Gemini. Financement à 100% possible.",
    cta: "Consulter les cours",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100",
    btnColor: "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800",
  },
  {
    id: 4,
    tag: "Recommandé • FormFlow Premium",
    title: "Supprimez toutes les publicités et libérez la puissance de l'IA !",
    description: "Concevez des questionnaires intelligents sans aucune limite pour seulement 1 000 FCFA (1.72 USD) par an. Offre sans engagement.",
    cta: "Passer à Premium",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-100",
    btnColor: "bg-amber-600 hover:bg-amber-700 active:bg-amber-800",
  }
];

export default function SponsorBanner({ isPremium, onOpenPricing }: SponsorBannerProps) {
  const [currentAdIdx, setCurrentAdIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isPremium) {
      setIsVisible(false);
      return;
    }

    // Auto rotate ads every 12 seconds for realistic interaction
    const interval = setInterval(() => {
      setCurrentAdIdx((prev) => (prev + 1) % MOCK_ADS.length);
    }, 12000);

    return () => clearInterval(interval);
  }, [isPremium]);

  if (isPremium || !isVisible) return null;

  const ad = MOCK_ADS[currentAdIdx];

  return (
    <div className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs animate-in fade-in duration-300">
      <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
        <button
          onClick={onOpenPricing}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-[9px] transition-all cursor-pointer shadow-3xs"
        >
          <Crown className="w-2.5 h-2.5 fill-white" />
          Retirer les pubs
        </button>
        <button
          onClick={() => {
            // Temporary hide but explain it's due to non-premium
            setIsVisible(false);
            // Re-show another ad in 20 seconds to simulate commercial networks
            setTimeout(() => {
              setIsVisible(true);
              setCurrentAdIdx((prev) => (prev + 1) % MOCK_ADS.length);
            }, 20000);
          }}
          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer transition-all"
          title="Fermer temporairement la publicité"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 md:max-w-[75%]">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0">
              <Megaphone className="w-3 h-3 text-slate-400" />
              Sponsorisé
            </span>
            <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-md shrink-0 ${ad.badgeColor}`}>
              {ad.tag}
            </span>
          </div>
          <h5 className="text-xs md:text-sm font-bold text-slate-800 leading-snug">
            {ad.title}
          </h5>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {ad.description}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto mt-1 md:mt-0">
          <button
            onClick={() => {
              if (ad.id === 4) {
                onOpenPricing();
              } else {
                // Simulate opening the external link safely
                alert(`[Simulation d'ouverture] Redirection vers ${ad.tag.split(" • ")[1]}...\nDans la version réelle, ce bouton ouvre le lien partenaire.`);
              }
            }}
            className={`w-full md:w-auto px-4 py-2 text-xs font-bold text-white rounded-xl cursor-pointer shadow-3xs hover:shadow-2xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${ad.btnColor}`}
          >
            {ad.cta}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
