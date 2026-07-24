import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Users,
  Calendar,
  Clock,
  ExternalLink,
  MessageSquare,
  Sparkles,
  PieChart as PieIcon,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  Eye,
} from "lucide-react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { GoogleFormDetails, FormResponse } from "../types";
import { getFormResponsesAndDetails } from "../formsService";

interface AnalyticsDashboardProps {
  formId: string;
  token: string;
  onBack: () => void;
}

const COLORS = [
  "#2563eb", // Blue
  "#3b82f6", // Light Blue
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#8b5cf6", // Violet
];

export default function AnalyticsDashboard({
  formId,
  token,
  onBack,
}: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    details: GoogleFormDetails;
    responses: FormResponse[];
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFormResponsesAndDetails(formId, token);
      setData(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur de chargement des statistiques.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [formId, token]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center min-h-[400px] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500 font-display">
          Analyse du formulaire et des réponses en cours...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center min-h-[300px] flex flex-col items-center justify-center space-y-4">
        <div className="p-3 bg-red-50 text-red-500 rounded-full w-12 h-12 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">Échec du chargement</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{error}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Retour
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const { details, responses } = data;
  const questions = details.items || [];
  const responsesCount = responses.length;

  // Compute answers distribution for a choice question
  const getChoiceQuestionData = (
    itemId: string,
    questionId: string,
    options: string[]
  ) => {
    const counts: { [opt: string]: number } = {};
    options.forEach((opt) => {
      counts[opt] = 0;
    });

    responses.forEach((resp) => {
      const answerObj = resp.answers?.[questionId] || resp.answers?.[itemId];
      if (answerObj && answerObj.textAnswers && answerObj.textAnswers.answers) {
        answerObj.textAnswers.answers.forEach((ans) => {
          const val = ans.value;
          if (options.includes(val)) {
            counts[val] = (counts[val] || 0) + 1;
          } else if (val) {
            counts[val] = (counts[val] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  };

  // Compute text answers list
  const getTextAnswersList = (itemId: string, questionId: string) => {
    const list: string[] = [];
    responses.forEach((resp) => {
      const answerObj = resp.answers?.[questionId] || resp.answers?.[itemId];
      if (answerObj && answerObj.textAnswers && answerObj.textAnswers.answers) {
        answerObj.textAnswers.answers.forEach((ans) => {
          if (ans.value) list.push(ans.value);
        });
      }
    });
    return list;
  };

  // Compute simple timelines of submissions
  const getTimelineData = () => {
    const days: { [date: string]: number } = {};
    responses.forEach((resp) => {
      if (resp.createTime) {
        const date = new Date(resp.createTime).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        });
        days[date] = (days[date] || 0) + 1;
      }
    });
    return Object.entries(days).map(([name, submissions]) => ({
      name,
      submissions,
    }));
  };

  const timelineData = getTimelineData();

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour à la liste
          </button>
          <h2 className="text-xl md:text-2xl font-bold font-display text-slate-800 truncate">
            {details.info?.title || "Formulaire sans titre"}
          </h2>
          <p className="text-xs text-slate-400 mt-1 truncate">
            {details.info?.description || "Aucune description pour ce formulaire."}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <button
            onClick={fetchData}
            className="p-3 sm:p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all min-w-[44px] min-h-[44px] sm:min-w-[auto] sm:min-h-[auto] flex items-center justify-center cursor-pointer shrink-0"
            title="Rafraîchir les données"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <a
            href={`https://docs.google.com/forms/d/${formId}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all cursor-pointer min-h-[44px] sm:min-h-[auto]"
          >
            <span className="truncate">Éditeur Google Forms</span>
            <Eye className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
          </a>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Nombre de Réponses
            </span>
            <span className="text-2xl font-bold text-slate-800 font-display block mt-1">
              {responsesCount}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Taux de complétion
            </span>
            <span className="text-2xl font-bold text-slate-800 font-display block mt-1">
              {responsesCount > 0 ? "100%" : "0%"}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Dernière mise à jour
            </span>
            <span className="text-xs font-semibold text-slate-700 block mt-2">
              {responsesCount > 0
                ? new Date(responses[0].createTime).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Aucune réponse"}
            </span>
          </div>
        </div>
      </div>

      {responsesCount === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-full w-14 h-14 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Aucune réponse pour le moment</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Votre formulaire a été créé avec succès, mais aucun utilisateur ne l'a encore rempli. Partagez le lien public pour commencer à collecter des données !
            </p>
          </div>
          <div className="pt-2">
            <a
              href={details.responderUri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl hover:shadow-xs transition-all cursor-pointer"
            >
              Ouvrir le formulaire public <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Timeline chart card */}
          {timelineData.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 mb-4">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Évolution des soumissions dans le temps
              </h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        backgroundColor: "#0f172a",
                        color: "#fff",
                        border: "none",
                      }}
                    />
                    <Bar dataKey="submissions" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={24} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Individual Question Analytics Grid */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Analyse détaillée par question
            </h3>

            {questions.map((item, idx) => {
              const q = item.questionItem?.question;
              if (!q) return null;

              const questionId = q.questionId;
              const itemId = item.itemId;
              const isChoice = !!q.choiceQuestion;

              return (
                <div key={itemId} className="bg-white rounded-xl border border-slate-100 p-6 shadow-2xs space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-slate-100 text-slate-600 text-2xs font-bold font-mono mt-0.5 shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-slate-400 mt-0.5 italic">{item.description}</p>
                      )}
                    </div>
                  </div>

                  {isChoice ? (
                    (() => {
                      const options = (q.choiceQuestion?.options || []).map((o) => o.value);
                      const chartData = getChoiceQuestionData(itemId, questionId, options);
                      const totalAnswers = chartData.reduce((acc, curr) => acc + curr.value, 0);

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                          {/* Recharts Pie Chart */}
                          <div className="md:col-span-5 h-44 w-full flex items-center justify-center">
                            {totalAnswers > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                  <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={3}
                                    dataKey="value"
                                  >
                                    {chartData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    contentStyle={{
                                      fontSize: 10,
                                      borderRadius: 6,
                                      backgroundColor: "#0f172a",
                                      color: "#fff",
                                      border: "none",
                                    }}
                                  />
                                </RechartsPieChart>
                              </ResponsiveContainer>
                            ) : (
                              <p className="text-xs text-slate-400 italic">Aucun vote enregistré.</p>
                            )}
                          </div>

                          {/* Legend / Values Breakdown */}
                          <div className="md:col-span-7 space-y-2">
                            {chartData.map((opt, index) => {
                              const percentage =
                                totalAnswers > 0 ? Math.round((opt.value / totalAnswers) * 100) : 0;
                              return (
                                <div key={opt.name} className="flex items-center justify-between gap-4 text-xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="text-slate-600 truncate" title={opt.name}>
                                      {opt.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 font-mono">
                                    <span className="text-slate-800 font-semibold">{opt.value}</span>
                                    <span className="text-slate-400 text-[10px]">({percentage}%)</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    (() => {
                      const textAnswers = getTextAnswersList(itemId, questionId);
                      return (
                        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 max-h-48 overflow-y-auto space-y-2">
                          {textAnswers.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Aucune réponse texte fournie.</p>
                          ) : (
                            textAnswers.map((ans, aIdx) => (
                              <div
                                key={aIdx}
                                className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-100 shadow-3xs leading-relaxed"
                              >
                                {ans}
                              </div>
                            ))
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
