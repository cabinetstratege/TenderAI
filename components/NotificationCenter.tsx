import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, AlertTriangle, X } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { AppNotification } from '../types';
import { useNavigate } from 'react-router-dom';

const NotificationCenter: React.FC = () => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const navigate = useNavigate();
    const wrapperRef = useRef<HTMLDivElement>(null);

    const loadNotifications = async () => {
        const notifs = await notificationService.getNotifications();
        setNotifications(notifs);
        setHasUnread(notifs.length > 0);
    };

    useEffect(() => {
        loadNotifications();
        // Poll every minute to keep fresh without reload
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (tenderId: string) => {
        setIsOpen(false);
        navigate(`/tender/${tenderId}`);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Notifications"
            >
                <Bell size={20} />
                {hasUnread && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-80 md:w-96 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-bottom-left">
                    <div className="p-3 border-b border-border bg-slate-900 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            Notifications <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{notifications.length}</span>
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
                            <X size={16}/>
                        </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                                <Bell size={32} className="mb-2 opacity-20"/>
                                <p className="text-sm">Rien à signaler pour le moment.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {notifications.map((notif) => (
                                    <div 
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif.tenderId)}
                                        className="p-4 hover:bg-slate-800/50 cursor-pointer transition-colors group"
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 p-2 rounded-full h-fit shrink-0 ${
                                                notif.type === 'deadline' 
                                                ? 'bg-red-950/40 text-red-400' 
                                                : 'bg-blue-950/40 text-blue-400'
                                            }`}>
                                                {notif.type === 'deadline' ? <AlertTriangle size={16}/> : <Clock size={16}/>}
                                            </div>
                                            <div>
                                                <h4 className={`text-sm font-semibold mb-1 group-hover:underline ${
                                                    notif.type === 'deadline' ? 'text-red-400' : 'text-blue-400'
                                                }`}>
                                                    {notif.title}
                                                </h4>
                                                <p className="text-xs text-slate-300 leading-relaxed mb-2">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-slate-500">
                                                    AO concerné : {notif.tenderId.substring(0, 15)}...
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
