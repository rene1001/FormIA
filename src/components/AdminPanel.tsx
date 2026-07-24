import React, { useState, useEffect } from "react";
import {
  Crown,
  Users,
  TrendingUp,
  CreditCard,
  Eye,
  ToggleLeft,
  ToggleRight,
  Search,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  HelpCircle,
  Megaphone,
  UserCheck,
  ShieldCheck,
  Calendar,
  Lock,
  Key,
  Save,
  Check,
  X,
  Smartphone,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Cell,
  Pie,
} from "recharts";

interface AdminPanelProps {
  currentPremiumStatus?: boolean;
  onTogglePremium?: (status: boolean) => void;
  trialDaysLeft?: number;
  onSetTrialDays?: (days: number) => void;
  onSimulateExpired?: () => void;
  onSimulateReset?: () => void;
}

// Initial mockup data of simulated users from CFA/USD zones
interface SimulatedUser {
  id: string;
  name: string;
  email: string;
  country: string;
  joinedDate: string;
  status: "premium" | "trial" | "expired";
  paymentMethod: "wave" | "orange" | "mtn" | "card" | "-";
  amountPaid: number;
}

const INITIAL_SIMULATED_USERS: SimulatedUser[] = [
  { id: "USR-001", name: "Amadou Diallo", email: "amadou.diallo@gmail.com", country: "Sénégal", joinedDate: "2026-07-10", status: "premium", paymentMethod: "wave", amountPaid: 1000 },
  { id: "USR-002", name: "Koffi Mensah", email: "k.mensah@yahoo.fr", country: "Côte d'Ivoire", joinedDate: "2026-07-12", status: "premium", paymentMethod: "orange", amountPaid: 1000 },
  { id: "USR-003", name: "Gaston Kabore", email: "gaston.k@gmail.com", country: "Burkina Faso", joinedDate: "2026-07-15", status: "trial", paymentMethod: "-", amountPaid: 0 },
  { id: "USR-004", name: "Fatou Diop", email: "fatou_diop@outlook.com", country: "Sénégal", joinedDate: "2026-07-18", status: "premium", paymentMethod: "wave", amountPaid: 1000 },
  { id: "USR-005", name: "Afi Lawson", email: "lawson.afi@gmail.com", country: "Togo", joinedDate: "2026-07-19", status: "trial", paymentMethod: "-", amountPaid: 0 },
  { id: "USR-006", name: "John Doe", email: "johndoe@gmail.com", country: "États-Unis", joinedDate: "2026-07-05", status: "premium", paymentMethod: "card", amountPaid: 1000 }, // represented as 1.72 USD
  { id: "USR-007", name: "Hassane Cisse", email: "hassane.c@hotmail.com", country: "Niger", joinedDate: "2026-07-11", status: "expired", paymentMethod: "-", amountPaid: 0 },
  { id: "USR-008", name: "Inès Soglo", email: "ines.soglo@gmail.com", country: "Bénin", joinedDate: "2026-07-14", status: "premium", paymentMethod: "mtn", amountPaid: 1000 },
  { id: "USR-009", name: "Moussa Traore", email: "moussa.t@gmail.com", country: "Mali", joinedDate: "2026-07-20", status: "trial", paymentMethod: "-", amountPaid: 0 },
];

const REVENUE_DATA = [
  { date: "07/15", revenue: 2000, trials: 4 },
  { date: "07/16", revenue: 3000, trials: 6 },
  { date: "07/17", revenue: 4000, trials: 8 },
  { date: "07/18", revenue: 5000, trials: 11 },
  { date: "07/19", revenue: 6000, trials: 13 },
  { date: "07/20", revenue: 7000, trials: 15 },
  { date: "07/21", revenue: 9000, trials: 18 },
];

const COUNTRY_DISTRIBUTION = [
  { name: "Sénégal", value: 3 },
  { name: "Côte d'Ivoire", value: 2 },
  { name: "Burkina Faso", value: 1 },
  { name: "Togo", value: 1 },
  { name: "Bénin", value: 1 },
  { name: "Autres", value: 1 },
];

