"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Clock, AlertTriangle, X, CheckCheck } from "lucide-react";
import { notificationService } from "../services/notificationService";
import { AppNotification } from "../types";

type NotificationCenterProps = {
  onNavigate?: (path: string) => void;
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    const notifs = await notificationService.getNotifications();
    setNotifications(notifs);
    setUnreadCount(notifs.filter((n) => !n.isRead).length);
  };

  useEffect(() => {
    loadNotifications();
    // Poll every minute to keep fresh without reload
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Refresh when opening to ensure read status is up to date if changed elsewhere
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notif: AppNotification) => {
    notificationService.markAsRead(notif.id);
    setIsOpen(false);
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    if (onNavigate) {
      onNavigate(`/tender/${notif.tenderId}`);
    }
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead(notifications);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-slate-900"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full left-0 mb-2 w-80 md:w-96 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-bottom-left flex flex-col max-h-[500px]"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          <div className="p-3 border-b border-border bg-slate-900 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full border border-red-800">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div
            className="overflow-y-auto custom-scrollbar flex-1"
            style={{ backgroundColor: "var(--color-surface)" }}
          >
            {notifications.length === 0 ? (
              <div
                className="p-12 text-center text-slate-500 flex flex-col items-center rounded-b-xl w-full h-full"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <Bell size={32} className="mb-3 opacity-50" />
                <p className="text-sm text-slate-600 dark:text-slate-500">
                  Rien à signaler pour le moment.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Vous êtes à jour !
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 cursor-pointer transition-all group border-l-2 ${
                      notif.isRead
                        ? "bg-surface dark:bg-surface opacity-70 hover:opacity-100 hover:bg-surfaceHighlight dark:hover:bg-surfaceHighlight border-transparent"
                        : "bg-surfaceHighlight dark:bg-slate-800 hover:bg-surfaceHighlight dark:hover:bg-slate-700 border-primary"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`mt-0.5 p-2 rounded-full h-fit shrink-0 ${
                          notif.type === "deadline"
                            ? "bg-red-950/40 text-red-400"
                            : "bg-blue-950/40 text-blue-400"
                        }`}
                      >
                        {notif.type === "deadline" ? (
                          <AlertTriangle size={16} />
                        ) : (
                          <Clock size={16} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4
                            className={`text-sm font-semibold truncate pr-2 ${
                              notif.type === "deadline"
                                ? "text-red-400"
                                : "text-blue-400"
                            }`}
                          >
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5"></div>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed mb-2 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          ID: {notif.tenderId.substring(0, 8)}...
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
