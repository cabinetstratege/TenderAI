"use client";

/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect, useRef } from "react";
import { tenderService } from "../services/tenderService";
import {
  chatWithTender,
  generateStrategicAnalysis,
} from "../services/geminiService";
import { userService } from "../services/userService";
import {
  Tender,
  UserInteraction,
  TenderStatus,
  AIStrategyAnalysis,
  ChatMessage,
  UserProfile,
} from "../types";
import jsPDF from "jspdf";
import { generateTenderReport } from "../services/pdfService";
import DepartmentMap from "./DepartmentMap";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building,
  ExternalLink,
  Euro,
  BrainCircuit,
  Send,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Save,
  XCircle,
  Clock,
  Mail,
  Phone,
  User,
  Share2,
  Printer,
  Loader2,
  Copy,
  FileText,
  Trash2,
  BookmarkMinus,
  RotateCcw,
  MessageSquareText,
  Layers,
  StickyNote,
  MoreVertical,
  CalendarPlus,
} from "lucide-react";

type TenderDetailScreenProps = { tenderId?: string; onBack?: () => void };

const FormattedMessage = ({ text, role }: { text: string; role: string }) => {
  const paragraphs = text.split("\n\n");

  return (
    <div
      className={`text-sm leading-relaxed space-y-3 ${role === "user" ? "text-white" : "text-slate-700 dark:text-slate-200"}`}
    >
      {paragraphs.map((para, idx) => {
        if (para.trim().startsWith("- ") || para.trim().startsWith("* ")) {
          const items = para.split("\n");
          return (
            <ul
              key={idx}
              className={`list-disc pl-5 space-y-1 ${role === "user" ? "marker:text-blue-200" : "marker:text-slate-400"}`}
            >
              {items.map((item, i) => (
                <li key={i}>{parseBold(item.replace(/^[-\*] /, ""))}</li>
              ))}
            </ul>
          );
        }
        if (para.startsWith("#")) {
          return (
            <h3
              key={idx}
              className={`font-bold mt-4 mb-2 text-base ${role === "user" ? "text-white" : "text-slate-900 dark:text-white"}`}
            >
              {parseBold(para.replace(/^#+ /, ""))}
            </h3>
          );
        }
        return (
          <p key={idx}>
            {para.split("\n").map((line, i) => (
              <React.Fragment key={i}>
                {parseBold(line)}
                {i < para.split("\n").length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

const parseBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold opacity-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

export const TenderDetailScreen: React.FC<TenderDetailScreenProps> = ({
  tenderId,
  onBack,
}) => {
  const id = tenderId;
  const [data, setData] = useState<{
    tender: Tender;
    interaction?: UserInteraction;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<
    "description" | "lots" | "intelligence"
  >("description");
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const [analysis, setAnalysis] = useState<AIStrategyAnalysis | undefined>(
    undefined,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisCooldownUntil, setAnalysisCooldownUntil] = useState<number | null>(null);
  const analysisCooldownRef = useRef<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Assistant State
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(
    null,
  );
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const copyTimeoutRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      tenderService.markTenderAsVisited(id);

      const [tenderResult, profileResult] = await Promise.all([
        tenderService.getTenderById(id),
        userService.getCurrentProfile(),
      ]);

      if (tenderResult) {
        setData(tenderResult);
        if (tenderResult.interaction?.aiAnalysisResult) {
          setAnalysis(tenderResult.interaction.aiAnalysisResult);
          // Default to intelligence tab if analysis exists
          setActiveTab("intelligence");
        }
        if (tenderResult.interaction?.chatHistory) {
          setChatHistory(tenderResult.interaction.chatHistory);
        }
      }
      if (profileResult) {
        setUserProfile(profileResult);
      }
      setIsLoading(false);
    };
    loadData();
  }, [id]);

  useEffect(() => {
    if (activeTab === "intelligence") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isChatting, activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        shareMenuRef.current &&
        !shareMenuRef.current.contains(event.target as Node)
      ) {
        setIsShareOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerateStrategy = async (forceRefresh: boolean = false) => {
    if (!data?.tender || !userProfile) return;
    if (analysis && !forceRefresh) return;
    setIsAnalyzing(true);

    try {
      const result = await generateStrategicAnalysis(data.tender, userProfile);

      if (result) {
        setAnalysis(result);
        await tenderService.saveAnalysis(data.tender.id, result);
        // Persist to tender interaction
        await tenderService.updateInteraction(
          data.tender.id,
          TenderStatus.SAVED,
          undefined,
          data.tender,
        );
        setToast({
          type: "success",
          message: forceRefresh
            ? "Analyse mise à jour."
            : "Analyse générée.",
        });
        if (forceRefresh) {
          const cooldownUntil = Date.now() + 60_000;
          setAnalysisCooldownUntil(cooldownUntil);
          if (analysisCooldownRef.current) {
            window.clearTimeout(analysisCooldownRef.current);
          }
          analysisCooldownRef.current = window.setTimeout(() => {
            setAnalysisCooldownUntil(null);
          }, 60_000);
        }
      }
      setActiveTab("intelligence");
    } catch (e) {
      setToast({
        type: "error",
        message: "Erreur lors de l'analyse. Réessayez.",
      });
    } finally {
      setIsAnalyzing(false);
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2500);
    }
  };

  const handleChatSend = async (presetMessage?: string) => {
    if (!data?.tender || !userProfile) return;
    const message = presetMessage ?? chatInput.trim();
    if (!message) return;

    setIsChatting(true);
    setChatInput("");

    const updatedHistory: ChatMessage[] = [
      ...chatHistory,
      { role: "user", text: message },
    ];
    setChatHistory(updatedHistory);

    const apiHistory = updatedHistory.map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    }));

    const response = await chatWithTender(
      data.tender,
      apiHistory,
      message,
      userProfile,
    );
    const newHistory: ChatMessage[] = [
      ...updatedHistory,
      { role: "model", text: response },
    ];

    setChatHistory(newHistory);
    setIsChatting(false);
    setActiveTab("intelligence");
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

    await tenderService.saveChatHistory(data.tender.id, newHistory);
  };

  const handleSaveNotes = async (note: string) => {
    if (!data?.tender) return;
    await tenderService.updateInteraction(
      data.tender.id,
      data.interaction?.status ?? TenderStatus.SAVED,
      note,
      data.tender,
    );
    setData((prev) =>
      prev
        ? {
            ...prev,
            interaction: {
              ...(prev.interaction ?? {
                tenderId: prev.tender.id,
                status: TenderStatus.SAVED,
              }),
              internalNotes: note,
            },
          }
        : prev,
    );
  };

  const handleStatusChange = async (status: TenderStatus) => {
    if (!data?.tender) return;
    setIsSaving(true);
    try {
      await tenderService.updateInteraction(
        data.tender.id,
        status,
        data.interaction?.internalNotes,
        data.tender,
      );
      setData((prev) =>
        prev
          ? {
              ...prev,
              interaction: {
                ...(prev.interaction ?? { tenderId: prev.tender.id, status }),
                status,
              },
            }
          : prev,
      );
      if (status === TenderStatus.SAVED) {
        setToast({ type: "success", message: "Offre sauvegardée." });
      }
    } catch (e) {
      setToast({ type: "error", message: "Erreur lors de la sauvegarde. Réessayez." });
    } finally {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2500);
      setIsSaving(false);
    }
  };

  const handleUnsave = async () => {
    if (!data?.tender) return;
    setIsSaving(true);
    try {
      await tenderService.deleteInteraction(data.tender.id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              interaction: undefined,
            }
          : prev,
      );
      setToast({ type: "success", message: "Offre retirée des sauvegardes." });
    } catch (e) {
      setToast({ type: "error", message: "Erreur lors de la suppression. Réessayez." });
    } finally {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = window.setTimeout(() => {
        setToast(null);
      }, 2500);
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    if (!data?.tender) return;
    const text = `AO : ${data.tender.title}\nAcheteur : ${data.tender.buyer}\nDeadline : ${data.tender.deadline}\nLien : ${data.tender.linkDCE}`;
    if (navigator.share) {
      navigator
        .share({
          title: data.tender.title,
          text,
          url: data.tender.linkDCE,
        })
        .catch((err) => console.error(err));
    } else {
      navigator.clipboard.writeText(text);
      alert("Copié dans le presse-papiers");
    }
  };

  const handleExportPDF = () => {
    if (!data?.tender) return;
    generateTenderReport(
      data.tender,
      analysis,
      data.interaction?.internalNotes,
      userProfile,
    );
  };

  const handleClearChat = () => {
    setChatHistory([]);
    setAnalysis(undefined);
    if (data?.tender) {
      tenderService.saveChatHistory(data.tender.id, []);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleCopyMessage = (text: string, index: number) => {
    copyToClipboard(text);
    setCopiedMessageIndex(index);
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = window.setTimeout(() => {
      setCopiedMessageIndex(null);
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!data?.tender) return null;

  const targetDepartments = (userProfile?.targetDepartments || "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  const targetDeptSet = new Set(targetDepartments);

  return (
    <div className="pb-12">
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium shadow-lg border ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-900/40"
                : "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-900/40"
            }`}
            role="status"
            aria-live="polite"
          >
            {toast.message}
          </div>
        </div>
      )}
      <div className="flex items-start gap-3 mb-6">
        <button
          onClick={() => (onBack ? onBack() : window.history.back())}
          className="p-2 mt-1 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-textMain leading-tight">
            {data.tender.title}
          </h1>
          <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md w-fit">
            AO #{data.tender.idWeb}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 order-1 lg:order-1">
          <div className="bg-surface border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-primary" />
                <div className="flex gap-2 text-sm font-semibold text-textMain">
                  <button
                    onClick={() => setActiveTab("description")}
                    className={`px-3 py-1 rounded-lg border transition-colors duration-150 cursor-pointer ${
                      activeTab === "description"
                        ? "bg-blue-100 dark:bg-blue-900/40 text-primary border-transparent"
                        : "border-slate-200 dark:border-slate-700/50 text-textMuted hover:text-textMain hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    onFocus={(e) =>
                      e.currentTarget.classList.add("bg-slate-100")
                    }
                    onBlur={(e) =>
                      e.currentTarget.classList.remove("bg-slate-100")
                    }
                    aria-pressed={activeTab === "description"}
                    title="Voir la description"
                  >
                    Description
                  </button>
                  <button
                    onClick={() => setActiveTab("lots")}
                    className={`px-3 py-1 rounded-lg border transition-colors duration-150 cursor-pointer ${
                      activeTab === "lots"
                        ? "bg-blue-100 dark:bg-blue-900/40 text-primary border-transparent"
                        : "border-slate-200 dark:border-slate-700/50 text-textMuted hover:text-textMain hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    onFocus={(e) =>
                      e.currentTarget.classList.add("bg-slate-100")
                    }
                    onBlur={(e) =>
                      e.currentTarget.classList.remove("bg-slate-100")
                    }
                    aria-pressed={activeTab === "lots"}
                    title="Voir les lots"
                  >
                    Lots
                  </button>
                  <button
                    onClick={() => setActiveTab("intelligence")}
                    className={`px-3 py-1 rounded-lg transition-colors duration-150 cursor-pointer ${
                      activeTab === "intelligence"
                        ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                        : "text-textMuted hover:text-textMain hover:bg-slate-100 dark:hover:bg-slate-800"
                    } hidden`}
                    aria-pressed={activeTab === "intelligence"}
                    title="Voir l'intelligence"
                  >
                    Intelligence
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-[11px] text-textMuted">
                  <Calendar size={14} /> Dépôt : {data.tender.deadline}
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs">
                  <button
                    onClick={handleExportPDF}
                    className="px-2.5 py-1.5 font-semibold bg-slate-100 dark:bg-slate-800 text-textMain rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer size={12} /> Exporter
                  </button>
                  <button
                    onClick={handleShare}
                    className="px-2.5 py-1.5 font-semibold bg-primary text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Share2 size={12} /> Partager
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4">
              {activeTab === "description" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-textMuted">
                    <Building size={16} />
                    <span>{data.tender.buyer}</span>
                  </div>
                  <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                    {data.tender.aiSummary}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full border border-slate-200 dark:border-slate-700 font-semibold uppercase tracking-wide">
                      {data.tender.procedureType}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wide ${
                        data.tender.compatibilityScore < 30
                          ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/40"
                          : data.tender.compatibilityScore < 60
                            ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40"
                            : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40"
                      }`}
                    >
                      Compatibilité : {data.tender.compatibilityScore}%
                    </span>
                    {data.tender.estimatedBudget && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full border border-amber-200 text-[11px] font-semibold uppercase tracking-wide dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40">
                        <Euro size={12} />{" "}
                        {data.tender.estimatedBudget.toLocaleString("fr-FR")} €
                      </span>
                    )}
                  </div>
                  <a
                    href={data.tender.linkDCE}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-primary text-sm font-semibold hover:underline"
                  >
                    Consulter le DCE <ExternalLink size={14} />
                  </a>
                </div>
              )}

              {activeTab === "lots" && (
                <div className="space-y-3">
                  {data.tender.lots.length === 0 && (
                    <p className="text-sm text-textMuted">
                      Aucun lot disponible.
                    </p>
                  )}
                  {data.tender.lots.map((lot) => (
                    <div
                      key={lot.lotNumber}
                      className="p-3 border border-slate-200 dark:border-slate-700/50 rounded-2xl bg-slate-50 dark:bg-slate-900/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-textMain">
                          Lot {lot.lotNumber} â€” {lot.title}
                        </div>
                        {lot.cpv && (
                          <span className="text-[11px] px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            CPV: {lot.cpv.join(", ")}
                          </span>
                        )}
                      </div>
                      {lot.description && (
                        <p className="text-xs text-textMuted mt-1">
                          {lot.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="bg-surface border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-xl">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-4">
                <div className="p-3 border border-slate-200 dark:border-slate-700/50 rounded-2xl bg-slate-50 dark:bg-slate-900/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-500" />
                      <h4 className="font-bold text-textMain">Analyse IA</h4>
                    </div>
              <button
                onClick={() => handleGenerateStrategy(!!analysis)}
                disabled={isAnalyzing || (analysis && analysisCooldownUntil !== null)}
                className="px-3 py-1.5 text-[11px] bg-primary text-white rounded-full hover:bg-blue-600 shadow-sm flex items-center gap-1 disabled:opacity-50"
              >
                      {isAnalyzing ? (
                        <Loader2 className="animate-spin" size={12} />
                      ) : analysis ? (
                        <RotateCcw size={12} />
                      ) : (
                        <Sparkles size={12} />
                      )}
                      {analysis ? "Mettre à jour" : "Générer l'analyse"}
                    </button>
                  </div>

                  {analysis ? (
                    <div className="space-y-3 text-sm">
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50">
                        <h5 className="font-bold text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-1 text-sm">
                          <CheckCircle size={14} /> Atouts
                        </h5>
                        {isAnalyzing ? (
                          <div className="space-y-2 animate-pulse">
                            <div className="h-3 bg-emerald-200/60 dark:bg-emerald-800/40 rounded" />
                            <div className="h-3 bg-emerald-200/60 dark:bg-emerald-800/40 rounded w-5/6" />
                            <div className="h-3 bg-emerald-200/60 dark:bg-emerald-800/40 rounded w-4/6" />
                          </div>
                        ) : (
                          <ul className="list-disc pl-4 space-y-1 text-emerald-800 dark:text-emerald-100">
                            {analysis.strengths.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50">
                        <h5 className="font-bold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1 text-sm">
                          <AlertTriangle size={14} /> Risques
                        </h5>
                        {isAnalyzing ? (
                          <div className="space-y-2 animate-pulse">
                            <div className="h-3 bg-amber-200/60 dark:bg-amber-800/40 rounded" />
                            <div className="h-3 bg-amber-200/60 dark:bg-amber-800/40 rounded w-5/6" />
                            <div className="h-3 bg-amber-200/60 dark:bg-amber-800/40 rounded w-4/6" />
                          </div>
                        ) : (
                          <ul className="list-disc pl-4 space-y-1 text-amber-800 dark:text-amber-100">
                            {analysis.risks.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="p-3 bg-slate-100 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                          <Clock size={12} /> Charge : {analysis.workload}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-textMuted">
                      Lancez l'analyse pour obtenir les risques et atouts.
                    </p>
                  )}
                </div>

                <div className="border border-slate-200 dark:border-slate-700/50 rounded-2xl p-3 bg-surface shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquareText size={16} className="text-purple-500" />
                      <h4 className="font-bold text-textMain">Assistant IA</h4>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                    {chatHistory.length === 0 && (
                      <div className="text-sm text-textMuted text-center py-6">
                        Posez une question ou lancez un prompt pré-rempli.
                      </div>
                    )}
                    {chatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                            msg.role === "user"
                              ? "bg-primary text-white rounded-br-none"
                              : "bg-slate-100 dark:bg-slate-800 text-textMain rounded-bl-none"
                          }`}
                        >
                          <FormattedMessage text={msg.text} role={msg.role} />
                          {msg.role === "model" && (
                            <div className="mt-2 flex justify-end">
                              <button
                                onClick={() => handleCopyMessage(msg.text, idx)}
                                className="text-[11px] text-slate-500 hover:text-primary flex items-center gap-1 cursor-pointer"
                                title="Copier la réponse"
                              >
                                <Copy size={12} />{" "}
                                {copiedMessageIndex === idx ? "Copié" : "Copier"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isChatting && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-2 text-sm text-textMuted">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                            <span
                              className="w-2 h-2 bg-primary rounded-full animate-bounce"
                              style={{ animationDelay: "120ms" }}
                            />
                            <span
                              className="w-2 h-2 bg-primary rounded-full animate-bounce"
                              style={{ animationDelay: "240ms" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleChatSend(
                            "Rédige une synthèse exécutive de notre réponse pour le décideur (Maire/Directeur).",
                          )
                        }
                        disabled={isChatting}
                        className="px-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-textMain flex items-center gap-2"
                      >
                        <Sparkles size={14} /> Synthèse
                      </button>
                      <button
                        onClick={() =>
                          handleChatSend(
                            "Propose un plan détaillé pour le Mémoire Technique de cet AO, structuré en grands chapitres.",
                          )
                        }
                        disabled={isChatting}
                        className="px-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-textMain flex items-center gap-2"
                      >
                        <BrainCircuit size={14} /> Plan mémoire
                      </button>
                    </div>

                    <div className="relative">
                      <textarea
                        className="w-full pl-3 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-textMain placeholder-slate-400 disabled:opacity-50"
                        rows={3}
                        placeholder="Posez une question ou demandez une modification..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleChatSend();
                          }
                        }}
                        disabled={isChatting}
                      />
                      <button
                        onClick={() => handleChatSend()}
                        disabled={!chatInput.trim() || isChatting}
                        className="absolute right-2 bottom-2 p-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                      >
                        <Send size={16} />
                      </button>
                    </div>

                    {chatHistory.length > 0 && (
                      <div className="flex justify-end gap-3 text-[11px] text-slate-500">
                        <button
                          onClick={handleClearChat}
                          className="hover:text-red-500 flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Effacer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 order-2 lg:order-2">
          <div className="bg-surface border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-blue-500" />
              <h4 className="font-bold text-textMain">Géographie ciblée</h4>
            </div>
            <DepartmentMap departments={data.tender.departments} />
            <div className="text-xs text-textMuted flex items-center gap-2">
              <MapPin size={12} /> Départements :
              {data.tender.departments?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.tender.departments.map((dept) => {
                    const isTarget = targetDeptSet.has(dept);
                    return (
                      <span
                        key={dept}
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                          isTarget
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-900/40"
                            : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-900/40"
                        }`}
                      >
                        {dept}
                      </span>
                    );
                  })}
                </div>
              ) : (
                "â€”"
              )}
            </div>
          </div>

          <div className="bg-surface border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <CalendarPlus size={16} className="text-emerald-500" />
              <h4 className="font-bold text-textMain">Suivi</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {data.interaction?.status === TenderStatus.SAVED ? (
                <button
                  onClick={handleUnsave}
                  disabled={isSaving}
                  className="px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/80 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />{" "}
                      Suppression...
                    </>
                  ) : (
                    <>
                      <BookmarkMinus size={14} /> Ne plus sauvegarder
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange(TenderStatus.SAVED)}
                  disabled={isSaving}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-textMain flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />{" "}
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Sauvegarder
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => handleStatusChange(TenderStatus.BLACKLISTED)}
                disabled={isSaving}
                className="px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={14} /> Traitement...
                  </>
                ) : (
                  <>
                    <XCircle size={14} /> Blacklister
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="bg-surface border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <StickyNote size={16} className="text-slate-500" />
              <h4 className="font-bold text-textMain">Notes internes</h4>
            </div>
            <textarea
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-textMain min-h-[120px]"
              placeholder="Ajoutez vos éléments clés..."
              value={data.interaction?.internalNotes || ""}
              onChange={(e) => handleSaveNotes(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenderDetailScreen;
