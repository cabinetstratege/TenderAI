import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tenderService } from '../services/tenderService';
import { chatWithTender, generateStrategicAnalysis } from '../services/geminiService';
import { userService } from '../services/userService';
import { Tender, UserInteraction, TenderStatus, AIStrategyAnalysis } from '../types';
import { 
  ArrowLeft, Calendar, MapPin, Building, ExternalLink, Euro, 
  BrainCircuit, MessageSquare, Send, Sparkles, AlertTriangle, 
  CheckCircle, HelpCircle, Save, XCircle, Clock
} from 'lucide-react';

const TenderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{tender: Tender, interaction?: UserInteraction} | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'strategy'>('description');
  const [isLoading, setIsLoading] = useState(true);
  
  // Strategy State
  const [analysis, setAnalysis] = useState<AIStrategyAnalysis | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      const result = await tenderService.getTenderById(id);
      if (result) {
        setData(result);
        if (result.interaction?.aiAnalysisResult) {
            setAnalysis(result.interaction.aiAnalysisResult);
            setActiveTab('strategy');
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, [id]);

  const handleGenerateStrategy = async () => {
      if (!data?.tender) return;
      setIsAnalyzing(true);
      
      const profile = await userService.getCurrentProfile();
      if (!profile) {
          setIsAnalyzing(false);
          return;
      }

      const result = await generateStrategicAnalysis(data.tender, profile);
      
      if (result) {
          setAnalysis(result);
          await tenderService.saveAnalysis(data.tender.id, result);
      }
      setIsAnalyzing(false);
  };

  const handleChatSend = async () => {
      if (!chatInput.trim() || !data?.tender) return;
      
      const userMsg = chatInput;
      setChatInput('');
      setChatHistory(prev => [...prev, {role: 'user', text: userMsg}]);
      setIsChatting(true);

      // Convert format for Gemini API
      const apiHistory = chatHistory.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
      }));

      const response = await chatWithTender(data.tender, apiHistory, userMsg);
      
      setChatHistory(prev => [...prev, {role: 'model', text: response}]);
      setIsChatting(false);
  };

  const handleStatusChange = async (status: TenderStatus) => {
      if(!data?.tender) return;
      await tenderService.updateInteraction(data.tender.id, status, undefined, data.tender);
      setData(prev => prev ? {...prev, interaction: {...(prev.interaction || {}), status} as UserInteraction} : null);
  };

  if (isLoading) return <div className="p-8 text-center">Chargement de l'AO...</div>;
  if (!data) return <div className="p-8 text-center">Appel d'offre introuvable.</div>;

  const { tender, interaction } = data;
  const daysRemaining = Math.ceil((new Date(tender.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      {/* Header / Nav */}
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-900 truncate">{tender.title}</h1>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        
        {/* ZONE A: Identity & Key Info (Sticky Sidebar style) - 3 cols */}
        <div className="lg:col-span-3 space-y-4 overflow-y-auto pr-2">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
                
                {/* Score */}
                <div className="text-center">
                    <div className="inline-block p-4 rounded-full bg-slate-50 border-4 border-primary/10 mb-2">
                        <span className="text-3xl font-bold text-primary">{tender.compatibilityScore}%</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Compatibilité</p>
                </div>

                <hr className="border-slate-100"/>

                {/* Info Block */}
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <Building size={18} className="text-slate-400 mt-0.5" />
                        <div>
                            <p className="text-xs text-slate-400 font-medium">ACHETEUR</p>
                            <p className="text-sm font-semibold text-slate-800">{tender.buyer}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin size={18} className="text-slate-400 mt-0.5" />
                        <div>
                            <p className="text-xs text-slate-400 font-medium">LIEU</p>
                            <p className="text-sm text-slate-800">Dépts: {tender.departments.join(', ')}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Calendar size={18} className="text-slate-400 mt-0.5" />
                        <div>
                            <p className="text-xs text-slate-400 font-medium">DATE LIMITE</p>
                            <p className="text-sm font-semibold text-slate-800">{tender.deadline}</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${daysRemaining < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                J-{daysRemaining}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Euro size={18} className="text-slate-400 mt-0.5" />
                        <div>
                            <p className="text-xs text-slate-400 font-medium">BUDGET ESTIMÉ</p>
                            <p className="text-sm font-bold text-slate-800">
                                {tender.estimatedBudget ? `${(tender.estimatedBudget/1000).toLocaleString()} k€` : 'Non détecté'}
                            </p>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-100"/>

                {/* Actions */}
                <div className="space-y-2">
                     <a 
                        href={tender.linkDCE} target="_blank" rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        <ExternalLink size={16} /> Voir sur BOAMP
                    </a>
                    
                    {interaction?.status === TenderStatus.SAVED ? (
                        <div className="w-full py-2 bg-green-50 text-green-700 text-center rounded-lg text-sm font-medium border border-green-200">
                            Sauvegardé
                        </div>
                    ) : (
                        <button 
                            onClick={() => handleStatusChange(TenderStatus.SAVED)}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
                        >
                            <Save size={16} /> Sauvegarder
                        </button>
                    )}
                    
                    <button 
                        onClick={() => handleStatusChange(TenderStatus.BLACKLISTED)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-slate-500 hover:bg-slate-100 rounded-lg text-sm"
                    >
                        <XCircle size={16} /> Rejeter l'AO
                    </button>
                </div>
            </div>
        </div>

        {/* ZONE B: Content & Strategy - 5 cols */}
        <div className="lg:col-span-5 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             {/* Tabs */}
             <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('description')}
                    className={`flex-1 py-3 text-sm font-medium ${activeTab === 'description' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Description Complète
                </button>
                <button 
                    onClick={() => setActiveTab('strategy')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'strategy' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Sparkles size={16} /> Stratégie IA
                </button>
             </div>

             {/* Content Area */}
             <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {activeTab === 'description' && (
                    <div className="prose prose-sm text-slate-700 max-w-none">
                        <p className="whitespace-pre-wrap">{tender.fullDescription}</p>
                        <div className="mt-8 pt-4 border-t border-slate-200">
                            <h4 className="font-semibold text-slate-900 mb-2">Descripteurs (Mots-clés)</h4>
                            <div className="flex flex-wrap gap-2">
                                {tender.descriptors.map((tag, i) => (
                                    <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'strategy' && (
                    <div className="space-y-6">
                        {!analysis ? (
                            <div className="text-center py-12">
                                <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                                    <BrainCircuit size={32} className="text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Générer l'analyse stratégique</h3>
                                <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                                    Laissez Gemini analyser les risques, opportunités et la charge de travail pour cet AO.
                                </p>
                                <button 
                                    onClick={handleGenerateStrategy}
                                    disabled={isAnalyzing}
                                    className="px-6 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2 mx-auto"
                                >
                                    {isAnalyzing ? 'Analyse en cours...' : 'Lancer l\'analyse (1 crédit)'}
                                    {!isAnalyzing && <Sparkles size={16}/>}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Workload Badge */}
                                <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                    <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <Clock size={18} className="text-slate-400"/> Charge estimée
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                        analysis.workload === 'Faible' ? 'bg-green-100 text-green-700' :
                                        analysis.workload === 'Moyenne' ? 'bg-orange-100 text-orange-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {analysis.workload}
                                    </span>
                                </div>

                                {/* Strengths */}
                                <div className="bg-white p-5 rounded-lg border border-l-4 border-l-green-500 border-slate-200 shadow-sm">
                                    <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                                        <CheckCircle size={18} /> Points Forts & Opportunités
                                    </h4>
                                    <ul className="space-y-2">
                                        {analysis.strengths.map((point, i) => (
                                            <li key={i} className="text-sm text-slate-700 flex gap-2">
                                                <span className="text-green-500">•</span> {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Risks */}
                                <div className="bg-white p-5 rounded-lg border border-l-4 border-l-amber-500 border-slate-200 shadow-sm">
                                    <h4 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
                                        <AlertTriangle size={18} /> Vigilances & Risques
                                    </h4>
                                    <ul className="space-y-2">
                                        {analysis.risks.map((point, i) => (
                                            <li key={i} className="text-sm text-slate-700 flex gap-2">
                                                <span className="text-amber-500">•</span> {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Questions */}
                                <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                        <HelpCircle size={18} /> Questions à poser
                                    </h4>
                                    <ul className="space-y-2">
                                        {analysis.questions.map((q, i) => (
                                            <li key={i} className="text-sm text-blue-700 italic">"{q}"</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}
             </div>
        </div>

        {/* ZONE C: Assistant Chat - 4 cols */}
        <div className="lg:col-span-4 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm h-[600px] lg:h-auto">
             <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center text-white">
                    <Sparkles size={16}/>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">Assistant Rédactionnel</h3>
                    <p className="text-xs text-slate-500">Contexte actif : Cet AO</p>
                </div>
             </div>

             {/* Chat History */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.length === 0 && (
                    <div className="text-center mt-10 space-y-2">
                        <p className="text-sm text-slate-400">Posez une question à propos de cet AO.</p>
                        <div className="flex flex-col gap-2 px-8">
                            <button onClick={() => setChatInput("Rédige une ébauche de lettre de motivation")} className="text-xs bg-slate-100 hover:bg-slate-200 py-2 px-3 rounded text-slate-600 transition-colors">
                                "Rédige une lettre de motivation"
                            </button>
                            <button onClick={() => setChatInput("Quels sont les critères de sélection ?")} className="text-xs bg-slate-100 hover:bg-slate-200 py-2 px-3 rounded text-slate-600 transition-colors">
                                "Quels sont les critères de sélection ?"
                            </button>
                        </div>
                    </div>
                )}
                
                {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                            msg.role === 'user' 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-slate-100 text-slate-800 rounded-tl-none'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                
                {isChatting && (
                    <div className="flex justify-start">
                        <div className="bg-slate-100 rounded-2xl px-4 py-3 rounded-tl-none flex gap-1 items-center">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                    </div>
                )}
             </div>

             {/* Input Area */}
             <div className="p-3 border-t border-slate-100">
                <div className="relative">
                    <input 
                        type="text" 
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="Discutez avec l'IA..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                    />
                    <button 
                        onClick={handleChatSend}
                        disabled={!chatInput.trim() || isChatting}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white text-primary rounded-lg hover:bg-slate-100 disabled:opacity-50"
                    >
                        <Send size={18} />
                    </button>
                </div>
             </div>
        </div>

      </div>
    </div>
  );
};

export default TenderDetail;