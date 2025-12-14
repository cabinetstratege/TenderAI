
import React, { useState, useEffect } from 'react';
import { tenderService } from '../services/tenderService';
import { TenderStatus, Tender, UserInteraction } from '../types';
import { Loader2, ArrowRight, ArrowLeft, FileText, X, AlertCircle, CheckCircle, BrainCircuit } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyTenders: React.FC = () => {
  const [data, setData] = useState<{tender: Tender, interaction: UserInteraction}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [currentNote, setCurrentNote] = useState('');

  const refreshData = async () => {
      setIsLoading(true);
      const savedData = await tenderService.getSavedTenders();
      // On re-mappe les vieux statuts 'SAVED' vers 'TODO' si besoin pour la compatibilité
      const normalizedData = savedData.map(item => {
          if (item.interaction.status === 'Sauvegardé' as any) {
              return {...item, interaction: {...item.interaction, status: TenderStatus.TODO}};
          }
          return item;
      });
      setData(normalizedData);
      setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleUpdateStatus = (id: string, status: TenderStatus) => {
    tenderService.updateInteraction(id, status);
    setData(prev => prev.map(item => {
        if(item.tender.id === id) {
            return {...item, interaction: {...item.interaction, status}};
        }
        return item;
    }));
  };

  const openNoteModal = (tenderId: string, note: string = '') => {
    setEditingNoteId(tenderId);
    setCurrentNote(note);
  };

  const saveNote = () => {
    if (editingNoteId) {
        // Find current status to preserve it
        const currentItem = data.find(i => i.tender.id === editingNoteId);
        const status = currentItem ? currentItem.interaction.status : TenderStatus.TODO;
        
        tenderService.updateInteraction(editingNoteId, status, currentNote);
        setData(prev => prev.map(item => {
             if(item.tender.id === editingNoteId) {
                 return {...item, interaction: {...item.interaction, internalNotes: currentNote}};
             }
             return item;
        }));
        setEditingNoteId(null);
    }
  };

  const getColumnData = (status: TenderStatus) => {
      return data.filter(item => item.interaction.status === status);
  };

  const KanbanCard = ({ item }: { item: {tender: Tender, interaction: UserInteraction} }) => {
      const daysRemaining = Math.ceil((new Date(item.tender.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      return (
          <div className="bg-surface p-4 rounded-xl border border-border shadow-md hover:border-slate-600 transition-all flex flex-col gap-3 group relative">
              <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">{item.tender.idWeb}</span>
                  {daysRemaining < 5 ? (
                      <span className="text-[10px] font-bold text-red-400 flex items-center gap-1 bg-red-950/30 px-2 py-0.5 rounded-full border border-red-900/50">
                          <AlertCircle size={10}/> J-{daysRemaining}
                      </span>
                  ) : (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-900/50">
                          J-{daysRemaining}
                      </span>
                  )}
              </div>
              
              <Link to={`/tender/${item.tender.id}`} className="font-semibold text-sm text-slate-200 line-clamp-2 hover:text-primary transition-colors">
                  {item.tender.title}
              </Link>
              <p className="text-xs text-slate-500 truncate">{item.tender.buyer}</p>

              {/* Notes Indicator */}
              {item.interaction.internalNotes && (
                  <div className="bg-amber-950/20 border border-amber-900/30 p-2 rounded text-[10px] text-amber-200/80 truncate cursor-pointer hover:bg-amber-950/40" onClick={() => openNoteModal(item.tender.id, item.interaction.internalNotes)}>
                      📝 {item.interaction.internalNotes}
                  </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 mt-auto">
                  <button onClick={() => openNoteModal(item.tender.id, item.interaction.internalNotes)} className="text-slate-500 hover:text-white" title="Notes">
                      <FileText size={14} />
                  </button>
                  
                  <div className="flex gap-1">
                      {item.interaction.status !== TenderStatus.TODO && (
                          <button 
                            onClick={() => {
                                const prev = item.interaction.status === TenderStatus.IN_PROGRESS ? TenderStatus.TODO 
                                           : item.interaction.status === TenderStatus.SUBMITTED ? TenderStatus.IN_PROGRESS 
                                           : TenderStatus.SUBMITTED;
                                handleUpdateStatus(item.tender.id, prev);
                            }}
                            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                          >
                              <ArrowLeft size={14} />
                          </button>
                      )}
                      
                      {item.interaction.status === TenderStatus.TODO && (
                          <button onClick={() => handleUpdateStatus(item.tender.id, TenderStatus.IN_PROGRESS)} className="p-1.5 bg-slate-800 hover:bg-primary text-slate-300 hover:text-white rounded transition-colors">
                              <ArrowRight size={14} />
                          </button>
                      )}
                      {item.interaction.status === TenderStatus.IN_PROGRESS && (
                          <button onClick={() => handleUpdateStatus(item.tender.id, TenderStatus.SUBMITTED)} className="p-1.5 bg-slate-800 hover:bg-primary text-slate-300 hover:text-white rounded transition-colors">
                              <ArrowRight size={14} />
                          </button>
                      )}
                      {item.interaction.status === TenderStatus.SUBMITTED && (
                         <div className="flex gap-1">
                              <button onClick={() => handleUpdateStatus(item.tender.id, TenderStatus.WON)} className="p-1.5 bg-emerald-900/30 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded border border-emerald-900/50" title="Gagné">
                                  <CheckCircle size={14} />
                              </button>
                              <button onClick={() => handleUpdateStatus(item.tender.id, TenderStatus.LOST)} className="p-1.5 bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white rounded border border-red-900/50" title="Perdu">
                                  <X size={14} />
                              </button>
                         </div>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-slate-400 font-medium">Chargement du pipeline...</p>
        </div>
      );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-2xl font-bold text-white">Pipeline des Marchés</h2>
          <div className="flex gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div> Total: {data.length} dossiers
              </div>
          </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex h-full gap-6 min-w-[1000px]">
            
            {/* COL 1: A QUALIFIER */}
            <div className="flex-1 min-w-[280px] flex flex-col bg-slate-900/30 border border-slate-800/50 rounded-2xl h-full">
                <div className="p-4 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2"><CheckCircle size={16} className="text-slate-500"/> À Qualifier</h3>
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{getColumnData(TenderStatus.TODO).length}</span>
                </div>
                <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {getColumnData(TenderStatus.TODO).map(item => <KanbanCard key={item.tender.id} item={item} />)}
                </div>
            </div>

            {/* COL 2: EN REDACTION */}
            <div className="flex-1 min-w-[280px] flex flex-col bg-blue-900/10 border border-blue-900/20 rounded-2xl h-full">
                <div className="p-4 border-b border-blue-900/20 flex justify-between items-center bg-blue-900/20 rounded-t-2xl">
                    <h3 className="font-bold text-blue-100 flex items-center gap-2"><BrainCircuit size={16} className="text-blue-400"/> En Rédaction</h3>
                    <span className="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">{getColumnData(TenderStatus.IN_PROGRESS).length}</span>
                </div>
                <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {getColumnData(TenderStatus.IN_PROGRESS).map(item => <KanbanCard key={item.tender.id} item={item} />)}
                </div>
            </div>

            {/* COL 3: SOUMIS */}
            <div className="flex-1 min-w-[280px] flex flex-col bg-slate-900/30 border border-slate-800/50 rounded-2xl h-full">
                <div className="p-4 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2"><ArrowRight size={16} className="text-purple-400"/> Offre Soumise</h3>
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{getColumnData(TenderStatus.SUBMITTED).length}</span>
                </div>
                <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {getColumnData(TenderStatus.SUBMITTED).map(item => <KanbanCard key={item.tender.id} item={item} />)}
                </div>
            </div>

            {/* COL 4: TERMINE */}
            <div className="flex-1 min-w-[280px] flex flex-col bg-slate-900/30 border border-slate-800/50 rounded-2xl h-full opacity-80">
                <div className="p-4 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
                    <h3 className="font-bold text-slate-400">Terminé</h3>
                    <span className="text-xs bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">
                        {getColumnData(TenderStatus.WON).length + getColumnData(TenderStatus.LOST).length}
                    </span>
                </div>
                <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {getColumnData(TenderStatus.WON).map(item => <KanbanCard key={item.tender.id} item={item} />)}
                    {getColumnData(TenderStatus.LOST).map(item => <KanbanCard key={item.tender.id} item={item} />)}
                </div>
            </div>

        </div>
      </div>

      {/* Notes Modal */}
      {editingNoteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-surface border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white">Notes Internes</h3>
                    <button onClick={() => setEditingNoteId(null)}><X size={20} className="text-slate-500 hover:text-white"/></button>
                </div>
                <textarea 
                    className="w-full h-32 bg-background border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none text-white placeholder-slate-600"
                    placeholder="Avancement, questions à poser, stratégie de réponse..."
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingNoteId(null)} className="px-4 py-2 text-slate-400 text-sm font-medium hover:text-white">Annuler</button>
                    <button onClick={saveNote} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-600">Enregistrer</button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default MyTenders;
