
import { tenderService } from './tenderService';
import { AppNotification, TenderStatus } from '../types';

const STORAGE_READ_NOTIFS_KEY = 'tenderai_read_notifications';

export const notificationService = {
  getNotifications: async (): Promise<AppNotification[]> => {
    try {
        const savedData = await tenderService.getSavedTenders();
        const notifications: AppNotification[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get read history
        let readIds: string[] = [];
        try {
            readIds = JSON.parse(localStorage.getItem(STORAGE_READ_NOTIFS_KEY) || '[]');
        } catch (e) { console.error(e); }

        savedData.forEach(({ tender, interaction }) => {
            // 1. Check Deadline (Alert at J-3)
            // Fix: Include tenders being worked on (TODO, IN_PROGRESS, SUBMITTED), exclude already finished ones.
            const activeStatuses = [TenderStatus.SAVED, TenderStatus.TODO, TenderStatus.IN_PROGRESS, TenderStatus.SUBMITTED];
            
            if (activeStatuses.includes(interaction.status) && tender.deadline) {
                const deadlineDate = new Date(tender.deadline);
                const timeDiff = deadlineDate.getTime() - today.getTime();
                const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

                // Alert if between 0 and 5 days (widened slightly)
                if (daysDiff >= 0 && daysDiff <= 5) {
                    const notifId = `deadline-${tender.id}`;
                    notifications.push({
                        id: notifId,
                        type: 'deadline',
                        title: daysDiff === 0 ? "Expire aujourd'hui !" : `Expire dans ${daysDiff} jours`,
                        message: `L'AO "${tender.title.substring(0, 50)}..." arrive à échéance.`,
                        date: new Date().toISOString(), // Generated now to be at top
                        tenderId: tender.id,
                        isRead: readIds.includes(notifId)
                    });
                }
            }

            // 2. Check Custom Reminder
            if (interaction.customReminderDate) {
                const reminderDate = new Date(interaction.customReminderDate);
                reminderDate.setHours(0, 0, 0, 0);
                
                // If reminder is today or passed
                if (reminderDate <= today) {
                     const notifId = `reminder-${tender.id}-${interaction.customReminderDate}`;
                     notifications.push({
                        id: notifId,
                        type: 'reminder',
                        title: 'Rappel Personnalisé',
                        message: interaction.internalNotes 
                            ? `Note : "${interaction.internalNotes.substring(0, 50)}..."` 
                            : `Rappel prévu pour cet appel d'offre.`,
                        date: interaction.customReminderDate,
                        tenderId: tender.id,
                        isRead: readIds.includes(notifId)
                    });
                }
            }
        });

        // Sort: Unread first, then by date descending
        return notifications.sort((a, b) => {
            if (a.isRead === b.isRead) {
                // Determine 'date' for sorting (deadline urgency or creation date)
                return 0; 
            }
            return a.isRead ? 1 : -1;
        });
    } catch (error) {
        console.error("Error generating notifications", error);
        return [];
    }
  },

  markAsRead: (notificationId: string) => {
      try {
          const readIds = JSON.parse(localStorage.getItem(STORAGE_READ_NOTIFS_KEY) || '[]');
          if (!readIds.includes(notificationId)) {
              readIds.push(notificationId);
              localStorage.setItem(STORAGE_READ_NOTIFS_KEY, JSON.stringify(readIds));
          }
      } catch (e) {
          console.error("Failed to mark notification as read", e);
      }
  },

  markAllAsRead: (notifications: AppNotification[]) => {
      try {
          const readIds = JSON.parse(localStorage.getItem(STORAGE_READ_NOTIFS_KEY) || '[]');
          const newIds = notifications.map(n => n.id);
          const combined = Array.from(new Set([...readIds, ...newIds]));
          localStorage.setItem(STORAGE_READ_NOTIFS_KEY, JSON.stringify(combined));
      } catch (e) { console.error(e); }
  }
};
