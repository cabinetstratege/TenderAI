'use client';

import React, { useEffect, useState } from 'react';
import { tenderService } from '../services/tenderService';
import { TenderStatus, Tender, UserInteraction } from '../types';
import { Loader2, ArrowRight, ArrowLeft, Ban, X, AlertCircle, CheckCircle, BrainCircuit } from 'lucide-react';
import RefreshButton from './RefreshButton';

type MyTendersScreenProps = {
  onNavigateTender?: (id: string) => void;
};

interface KanbanCardProps {
  item: { tender: Tender; interaction: UserInteraction };
  onNoteClick: (tenderId: string, note: string) => void;
  onStatusChange: (tenderId: string, status: TenderStatus) => void;
  onNavigateTender?: (id: string) => void;
  onDragStart?: (id: string, status: TenderStatus) => void;
  onDragEnd?: () => void;
  disableClick?: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ item, onNoteClick, onStatusChange, onNavigateTender, onDragStart, onDragEnd, disableClick }) => {
  const daysRemaining = Math.ceil((new Date(item.tender.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div
      className="bg-surface p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md hover:border-slate-400 dark:hover:border-slate-600 transition-all flex flex-col gap-3 group relative cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', item.tender.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(item.tender.id, item.interaction.status);
      }}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        if (e.defaultPrevented) return;
        if (!disableClick) {
          onNavigateTender?.(item.tender.id);
        }
      }}
    >
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">{item.tender.idWeb}</span>
        {daysRemaining < 5 ? (
          <span className="text-[10px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1 bg-red-100 dark:bg-red-950/30 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/50">
            <AlertCircle size={10} /> J-{daysRemaining}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/50">
            J-{daysRemaining}
          </span>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onNavigateTender?.(item.tender.id);
        }}
        className="font-semibold text-sm text-slate-800 dark:text-slate-200 line-clamp-2 text-left hover:text-primary transition-colors"
      >
        {item.tender.title}
      </button>
      <p className="text-xs text-slate-500 truncate">{item.tender.buyer}</p>

      {item.interaction.internalNotes && (
        <div
          className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-2 rounded text-[10px] text-amber-700 dark:text-amber-200/80 truncate cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/40"
          onClick={(e) => {
            e.stopPropagation();
            onNoteClick(item.tender.id, item.interaction.internalNotes || '');
          }}
        >
          Note : {item.interaction.internalNotes}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 mt-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(item.tender.id, TenderStatus.BLACKLISTED);
          }}
          className="text-slate-400 hover:text-textMain cursor-pointer"
          title="Blacklister"
        >
          <Ban size={14} />
        </button>

        <div className="flex gap-1">
          {item.interaction.status !== TenderStatus.TODO && (
            <button
              onClickCapture={(e) => e.stopPropagation()}
              onClick={() => {
                const prev =
                  item.interaction.status === TenderStatus.IN_PROGRESS
                    ? TenderStatus.TODO
                    : item.interaction.status === TenderStatus.SUBMITTED
                    ? TenderStatus.IN_PROGRESS
                    : TenderStatus.SUBMITTED;
                onStatusChange(item.tender.id, prev);
              }}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-textMain cursor-pointer"
              title="Revenir à l'étape précédente"
            >
              <ArrowLeft size={14} />
            </button>
          )}

          {item.interaction.status === TenderStatus.TODO && (
            <button
              onClickCapture={(e) => e.stopPropagation()}
              onClick={() => onStatusChange(item.tender.id, TenderStatus.IN_PROGRESS)}
              className="p-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-primary text-slate-500 dark:text-slate-300 hover:text-white rounded transition-colors cursor-pointer"
              title="Passer en rédaction"
            >
              <ArrowRight size={14} />
            </button>
          )}
          {item.interaction.status === TenderStatus.IN_PROGRESS && (
            <button
              onClickCapture={(e) => e.stopPropagation()}
              onClick={() => onStatusChange(item.tender.id, TenderStatus.SUBMITTED)}
              className="p-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-primary text-slate-500 dark:text-slate-300 hover:text-white rounded transition-colors cursor-pointer"
              title="Marquer comme soumise"
            >
              <ArrowRight size={14} />
            </button>
          )}
          {item.interaction.status === TenderStatus.SUBMITTED && (
            <div className="flex gap-1">
              <button
                onClickCapture={(e) => e.stopPropagation()}
                onClick={() => onStatusChange(item.tender.id, TenderStatus.WON)}
                className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white rounded border border-emerald-200 dark:border-emerald-900/50 cursor-pointer"
                title="Marquer comme gagné"
              >
                <CheckCircle size={14} />
              </button>
              <button
                onClickCapture={(e) => e.stopPropagation()}
                onClick={() => onStatusChange(item.tender.id, TenderStatus.LOST)}
                className="p-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white rounded border border-red-200 dark:border-red-900/50 cursor-pointer"
                title="Marquer comme perdu"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MyTendersScreen: React.FC<MyTendersScreenProps> = ({ onNavigateTender }) => {
  const [data, setData] = useState<{ tender: Tender; interaction: UserInteraction }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [currentNote, setCurrentNote] = useState('');
  const [dragItem, setDragItem] = useState<{ id: string; from: TenderStatus } | null>(null);
  const [hoveredStatus, setHoveredStatus] = useState<TenderStatus | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    const savedData = await tenderService.getSavedTenders();
    const normalizedData = savedData.map((item) => {
      if (item.interaction.status === ('Sauvegardé' as any)) {
        return { ...item, interaction: { ...item.interaction, status: TenderStatus.TODO } };
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
    setData((prev) =>
      prev.map((item) => {
        if (item.tender.id === id) {
          return { ...item, interaction: { ...item.interaction, status } };
        }
        return item;
      })
    );
  };

  const openNoteModal = (tenderId: string, note: string = '') => {
    setEditingNoteId(tenderId);
    setCurrentNote(note);
  };

  const saveNote = () => {
    if (editingNoteId) {
      const currentItem = data.find((i) => i.tender.id === editingNoteId);
      const status = currentItem ? currentItem.interaction.status : TenderStatus.TODO;

      tenderService.updateInteraction(editingNoteId, status, currentNote);
      setData((prev) =>
        prev.map((item) => {
          if (item.tender.id === editingNoteId) {
            return { ...item, interaction: { ...item.interaction, internalNotes: currentNote } };
          }
          return item;
        })
      );
      setEditingNoteId(null);
    }
  };

  const handleDragStart = (id: string, from: TenderStatus) => {
    setDragItem({ id, from });
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setDragItem(null);
    setHoveredStatus(null);
    setIsDragging(false);
  };

  const handleDropOnColumn = (targetStatus: TenderStatus) => {
    if (dragItem && dragItem.from !== targetStatus) {
      handleUpdateStatus(dragItem.id, targetStatus);
    }
    handleDragEnd();
  };

  const getColumnData = (status: TenderStatus) => data.filter((item) => item.interaction.status === status);

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
        <h2 className="text-2xl font-bold text-textMain">Pipeline des Marchés</h2>
        <div className="flex gap-2">
          <RefreshButton onRefresh={refreshData} isLoading={isLoading} />
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-surface px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div> Total: {data.length} dossiers
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex h-full gap-6 min-w-[1000px]">
          <KanbanColumn
            title="À Qualifier"
            status={TenderStatus.TODO}
            items={getColumnData(TenderStatus.TODO)}
            onNoteClick={openNoteModal}
            onStatusChange={handleUpdateStatus}
            onNavigateTender={onNavigateTender}
            colorClass="bg-slate-100 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/50"
            headerClass="bg-slate-200 dark:bg-slate-900/50"
            icon={<CheckCircle size={16} className="text-slate-500" />}
            onCardDragStart={handleDragStart}
            onCardDragEnd={handleDragEnd}
            onDropItem={handleDropOnColumn}
            isHovered={hoveredStatus === TenderStatus.TODO}
            onDragEnterColumn={() => setHoveredStatus(TenderStatus.TODO)}
            onDragLeaveColumn={() => setHoveredStatus(null)}
            disableCardClick={isDragging}
          />

          <KanbanColumn
            title="En Rédaction"
            status={TenderStatus.IN_PROGRESS}
            items={getColumnData(TenderStatus.IN_PROGRESS)}
            onNoteClick={openNoteModal}
            onStatusChange={handleUpdateStatus}
            onNavigateTender={onNavigateTender}
            colorClass="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/20"
            headerClass="bg-blue-100 dark:bg-blue-900/20"
            icon={<BrainCircuit size={16} className="text-blue-500" />}
            badgeClass="bg-blue-200 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30"
            onCardDragStart={handleDragStart}
            onCardDragEnd={handleDragEnd}
            onDropItem={handleDropOnColumn}
            isHovered={hoveredStatus === TenderStatus.IN_PROGRESS}
            onDragEnterColumn={() => setHoveredStatus(TenderStatus.IN_PROGRESS)}
            onDragLeaveColumn={() => setHoveredStatus(null)}
            disableCardClick={isDragging}
          />

          <KanbanColumn
            title="Offre Soumise"
            status={TenderStatus.SUBMITTED}
            items={getColumnData(TenderStatus.SUBMITTED)}
            onNoteClick={openNoteModal}
            onStatusChange={handleUpdateStatus}
            onNavigateTender={onNavigateTender}
            colorClass="bg-slate-100 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/50"
            headerClass="bg-slate-200 dark:bg-slate-900/50"
            icon={<ArrowRight size={16} className="text-purple-500" />}
            onCardDragStart={handleDragStart}
            onCardDragEnd={handleDragEnd}
            onDropItem={handleDropOnColumn}
            isHovered={hoveredStatus === TenderStatus.SUBMITTED}
            onDragEnterColumn={() => setHoveredStatus(TenderStatus.SUBMITTED)}
            onDragLeaveColumn={() => setHoveredStatus(null)}
            disableCardClick={isDragging}
          />

          <KanbanColumn
            title="Terminé"
            status={TenderStatus.WON}
            items={[...getColumnData(TenderStatus.WON), ...getColumnData(TenderStatus.LOST)]}
            onNoteClick={openNoteModal}
            onStatusChange={handleUpdateStatus}
            onNavigateTender={onNavigateTender}
            colorClass="bg-slate-100 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/50 opacity-80"
            headerClass="bg-slate-200 dark:bg-slate-900/50"
            icon={<CheckCircle size={16} className="text-emerald-500" />}
            onCardDragStart={handleDragStart}
            onCardDragEnd={handleDragEnd}
            onDropItem={handleDropOnColumn}
            isHovered={hoveredStatus === TenderStatus.WON}
            onDragEnterColumn={() => setHoveredStatus(TenderStatus.WON)}
            onDragLeaveColumn={() => setHoveredStatus(null)}
            disableCardClick={isDragging}
          />
        </div>
      </div>

      {editingNoteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-textMain">Notes Internes</h3>
              <button onClick={() => setEditingNoteId(null)}>
                <X size={20} className="text-slate-500 hover:text-textMain" />
              </button>
            </div>
            <textarea
              className="w-full h-32 bg-background border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none text-textMain placeholder-slate-500"
              placeholder="Avancement, questions à poser, stratégie de réponse..."
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingNoteId(null)} className="px-4 py-2 text-slate-500 text-sm font-medium hover:text-textMain">
                Annuler
              </button>
              <button onClick={saveNote} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-600">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KanbanColumn = ({
  title,
  status,
  items,
  onNoteClick,
  onStatusChange,
  onNavigateTender,
  colorClass,
  headerClass,
  icon,
  badgeClass,
  onCardDragStart,
  onCardDragEnd,
  onDropItem,
  isHovered,
  onDragEnterColumn,
  onDragLeaveColumn,
  disableCardClick,
}: {
  title: string;
  status: TenderStatus;
  items: { tender: Tender; interaction: UserInteraction }[];
  onNoteClick: (tenderId: string, note: string) => void;
  onStatusChange: (tenderId: string, status: TenderStatus) => void;
  onNavigateTender?: (id: string) => void;
  colorClass: string;
  headerClass: string;
  icon: React.ReactNode;
  badgeClass?: string;
  onCardDragStart?: (id: string, status: TenderStatus) => void;
  onCardDragEnd?: () => void;
  onDropItem?: (status: TenderStatus) => void;
  isHovered?: boolean;
  onDragEnterColumn?: () => void;
  onDragLeaveColumn?: () => void;
  disableCardClick?: boolean;
}) => (
  <div
    className={`flex-1 min-w-[280px] flex flex-col border rounded-2xl h-full transition-colors ${colorClass} ${
      isHovered ? 'border-dashed border-primary bg-primary/5 dark:bg-primary/10' : ''
    }`}
    onDragOver={(e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      onDragEnterColumn?.();
    }}
    onDragEnter={(e) => {
      e.preventDefault();
      onDragEnterColumn?.();
    }}
    onDragLeave={onDragLeaveColumn}
    onDrop={(e) => {
      e.preventDefault();
      onDropItem?.(status);
    }}
  >
    <div className={`p-4 border-b flex justify-between items-center rounded-t-2xl ${headerClass}`}>
      <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        {icon} {title}
      </h3>
      <span className={`text-xs px-2 py-0.5 rounded-full ${badgeClass || 'bg-white dark:bg-slate-800 text-slate-500'}`}>{items.length}</span>
    </div>
    <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-3">
      {items.map((item) => (
        <KanbanCard
          key={item.tender.id}
          item={item}
          onNoteClick={onNoteClick}
          onStatusChange={onStatusChange}
          onNavigateTender={onNavigateTender}
          onDragStart={onCardDragStart}
          onDragEnd={onCardDragEnd}
          disableClick={disableCardClick}
        />
      ))}
    </div>
  </div>
);

export default MyTendersScreen;
