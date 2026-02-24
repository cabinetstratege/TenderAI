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
  MessageSquareText,
  Layers,
  StickyNote,
  MoreVertical,
  Download,
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

  // Assistant State
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

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

  const handleGenerateStrategy = async () => {
    if (!data?.tender || !userProfile) return;
    setIsAnalyzing(true);

    const result = await generateStrategicAnalysis(data.tender, userProfile);

    if (result) {
      setAnalysis(result);
      // Persist to tender interaction
      await tenderService.updateInteraction(
        data.tender.id,
        TenderStatus.SAVED,
        undefined,
        data.tender,
      );
    }

    setIsAnalyzing(false);
    setActiveTab("intelligence");
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
    const newHistory: ChatMessage[] = [...updatedHistory, { role: "model", text: response }];

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
              ...(prev.interaction ?? { tenderId: prev.tender.id, status: TenderStatus.SAVED }),
              internalNotes: note,
            },
          }
        : prev,
    );
  };

  const handleStatusChange = async (status: TenderStatus) => {
    if (!data?.tender) return;
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

  const handleExportChatPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Historique de chat", 10, 15);
    doc.setFontSize(11);
    let y = 25;
    chatHistory.forEach((msg) => {
      doc.text(`${msg.role === "user" ? "Vous" : "Assistant"}:`, 10, y);
      y += 5;
      const lines = doc.splitTextToSize(msg.text, 180);
      doc.text(lines, 10, y);
      y += lines.length * 5 + 5;
    });
    doc.save("chat.pdf");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  if (isLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!data?.tender) return null;

  return (
    <div className="pb-12">
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
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-primary" />
                <div className="flex gap-2 text-sm font-semibold text-textMain">
                  <button
                    onClick={() => setActiveTab("description")}
                    className={`px-3 py-1 rounded-lg transition-colors duration-150 cursor-pointer ${
                      activeTab === "description"
                        ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                        : "text-textMuted hover:text-textMain hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    aria-pressed={activeTab === "description"}
                    title="Voir la description"
                  >
                    Description
                  </button>
                  <button
                    onClick={() => setActiveTab("lots")}
                    className={`px-3 py-1 rounded-lg transition-colors duration-150 cursor-pointer ${
                      activeTab === "lots"
                        ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                        : "text-textMuted hover:text-textMain hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
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
                    }`}
                    aria-pressed={activeTab === "intelligence"}
                    title="Voir l'intelligence"
                  >
                    Intelligence
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-textMuted">
                <Calendar size={14} /> Dépôt : {data.tender.deadline}
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
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                      Procédure : {data.tender.procedureType}
                    </span>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                      Compatibilité : {data.tender.compatibilityScore}%
                    </span>
                    {data.tender.estimatedBudget && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                        <Euro size={12} /> {data.tender.estimatedBudget.toLocaleString("fr-FR")} €
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
                    <p className="text-sm text-textMuted">Aucun lot disponible.</p>
                  )}
                  {data.tender.lots.map((lot) => (
                    <div
                      key={lot.lotNumber}
                      className="p-3 border border-border rounded-xl bg-slate-50 dark:bg-slate-900/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-textMain">
                          Lot {lot.lotNumber} — {lot.title}
                        </div>
                        {lot.cpv && (
                          <span className="text-[11px] px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            CPV: {lot.cpv.join(", ")}
                          </span>
                        )}
                      </div>
                      {lot.description && (
                        <p className="text-xs text-textMuted mt-1">{lot.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "intelligence" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BrainCircuit size={18} className="text-primary" />
                        <h3 className="font-bold text-textMain">Assistant Stratégique</h3>
                      </div>
                      <button
                        onClick={handleGenerateStrategy}
                        disabled={isAnalyzing || !userProfile}
                        className="px-3 py-2 text-xs bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                      >
                        {isAnalyzing ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        Générer une analyse
                      </button>
                    </div>

                    {/* Chat */}
                    <div className="border border-border rounded-xl p-3 bg-surface shadow-inner">
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
                            className="px-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-border rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-textMain flex items-center gap-2"
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
                            className="px-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-border rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-textMain flex items-center gap-2"
                          >
                            <BrainCircuit size={14} /> Plan mémoire
                          </button>
                        </div>

                        <div className="relative">
                          <textarea
                            className="w-full pl-3 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-textMain placeholder-slate-400 disabled:opacity-50"
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
                              onClick={handleExportChatPDF}
                              className="hover:text-primary flex items-center gap-1"
                            >
                              <Download size={12} /> Export PDF
                            </button>
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

                  <div className="space-y-4">
                    <div className="p-3 border border-border rounded-xl bg-slate-50 dark:bg-slate-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-amber-500" />
                          <h4 className="font-bold text-textMain">Analyse IA</h4>
                        </div>
                        <button
                          onClick={handleGenerateStrategy}
                          disabled={isAnalyzing}
                          className="px-3 py-1 text-[11px] bg-primary/10 text-primary rounded-full hover:bg-primary/20 flex items-center gap-1 disabled:opacity-50"
                        >
                          {isAnalyzing ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                          {analysis ? "Mettre à jour" : "Lancer"}
                        </button>
                      </div>

                      {analysis ? (
                        <div className="space-y-3 text-sm">
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800">
                            <h5 className="font-bold text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-1 text-sm">
                              <CheckCircle size={14} /> Atouts
                            </h5>
                            <ul className="list-disc pl-4 space-y-1 text-emerald-800 dark:text-emerald-100">
                              {analysis.strengths.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800">
                            <h5 className="font-bold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1 text-sm">
                              <AlertTriangle size={14} /> Risques
                            </h5>
                            <ul className="list-disc pl-4 space-y-1 text-amber-800 dark:text-amber-100">
                              {analysis.risks.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-3 bg-slate-100 dark:bg-slate-900/40 rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
                              <Clock size={12} /> Charge : {analysis.workload}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-textMuted">Lancez l'analyse pour obtenir les risques et atouts.</p>
                      )}
                    </div>

                    <div className="p-3 border border-border rounded-xl bg-slate-50 dark:bg-slate-900/30 space-y-2">
                      <h4 className="font-bold text-textMain flex items-center gap-2 text-sm">
                        <StickyNote size={14} /> Notes internes
                      </h4>
                      <textarea
                        className="w-full bg-white dark:bg-slate-900 border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-textMain min-h-[100px]"
                        placeholder="Ajoutez vos éléments clés..."
                        value={data.interaction?.internalNotes || ""}
                        onChange={(e) => handleSaveNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-xl space-y-2">
            <div className="text-sm font-semibold text-textMain">Actions</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-2">
              <button
                onClick={handleExportPDF}
                className="px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-textMain rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 border border-border flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={14} /> Exporter
              </button>
              <button
                onClick={handleShare}
                className="px-3 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 size={14} /> Partager
              </button>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-sm text-textMuted">
              <MapPin size={14} /> Géographie ciblée
            </div>
            <DepartmentMap departments={data.tender.departments} />
            <div className="text-xs text-textMuted flex items-center gap-2">
              <User size={12} /> Client principal : {userProfile?.companyName || "—"}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-sm text-textMuted">
              <CalendarPlus size={14} /> Suivi
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleStatusChange(TenderStatus.SAVED)}
                className="px-3 py-2 rounded-lg border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-textMain flex items-center gap-2 cursor-pointer"
              >
                <Save size={14} /> Sauvegarder
              </button>
              <button
                onClick={() => handleStatusChange(TenderStatus.BLACKLISTED)}
                className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 cursor-pointer"
              >
                <XCircle size={14} /> Blacklister
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenderDetailScreen;
