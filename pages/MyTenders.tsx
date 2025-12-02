import React, { useState, useEffect } from 'react';
import { tenderService } from '../services/tenderService';
import { TenderStatus, Tender, UserInteraction } from '../types';
import { Calendar, Download, Trash2, CheckCircle, XCircle, FileText, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyTenders: React.FC = () => {
  const [data, setData] = useState<{tender: Tender, interaction: UserInteraction}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [currentNote, setCurrentNote] = useState('');

  const refreshData = async () => {
      setIsLoading(true);
      const savedData = await tenderService.getSavedTenders();
      setData(savedData);
      setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleUpdateStatus = (id: string, status: TenderStatus) => {
    tenderService.updateInteraction(id, status);
    // Optimistic UI update
    setData(prev => prev.map(item => {
        if(item.tender.id === id) {
            return {...item, interaction: {...item.interaction, status}};
        }
        return item;
    }));
    // Note: In a real app we might refetch or filter out depending on if we show WON/LOST here
  };

  const openNoteModal = (tenderId: string, note: string = '') => {
    setEditingNoteId(tenderId);
    setCurrentNote(note);
  };

  const saveNote = () => {
    if (editingNoteId) {
        tenderService.updateInteraction(editingNoteId, TenderStatus.SAVED, currentNote);
        setData(prev => prev.map(item => {
             if(item.tender.id === editingNoteId) {
                 return {...item, interaction: {...item.interaction, internalNotes: currentNote}};
             }
             return item;
        }));
        setEditingNoteId(null);
    }
  };

  const handleExportICS = (tender: any) => {
    const event = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:Rendu AO: ${tender.title}`,
      `DTSTART:${tender.deadline.replace(/-/g, '')}`,
      `DESCRIPTION:Acheteur: ${tender.buyer}\\nLien: ${tender.linkDCE}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([event], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AO_${tender.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-slate-500 font-medium">Chargement de votre espace de travail...</p>
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Mes Appels d'Offres (Espace de Travail)</h2>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-900 w-1/3">Titre & Acheteur</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Notes Internes</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Rappel & Export</th>
                <th className="px-6 py-4 font-semibold text-slate-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Aucun appel d'offre sauvegardé pour le moment.
                  </td>
                </tr>
              ) : (
                data.map(({tender, interaction}) => (
                  <tr key={tender.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/tender/${tender.id}`} className="font-medium text-slate-900 line-clamp-2 hover:text-primary hover:underline">
                          {tender.title}
                      </Link>
                      <div className="text-xs text-slate-400 mt-1">{tender.buyer}</div>
                      <div className="mt-2 text-xs font-mono bg-slate-100 inline-block px-1 rounded">{tender.idWeb}</div>
                      <div className="mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                              interaction.status === TenderStatus.WON ? 'bg-green-100 text-green-700 border-green-200' :
                              interaction.status === TenderStatus.LOST ? 'bg-red-100 text-red-700 border-red-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                              {interaction.status}
                          </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <div 
                            onClick={() => openNoteModal(tender.id, interaction.internalNotes)}
                            className="cursor-pointer group"
                        >
                            {interaction.internalNotes ? (
                                <p className="text-xs bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-100 group-hover:border-yellow-300 transition-colors max-w-xs truncate">
                                    {interaction.internalNotes}
                                </p>
                            ) : (
                                <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary">
                                    <FileText size={12} /> Ajouter une note
                                </button>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-500 w-12">Rendu:</span>
                                <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-xs border border-red-100">
                                    {tender.deadline}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-500 w-12">Rappel:</span>
                                <input 
                                    type="date" 
                                    defaultValue={interaction.customReminderDate}
                                    className="border border-slate-300 rounded px-2 py-0.5 text-xs w-28"
                                />
                            </div>
                            <button 
                                onClick={() => handleExportICS(tender)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                            >
                                <Download size={12} /> Ajouter au Calendrier
                            </button>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                       <button 
                         onClick={() => handleUpdateStatus(tender.id, TenderStatus.WON)}
                         className={`p-2 rounded-full transition-colors ${interaction.status === TenderStatus.WON ? 'text-green-600 bg-green-100' : 'text-slate-500 hover:text-green-600 hover:bg-green-50'}`}
                         title="Marquer comme Gagné"
                       >
                         <CheckCircle size={18} />
                       </button>
                       <button 
                         onClick={() => handleUpdateStatus(tender.id, TenderStatus.LOST)}
                         className={`p-2 rounded-full transition-colors ${interaction.status === TenderStatus.LOST ? 'text-red-600 bg-red-100' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'}`}
                         title="Marquer comme Perdu/Rejeté"
                       >
                         <XCircle size={18} />
                       </button>
                       <button 
                         onClick={() => handleUpdateStatus(tender.id, TenderStatus.BLACKLISTED)}
                         className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-full transition-colors"
                         title="Supprimer"
                       >
                         <Trash2 size={18} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes Modal */}
      {editingNoteId && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900">Notes Internes</h3>
                    <button onClick={() => setEditingNoteId(null)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                </div>
                <textarea 
                    className="w-full h-32 border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Avancement, questions à poser, stratégie de réponse..."
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingNoteId(null)} className="px-4 py-2 text-slate-600 text-sm font-medium">Annuler</button>
                    <button onClick={saveNote} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-700">Enregistrer</button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default MyTenders;