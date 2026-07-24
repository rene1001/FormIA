import React, { useState } from "react";
import {
  X,
  Check,
  Zap,
  Sparkles,
  Smartphone,
  CreditCard,
  Crown,
  Lock,
  Gift,
  HelpCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPremium: boolean;
  trialDaysLeft: number;
  isTrialExpired: boolean;
  onSubscribe: () => void;
  onSimulateExpired: () => void;
  onSimulateReset: () => void;
  userDisplayName?: string;
  userEmail?: string;
}

type Currency = "XOF" | "USD";
type PaymentMethod = "wave" | "orange" | "mtn" | "card";

export default function PricingModal({
  isOpen,
  onClose,
  isPremium,
  trialDaysLeft,
  isTrialExpired,
  onSubscribe,
  onSimulateExpired,
  onSimulateReset,
  userDisplayName = "",
  userEmail = "",
}: PricingModalProps) {
  const [currency, setCurrency] = useState<Currency>("XOF");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wave");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  
  // Custom direct transfer states
  const [senderName, setSenderName] = useState(userDisplayName);
  const [senderEmail, setSenderEmail] = useState(userEmail);
  const [transactionRef, setTransactionRef] = useState("");
  
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "direct_submitted" | "error">("idle");
  const [paymentStep, setPaymentStep] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [cardError, setCardError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [submittedTxId, setSubmittedTxId] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Sync user info if modal re-opens or if auth changes
  React.useEffect(() => {
    if (isOpen) {
      if (!senderName && userDisplayName) {
        setSenderName(userDisplayName);
      }
      if (!senderEmail && userEmail) {
        setSenderEmail(userEmail);
      }
    }
  }, [isOpen, userDisplayName, userEmail]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (!isOpen) return null;

  const priceLabel = currency === "XOF" ? "1 000 FCFA" : "1.72 USD";
  const periodLabel = "par an";

  // Read current configuration
  const paymentMode = localStorage.getItem("formflow_payment_mode") || "direct";
  const ownerWave = localStorage.getItem("formflow_owner_wave") || "+221 77 123 45 67";
  const ownerOrange = localStorage.getItem("formflow_owner_orange") || "+225 07 987 65 43";
  const ownerMtn = localStorage.getItem("formflow_owner_mtn") || "+229 90 00 00 00";
  const ownerVisa = localStorage.getItem("formflow_owner_visa") || "CI086 01001 123456789012 34";
  const activeGateway = localStorage.getItem("formflow_gateway") || "fedapay";

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");
    setCardError("");
    setGeneralError("");

    if (paymentMode === "direct") {
      if (!senderName.trim()) {
        setGeneralError("Veuillez renseigner votre nom complet.");
        return;
      }
      if (!senderEmail.trim() || !senderEmail.includes("@")) {
        setGeneralError("Veuillez renseigner une adresse e-mail valide.");
        return;
      }
      if (paymentMethod !== "card" && !phoneNumber.trim()) {
        setPhoneError("Veuillez renseigner votre numéro de téléphone d'envoi.");
        return;
      }
      if (!transactionRef.trim()) {
        setGeneralError("Veuillez renseigner le code ou la référence de transaction de votre transfert.");
        return;
      }
      if (paymentMethod === "card" && (!cardNumber || !cardExpiry || !cardCVC)) {
        setCardError("Veuillez renseigner les détails de votre carte Visa.");
        return;
      }

      // Process direct payment submission (manual verification queue)
      setPaymentStatus("processing");
      setPaymentStep("Génération de votre reçu numérique...");

      setTimeout(() => {
        setPaymentStep("Enregistrement de la demande de validation de transfert...");
        
        setTimeout(() => {
          setPaymentStep("Notification envoyée à l'administrateur !");
          
          setTimeout(() => {
            const newTxId = "TX-" + Math.floor(100000 + Math.random() * 900000);
            setSubmittedTxId(newTxId);

            // Register in localStorage pendingPayments
            const savedPending = localStorage.getItem("formflow_pending_payments");
            let pendingList = [];
            if (savedPending) {
              try {
                pendingList = JSON.parse(savedPending);
              } catch (e) {}
            }

            const newPayment = {
              id: newTxId,
              userName: senderName,
              userEmail: senderEmail,
              paymentMethod: paymentMethod,
              phoneNumber: paymentMethod !== "card" ? phoneNumber : undefined,
              transactionRef: transactionRef,
              amount: priceLabel,
              date: new Date().toISOString().split("T")[0],
              status: "pending" as const
            };

            pendingList.unshift(newPayment);
            localStorage.setItem("formflow_pending_payments", JSON.stringify(pendingList));

            setPaymentStatus("direct_submitted");
          }, 1200);
        }, 1200);
      }, 1000);

    } else {
      // Automated simulation
      if (paymentMethod !== "card" && !phoneNumber.trim()) {
        setPhoneError("Veuillez entrer votre numéro de téléphone pour la facturation Mobile Money.");
        return;
      }

      if (paymentMethod === "card") {
        if (!cardNumber || !cardExpiry || !cardCVC) {
          setCardError("Veuillez remplir tous les champs de votre carte de crédit.");
          return;
        }
      }

      // Step-by-step payment simulation
      setPaymentStatus("processing");
      const steps = [
        { text: `Connexion sécurisée avec la passerelle automatique ${activeGateway.toUpperCase()}...`, delay: 0 },
        { text: paymentMethod === "card" 
          ? "Vérification des fonds et autorisation bancaire..." 
          : `Envoi de la requête de facturation vers votre opérateur ${paymentMethod.toUpperCase()}...`, delay: 1000 },
        { text: paymentMethod === "card"
          ? "Sécurisation de la transaction en cours..."
          : `Attente du débit automatique validé par l'API ${activeGateway.toUpperCase()}...`, delay: 2500 },
        { text: "Paiement approuvé instantanément par la passerelle !", delay: 4200 },
        { text: "Génération de votre licence FormFlow Premium...", delay: 5200 },
      ];

      steps.forEach((step, idx) => {
        setTimeout(() => {
          setPaymentStep(step.text);
          if (idx === steps.length - 1) {
            setTimeout(() => {
              setPaymentStatus("success");
              onSubscribe(); // Update parent state to premium
            }, 1000);
          }
        }, step.delay);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200 max-h-[92vh]">
        
        {/* Left column: Plan Benefits */}
        <div className="bg-gradient-to-b from-blue-900 to-slate-950 p-6 md:p-8 text-white flex flex-col justify-between md:w-[48%] shrink-0 overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-500/10 border border-blue-400/20 rounded-xl text-blue-400">
                <Crown className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
              </span>
              <span className="text-xs font-bold tracking-wider uppercase text-blue-400">
                FORFAIT UNIQUE SANS ENGAGEMENT
              </span>
            </div>

            <div>
              <h3 className="text-2xl font-extrabold font-display leading-tight">
                FormFlow Premium
              </h3>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                Profitez d'une liberté totale et boostez votre productivité avec l'IA la plus avancée du marché pour concevoir des questionnaires professionnels.
              </p>
            </div>

            {/* Trial Status indicator */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-200">État de votre abonnement</span>
              </div>
              {isPremium ? (
                <div className="text-xs text-green-400 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Licencié à vie / Annuel Actif !
                </div>
              ) : isTrialExpired ? (
                <div className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                  ⚠️ Période d'essai de 3 jours expirée !
                </div>
              ) : (
                <div className="text-xs text-blue-300 font-semibold">
                  ⏳ Mode d'essai actif : <span className="text-white font-bold">{trialDaysLeft} jour(s) restants</span> (avec publicités discrètes).
                </div>
              )}
            </div>

            {/* Benefit Checkmarks */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-500/10 text-blue-400 rounded-lg mt-0.5 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-white block">Suppression des publicités</strong>
                  Aucun encart publicitaire pour un espace de travail épuré et ultra-fluide.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-500/10 text-blue-400 rounded-lg mt-0.5 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-white block">Générations IA illimitées</strong>
                  Aucune limite quotidienne sur la création de formulaires avec Gemini.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-500/10 text-blue-400 rounded-lg mt-0.5 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-white block">Analyses avancées en temps réel</strong>
                  Filtres interactifs, graphiques détaillés et rapports PDF exportables.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-500/10 text-blue-400 rounded-lg mt-0.5 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-slate-300">
                  <strong className="text-white block">Support prioritaire VIP</strong>
                  Une assistance technique dédiée sous 24 heures pour toutes vos questions.
                </div>
              </div>
            </div>
          </div>

          {/* Tester controls to easily test different flow states */}
          <div className="border-t border-white/10 pt-4 mt-6">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-bold mb-2">
              🧪 Panneau de test (Simulateur)
            </span>
            <div className="flex gap-2">
              <button
                onClick={onSimulateExpired}
                className="flex-1 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 text-[10px] py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer text-slate-300 hover:text-white text-center"
              >
                Forcer l'expiration (3j)
              </button>
              <button
                onClick={onSimulateReset}
                className="flex-1 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 text-[10px] py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer text-slate-300 hover:text-white text-center"
              >
                Réinitialiser l'essai
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Pricing & Payments Checkout */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-400" />
                Finaliser l'activation de votre abonnement
              </h4>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {paymentStatus === "idle" && (
              <div className="space-y-5 py-4 animate-in fade-in duration-200">
                {/* Pricing highlight & Currency selector */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold block">
                      Tarif annuel unique
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-3xl font-black text-slate-900 font-display">
                        {priceLabel}
                      </span>
                      <span className="text-slate-500 text-xs font-semibold">{periodLabel}</span>
                    </div>
                  </div>

                  <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-bold w-full sm:w-auto self-start sm:self-center">
                    <button
                      onClick={() => setCurrency("XOF")}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                        currency === "XOF"
                          ? "bg-white text-slate-900 shadow-3xs"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      Francs CFA (XOF)
                    </button>
                    <button
                      onClick={() => setCurrency("USD")}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                        currency === "USD"
                          ? "bg-white text-slate-900 shadow-3xs"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>

                {/* Local Payment Methods selector */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 tracking-wide uppercase block">
                    Sélectionner un moyen de paiement
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* WAVE */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("wave")}
                      className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                        paymentMethod === "wave"
                          ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/10"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-3xs">
                          🌊
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Wave</span>
                          <span className="text-[9px] text-slate-400">Sans frais supplémentaires</span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        paymentMethod === "wave" ? "border-blue-500 bg-blue-500" : "border-slate-300"
                      }`}>
                        {paymentMethod === "wave" && <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />}
                      </div>
                    </button>

                    {/* ORANGE MONEY */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("orange")}
                      className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                        paymentMethod === "orange"
                          ? "border-orange-500 bg-orange-50/30 ring-2 ring-orange-500/10"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-3xs">
                          🍊
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Orange Money</span>
                          <span className="text-[9px] text-slate-400">Paiement instantané</span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        paymentMethod === "orange" ? "border-orange-500 bg-orange-500" : "border-slate-300"
                      }`}>
                        {paymentMethod === "orange" && <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />}
                      </div>
                    </button>

                    {/* MTN MOBILE MONEY */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("mtn")}
                      className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                        paymentMethod === "mtn"
                          ? "border-amber-500 bg-amber-50/30 ring-2 ring-amber-500/10"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-yellow-400 text-amber-950 flex items-center justify-center font-bold text-xs shadow-3xs">
                          🟡
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">MTN MoMo</span>
                          <span className="text-[9px] text-slate-400">Paiement ultra-sécurisé</span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        paymentMethod === "mtn" ? "border-amber-500 bg-amber-500" : "border-slate-300"
                      }`}>
                        {paymentMethod === "mtn" && <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />}
                      </div>
                    </button>

                    {/* CREDIT CARD */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                        paymentMethod === "card"
                          ? "border-purple-500 bg-purple-50/30 ring-2 ring-purple-500/10"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-3xs">
                          💳
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Carte Bancaire</span>
                          <span className="text-[9px] text-slate-400">Visa, Mastercard</span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        paymentMethod === "card" ? "border-purple-500 bg-purple-500" : "border-slate-300"
                      }`}>
                        {paymentMethod === "card" && <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Form Inputs based on payment method and mode */}
                <form onSubmit={handleSimulatePayment} className="space-y-4 pt-1">
                  
                   {paymentMode === "direct" && (
                    <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 text-[11px] text-slate-700 space-y-3.5 animate-in slide-in-from-top-1 shadow-3xs">
                      <p className="font-extrabold text-blue-900 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                        📍 Instructions de transfert direct :
                      </p>
                      
                      {paymentMethod === "wave" && (
                        <div className="space-y-2">
                          <p>1. Ouvrez votre application <strong>Wave</strong> sur votre téléphone.</p>
                          <p>2. Effectuez un transfert gratuit de <strong>{priceLabel}</strong> vers le compte de l'administrateur :</p>
                          <div className="bg-white/90 border border-blue-200 p-2.5 rounded-xl font-bold font-mono text-xs flex items-center justify-between mt-1 text-blue-950">
                            <span>{ownerWave}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(ownerWave, "wave")}
                              className="text-[10px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                            >
                              {copiedText === "wave" ? "✓ Copié !" : "Copier"}
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500 pt-1">3. Copiez le code de transaction reçu par SMS et collez-le ci-dessous.</p>
                        </div>
                      )}

                      {paymentMethod === "orange" && (
                        <div className="space-y-2">
                          <p>1. Composez le code d'envoi ou ouvrez l'application <strong>Orange Money</strong>.</p>
                          <p>2. Effectuez un transfert de <strong>{priceLabel}</strong> au numéro de l'administrateur :</p>
                          <div className="bg-white/90 border border-orange-200 p-2.5 rounded-xl font-bold font-mono text-xs flex items-center justify-between mt-1 text-orange-950">
                            <span>{ownerOrange}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(ownerOrange, "orange")}
                              className="text-[10px] bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                            >
                              {copiedText === "orange" ? "✓ Copié !" : "Copier"}
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500 pt-1">3. Copiez la référence de transaction reçue par SMS de l'opérateur et saisissez-la ci-dessous.</p>
                        </div>
                      )}

                      {paymentMethod === "mtn" && (
                        <div className="space-y-2">
                          <p>1. Ouvrez votre portefeuille ou composez le code <strong>MTN Mobile Money</strong>.</p>
                          <p>2. Effectuez un transfert MoMo de <strong>{priceLabel}</strong> sur le compte de l'administrateur :</p>
                          <div className="bg-white/90 border border-yellow-200 p-2.5 rounded-xl font-bold font-mono text-xs flex items-center justify-between mt-1 text-yellow-950">
                            <span>{ownerMtn}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(ownerMtn, "mtn")}
                              className="text-[10px] bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                            >
                              {copiedText === "mtn" ? "✓ Copié !" : "Copier"}
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500 pt-1">3. Saisissez la référence du reçu d'envoi MTN ci-dessous.</p>
                        </div>
                      )}

                      {paymentMethod === "card" && (
                        <div className="space-y-2">
                          <p>1. Effectuez un virement bancaire ou approvisionnement direct de <strong>{priceLabel}</strong> sur le RIB de l'administrateur :</p>
                          <div className="bg-white/90 border border-purple-200 p-3 rounded-xl font-mono text-[10px] mt-1 text-purple-950 leading-relaxed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <span className="break-all select-all"><strong>RIB:</strong> {ownerVisa}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(ownerVisa, "visa")}
                              className="text-[10px] bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 self-end sm:self-center"
                            >
                              {copiedText === "visa" ? "✓ Copié !" : "Copier"}
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500 pt-1">2. Complétez vos coordonnées de virement ci-dessous.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Direct payment payer identity */}
                  {paymentMode === "direct" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Votre Nom complet
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Amadou Diallo"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Votre Adresse e-mail
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="amadou.diallo@gmail.com"
                          value={senderEmail}
                          onChange={(e) => setSenderEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod !== "card" ? (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                        {paymentMode === "direct" ? "Numéro de téléphone d'envoi" : "Numéro de téléphone de facturation"}
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          placeholder={
                            paymentMethod === "wave"
                              ? "Ex: +221 77 123 45 67"
                              : paymentMethod === "orange"
                              ? "Ex: +225 07 987 65 43"
                              : "Ex: +229 90 123 456"
                          }
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm placeholder:text-slate-400 transition-all font-mono"
                        />
                      </div>
                      {phoneError && <p className="text-[11px] text-red-500 mt-1 font-semibold">{phoneError}</p>}
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          Numéro de carte de crédit / Débit
                        </label>
                        <input
                          type="text"
                          placeholder="4000 1234 5678 9010"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm placeholder:text-slate-400 transition-all font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                            Date d'expiration
                          </label>
                          <input
                            type="text"
                            placeholder="MM/AA"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm placeholder:text-slate-400 transition-all text-center font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                            Code CVC / CVV
                          </label>
                          <input
                            type="password"
                            placeholder="•••"
                            maxLength={3}
                            value={cardCVC}
                            onChange={(e) => setCardCVC(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 text-sm placeholder:text-slate-400 transition-all text-center font-mono"
                          />
                        </div>
                      </div>
                      {cardError && <p className="text-[11px] text-red-500 mt-1 font-semibold">{cardError}</p>}
                    </div>
                  )}

                  {/* Direct payment Transaction reference */}
                  {paymentMode === "direct" && (
                    <div className="space-y-1 pt-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                        🔑 Référence / Code de transaction reçu
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={
                          paymentMethod === "wave"
                            ? "Ex: WAVE-54128-TR"
                            : paymentMethod === "orange"
                            ? "Ex: OM.0712.9832"
                            : "Ex: MP.2031.98"
                        }
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm font-mono placeholder:text-slate-400"
                      />
                    </div>
                  )}

                  {generalError && <p className="text-[11px] text-red-500 mt-1 font-semibold">{generalError}</p>}

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-4 h-4 shrink-0" />
                    {paymentMode === "direct" ? "Soumettre le reçu de paiement direct" : `Payer ${priceLabel} par an`}
                  </button>
                </form>
              </div>
            )}

            {paymentStatus === "processing" && (
              <div className="flex flex-col items-center justify-center py-16 px-4 animate-in fade-in duration-200 space-y-6">
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute text-blue-600 animate-pulse">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </div>
                <div className="text-center space-y-2 max-w-[320px]">
                  <h4 className="text-sm font-bold text-slate-800 font-display">Traitement sécurisé...</h4>
                  <p className="text-xs text-slate-500 leading-relaxed min-h-[40px]">{paymentStep}</p>
                </div>
              </div>
            )}

            {paymentStatus === "success" && (
              <div className="flex flex-col items-center justify-center py-12 px-4 animate-in zoom-in-95 duration-300 space-y-6 text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full border border-green-100 flex items-center justify-center text-green-600 shadow-md">
                  <Crown className="w-10 h-10 text-amber-500 fill-amber-500 animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-slate-900 font-display">Bienvenue dans FormFlow Premium ! 🎉</h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[360px] mx-auto">
                    Votre paiement de <strong>{priceLabel}</strong> a été validé avec succès. Les publicités ont été entièrement supprimées et toutes les fonctionnalités sont déverrouillées !
                  </p>
                </div>

                <button
                  onClick={() => {
                    setPaymentStatus("idle");
                    setPhoneNumber("");
                    setCardNumber("");
                    setCardExpiry("");
                    setCardCVC("");
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
                >
                  Commencer l'expérience Premium
                </button>
              </div>
            )}

            {paymentStatus === "direct_submitted" && (
              <div className="flex flex-col py-6 px-2 animate-in zoom-in-95 duration-300 space-y-6 text-slate-800">
                <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0 border border-blue-100">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 leading-snug">
                      Reçu de Transfert Soumis avec Succès !
                    </h4>
                    <p className="text-xs text-slate-500">
                      Votre demande est en file d'attente de validation par l'administrateur.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Référence</span>
                      <span className="font-extrabold text-blue-700 font-mono text-sm">{submittedTxId}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Méthode de paiement</span>
                      <span className="font-bold text-slate-700 uppercase">
                        {paymentMethod === "wave" && "🌊 Wave Transfer"}
                        {paymentMethod === "orange" && "🍊 Orange Money"}
                        {paymentMethod === "mtn" && "🟡 MTN MoMo"}
                        {paymentMethod === "card" && "💳 Carte Bancaire / Virement"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Payeur</span>
                      <span className="font-bold text-slate-700 block">{senderName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{senderEmail}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Code Saisi</span>
                      <span className="font-bold text-blue-900 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-100/50 inline-block">
                        {transactionRef}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Montant</span>
                    <span className="font-black text-slate-950 text-sm">{priceLabel}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed space-y-2 bg-amber-50/50 border border-amber-100 p-4 rounded-xl">
                  <p className="font-bold text-amber-800">📍 Que va-t-il se passer ensuite ?</p>
                  <p>
                    L'administrateur va recevoir votre demande, vérifier la réception effective de vos <strong>{priceLabel}</strong> sur son téléphone, puis validera votre dossier. Votre compte FormFlow passera automatiquement en mode Premium à vie !
                  </p>
                  
                  <div className="pt-2.5 mt-2.5 border-t border-amber-200/50 space-y-2 text-[11px]">
                    <span className="font-bold text-amber-900 block flex items-center gap-1">
                      🛠️ Mode Démo / Évaluation :
                    </span>
                    <p className="text-amber-800/90">
                      Vous pouvez soit ouvrir l'onglet <strong>"Console Admin"</strong> en haut à droite du site et cliquer sur "Valider" dans l'onglet des paiements, soit cliquer sur le bouton raccourci ci-dessous pour simuler l'approbation instantanée !
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={() => {
                      onSubscribe(); // Set to premium
                      setPaymentStatus("success");
                    }}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    Simuler l'approbation instantanée (Test)
                  </button>
                  <button
                    onClick={() => {
                      setPaymentStatus("idle");
                      setPhoneNumber("");
                      setCardNumber("");
                      setCardExpiry("");
                      setCardCVC("");
                      onClose();
                    }}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Fermer la fenêtre
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Secure note */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              Connexion sécurisée SSL 256 bits
            </span>
            <span className="hidden xs:inline">
              FormFlow Payments S.A.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
