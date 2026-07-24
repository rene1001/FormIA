import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  googleSignIn,
  initAuth,
  logout,
  getAccessToken,
} from "./auth";
import {
  createGoogleForm,
  listGoogleForms,
  deleteGoogleForm,
} from "./formsService";
import { FormStructure, GoogleFormFile } from "./types";
import FormCreator from "./components/FormCreator";
import FormEditor from "./components/FormEditor";
import FormList from "./components/FormList";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import ConfirmationModal from "./components/ConfirmationModal";
import InstallGuideModal from "./components/InstallGuideModal";
import AdminPanel from "./components/AdminPanel";
import appLogo from "./assets/images/formflow_ai_logo_1784669877363.jpg";
import {
  Sparkles,
  FileText,
  LogOut,
  FolderOpen,
  User as UserIcon,
  Plus,
  Compass,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Laptop,
  ShieldCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Install guide modal state
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Layout & Navigation State
  const [activeTab, setActiveTab] = useState<"create" | "list" | "admin">("create");

  // Hidden Admin Console accessibility (Only visible via URL query param: ?admin=true or ?admin=1)
  const [showAdminTab, setShowAdminTab] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("admin") === "true" || params.get("admin") === "1";
  });

  useEffect(() => {
    // Clean up old show_admin_tab storage to ensure it's completely hidden for everyone by default
    localStorage.removeItem("formflow_show_admin_tab");
    
    // Safety check: if URL is not admin and we are currently on admin tab, redirect to create tab
    if (!showAdminTab && activeTab === "admin") {
      setActiveTab("create");
    }
  }, [showAdminTab, activeTab]);

  const [generatedForm, setGeneratedForm] = useState<FormStructure | null>(null);
  const [selectedFormIdForAnalytics, setSelectedFormIdForAnalytics] = useState<string | null>(null);

  // Forms Directory List
  const [formsList, setFormsList] = useState<GoogleFormFile[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [formsError, setFormsError] = useState<string | null>(null);

  // Action Pending States
  const [publishingForm, setPublishingForm] = useState(false);

  // Overlays / Popups States
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    formId: string;
    responderUri: string;
    editUri: string;
    title: string;
  }>({
    isOpen: false,
    formId: "",
    responderUri: "",
    editUri: "",
    title: "",
  });

  const [copiedType, setCopiedType] = useState<"responder" | "edit" | null>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    formId: string;
    formName: string;
  }>({
    isOpen: false,
    formId: "",
    formName: "",
  });

  // Init Auth & Register Service Worker on load
  useEffect(() => {
    initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
        fetchForms(accessToken);
      },
      () => {
        setNeedsAuth(true);
      }
    );

    // Register Service Worker for PWA / Install capabilities
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered successfully with scope:", registration.scope);
          })
          .catch((error) => {
            console.warn("Service Worker registration failed:", error);
          });
      });
    }
  }, []);

  const handleLogin = async () => {
    setIsSigningIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        fetchForms(result.accessToken);
      }
    } catch (err) {
      console.error("Login failed:", err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setNeedsAuth(true);
      setFormsList([]);
      setGeneratedForm(null);
      setSelectedFormIdForAnalytics(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const fetchForms = async (accessToken?: string) => {
    const activeToken = accessToken || token;
    if (!activeToken) {
      setNeedsAuth(true);
      return;
    }

    setFormsLoading(true);
    setFormsError(null);
    try {
      const forms = await listGoogleForms(activeToken);
      setFormsList(forms);
      setFormsError(null);
    } catch (err: any) {
      console.error("Failed to fetch forms:", err);
      if (err.message === "UNAUTHORIZED" || err.message?.includes("401")) {
        setToken(null);
        setNeedsAuth(true);
        setFormsError("Votre session Google a expiré. Veuillez vous reconnecter.");
      } else {
        setFormsError(err.message || "Impossible de charger vos formulaires depuis Google Drive.");
      }
    } finally {
      setFormsLoading(false);
    }
  };

  const handleFormGenerated = (form: FormStructure) => {
    setGeneratedForm(form);
  };

  const handlePublishForm = async (formToPublish: FormStructure) => {
    if (!token) return;
    setPublishingForm(true);
    try {
      const result = await createGoogleForm(
        formToPublish.title,
        formToPublish.description,
        formToPublish.questions,
        token
      );

      // Trigger Confetti Celebration!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });

      setSuccessModal({
        isOpen: true,
        formId: result.formId,
        responderUri: result.responderUri,
        editUri: result.editUri,
        title: formToPublish.title,
      });

      // Refetch files in background
      fetchForms(token);
    } catch (err: any) {
      console.error(err);
      throw err;
    } finally {
      setPublishingForm(false);
    }
  };

  const confirmDeleteForm = (formId: string, formName: string) => {
    setDeleteConfirmation({
      isOpen: true,
      formId,
      formName,
    });
  };

  const executeDeleteForm = async () => {
    if (!token || !deleteConfirmation.formId) return;

    try {
      await deleteGoogleForm(deleteConfirmation.formId, token);
      setFormsList((prev) => prev.filter((f) => f.id !== deleteConfirmation.formId));
      if (selectedFormIdForAnalytics === deleteConfirmation.formId) {
        setSelectedFormIdForAnalytics(null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Une erreur est survenue lors de la suppression du formulaire.");
    } finally {
      setDeleteConfirmation({ isOpen: false, formId: "", formName: "" });
    }
  };

  const copyToClipboard = (text: string, type: "responder" | "edit") => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType(null);
    }, 2000);
  };

  const closeSuccessModal = () => {
    setSuccessModal({
      isOpen: false,
      formId: "",
      responderUri: "",
      editUri: "",
      title: "",
    });
    setGeneratedForm(null); // Return to creator screen after closing success modal
    setActiveTab("list"); // Show the listed forms
  };

  return (
    <div className="min-h-screen flex flex-col bg-animated-gradient text-slate-100 selection:bg-blue-500/30">
      {/* Navbar Header */}
      <header className="sticky top-0 z-40 glass py-3 px-4 sm:py-3.5 sm:px-6 transition-all border-b-0 border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative group">
              <img
                src={appLogo}
                alt="FormFlow Logo"
                referrerPolicy="no-referrer"
                className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-xl object-cover shadow-sm ring-1 ring-slate-100 group-hover:scale-105 transition-all shrink-0"
              />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" title="Service En Ligne" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-md md:text-lg font-black font-display tracking-tight text-slate-100 leading-tight">
                  FormFlow
                </h1>
                <span className="text-[9px] bg-blue-500/20 text-blue-300 font-extrabold px-1.5 py-0.5 rounded border border-blue-500/30">AI</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-semibold tracking-wide uppercase hidden xs:block">
                Créateur de Formulaires Intelligent
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shadow-3xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Gratuit
            </span>

            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-200 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-all cursor-pointer border border-slate-600/50 shadow-3xs hover:shadow-2xs active:scale-[0.98]"
              title="Installer sur mobile ou ordinateur"
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="hidden xs:inline">Installer l'appli</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/50 p-1 rounded-xl shrink-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "Avatar"}
                    className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-lg shrink-0 referrer-policy-no-referrer object-cover border border-slate-700 shadow-3xs"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                    <UserIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  </div>
                )}
                <div className="hidden md:block text-left pr-1 pl-1">
                  <p className="text-[11px] font-bold text-slate-200 leading-tight">
                    {user.displayName || "Utilisateur Google"}
                  </p>
                  <p className="text-[9px] text-slate-400 truncate max-w-[120px]" title={user.email || ""}>
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-all cursor-pointer shadow-3xs"
                  title="Se déconnecter"
                >
                  <LogOut className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {needsAuth ? (
          /* Landing page for authentication */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="max-w-xl mx-auto my-12 text-center glass-card space-y-8 border border-white/10"
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 rounded-full"></div>
              <img
                src={appLogo}
                alt="FormFlow AI Logo"
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-2xl mx-auto shadow-2xl object-cover relative z-10 border border-white/10"
              />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 leading-snug">
                Créez des Google Forms en quelques secondes avec l'IA
              </h2>
              <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-md mx-auto">
                Connectez-vous à votre compte Google pour concevoir, éditer et publier instantanément de superbes questionnaires et analyser les retours de vos utilisateurs.
              </p>
            </div>

            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogin}
                disabled={isSigningIn}
                className="gsi-material-button relative w-full sm:w-auto inline-flex items-center justify-center bg-slate-800/80 hover:bg-slate-700/80 text-white border border-slate-600/50 rounded-xl py-3.5 px-8 shadow-xl cursor-pointer transition-all disabled:opacity-50 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 opacity-0 hover:opacity-100 transition-opacity"></div>
                <div className="gsi-material-button-content-wrapper flex items-center gap-3">
                  <div className="gsi-material-button-icon shrink-0">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents text-sm font-semibold select-none text-white relative z-10">
                    {isSigningIn ? "Connexion en cours..." : "Se connecter avec Google"}
                  </span>
                </div>
              </motion.button>
            </div>

            <div className="pt-6 border-t border-slate-700/50 flex items-center justify-center gap-6 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">🔒 Données Chiffrées</span>
              <span className="flex items-center gap-1.5">📄 Scopes minimums requis</span>
            </div>
          </motion.div>
        ) : selectedFormIdForAnalytics ? (
          /* Live statistics visualizer and dashboard */
          <AnalyticsDashboard
            formId={selectedFormIdForAnalytics}
            token={token!}
            onBack={() => setSelectedFormIdForAnalytics(null)}
          />
        ) : (
          /* Normal Tab workspace */
          <div className="space-y-6">
            {/* Tabs Controller */}
            <div className="flex justify-center sm:justify-start">
              <div className="glass p-1.5 rounded-2xl flex items-center gap-1 border border-white/10 shadow-lg max-w-full overflow-x-auto scrollbar-none">
                <button
                  onClick={() => {
                    setActiveTab("create");
                    setGeneratedForm(null);
                  }}
                  className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-[0.98] ${
                    activeTab === "create" && !generatedForm
                      ? "bg-blue-600 text-white shadow-md font-black ring-1 ring-blue-500/50"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                  }`}
                >
                  <Plus className={`w-3.5 h-3.5 shrink-0 ${activeTab === "create" && !generatedForm ? "text-white" : "text-blue-400"}`} />
                  <span>Nouveau Formulaire</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("list");
                    fetchForms();
                  }}
                  className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-[0.98] ${
                    activeTab === "list"
                      ? "bg-indigo-600 text-white shadow-md font-black ring-1 ring-indigo-500/50"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                  }`}
                >
                  <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${activeTab === "list" ? "text-white" : "text-indigo-400"}`} />
                  <span>Mes Formulaires ({formsList.length})</span>
                </button>
                {showAdminTab && (
                  <button
                    onClick={() => {
                      setActiveTab("admin");
                    }}
                    className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-[0.98] ${
                      activeTab === "admin"
                        ? "bg-amber-600 text-white shadow-md font-black ring-1 ring-amber-500/50"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                    }`}
                  >
                    <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${activeTab === "admin" ? "text-white" : "text-amber-500"}`} />
                    <span>Console Admin</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab Views */}
            {activeTab === "create" ? (
              generatedForm ? (
                /* Dynamic Form Question Editor before creation */
                <FormEditor
                  initialForm={generatedForm}
                  onPublish={handlePublishForm}
                  onBack={() => setGeneratedForm(null)}
                  publishing={publishingForm}
                />
              ) : (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <FormCreator
                    onFormGenerated={handleFormGenerated}
                  />
                </div>
              )
            ) : activeTab === "list" ? (
              /* User Forms List directory */
              <FormList
                forms={formsList}
                onSelectForm={setSelectedFormIdForAnalytics}
                onDeleteForm={confirmDeleteForm}
                onRefresh={() => fetchForms()}
                loading={formsLoading}
                error={formsError}
                onLoginAgain={handleLogin}
              />
            ) : (
              /* Admin Panel Console */
              <AdminPanel />
            )}
          </div>
        )}
      </main>

      {/* Premium Elegant Footer */}
      <footer className="w-full border-t border-white/5 glass py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <img
                src={appLogo}
                alt="FormFlow Logo"
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-md object-cover opacity-80"
              />
              <span className="text-xs font-black text-slate-200 font-display">FormFlow AI</span>
            </div>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="text-[11px] text-slate-400">
              &copy; {new Date().getFullYear()} FormFlow S.A. Tous droits réservés. • v2.5.0
            </span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-slate-400 font-medium">
            <span className="hover:text-slate-200 transition-colors cursor-pointer hover:underline underline-offset-4">Conditions d'utilisation</span>
            <span className="text-slate-600">•</span>
            <span className="hover:text-slate-200 transition-colors cursor-pointer hover:underline underline-offset-4">Confidentialité</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
              Service Opérationnel
            </span>
          </div>
        </div>
      </footer>

      {/* Success Modal Overlay */}
      {successModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 text-center space-y-6">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full w-14 h-14 flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold font-display text-slate-900 leading-snug">
                  Formulaire Google Forms Créé avec Succès !
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Votre questionnaire <strong className="text-slate-700">"{successModal.title}"</strong> a été généré, formaté et déposé directement dans votre Google Drive.
                </p>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {/* Public Form link */}
                <div className="bg-slate-50 hover:bg-slate-100/60 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between h-36">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Partager le Formulaire</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Lien public que vous pouvez envoyer directement à vos destinataires pour collecter des réponses.
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4 pt-2 border-t border-slate-200/50">
                    <button
                      onClick={() => copyToClipboard(successModal.responderUri, "responder")}
                      className="flex-1 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      {copiedType === "responder" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          Copié !
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          Copier le lien
                        </>
                      )}
                    </button>
                    <a
                      href={successModal.responderUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                      title="Ouvrir le formulaire public"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Edit Form link */}
                <div className="bg-slate-50 hover:bg-slate-100/60 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between h-36">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Personnaliser & Organiser</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Lien d'édition pour modifier le thème visuel, configurer des rappels par mail ou collecter les mails.
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4 pt-2 border-t border-slate-200/50">
                    <button
                      onClick={() => copyToClipboard(successModal.editUri, "edit")}
                      className="flex-1 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      {copiedType === "edit" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          Copié !
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          Copier le lien
                        </>
                      )}
                    </button>
                    <a
                      href={successModal.editUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                      title="Ouvrir l'éditeur Google Forms"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={closeSuccessModal}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl cursor-pointer"
              >
                Terminer & Retourner au Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title="Supprimer ce formulaire ?"
        message={`Êtes-vous sûr de vouloir supprimer définitivement le formulaire "${deleteConfirmation.formName}" de votre compte Google Drive ? Cette action est irréversible.`}
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        isDestructive={true}
        onConfirm={executeDeleteForm}
        onCancel={() => setDeleteConfirmation({ isOpen: false, formId: "", formName: "" })}
      />

      {/* PWA & Mobile APK Installer Modal */}
      <InstallGuideModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}
