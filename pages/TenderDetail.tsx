import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tenderService } from '../services/tenderService';
import { chatWithTender, generateStrategicAnalysis } from '../services/geminiService';
import { userService } from '../services/userService';
import { Tender, UserInteraction, TenderStatus, AIStrategyAnalysis, ChatMessage, UserProfile } from '../types';
import jsPDF from 'jspdf';
import DepartmentMap from '../components/DepartmentMap';
import { 
  ArrowLeft, Calendar, MapPin, Building, ExternalLink, Euro, 
  BrainCircuit, Send, Sparkles, AlertTriangle, 
  CheckCircle, HelpCircle, Save, XCircle, Clock, Mail, Phone, User, Share2, Printer, Loader2, Copy, FileText, Trash2, MessageSquareText
} from 'lucide-react';

const FormattedMessage = ({ text }: { text: string }) => {
    const paragraphs = text.split('\n\n');
    
    return (
        <div className="text-sm leading-relaxed space-y-3">
            {paragraphs.map((para, idx) => {
                if (para.trim().startsWith('- ') || para.trim().startsWith('* ')) {
                     const items = para.split('\n');
                     return (
                         <ul key={idx} className="list-disc pl-5 space-y-1">
                             {items.map((item, i) => (
                                 <li key={i} className="text-slate-300">
                                     {parseBold(item.replace(/^[-\*] /, ''))}
                                 </li>
                             ))}
                         </ul>
                     );
                }
                if (para.startsWith('#')) {
                    return <h3 key={idx} className="font-bold text-white mt-4 mb-2">{parseBold(para.replace(/^#+ /, ''))}</h3>;
                }
                return (
                    <p key={idx} className="text-slate-300">
                        {para.split('\n').map((line, i) => (
                            <React.Fragment key={i}>
                                {parseBold(line)}
                                {i < para.split('\n').length - 1 && <br />}
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
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const TenderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{tender: Tender, interaction?: UserInteraction} | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'intelligence'>('description');
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [analysis, setAnalysis] = useState<AIStrategyAnalysis | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Assistant State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      tenderService.markTenderAsVisited(id);

      const [tenderResult, profileResult] = await Promise.all([
          tenderService.getTenderById(id),
          userService.getCurrentProfile()
      ]);

      if (tenderResult) {
        setData(tenderResult);
        if (tenderResult.interaction?.aiAnalysisResult) {
            setAnalysis(tenderResult.interaction.aiAnalysisResult);
            // Default to intelligence tab if analysis exists
            setActiveTab('intelligence');
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
      if (activeTab === 'intelligence') {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [chatHistory, isChatting, activeTab]);

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
      setChatInput('');
      
      setChatHistory(prev => [...prev, {role: 'user', text: userMsg}]);
      setIsChatting(true);

      const apiHistory = chatHistory.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
      }));

      const response = await chatWithTender(data.tender, apiHistory, userMsg, userProfile || undefined);
      
      const finalHistory: ChatMessage[] = [...chatHistory, {role: 'user', text: userMsg}, {role: 'model', text: response}];
      setChatHistory(finalHistory);
      setIsChatting(false);

      await tenderService.saveChatHistory(data.tender.id, finalHistory);
  };
  
  const handleClearChat = async () => {
      if (!data?.tender) return;
      if (window.confirm("Voulez-vous vraiment effacer l'historique de conversation pour cet AO ?")) {
          setChatHistory([]);
          await tenderService.saveChatHistory(data.tender.id, []);
      }
  };

  const handleStatusChange = async (status: TenderStatus) => {
      if(!data?.tender) return;
      await tenderService.updateInteraction(data.tender.id, status, undefined, data.tender);
      setData(prev => prev ? {...prev, interaction: {...(prev.interaction || {}), status} as UserInteraction} : null);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
  };

  const downloadPDF = (content: string, title: string) => {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Document généré par Le Compagnon des Marchés", 10, 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`AO: ${title}`, 10, 22);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 27);
      doc.line(10, 32, 200, 32);
      doc.setFontSize(11);
      const cleanText = content.replace(/\*\*/g, '').replace(/##/g, '').replace(/- /g, '• ');
      const splitText = doc.splitTextToSize(cleanText, 180);
      let y = 40;
      splitText.forEach((line: string) => {
          if (y > 280) {
              doc.addPage();
              y = 20;
          }
          doc.text(line, 10, y);
          y += 6;
      });
      doc.save(`TenderAI_Doc_${new Date().getTime()}.pdf`);
  };

  const handleShare = () => {
      if(!data?.tender) return;
      let shareUrl = "";
      try {
          shareUrl = window.location.href;
      } catch(err) {
          shareUrl = window.location.pathname; // Fallback
      }

      const shareData = {
          title: data.tender.title,
          text: `Regarde cet appel d'offre : ${data.tender.title}`,
          url: shareUrl
      };
      if (navigator.share) {
          navigator.share(shareData).catch(console.error);
      } else {
          navigator.clipboard.writeText(shareData.url);
          alert("Lien copié !");
      }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-400 flex flex-col items-center"><span className="animate-pulse">Chargement de l'AO...</span></div>;
  if (!data) return <div className="p-8 text-center text-slate-400">Appel d'offre introuvable.</div>;

  const { tender, interaction } = data;
  const daysRemaining = Math.ceil((new Date(tender.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  const scoreColor = tender.compatibilityScore >= 80 ? 'text-emerald-400 from-emerald-500/20 to-emerald-900/20 border-emerald-500/50' 
                   : tender.compatibilityScore >= 50 ? 'text-amber-400 from-amber-500/20 to-amber-900/20 border-amber-500/50'
                   : 'text-red-400 from-red-500/20 to-red-900/20 border-red-500/50';

  return (
    <div className="flex flex-col gap-6 relative animate-fade-in pb-20">
      
      {/* HEADER */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="mt-1 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700">
            <ArrowLeft size={24} />
        </button>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-mono text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50">{tender.idWeb}</span>
                {interaction?.status === TenderStatus.TODO && <span className="text-xs font-bold text-blue-400 flex items-center gap-1"><CheckCircle size={12}/> À Qualifier</span>}
                {interaction?.status === TenderStatus.IN_PROGRESS && <span className="text-xs font-bold text-amber-400 flex items-center gap-1"><BrainCircuit size={12}/> En Rédaction</span>}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{tender.title}</h1>
        </div>
        <div className="hidden md:flex gap-2">
             <button onClick={handleShare} className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 transition-all shadow-sm">
                <Share2 size={20}/>
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-140px)]">
        
        {/* LEFT COLUMN: Identity Card (Fixed Info) */}
        <div className="lg:col-span-4 space-y-6 h-full overflow-y-auto custom-scrollbar pr-2">
            <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-8 relative overflow-hidden">
                <div className="relative z-10 text-center">
                    <div className={`inline-flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 bg-gradient-to-br shadow-[0_0_30px_rgba(0,0,0,0.3)] ${scoreColor} mb-4`}>
                        <span className="text-4xl font-black tracking-tighter">{tender.compatibilityScore}%</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Match</span>
                    </div>
                    <p className="text-sm text-slate-400 italic px-4">
                        Basé sur votre expertise en <span className="text-white font-medium">{userProfile?.specialization}</span>
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 border border-white/5">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Building size={20} /></div>
                        <div className="min-w-0">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Acheteur</p>
                            <p className="text-sm font-semibold text-slate-100 truncate">{tender.buyer}</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-800/40 border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><MapPin size={20} /></div>
                            <div className="min-w-0">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Lieu</p>
                                <p className="text-sm font-semibold text-slate-100 truncate">Dépts: {tender.departments.join(', ')}</p>
                            </div>
                        </div>
                        {/* MAP COMPONENT INTEGRATION */}
                        <div className="mt-1">
                             <DepartmentMap departments={tender.departments} />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 border border-white/5">
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><Euro size={20} /></div>
                        <div className="min-w-0">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Budget Estimé</p>
                            <p className="text-sm font-semibold text-slate-100">
                                {tender.estimatedBudget ? `${(tender.estimatedBudget/1000).toLocaleString()} k€` : 'Non détecté'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 border border-white/5">
                        <div className={`p-2 rounded-lg ${daysRemaining < 5 ? 'bg-red-500/10 text-red-400' : 'bg-slate-700/50 text-slate-400'}`}>
                            <Calendar size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Date Limite</p>
                            <p className="text-sm font-semibold text-slate-100">{tender.deadline}</p>
                            <p className={`text-xs font-bold mt-0.5 ${daysRemaining < 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                                J-{daysRemaining} restants
                            </p>
                        </div>
                    </div>
                </div>

                {tender.contact && (tender.contact.email || tender.contact.phone || tender.contact.name) && (
                    <div className="pt-4 border-t border-white/5">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Contact</p>
                        <div className="space-y-3">
                             {tender.contact.name && (
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <User size={14} className="text-slate-500"/> <span className="truncate">{tender.contact.name}</span>
                                </div>
                             )}
                             {tender.contact.email && (
                                <a href={`mailto:${tender.contact.email}`} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                                    <Mail size={14} /> <span className="truncate">{tender.contact.email}</span>
                                </a>
                             )}
                             {tender.contact.phone && (
                                <a href={`tel:${tender.contact.phone}`} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                                    <Phone size={14} /> <span>{tender.contact.phone}</span>
                                </a>
                             )}
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                     <a href={tender.linkDCE} target="_blank" rel="noreferrer" className="col-span-2 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-bold text-slate-200 transition-all shadow-lg">
                        <ExternalLink size={16} /> Voir sur BOAMP
                    </a>

                    {interaction?.status === TenderStatus.TODO ? (
                        <button disabled className="col-span-2 py-3 bg-blue-900/30 border border-blue-900/50 text-blue-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                            <CheckCircle size={18}/> Dans le Pipeline
                        </button>
                    ) : (
                        <button onClick={() => handleStatusChange(TenderStatus.TODO)} className="col-span-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all">
                            <Save size={18} /> Sauvegarder
                        </button>
                    )}
                    
                    {interaction?.status !== TenderStatus.BLACKLISTED && (
                        <button onClick={() => handleStatusChange(TenderStatus.BLACKLISTED)} className="col-span-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-red-900/20 hover:text-red-400 text-slate-400 border border-slate-700 hover:border-red-900/30 rounded-xl text-sm font-bold transition-all">
                            <XCircle size={18} /> Rejeter
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Unified Intelligence Workspace */}
        <div className="lg:col-span-8 flex flex-col h-full glass-panel rounded-2xl border border-white/5 shadow-xl overflow-hidden">
             
             {/* Tabs */}
             <div className="flex p-2 bg-slate-900/50 border-b border-white/5 gap-1 shrink-0">
                <button 
                    onClick={() => setActiveTab('description')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'description' 
                        ? 'bg-slate-800 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                    }`}
                >
                    Description Officielle
                </button>
                <button 
                    onClick={() => setActiveTab('intelligence')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'intelligence' 
                        ? 'bg-gradient-to-r from-indigo-900/50 to-purple-900/50 text-white shadow-md border border-white/5' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                    }`}
                >
                    <Sparkles size={16} className={activeTab === 'intelligence' ? 'text-purple-400' : ''} /> 
                    Espace Intelligent
                </button>
             </div>

             {activeTab === 'description' && (
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="prose prose-invert prose-slate max-w-none">
                        <div className="flex flex-wrap gap-2 mb-6">
                            {tender.descriptors.map((tag, i) => (
                                <span key={i} className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs font-medium text-slate-300">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <p className="whitespace-pre-wrap text-slate-300 leading-relaxed text-sm md:text-base">
                            {tender.fullDescription}
                        </p>
                    </div>
                </div>
             )}

             {activeTab === 'intelligence' && (
                <div className="flex flex-col h-full relative">
                    {/* SCROLLABLE AREA: Analysis + Chat History */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar scroll-smooth">
                        
                        {/* 1. ANALYSIS SECTION (If Generated) */}
                        {!analysis ? (
                            <div className="bg-slate-800/30 p-6 rounded-xl border border-white/5 text-center space-y-4 mb-8">
                                <BrainCircuit size={32} className="text-blue-400 mx-auto" />
                                <h3 className="text-lg font-bold text-white">Analyse Stratégique</h3>
                                <p className="text-sm text-slate-400 max-w-md mx-auto">
                                    Détectez les opportunités cachées et préparez votre réponse.
                                </p>
                                <button 
                                    onClick={handleGenerateStrategy}
                                    disabled={isAnalyzing}
                                    className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50 inline-flex items-center gap-2"
                                >
                                    {isAnalyzing ? <><Loader2 className="animate-spin" size={16}/> Analyse...</> : "Lancer l'analyse"}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 mb-8 animate-in fade-in slide-in-from-top-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide">Synthèse Stratégique</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                        analysis.workload === 'Faible' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        analysis.workload === 'Moyenne' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                        'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}>
                                        Charge: {analysis.workload}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-emerald-900/10 p-4 rounded-xl border border-emerald-500/20">
                                        <h4 className="font-bold text-emerald-400 mb-2 flex items-center gap-2 text-sm"><CheckCircle size={16}/> Points Forts</h4>
                                        <ul className="space-y-2">
                                            {analysis.strengths.map((p, i) => (
                                                <li key={i} className="text-xs text-slate-300 flex gap-2"><span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span> {p}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-red-900/10 p-4 rounded-xl border border-red-500/20">
                                        <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2 text-sm"><AlertTriangle size={16}/> Vigilance</h4>
                                        <ul className="space-y-2">
                                            {analysis.risks.map((p, i) => (
                                                <li key={i} className="text-xs text-slate-300 flex gap-2"><span className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0"></span> {p}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. QUICK ACTIONS (Contextual Prompts) */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <button 
                                onClick={() => handleChatSend("Rédige une lettre de candidature formelle pour cet AO. Inclus l'objet, les références, et mets en avant nos certifications.")}
                                disabled={isChatting}
                                className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-white/5 text-center group disabled:opacity-50"
                            >
                                <FileText size={18} className="text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform"/>
                                <span className="text-[10px] font-bold text-slate-300 block">Lettre Type</span>
                            </button>
                            <button 
                                onClick={() => handleChatSend("Propose un plan détaillé pour le Mémoire Technique de cet AO, structuré en grands chapitres.")}
                                disabled={isChatting}
                                className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-white/5 text-center group disabled:opacity-50"
                            >
                                <BrainCircuit size={18} className="text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform"/>
                                <span className="text-[10px] font-bold text-slate-300 block">Plan Mémoire</span>
                            </button>
                            <button 
                                onClick={() => handleChatSend("Rédige une synthèse exécutive de notre réponse pour le décideur (Maire/Directeur).")}
                                disabled={isChatting}
                                className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-white/5 text-center group disabled:opacity-50"
                            >
                                <Sparkles size={18} className="text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform"/>
                                <span className="text-[10px] font-bold text-slate-300 block">Synthèse</span>
                            </button>
                        </div>

                        {/* 3. CHAT HISTORY */}
                        <div className="space-y-6">
                            {chatHistory.length === 0 && (
                                <div className="text-center py-8 opacity-40">
                                    <MessageSquareText size={32} className="mx-auto mb-2"/>
                                    <p className="text-sm">Discutez avec l'IA pour rédiger vos documents.</p>
                                </div>
                            )}
                            {chatHistory.map((msg, idx) => (
                                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[95%] rounded-2xl px-5 py-4 text-sm shadow-md leading-relaxed ${
                                        msg.role === 'user' 
                                        ? 'bg-primary text-white rounded-tr-none' 
                                        : 'bg-slate-800 border border-white/5 text-slate-200 rounded-tl-none'
                                    }`}>
                                        <FormattedMessage text={msg.text} />
                                    </div>
                                    
                                    {msg.role === 'model' && (
                                        <div className="flex gap-2 mt-2 ml-2">
                                            <button 
                                                onClick={() => copyToClipboard(msg.text)} 
                                                className="p-1.5 text-slate-500 hover:text-primary rounded-md hover:bg-slate-800 transition-colors" 
                                                title="Copier le texte"
                                            >
                                                <Copy size={14} />
                                            </button>
                                            <button 
                                                onClick={() => downloadPDF(msg.text, tender.title)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 rounded-md hover:bg-slate-800 transition-colors" 
                                                title="Télécharger en PDF"
                                            >
                                                <Printer size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isChatting && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-800 rounded-2xl px-4 py-3 rounded-tl-none flex gap-2 items-center border border-white/5">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    </div>

                    {/* 4. CHAT INPUT (Fixed at Bottom) */}
                    <div className="p-4 bg-slate-900 border-t border-white/10 shrink-0">
                         <div className="relative">
                            <textarea 
                                className="w-full pl-4 pr-14 py-4 bg-slate-950 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-white placeholder-slate-500 disabled:opacity-50 resize-none custom-scrollbar shadow-inner"
                                placeholder="Posez une question ou demandez une modification..."
                                rows={2}
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey && !isChatting) {
                                        e.preventDefault();
                                        handleChatSend();
                                    }
                                }}
                                disabled={isChatting}
                            />
                            <button 
                                onClick={() => handleChatSend()}
                                disabled={!chatInput.trim() || isChatting}
                                className="absolute right-3 bottom-3 p-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-lg"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        {chatHistory.length > 0 && (
                            <div className="text-right mt-2">
                                <button onClick={handleClearChat} className="text-[10px] text-slate-600 hover:text-red-400 flex items-center gap-1 justify-end ml-auto">
                                    <Trash2 size={10} /> Effacer historique
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

export default TenderDetail;