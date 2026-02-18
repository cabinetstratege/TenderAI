"use client";

/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import DepartmentMap from "../components/DepartmentMap";
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
  const navigate = useNavigate();
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
      await tenderService.saveAnalysis(data.tender.id, result);
    }
    setIsAnalyzing(false);
  };

  const handleChatSend = async (messageOverride?: string) => {
    if ((!chatInput.trim() && !messageOverride) || !data?.tender) return;

    const userMsg = messageOverride || chatInput;
    setChatInput("");

    setChatHistory((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsChatting(true);

    const apiHistory = chatHistory.map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    }));

    const response = await chatWithTender(
      data.tender,
      apiHistory,
      userMsg,
      userProfile || undefined,
    );

    const finalHistory: ChatMessage[] = [
      ...chatHistory,
      { role: "user", text: userMsg },
      { role: "model", text: response },
    ];
    setChatHistory(finalHistory);
    setIsChatting(false);

    await tenderService.saveChatHistory(data.tender.id, finalHistory);
  };

  const handleClearChat = async () => {
    if (!data?.tender) return;
    if (
      window.confirm(
        "Voulez-vous vraiment effacer l'historique de conversation pour cet AO ?",
      )
    ) {
      setChatHistory([]);
      await tenderService.saveChatHistory(data.tender.id, []);
    }
  };

  const handleExportChatPDF = () => {
    if (chatHistory.length === 0 || !data?.tender) return;

    const doc = new jsPDF();
    const margin = 20;
    let y = 20;
    const pageWidth = doc.internal.pageSize.width;
    const maxLineWidth = pageWidth - margin * 2;

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Session de travail IA", margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`AO: ${data.tender.title.substring(0, 80)}...`, margin, y);
    y += 5;
    doc.text(`Date: ${new Date().toLocaleString()}`, margin, y);
    y += 15;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    chatHistory.forEach((msg) => {
      // Check page break
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      // Role Header
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      if (msg.role === "user") {
        doc.setTextColor(0, 0, 0); // Black for user
        doc.text("Moi :", margin, y);
      } else {
        doc.setTextColor(37, 99, 235); // Blue for AI
        doc.text("Assistant :", margin, y);
      }
      y += 6;

      // Content
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);

      // Strip markdown chars for cleaner PDF text
      const cleanText = msg.text.replace(/\*\*/g, "").replace(/#/g, "");
      const lines = doc.splitTextToSize(cleanText, maxLineWidth);

      lines.forEach((line: string) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 5;
      });
      y += 8; // Spacing between messages
    });

    doc.save(`Travail_IA_${data.tender.idWeb}.pdf`);
  };

  const handleStatusChange = async (status: TenderStatus) => {
    if (!data?.tender) return;
    await tenderService.updateInteraction(
      data.tender.id,
      status,
      undefined,
      data.tender,
    );
    setData((prev) =>
      prev
        ? {
            ...prev,
            interaction: {
              ...(prev.interaction || {}),
              status,
            } as UserInteraction,
          }
        : null,
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // --- ACTIONS EXPORT / SHARE ---

  const handleSendEmail = () => {
    if (!data?.tender) return;
    const recipient = userProfile?.contactEmail || "";
    const subject = `Opportunité AO : ${data.tender.title.substring(0, 60)}...`;
    const body = `Bonjour,\n\nVoici un appel d'offre intéressant détecté sur Le Compagnon des Marchés.\n\nTITRE : ${data.tender.title}\nACHETEUR : ${data.tender.buyer}\nDATE LIMITE : ${data.tender.deadline}\nBUDGET ESTIMÉ : ${data.tender.estimatedBudget ? (data.tender.estimatedBudget / 1000).toFixed(0) + " k€" : "N/C"}\n\nLien vers l'AO (DCE) : ${data.tender.linkDCE}\n\n--\nGénéré par Le Compagnon des Marchés`;

    window.open(
      `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    );
    setIsShareOpen(false);
  };

  const handleAddToCalendar = () => {
    if (!data?.tender || !data.tender.deadline) return;

    const title = `Limite AO : ${data.tender.title}`;
    const desc = `Acheteur: ${data.tender.buyer}\nLien: ${data.tender.linkDCE}\nID: ${data.tender.idWeb}`;

    // Convert date string (YYYY-MM-DD) to generic calendar format
    const dateParts = data.tender.deadline.split("-");
    if (dateParts.length !== 3) return;

    const dateString = dateParts.join("") + "T090000"; // Set default time to 9AM

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
URL:${data.tender.linkDCE}
DTSTART:${dateString}
DTEND:${dateString}
SUMMARY:${title}
DESCRIPTION:${desc.replace(/\n/g, "\\n")}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `AO_${data.tender.idWeb}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsShareOpen(false);
  };

  const handleDownloadTenderPDF = () => {
    if (!data?.tender) return;

    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Fiche Appel d'Offre", margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(
      `ID BOAMP : ${data.tender.idWeb} | Date: ${new Date().toLocaleDateString()}`,
      margin,
      y,
    );
    y += 15;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 190, y);
    y += 10;

    // Main Info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize(data.tender.title, 170);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 6 + 10;

    doc.setFontSize(10);
    doc.text(`Acheteur :`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(data.tender.buyer, margin + 25, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.text(`Date Limite :`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(data.tender.deadline, margin + 25, y);
    y += 8;

    if (data.tender.estimatedBudget) {
      doc.setFont("helvetica", "bold");
      doc.text(`Budget Est. :`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${(data.tender.estimatedBudget / 1000).toLocaleString()} k€`,
        margin + 25,
        y,
      );
      y += 8;
    }

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Description :", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");

    // Clean description
    const cleanDesc = (data.tender.fullDescription || "").replace(
      /<[^>]*>?/gm,
      "",
    );
    const descLines = doc.splitTextToSize(cleanDesc, 170);

    descLines.forEach((line: string) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 5;
    });

    doc.save(`Fiche_AO_${data.tender.idWeb}.pdf`);
    setIsShareOpen(false);
  };

  if (isLoading)
    return (
      <div className="p-8 text-center text-slate-400 flex flex-col items-center">
        <span className="animate-pulse">Chargement de l'AO...</span>
      </div>
    );
  if (!data)
    return (
      <div className="p-8 text-center text-slate-400">
        Appel d'offre introuvable.
      </div>
    );

  const { tender, interaction } = data;
  const daysRemaining = Math.ceil(
    (new Date(tender.deadline).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const scoreColor =
    tender.compatibilityScore >= 80
      ? "text-emerald-500 from-emerald-100 to-emerald-200 dark:from-emerald-500/20 dark:to-emerald-900/20 border-emerald-500/50"
      : tender.compatibilityScore >= 50
        ? "text-amber-500 from-amber-100 to-amber-200 dark:from-amber-500/20 dark:to-amber-900/20 border-amber-500/50"
        : "text-red-500 from-red-100 to-red-200 dark:from-red-500/20 dark:to-red-900/20 border-red-500/50";

  const hasLots = tender.lots && tender.lots.length > 0;

  return (
    <div className="flex flex-col gap-6 relative animate-fade-in pb-20">
      {/* HEADER */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => (onBack ? onBack() : window.history.back())}
          className="mt-1 p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-textMain transition-colors border border-transparent hover:border-border"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-mono text-slate-500 bg-slate-200 dark:bg-slate-800/50 px-2 py-0.5 rounded border border-border">
              {tender.idWeb}
            </span>
            {interaction?.status === TenderStatus.TODO && (
              <span className="text-xs font-bold text-blue-500 dark:text-blue-400 flex items-center gap-1">
                <CheckCircle size={12} /> Ã€ Qualifier
              </span>
            )}
            {interaction?.status === TenderStatus.IN_PROGRESS && (
              <span className="text-xs font-bold text-amber-500 dark:text-amber-400 flex items-center gap-1">
                <BrainCircuit size={12} /> En Rédaction
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-textMain leading-tight">
            {tender.title}
          </h1>
        </div>

        {/* SHARE & ACTIONS MENU */}
        <div className="hidden md:flex relative" ref={shareMenuRef}>
          <button
            onClick={() => setIsShareOpen(!isShareOpen)}
            className={`p-3 bg-white dark:bg-slate-800 border border-border rounded-xl text-slate-400 hover:text-textMain hover:border-slate-400 dark:hover:border-slate-500 transition-all shadow-sm flex items-center gap-2 ${isShareOpen ? "ring-2 ring-primary/20" : ""}`}
          >
            <Share2 size={20} />
          </button>

          {isShareOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-2 space-y-1">
                <button
                  onClick={handleSendEmail}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-200 transition-colors text-left group"
                >
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50">
                    <Mail size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">Envoyer par email</span>
                    {userProfile?.contactEmail && (
                      <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                        {userProfile.contactEmail}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={handleAddToCalendar}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-200 transition-colors text-left group"
                >
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50">
                    <CalendarPlus size={16} />
                  </div>
                  <span className="font-medium">Ajouter au calendrier</span>
                </button>
                <div className="h-px bg-border my-1"></div>
                <button
                  onClick={handleDownloadTenderPDF}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm text-slate-700 dark:text-slate-200 transition-colors text-left group"
                >
                  <div className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md group-hover:bg-slate-200 dark:group-hover:bg-slate-600">
                    <Download size={16} />
                  </div>
                  <span className="font-medium">
                    Télécharger la fiche (PDF)
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-140px)]">
        {/* LEFT COLUMN: Identity Card (Fixed Info) */}
        <div className="lg:col-span-6 space-y-6 h-full overflow-y-auto custom-scrollbar pr-2">
          <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-8 relative overflow-hidden border border-white/20 dark:border-white/5">
            <div className="relative z-10 text-center">
              <div
                className={`inline-flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 bg-gradient-to-br shadow-[0_0_30px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(0,0,0,0.3)] ${scoreColor} mb-4 relative`}
              >
                <span className="text-4xl font-black tracking-tighter text-slate-800 dark:text-slate-100">
                  {tender.compatibilityScore}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 text-slate-600 dark:text-slate-400">
                  Match
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 italic px-4">
                Basé sur votre expertise en{" "}
                <span className="text-slate-900 dark:text-white font-medium">
                  {userProfile?.specialization}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 transition-colors hover:border-slate-300 dark:hover:border-white/10">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg shadow-sm">
                  <Building size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                    Acheteur
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {tender.buyer}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 transition-colors hover:border-slate-300 dark:hover:border-white/10">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shadow-sm">
                    <MapPin size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                      Lieu
                    </p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      Départements: {tender.departments.join(", ")}
                    </p>
                  </div>
                </div>
                {/* MAP COMPONENT INTEGRATION */}
                <div className="mt-1 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
                  <DepartmentMap departments={tender.departments} />
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 transition-colors hover:border-slate-300 dark:hover:border-white/10">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg shadow-sm">
                  <Euro size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                    Budget Estimé
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {tender.estimatedBudget
                      ? `${(tender.estimatedBudget / 1000).toLocaleString()} k€`
                      : "Non détecté"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 transition-colors hover:border-slate-300 dark:hover:border-white/10">
                <div
                  className={`p-2.5 rounded-lg shadow-sm ${daysRemaining < 5 ? "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400" : "bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400"}`}
                >
                  <Calendar size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                    Date Limite
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {tender.deadline}
                  </p>
                  <p
                    className={`text-xs font-bold mt-0.5 ${daysRemaining < 5 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                  >
                    J-{daysRemaining} restants
                  </p>
                </div>
              </div>
            </div>

            {tender.contact &&
              (tender.contact.email ||
                tender.contact.phone ||
                tender.contact.name) && (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Contact
                  </p>
                  <div className="space-y-3">
                    {tender.contact.name && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <User size={14} className="text-slate-500" />{" "}
                        <span className="truncate">{tender.contact.name}</span>
                      </div>
                    )}
                    {tender.contact.email && (
                      <a
                        href={`mailto:${tender.contact.email}`}
                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                      >
                        <Mail size={14} />{" "}
                        <span className="truncate">{tender.contact.email}</span>
                      </a>
                    )}
                    {tender.contact.phone && (
                      <a
                        href={`tel:${tender.contact.phone}`}
                        className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-textMain transition-colors"
                      >
                        <Phone size={14} /> <span>{tender.contact.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={tender.linkDCE}
                target="_blank"
                rel="noreferrer"
                className="col-span-2 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 transition-all shadow-lg hover:border-primary/50"
              >
                <ExternalLink size={16} /> Voir sur BOAMP
              </a>

              {/* NEW: NOTES & REMINDERS DISPLAY */}
              {interaction &&
                (interaction.internalNotes ||
                  interaction.customReminderDate) && (
                  <div className="col-span-2 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl space-y-2 mt-2">
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-2">
                      <StickyNote size={14} /> Mon Suivi
                    </h4>
                    {interaction.customReminderDate && (
                      <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-200/70">
                        <Clock size={12} />
                        Rappel :{" "}
                        {new Date(
                          interaction.customReminderDate,
                        ).toLocaleDateString()}
                      </div>
                    )}
                    {interaction.internalNotes && (
                      <p className="text-sm text-amber-800 dark:text-amber-100 italic border-l-2 border-amber-400 dark:border-amber-700/50 pl-2">
                        "{interaction.internalNotes}"
                      </p>
                    )}
                  </div>
                )}

              {interaction?.status === TenderStatus.TODO ? (
                <button
                  disabled
                  className="col-span-2 py-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} /> Dans le Pipeline
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange(TenderStatus.TODO)}
                  className="col-span-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20 transition-all"
                >
                  <Save size={18} /> Sauvegarder
                </button>
              )}

              {interaction?.status !== TenderStatus.BLACKLISTED && (
                <button
                  onClick={() => handleStatusChange(TenderStatus.BLACKLISTED)}
                  className="col-span-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900/30 rounded-xl text-sm font-bold transition-all"
                >
                  <XCircle size={18} /> Rejeter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Unified Intelligence Workspace */}
        <div className="lg:col-span-6 flex flex-col h-full glass-panel rounded-2xl border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Tabs */}
          <div className="flex p-2 bg-slate-50 dark:bg-slate-900/80 border-b border-border gap-1 shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab("description")}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "description"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/50"
              }`}
            >
              Description
            </button>

            {hasLots && (
              <button
                onClick={() => setActiveTab("lots")}
                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === "lots"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/50"
                }`}
              >
                <Layers size={16} /> Lots ({tender.lots.length})
              </button>
            )}

            <button
              onClick={() => setActiveTab("intelligence")}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap relative overflow-hidden ${
                activeTab === "intelligence"
                  ? "text-indigo-900 dark:text-white shadow-md ring-1 ring-inset ring-indigo-500/20"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/50"
              }`}
            >
              {activeTab === "intelligence" && (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20"></div>
              )}
              <span className="relative flex items-center justify-center gap-2">
                <Sparkles
                  size={16}
                  className={
                    activeTab === "intelligence"
                      ? "text-purple-600 dark:text-purple-400"
                      : ""
                  }
                />
                Assistant IA
              </span>
            </button>
          </div>

          {activeTab === "description" && (
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white/50 dark:bg-transparent">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <div className="flex flex-wrap gap-2 mb-6">
                  {tender.descriptors.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed text-sm md:text-base">
                  {tender.fullDescription}
                </p>
              </div>
            </div>
          )}

          {activeTab === "lots" && hasLots && (
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white/50 dark:bg-transparent">
              <div className="grid grid-cols-1 gap-4">
                {tender.lots.map((lot, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded border border-blue-200 dark:border-blue-800">
                        Lot {lot.lotNumber}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                        {lot.title}
                      </h3>
                    </div>
                    {lot.description && (
                      <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mt-2 line-clamp-3 hover:line-clamp-none transition-all">
                        {lot.description}
                      </p>
                    )}
                    {lot.cpv && lot.cpv.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {lot.cpv.map((c, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "intelligence" && (
            <div className="flex flex-col h-full relative bg-slate-50/50 dark:bg-slate-900/20">
              {/* SCROLLABLE AREA: Analysis + Chat History */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar scroll-smooth">
                {/* 1. ANALYSIS SECTION (If Generated) */}
                {!analysis ? (
                  <div className="bg-white dark:bg-slate-800/40 p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-4 mb-8 mx-4 mt-8">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BrainCircuit
                        size={32}
                        className="text-blue-500 dark:text-blue-400"
                      />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      Analyse Stratégique
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      Laissez l'IA scanner les pièces du marché pour identifier
                      les risques et opportunités cachés.
                    </p>
                    <button
                      onClick={handleGenerateStrategy}
                      disabled={isAnalyzing}
                      className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50 inline-flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="animate-spin" size={18} /> Analyse
                          en cours...
                        </>
                      ) : (
                        "Lancer l'analyse"
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 mb-8 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between px-2">
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                        <Sparkles size={14} /> Synthèse Stratégique
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                          analysis.workload === "Faible"
                            ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                            : analysis.workload === "Moyenne"
                              ? "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                              : "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20"
                        }`}
                      >
                        Charge: {analysis.workload}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-emerald-50/80 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-500/20">
                        <h4 className="font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2 text-sm">
                          <CheckCircle size={16} /> Points Forts
                        </h4>
                        <ul className="space-y-2.5">
                          {analysis.strengths.map((p, i) => (
                            <li
                              key={i}
                              className="text-xs text-slate-700 dark:text-slate-300 flex gap-2 leading-relaxed"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>{" "}
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-red-50/80 dark:bg-red-900/10 p-4 rounded-xl border border-red-200/60 dark:border-red-500/20">
                        <h4 className="font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2 text-sm">
                          <AlertTriangle size={16} /> Points de Vigilance
                        </h4>
                        <ul className="space-y-2.5">
                          {analysis.risks.map((p, i) => (
                            <li
                              key={i}
                              className="text-xs text-slate-700 dark:text-slate-300 flex gap-2 leading-relaxed"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>{" "}
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. QUICK ACTIONS (Contextual Prompts) */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <button
                    onClick={() =>
                      handleChatSend(
                        "Rédige une lettre de candidature formelle pour cet AO. Inclus l'objet, les références, et mets en avant nos certifications.",
                      )
                    }
                    disabled={isChatting}
                    className="p-3 bg-white dark:bg-slate-800/40 hover:bg-blue-50 dark:hover:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-slate-600 text-center group disabled:opacity-50 transition-all shadow-sm"
                  >
                    <FileText
                      size={20}
                      className="text-blue-500 dark:text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">
                      Lettre Type
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      handleChatSend(
                        "Propose un plan détaillé pour le Mémoire Technique de cet AO, structuré en grands chapitres.",
                      )
                    }
                    disabled={isChatting}
                    className="p-3 bg-white dark:bg-slate-800/40 hover:bg-purple-50 dark:hover:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-slate-600 text-center group disabled:opacity-50 transition-all shadow-sm"
                  >
                    <BrainCircuit
                      size={20}
                      className="text-purple-500 dark:text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">
                      Plan Mémoire
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      handleChatSend(
                        "Rédige une synthèse exécutive de notre réponse pour le décideur (Maire/Directeur).",
                      )
                    }
                    disabled={isChatting}
                    className="p-3 bg-white dark:bg-slate-800/40 hover:bg-amber-50 dark:hover:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-200 dark:hover:border-slate-600 text-center group disabled:opacity-50 transition-all shadow-sm"
                  >
                    <Sparkles
                      size={20}
                      className="text-amber-500 dark:text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">
                      Synthèse
                    </span>
                  </button>
                </div>

                {/* 3. CHAT HISTORY */}
                <div className="space-y-6 pb-2">
                  {chatHistory.length === 0 && (
                    <div className="text-center py-12 opacity-30">
                      <MessageSquareText
                        size={48}
                        className="mx-auto mb-3 text-slate-400"
                      />
                      <p className="text-sm text-slate-500 font-medium">
                        L'assistant est prÃªt Ã  rédiger.
                      </p>
                    </div>
                  )}
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-2`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl px-5 py-4 text-sm shadow-md leading-relaxed relative group ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none"
                        }`}
                      >
                        <FormattedMessage text={msg.text} role={msg.role} />

                        {msg.role === "model" && (
                          <button
                            onClick={() => copyToClipboard(msg.text)}
                            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-all"
                            title="Copier le texte"
                          >
                            <Copy size={14} />
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {msg.role === "user" ? "Vous" : "Assistant"}
                      </span>
                    </div>
                  ))}
                  {isChatting && (
                    <div className="flex justify-start animate-in fade-in">
                      <div className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-4 rounded-tl-none flex gap-2 items-center border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* 4. CHAT INPUT (Fixed at Bottom) */}
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <div className="relative">
                  <textarea
                    className="w-full pl-4 pr-14 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-50 resize-none custom-scrollbar shadow-inner transition-all"
                    placeholder="Posez une question ou demandez une modification..."
                    rows={2}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !isChatting) {
                        e.preventDefault();
                        handleChatSend();
                      }
                    }}
                    disabled={isChatting}
                  />
                  <button
                    onClick={() => handleChatSend()}
                    disabled={!chatInput.trim() || isChatting}
                    className="absolute right-2 bottom-2 p-2.5 bg-primary text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-all shadow-md hover:shadow-lg disabled:shadow-none"
                  >
                    <Send size={18} />
                  </button>
                </div>
                {chatHistory.length > 0 && (
                  <div className="flex justify-end gap-3 mt-3 px-1">
                    <button
                      onClick={handleExportChatPDF}
                      className="text-[10px] font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                    >
                      <Download size={12} /> Exporter PDF
                    </button>
                    <button
                      onClick={handleClearChat}
                      className="text-[10px] font-bold text-slate-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 size={12} /> Effacer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TenderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  return <TenderDetailScreen tenderId={id} onBack={() => navigate(-1)} />;
};

export default TenderDetail;
