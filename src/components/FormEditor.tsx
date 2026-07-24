import React, { useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Settings,
  HelpCircle,
  Eye,
  CheckCircle,
  AlertCircle,
  X,
  FileCheck,
  ChevronLeft,
  ArrowRight,
} from "lucide-react";
import { FormStructure, FormQuestion } from "../types";

interface FormEditorProps {
  initialForm: FormStructure;
  onPublish: (form: FormStructure) => Promise<void>;
  onBack: () => void;
  publishing: boolean;
}

const QUESTION_TYPES = [
  { value: "RADIO", label: "🟢 Choix unique (Radio)" },
  { value: "CHECKBOX", label: "🟦 Choix multiples (Cases à cocher)" },
  { value: "DROP_DOWN", label: "🔽 Liste déroulante" },
  { value: "TEXT", label: "✍️ Réponse courte" },
  { value: "PARAGRAPH", label: "📝 Réponse longue" },
];

export default function FormEditor({
  initialForm,
  onPublish,
  onBack,
  publishing,
}: FormEditorProps) {
  const [form, setForm] = useState<FormStructure>({ ...initialForm });
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(0);
  const [publishError, setPublishError] = useState<string | null>(null);

  const updateFormTitle = (title: string) => {
    setForm((prev) => ({ ...prev, title }));
  };

  const updateFormDescription = (description: string) => {
    setForm((prev) => ({ ...prev, description }));
  };

  const updateQuestion = (index: number, updatedFields: Partial<FormQuestion>) => {
    setForm((prev) => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions[index] = { ...updatedQuestions[index], ...updatedFields };
      return { ...prev, questions: updatedQuestions };
    });
  };

  const addQuestion = () => {
    const newQuestion: FormQuestion = {
      title: "Nouvelle question sans titre",
      type: "RADIO",
      required: false,
      options: ["Option 1", "Option 2"],
    };
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
    setActiveQuestionIndex(form.questions.length);
  };

  const deleteQuestion = (index: number) => {
    setForm((prev) => {
      const updatedQuestions = prev.questions.filter((_, i) => i !== index);
      return { ...prev, questions: updatedQuestions };
    });
    if (activeQuestionIndex === index) {
      setActiveQuestionIndex(form.questions.length > 1 ? 0 : null);
    } else if (activeQuestionIndex !== null && activeQuestionIndex > index) {
      setActiveQuestionIndex(activeQuestionIndex - 1);
    }
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === form.questions.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    setForm((prev) => {
      const questions = [...prev.questions];
      const temp = questions[index];
      questions[index] = questions[targetIndex];
      questions[targetIndex] = temp;
      return { ...prev, questions };
    });

    if (activeQuestionIndex === index) {
      setActiveQuestionIndex(targetIndex);
    } else if (activeQuestionIndex === targetIndex) {
      setActiveQuestionIndex(index);
    }
  };

  const addOption = (questionIndex: number) => {
    const currentQuestion = form.questions[questionIndex];
    const currentOptions = currentQuestion.options || [];
    const newOption = `Option ${currentOptions.length + 1}`;
    updateQuestion(questionIndex, {
      options: [...currentOptions, newOption],
    });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const currentQuestion = form.questions[questionIndex];
    const currentOptions = [...(currentQuestion.options || [])];
    currentOptions[optionIndex] = value;
    updateQuestion(questionIndex, { options: currentOptions });
  };

  const deleteOption = (questionIndex: number, optionIndex: number) => {
    const currentQuestion = form.questions[questionIndex];
    const currentOptions = (currentQuestion.options || []).filter((_, i) => i !== optionIndex);
    updateQuestion(questionIndex, { options: currentOptions });
  };

  const handlePublish = async () => {
    if (!form.title.trim()) {
      setPublishError("Le titre du formulaire ne peut pas être vide.");
      return;
    }
    if (form.questions.length === 0) {
      setPublishError("Le formulaire doit comporter au moins une question.");
      return;
    }

    setPublishError(null);
    try {
      await onPublish(form);
    } catch (err: any) {
      setPublishError(err.message || "Une erreur s'est produite lors de la publication.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-2xs">
        <button
          onClick={onBack}
          disabled={publishing}
          className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 hover:text-slate-800 transition-colors py-1.5 cursor-pointer disabled:opacity-50 justify-center sm:justify-start"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          Retour au créateur
        </button>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={onBack}
            disabled={publishing}
            className="flex-1 sm:flex-none text-center justify-center px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            Recommencer
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishing ? (
              <>
                <svg className="animate-spin h-3.5 sm:h-4 w-3.5 sm:w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="truncate">Création...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0" />
                <span className="truncate">Créer le formulaire</span>
                <ArrowRight className="w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0 hidden xs:inline" />
              </>
            )}
          </button>
        </div>
      </div>

      {publishError && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-start gap-3 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Erreur de création</p>
            <p className="mt-0.5 text-red-600/95">{publishError}</p>
          </div>
        </div>
      )}

      {/* Grid of Editor & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Form Editor Panel */}
        <div className="lg:col-span-8 space-y-4">
          {/* Form Header Card */}
          <div className="bg-white rounded-2xl border-t-8 border-t-blue-600 border border-slate-100 p-6 shadow-xs">
            <div className="space-y-4">
              <input
                type="text"
                className="w-full text-2xl font-bold font-display text-slate-800 border-b border-transparent hover:border-slate-200 focus:border-blue-600 focus:ring-0 outline-hidden pb-1 transition-all"
                placeholder="Titre du formulaire"
                value={form.title}
                onChange={(e) => updateFormTitle(e.target.value)}
              />
              <textarea
                className="w-full text-sm text-slate-500 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-600 focus:ring-0 outline-hidden py-1 transition-all leading-relaxed resize-none"
                placeholder="Description du formulaire"
                rows={2}
                value={form.description}
                onChange={(e) => updateFormDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Form Questions Cards */}
          <div className="space-y-3">
            {form.questions.map((q, idx) => {
              const isActive = activeQuestionIndex === idx;

              return (
                <div
                  key={idx}
                  onClick={() => !isActive && setActiveQuestionIndex(idx)}
                  className={`bg-white rounded-xl border transition-all duration-200 ${
                    isActive
                      ? "border-blue-500 shadow-md ring-2 ring-blue-500/10"
                      : "border-slate-100 shadow-2xs hover:border-slate-300 hover:shadow-xs cursor-pointer"
                  }`}
                >
                  {/* Card Header & Controls (Always Visible) */}
                  <div className="p-5 flex items-start gap-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold font-mono shrink-0 mt-0.5">
                      {idx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      {isActive ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            className="w-full text-base font-semibold text-slate-800 border-b border-slate-200 focus:border-blue-500 outline-hidden pb-1 transition-all"
                            placeholder="Question sans titre"
                            value={q.title}
                            onChange={(e) => updateQuestion(idx, { title: e.target.value })}
                          />
                          <input
                            type="text"
                            className="w-full text-xs text-slate-400 border-b border-transparent focus:border-slate-200 outline-hidden pb-1 transition-all"
                            placeholder="Ajouter une description / consigne facultative"
                            value={q.description || ""}
                            onChange={(e) => updateQuestion(idx, { description: e.target.value })}
                          />
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-800 break-words flex items-center gap-1.5">
                            {q.title}
                            {q.required && <span className="text-red-500">*</span>}
                          </h4>
                          {q.description && (
                            <p className="text-xs text-slate-400 mt-1 italic shrink-0 leading-relaxed">
                              {q.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Question Action Panel (Move, Delete) */}
                    <div className="flex items-center gap-1.5 sm:gap-1 opacity-100 md:opacity-60 md:hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveQuestion(idx, "up");
                        }}
                        disabled={idx === 0}
                        className="p-2 sm:p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-[auto] sm:min-h-[auto] flex items-center justify-center"
                        title="Déplacer vers le haut"
                      >
                        <ChevronUp className="w-4.5 h-4.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveQuestion(idx, "down");
                        }}
                        disabled={idx === form.questions.length - 1}
                        className="p-2 sm:p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-[auto] sm:min-h-[auto] flex items-center justify-center"
                        title="Déplacer vers le bas"
                      >
                        <ChevronDown className="w-4.5 h-4.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteQuestion(idx);
                        }}
                        className="p-2 sm:p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-[auto] sm:min-h-[auto] flex items-center justify-center"
                        title="Supprimer la question"
                      >
                        <Trash2 className="w-4.5 h-4.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Edit Controls (Only Visible when Selected) */}
                  {isActive && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-50 bg-slate-50/40 space-y-4 rounded-b-xl">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Question Type */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Type de réponse
                          </label>
                          <select
                            className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg p-2.5 outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            value={q.type}
                            onChange={(e) => {
                              const type = e.target.value as FormQuestion["type"];
                              const updates: Partial<FormQuestion> = { type };
                              if (["RADIO", "CHECKBOX", "DROP_DOWN"].includes(type) && (!q.options || q.options.length === 0)) {
                                updates.options = ["Option 1", "Option 2"];
                              }
                              updateQuestion(idx, updates);
                            }}
                          >
                            {QUESTION_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Question settings */}
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 cursor-pointer py-2 px-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 select-none w-full">
                            <input
                              type="checkbox"
                              className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                              checked={q.required}
                              onChange={(e) => updateQuestion(idx, { required: e.target.checked })}
                            />
                            <span className="text-xs font-medium text-slate-700">Question obligatoire</span>
                          </label>
                        </div>
                      </div>

                      {/* Choices Options (Only if Choice Type) */}
                      {["RADIO", "CHECKBOX", "DROP_DOWN"].includes(q.type) && (
                        <div className="space-y-2 border-t border-slate-100 pt-3">
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Options de réponse
                          </label>
                          <div className="space-y-2">
                            {(q.options || []).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <span className="text-slate-300 shrink-0 select-none">
                                  {q.type === "RADIO" ? "⚪" : q.type === "CHECKBOX" ? "⬜" : "🔸"}
                                </span>
                                <input
                                  type="text"
                                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-hidden focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500"
                                  value={opt}
                                  onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                                />
                                <button
                                  type="button"
                                  onClick={() => deleteOption(idx, optIdx)}
                                  disabled={(q.options || []).length <= 1}
                                  className="p-2 sm:p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent min-w-[36px] min-h-[36px] sm:min-w-[auto] sm:min-h-[auto] flex items-center justify-center cursor-pointer"
                                >
                                  <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => addOption(idx)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 mt-1 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Ajouter une option
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Question Button */}
          <button
            onClick={addQuestion}
            className="w-full py-4 bg-slate-50 hover:bg-slate-100/70 border border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-400" />
            Ajouter une nouvelle question
          </button>
        </div>

        {/* Right Side: Live Form Schema Summary */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950 text-slate-200 p-6 rounded-2xl shadow-sm border border-slate-800 sticky top-4">
            <div className="flex items-center gap-2 text-blue-400 font-display font-semibold text-sm">
              <Eye className="w-4 h-4 animate-pulse" />
              RÉSUMÉ DU SCHÉMA
            </div>
            <h3 className="text-base font-bold text-white font-display mt-3 leading-snug">
              {form.title || "Formulaire sans titre"}
            </h3>
            <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
              {form.description || "Aucune description fournie."}
            </p>

            <div className="border-t border-slate-800/80 mt-5 pt-4 space-y-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Nombre de questions :</span>
                <span className="font-mono text-white font-semibold">
                  {form.questions.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Questions obligatoires :</span>
                <span className="font-mono text-amber-400 font-semibold">
                  {form.questions.filter((q) => q.required).length}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-800/80 mt-4 pt-4">
              <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mb-2">
                Aperçu des types :
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(form.questions.map((q) => q.type))).map((type) => {
                  const count = form.questions.filter((q) => q.type === type).length;
                  return (
                    <span
                      key={type}
                      className="text-[10px] font-medium bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded-md"
                    >
                      {type} ({count})
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