const COLORS = ["#2563eb", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

interface SimulatedCampaign {
  id: number;
  tag: string;
  title: string;
  impressions: number;
  clicks: number;
  enabled: boolean;
}

export default function AdminPanel({
  currentPremiumStatus,
  onTogglePremium,
  trialDaysLeft,
  onSetTrialDays,
  onSimulateExpired,
  onSimulateReset,
}: AdminPanelProps) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("formflow_admin_logged") === "true";
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  const [users, setUsers] = useState<SimulatedUser[]>(() => {
    const saved = localStorage.getItem("formflow_simulated_users");
    return saved ? JSON.parse(saved) : INITIAL_SIMULATED_USERS;
  });

  const [campaigns, setCampaigns] = useState<SimulatedCampaign[]>([
    { id: 1, tag: "HostLite Cloud", title: "Hébergez vos projets web en 1 clic dès 1.20$ / mois !", impressions: 1420, clicks: 84, enabled: true },
    { id: 2, tag: "MailApex", title: "Automatisez vos suivis de formulaires par e-mail et SMS", impressions: 932, clicks: 51, enabled: true },
    { id: 3, tag: "CodeForge Academy", title: "Devenez Développeur Web Full-Stack en 12 semaines 🚀", impressions: 2110, clicks: 125, enabled: true },
    { id: 4, tag: "FormFlow Premium Upgrade", title: "Supprimez toutes les publicités et libérez la puissance de l'IA !", impressions: 4520, clicks: 312, enabled: true },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "users" | "payments" | "campaigns">("dashboard");

  // Payment configuration states
  const [paymentMode, setPaymentMode] = useState<"direct" | "auto">(() => {
    return (localStorage.getItem("formflow_payment_mode") as "direct" | "auto") || "direct";
  });
  const [ownerWave, setOwnerWave] = useState(() => localStorage.getItem("formflow_owner_wave") || "+221 77 123 45 67");
  const [ownerOrange, setOwnerOrange] = useState(() => localStorage.getItem("formflow_owner_orange") || "+225 07 987 65 43");
  const [ownerMtn, setOwnerMtn] = useState(() => localStorage.getItem("formflow_owner_mtn") || "+229 90 00 00 00");
  const [ownerVisa, setOwnerVisa] = useState(() => localStorage.getItem("formflow_owner_visa") || "CI086 01001 123456789012 34");

  const [selectedGateway, setSelectedGateway] = useState<"fedapay" | "cinetpay" | "paytech">(() => {
    return (localStorage.getItem("formflow_gateway") as "fedapay" | "cinetpay" | "paytech") || "fedapay";
  });
  const [gatewayKey, setGatewayKey] = useState(() => localStorage.getItem("formflow_gateway_key") || "");
  const [gatewaySecret, setGatewaySecret] = useState(() => localStorage.getItem("formflow_gateway_secret") || "");
  const [gatewaySiteId, setGatewaySiteId] = useState(() => localStorage.getItem("formflow_gateway_site_id") || "");

  interface PendingPayment {
    id: string;
    userName: string;
    userEmail: string;
    paymentMethod: "wave" | "orange" | "mtn" | "card";
    phoneNumber?: string;
    transactionRef: string;
    amount: string;
    date: string;
    status: "pending" | "approved" | "rejected";
  }

  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>(() => {
    const saved = localStorage.getItem("formflow_pending_payments");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    const initial = [
      {
        id: "TX-984321",
        userName: "Moussa Traoré",
        userEmail: "moussa.t@gmail.com",
        paymentMethod: "wave" as const,
        phoneNumber: "+221 77 452 11 99",
        transactionRef: "WAVE-45281-TR",
        amount: "1 000 FCFA",
        date: new Date().toISOString().split("T")[0],
        status: "pending" as const
      },
      {
        id: "TX-105243",
        userName: "Afi Lawson",
        userEmail: "lawson.afi@gmail.com",
        paymentMethod: "orange" as const,
        phoneNumber: "+225 07 89 45 12 36",
        transactionRef: "OM-992-881",
        amount: "1 000 FCFA",
        date: new Date().toISOString().split("T")[0],
        status: "pending" as const
      }
    ];
    localStorage.setItem("formflow_pending_payments", JSON.stringify(initial));
    return initial;
  });

  // Sync settings when modified
  const handleSavePaymentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("formflow_payment_mode", paymentMode);
    localStorage.setItem("formflow_owner_wave", ownerWave);
    localStorage.setItem("formflow_owner_orange", ownerOrange);
    localStorage.setItem("formflow_owner_mtn", ownerMtn);
    localStorage.setItem("formflow_owner_visa", ownerVisa);
    localStorage.setItem("formflow_gateway", selectedGateway);
    localStorage.setItem("formflow_gateway_key", gatewayKey);
    localStorage.setItem("formflow_gateway_secret", gatewaySecret);
    localStorage.setItem("formflow_gateway_site_id", gatewaySiteId);
    alert("Configuration des paiements enregistrée avec succès !");
  };

  const handleApprovePayment = (txId: string, email: string) => {
    // 1. Approve pending payment status
    const updatedPayments = pendingPayments.map(p => 
      p.id === txId ? { ...p, status: "approved" as const } : p
    );
    setPendingPayments(updatedPayments);
    localStorage.setItem("formflow_pending_payments", JSON.stringify(updatedPayments));

    // 2. Set user as Premium in the simulated users list
    setUsers(prev => prev.map(u => 
      u.email === email ? { ...u, status: "premium", amountPaid: 1000 } : u
    ));

    // 3. If current user email being validated is the main user or if we want to toggle the main app's premium status
    // (This is super convenient for testing: they can simulate payment under their own email and immediately see the site become premium!)
    onTogglePremium(true);
  };

  const handleRejectPayment = (txId: string) => {
    const updatedPayments = pendingPayments.map(p => 
      p.id === txId ? { ...p, status: "rejected" as const } : p
    );
    setPendingPayments(updatedPayments);
    localStorage.setItem("formflow_pending_payments", JSON.stringify(updatedPayments));
  };

  // Save users in local storage
  useEffect(() => {
    localStorage.setItem("formflow_simulated_users", JSON.stringify(users));
  }, [users]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    
    // Default master password for this admin console
    if (adminPasswordInput === "admin123") {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem("formflow_admin_logged", "true");
    } else {
      setAuthError("Mot de passe incorrect. Astuce : utilisez 'admin123' pour tester.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem("formflow_admin_logged");
    setAdminPasswordInput("");
  };

  // Render Lock screen if not authenticated
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full border border-blue-100 flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-extrabold text-slate-900 font-display">Console Admin Sécurisée</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Cette zone est réservée exclusivement aux administrateurs pour piloter les forfaits, suivre les abonnements CFA / USD, et modérer les campagnes de parrainage.
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              Code d'accès administrateur
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={adminPasswordInput}
              onChange={(e) => setAdminPasswordInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm font-mono transition-all"
              autoFocus
            />
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-slate-950 hover:bg-slate-800 active:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Déverrouiller la Console
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
          🔒 Utilisez le code d'accès de test <code className="bg-slate-100 px-1.5 py-0.5 rounded-md font-mono font-bold text-slate-600">admin123</code>
        </div>
      </div>
    );
  }

  // Sync current user email premium with simulated users if exists
  const handleToggleSimulatedUserPremium = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newStatus = u.status === "premium" ? "trial" : "premium";
          return {
            ...u,
            status: newStatus,
            paymentMethod: newStatus === "premium" ? "wave" : "-",
            amountPaid: newStatus === "premium" ? 1000 : 0,
          };
        }
        return u;
      })
    );
  };

  const handleAddSimulatedUser = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const country = formData.get("country") as string;
    const status = formData.get("status") as "premium" | "trial";

    if (!name || !email) return;

    const newUser: SimulatedUser = {
      id: `USR-0${users.length + 1}`,
      name,
      email,
      country,
      status,
      joinedDate: new Date().toISOString().split("T")[0],
      paymentMethod: status === "premium" ? "wave" : "-",
      amountPaid: status === "premium" ? 1000 : 0,
    };

    setUsers([newUser, ...users]);
    (e.target as HTMLFormElement).reset();
  };

  const handleToggleCampaign = (id: number) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  // Stats calculation
  const totalSubscribers = users.filter((u) => u.status === "premium").length;
  const activeTrials = users.filter((u) => u.status === "trial").length;
  const expiredTrials = users.filter((u) => u.status === "expired").length;
  const conversionRate = ((totalSubscribers / users.length) * 100).toFixed(1);
  const totalRevenueCFA = users.reduce((acc, curr) => acc + curr.amountPaid, 0);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-100 shadow-3xs overflow-hidden">
      {/* Header Panel */}
      <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 bg-amber-500 rounded-lg text-slate-950">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400">
              Console d'Administration
            </span>
          </div>
          <h2 className="text-xl font-bold font-display mt-1">
            Tableau de Bord Administrateur
          </h2>
          <p className="text-xs text-slate-400">
            Gérez les forfaits uniques, suivez le taux de conversion et pilotez l'acquisition d'abonnés de FormFlow AI.
          </p>
        </div>

        {/* Global state synchronizers */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
          <div className="text-xs font-semibold px-2">
            Votre compte :
          </div>
          <button
            onClick={() => onTogglePremium(!currentPremiumStatus)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentPremiumStatus
                ? "bg-amber-500 text-slate-950 shadow-xs"
                : "bg-slate-700 hover:bg-slate-600 text-slate-200"
            }`}
          >
            <Crown className={`w-3.5 h-3.5 ${currentPremiumStatus ? "fill-slate-950" : ""}`} />
            <span>{currentPremiumStatus ? "Premium" : "Gratuit (Essai/Pubs)"}</span>
          </button>
          
          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-950 hover:bg-red-900 border border-red-800/50 text-red-200 transition-all cursor-pointer"
            title="Verrouiller la console admin"
          >
            <Lock className="w-3 h-3 shrink-0" />
            <span>Verrouiller</span>
          </button>
        </div>
      </div>

      {/* Internal Navigation Menu */}
      <div className="flex border-b border-slate-200 bg-white px-4">
        <button
          onClick={() => setActiveSubTab("dashboard")}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeSubTab === "dashboard"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Statistiques de Vente
        </button>
        <button
          onClick={() => setActiveSubTab("users")}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeSubTab === "users"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          Membres & Licences ({users.length})
        </button>
        <button
          onClick={() => setActiveSubTab("payments")}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeSubTab === "payments"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Configuration & Paiements Directs ({pendingPayments.filter(p => p.status === "pending").length})
        </button>
        <button
          onClick={() => setActiveSubTab("campaigns")}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeSubTab === "campaigns"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Régie Publicitaire (Sponsors)
        </button>
      </div>

      {/* Content Space */}
      <div className="p-6 space-y-6">
        
        {/* TAB 1: DASHBOARD ANALYTICS */}
        {activeSubTab === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Cards Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-3xs">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Revenus Cumulés</span>
                  <span className="text-2xl font-black text-slate-900 font-display">{totalRevenueCFA.toLocaleString("fr-FR")} FCFA</span>
                  <span className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5">
                    +12% vs semaine dernière
                  </span>
                </div>
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-3xs">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Abonnés Premium</span>
                  <span className="text-2xl font-black text-slate-900 font-display">{totalSubscribers}</span>
                  <span className="text-[10px] text-blue-600 font-semibold">Taux conv. : {conversionRate}%</span>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Crown className="w-5 h-5 fill-amber-500/20" />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-3xs">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Essais Gratuits</span>
                  <span className="text-2xl font-black text-slate-900 font-display">{activeTrials}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{expiredTrials} expirés</span>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-3xs">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Revenus en USD</span>
                  <span className="text-2xl font-black text-slate-900 font-display">{(totalRevenueCFA / 580).toFixed(2)} $</span>
                  <span className="text-[10px] text-slate-500 font-semibold">Taux de change fixe</span>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main revenue flow area chart */}
              <div className="lg:col-span-2 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Évolution des Souscriptions</h4>
                    <p className="text-[10px] text-slate-500">Revenus de l'abonnement unique (1 000 FCFA/an)</p>
                  </div>
                  <span className="text-[10px] bg-slate-100 font-bold px-2.5 py-1 rounded-md text-slate-600">
                    Mise à jour en temps réel
                  </span>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none" }}
                        labelStyle={{ color: "#94a3b8", fontWeight: "bold", fontSize: "11px" }}
                        itemStyle={{ color: "#fff", fontSize: "12px" }}
                      />
                      <Area type="monotone" dataKey="revenue" name="Revenus (CFA)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Geographic Distribution Pie Chart */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs space-y-4 flex flex-col justify-between">
                <div className="pb-3 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800">Distribution Géographique</h4>
                  <p className="text-[10px] text-slate-500">Pays d'origine des abonnés de la zone CFA</p>
                </div>

                <div className="h-44 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={COUNTRY_DISTRIBUTION}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {COUNTRY_DISTRIBUTION.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center space-y-0.5">
                    <span className="text-xs text-slate-400 font-semibold block">Total</span>
                    <span className="text-xl font-bold text-slate-800">{users.length}</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {COUNTRY_DISTRIBUTION.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="text-slate-600 truncate">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEMBERS & LICENSES MANAGEMENT */}
        {activeSubTab === "users" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Search and control filter header */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email ou pays..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white shadow-3xs transition-all"
                />
              </div>

              {/* Reset simulator inputs to force testing different scenarios */}
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setUsers(INITIAL_SIMULATED_USERS);
                    localStorage.setItem("formflow_simulated_users", JSON.stringify(INITIAL_SIMULATED_USERS));
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Réinitialiser la liste
                </button>
              </div>
            </div>

            {/* Quick simulated user creation box */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-3xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                ➕ Créer et ajouter un utilisateur simulé
              </span>
              <form onSubmit={handleAddSimulatedUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  name="name"
                  type="text"
                  placeholder="Nom complet"
                  required
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Adresse e-mail"
                  required
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <select
                  name="country"
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Sénégal">Sénégal</option>
                  <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                  <option value="Burkina Faso">Burkina Faso</option>
                  <option value="Togo">Togo</option>
                  <option value="Bénin">Bénin</option>
                  <option value="Mali">Mali</option>
                  <option value="Niger">Niger</option>
                </select>
                <select
                  name="status"
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="premium">Abonné d'office (1000 CFA)</option>
                  <option value="trial">Essai actif</option>
                </select>
                <button
                  type="submit"
                  className="sm:col-span-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter à la base de données simulée
                </button>
              </form>
            </div>

            {/* Interactive Users List Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-3xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                      <th className="p-4">Utilisateur</th>
                      <th className="p-4">Pays</th>
                      <th className="p-4">Rejoint le</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4">Méthode de Paiement</th>
                      <th className="p-4">Licence / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                          Aucun utilisateur trouvé correspondant à votre recherche.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-slate-800">{u.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          </td>
                          <td className="p-4 text-slate-600 font-medium">{u.country}</td>
                          <td className="p-4 text-slate-500 font-mono">{u.joinedDate}</td>
                          <td className="p-4">
                            {u.status === "premium" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">
                                <Crown className="w-2.5 h-2.5 fill-green-700" />
                                Premium
                              </span>
                            ) : u.status === "expired" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Expiré
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                <UserCheck className="w-2.5 h-2.5" />
                                Essai Actif
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-bold text-slate-700 uppercase">
                            {u.paymentMethod === "wave" && "🌊 Wave"}
                            {u.paymentMethod === "orange" && "🍊 Orange Money"}
                            {u.paymentMethod === "mtn" && "🟡 MTN MoMo"}
                            {u.paymentMethod === "card" && "💳 Carte Bancaire"}
                            {u.paymentMethod === "-" && "N/A"}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleSimulatedUserPremium(u.id)}
                              className={`px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                                u.status === "premium"
                                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                  : "bg-amber-500 hover:bg-amber-600 text-slate-950"
                              }`}
                            >
                              {u.status === "premium" ? "Révoquer Licence" : "Accorder Premium"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENTS & GATEWAY CONFIGURATION */}
        {activeSubTab === "payments" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Mode selection card */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-3xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">Mode d'encaissement de votre site</h4>
                  <p className="text-xs text-slate-500">Choisissez comment vous souhaitez encaisser vos clients sur FormFlow AI.</p>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1 self-start md:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode("direct");
                      localStorage.setItem("formflow_payment_mode", "direct");
                    }}
                    className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                      paymentMode === "direct"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    💸 Transferts Directs (Manuel P2P)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode("auto");
                      localStorage.setItem("formflow_payment_mode", "auto");
                    }}
                    className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                      paymentMode === "auto"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    ⚡ Passerelle Automatique (API)
                  </button>
                </div>
              </div>

              {paymentMode === "direct" ? (
                <div className="text-xs text-slate-600 space-y-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <p className="font-semibold text-blue-800 flex items-center gap-1.5">
                    💡 Fonctionnement du mode Transfert Direct (Manuel P2P) :
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Vous saisissez vos propres numéros <strong>Orange Money</strong>, <strong>Wave</strong> et vos coordonnées <strong>Visa/RIB</strong> ci-dessous.</li>
                    <li>Les utilisateurs voient vos coordonnées lors de la commande et font un transfert P2P direct de téléphone à téléphone (sans frais).</li>
                    <li>Ils copient-collent le code de transaction reçu par SMS et cliquent sur "Envoyer".</li>
                    <li>La transaction s'affiche instantanément dans votre file d'attente ci-dessous. Vous vérifiez sur votre mobile si vous avez bien reçu les fonds, puis cliquez sur <strong>"Valider"</strong> pour leur accorder automatiquement la licence Premium !</li>
                  </ul>
                </div>
              ) : (
                <div className="text-xs text-slate-600 space-y-2 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                  <p className="font-semibold text-purple-800 flex items-center gap-1.5">
                    🔌 Fonctionnement de la Passerelle Automatique (API) :
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Sélectionnez un agrégateur de paiement West-Africain agréé (FedaPay, CinetPay, ou PayTech) ci-dessous.</li>
                    <li>Renseignez votre clé d'API et vos identifiants marchands.</li>
                    <li>Les paiements par Orange Money, Wave et Carte Visa seront validés automatiquement de manière instantanée grâce à des webhooks de notification sécurisés sans intervention manuelle !</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Main configurations forms split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Config Form */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-blue-500" />
                  Paramètres de vos coordonnées marchandes
                </h4>

                <form onSubmit={handleSavePaymentSettings} className="space-y-4">
                  {paymentMode === "direct" ? (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Wave field */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                          🌊 Votre numéro de téléphone Wave
                        </label>
                        <input
                          type="text"
                          value={ownerWave}
                          onChange={(e) => setOwnerWave(e.target.value)}
                          placeholder="Ex: +221 77 123 45 67"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                        />
                        <span className="text-[9px] text-slate-400 block">Les clients au Sénégal, Côte d'Ivoire, Mali, etc. pourront vous payer sur ce numéro.</span>
                      </div>

                      {/* Orange Money field */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                          🍊 Votre numéro Orange Money
                        </label>
                        <input
                          type="text"
                          value={ownerOrange}
                          onChange={(e) => setOwnerOrange(e.target.value)}
                          placeholder="Ex: +225 07 987 65 43"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                        />
                        <span className="text-[9px] text-slate-400 block">Les clients d'Afrique de l'Ouest utiliseront ce compte de transfert direct.</span>
                      </div>

                      {/* MTN MoMo field */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                          🟡 Votre numéro MTN MoMo
                        </label>
                        <input
                          type="text"
                          value={ownerMtn}
                          onChange={(e) => setOwnerMtn(e.target.value)}
                          placeholder="Ex: +229 90 00 00 00"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                        />
                        <span className="text-[9px] text-slate-400 block">Les abonnés du Bénin, Togo, Cameroun, Côte d'Ivoire, etc. utiliseront ce numéro.</span>
                      </div>

                      {/* Visa card / RIB Field */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                          💳 Vos coordonnées bancaires (Visa / RIB)
                        </label>
                        <textarea
                          value={ownerVisa}
                          onChange={(e) => setOwnerVisa(e.target.value)}
                          rows={2}
                          placeholder="Ex: CI086 01001 123456789012 34 (Société Générale)"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                        />
                        <span className="text-[9px] text-slate-400 block">Pour recevoir des paiements par carte Visa/Mastercard ou virement bancaire de vos abonnés.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Select Aggregator */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                          Sélectionnez la Passerelle API
                        </label>
                        <select
                          value={selectedGateway}
                          onChange={(e) => setSelectedGateway(e.target.value as any)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 font-bold text-slate-700"
                        >
                          <option value="fedapay">FedaPay (Togo, Bénin, Côte d'Ivoire, Sénégal)</option>
                          <option value="cinetpay">CinetPay (Afrique francophone multi-pays)</option>
                          <option value="paytech">PayTech (Sénégal - Wave, Orange, Free)</option>
                        </select>
                      </div>

                      {/* Site ID / Site Token */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                          Site ID / Identifiant Marchand
                        </label>
                        <input
                          type="text"
                          value={gatewaySiteId}
                          onChange={(e) => setGatewaySiteId(e.target.value)}
                          placeholder="Ex: 504128"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>

                      {/* API Public Key */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                          Clé d'API Publique (Public Key)
                        </label>
                        <input
                          type="text"
                          value={gatewayKey}
                          onChange={(e) => setGatewayKey(e.target.value)}
                          placeholder="pk_live_..."
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>

                      {/* Secret Token */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                          Clé Secrète / Jeton d'authentification (Secret Token)
                        </label>
                        <input
                          type="password"
                          value={gatewaySecret}
                          onChange={(e) => setGatewaySecret(e.target.value)}
                          placeholder="sk_live_..."
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>

                      {/* Dynamic helpful integration docs */}
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Obtenir vos clés sur l'agrégateur :</span>
                        <a
                          href={
                            selectedGateway === "fedapay"
                              ? "https://www.fedapay.com"
                              : selectedGateway === "cinetpay"
                              ? "https://cinetpay.com"
                              : "https://paytech.sn"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5"
                        >
                          Créer un compte <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    Enregistrer la configuration de paiement
                  </button>
                </form>
              </div>

              {/* Right Column: Dynamic Validation list / History */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Demandes de validation de paiements directs
                  </h4>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                    {pendingPayments.filter((p) => p.status === "pending").length} en attente
                  </span>
                </div>

                {/* Queue of transfers */}
                <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
                  {pendingPayments.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-medium text-xs space-y-1">
                      <p>Aucune transaction soumise pour le moment.</p>
                      <p className="text-[10px] text-slate-400">Les transactions manuelles de vos utilisateurs s'afficheront ici.</p>
                    </div>
                  ) : (
                    pendingPayments.map((p) => (
                      <div
                        key={p.id}
                        className={`p-3.5 border rounded-xl flex flex-col gap-2 transition-all ${
                          p.status === "pending"
                            ? "border-blue-200 bg-blue-50/10"
                            : p.status === "approved"
                            ? "border-emerald-100 bg-emerald-50/10 opacity-75"
                            : "border-slate-200 bg-slate-50 opacity-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-400 font-mono block">REF: {p.id}</span>
                            <h5 className="text-xs font-bold text-slate-800">{p.userName}</h5>
                            <span className="text-[10px] text-slate-500 font-mono">{p.userEmail}</span>
                          </div>
                          
                          <div className="text-right space-y-0.5">
                            <span className="text-xs font-black text-slate-900 block">{p.amount}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">{p.date}</span>
                          </div>
                        </div>

                        {/* Payment detail tags */}
                        <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-slate-100/60 text-[10px]">
                          <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 uppercase">
                            {p.paymentMethod === "wave" && "🌊 Wave"}
                            {p.paymentMethod === "orange" && "🍊 Orange Money"}
                            {p.paymentMethod === "mtn" && "🟡 MTN MoMo"}
                            {p.paymentMethod === "card" && "💳 Visa / Carte"}
                          </span>

                          {p.phoneNumber && (
                            <span className="font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                              📱 {p.phoneNumber}
                            </span>
                          )}

                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-mono select-all flex items-center gap-1 border border-blue-100/50">
                            CODE: {p.transactionRef}
                          </span>
                        </div>

                        {/* Actions for pending payments */}
                        {p.status === "pending" ? (
                          <div className="flex gap-2 pt-2 border-t border-slate-100/60">
                            <button
                              onClick={() => handleApprovePayment(p.id, p.userEmail)}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Valider (Activer Premium)
                            </button>
                            <button
                              onClick={() => handleRejectPayment(p.id)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center"
                              title="Rejeter la transaction"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="pt-1 text-right">
                            {p.status === "approved" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                                <CheckCircle className="w-3 h-3" />
                                Validé & Premium activé
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
                                <X className="w-3 h-3" />
                                Transaction Rejetée
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SPONSOR CAMPAIGNS MANAGER */}
        {activeSubTab === "campaigns" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-800">Campagnes de parrainage actives</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Ces encarts publicitaires apparaissent discrètement aux utilisateurs pendant leur période d'essai gratuit de 3 jours. Ils sont retirés de l'interface immédiatement après l'acquisition d'un forfait unique à 1 000 FCFA.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {campaigns.map((c) => {
                  const ctr = ((c.clicks / c.impressions) * 100).toFixed(2);
                  return (
                    <div
                      key={c.id}
                      className={`p-4 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                        c.enabled
                          ? "border-slate-200 bg-white"
                          : "border-slate-100 bg-slate-50 opacity-60"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            {c.tag}
                          </span>
                          {!c.enabled && (
                            <span className="text-[9px] font-semibold text-red-600 uppercase">Désactivé</span>
                          )}
                        </div>
                        <h5 className="text-xs font-bold text-slate-800 leading-snug">
                          {c.title}
                        </h5>
                        <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono">
                          <span>Impressions: <strong>{c.impressions}</strong></span>
                          <span>Clics: <strong>{c.clicks}</strong></span>
                          <span>Taux de clic (CTR): <strong className="text-blue-600">{ctr}%</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        <button
                          onClick={() => handleToggleCampaign(c.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all cursor-pointer flex items-center gap-1.5"
                          title={c.enabled ? "Désactiver la campagne" : "Activer la campagne"}
                        >
                          {c.enabled ? (
                            <ToggleRight className="w-8 h-8 text-blue-600" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-slate-400" />
                          )}
                          <span className="text-[10px] font-bold text-slate-700 hidden sm:inline">
                            {c.enabled ? "En ligne" : "Désactivé"}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Campaign analytics charts */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Efficacité des Encarts (CTR)</h4>
                <p className="text-[10px] text-slate-500">Comparatif des clics et parrainages générés par campagne</p>
              </div>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaigns} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="tag" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="clicks" name="Clics" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
