import React, { useState } from "react";
import {
  FileText,
  Trash2,
  ExternalLink,
  BarChart3,
  Calendar,
  Search,
  RefreshCw,
  FolderOpen,
  FileSpreadsheet,
  AlertCircle,
  LogIn,
} from "lucide-react";
import { GoogleFormFile } from "../types";

interface FormListProps {
  forms: GoogleFormFile[];
  onSelectForm: (formId: string) => void;
  onDeleteForm: (formId: string, formName: string) => void;
  onRefresh: () => void;
  loading: boolean;
  error?: string | null;
  onLoginAgain?: () => void;
}

export default function FormList({
  forms,
  onSelectForm,
  onDeleteForm,
  onRefresh,
  loading,
  error,
  onLoginAgain,
}: FormListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredForms = forms.filter((form) =>
    form.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Inconnu";
    const d = new Date(dateString);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs p-6 space-y-6">
      {/* Search and Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-md font-black font-display text-slate-900 flex items-center gap-2 tracking-tight">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            Mes formulaires Google Forms
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Synchronisés en temps réel avec votre Google Drive ({forms.length} formulaires enregistrés)
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl hover:bg-slate-50/80 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Rechercher un formulaire par son titre..."
          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs outline-hidden focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 transition-all text-slate-700 shadow-3xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200/80 rounded-xl text-red-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs animate-in fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-semibold break-words">{error}</span>
          </div>
          {onLoginAgain && (
            <button
              onClick={onLoginAgain}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer shrink-0 shadow-3xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              Se reconnecter
            </button>
          )}
        </div>
      )}

      {/* Forms List Container */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-7 h-7 border-3 border-slate-200 border-t-slate-950 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-400">Chargement de votre Google Drive...</p>
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl space-y-4">
          <div className="p-3.5 bg-slate-50 text-slate-400 rounded-full w-12 h-12 flex items-center justify-center mx-auto shadow-3xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Aucun formulaire trouvé</h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              {searchQuery
                ? "Aucun résultat ne correspond à votre recherche."
                : "Commencez par générer et publier votre premier formulaire intelligent avec Gemini !"}
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto pr-2">
          {filteredForms.map((form) => (
            <div
              key={form.id}
              className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group transition-all hover:bg-slate-50/50 -mx-4 px-4 rounded-xl border-b border-slate-100/50 last:border-0"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl group-hover:bg-slate-950 group-hover:text-white transition-colors shrink-0 shadow-3xs">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 break-words group-hover:text-slate-950 transition-colors leading-snug">
                    {form.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 mt-1.5 font-medium">
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3" />
                      Modifié le {formatDate(form.modifiedTime)}
                    </span>
                    <span className="text-slate-200 shrink-0">|</span>
                    <span className="font-mono bg-slate-50 border border-slate-100 text-slate-500 px-1.5 py-0.5 rounded truncate max-w-[120px]" title={form.id}>
                      ID: {form.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  onClick={() => onSelectForm(form.id)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-[11px] font-bold text-white bg-slate-950 hover:bg-slate-900 rounded-xl transition-all cursor-pointer min-h-[38px] active:scale-[0.98] shadow-3xs"
                  title="Voir les réponses de ce formulaire"
                >
                  <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                  Réponses & Analyses
                </button>

                <a
                  href={`https://docs.google.com/forms/d/${form.id}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-2 text-slate-500 bg-white hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl transition-all min-w-[38px] min-h-[38px] shadow-3xs active:scale-[0.98]"
                  title="Ouvrir dans l'éditeur Google Forms"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>

                <button
                  onClick={() => onDeleteForm(form.id, form.name)}
                  className="flex items-center justify-center p-2 text-slate-400 hover:text-red-600 bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-200 rounded-xl transition-all min-w-[38px] min-h-[38px] shadow-3xs cursor-pointer active:scale-[0.98]"
                  title="Supprimer définitivement"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
