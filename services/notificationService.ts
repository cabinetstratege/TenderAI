import { tenderService } from './tenderService';
import { AppNotification, TenderStatus } from '../types';

export const notificationService = {
  getNotifications: async (): Promise<AppNotification[]> => {
    try {
        const savedData = await tenderService.getSavedTenders();
        const notifications: AppNotification[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        savedData.forEach(({ tender, interaction }) => {
            // 1. Check Deadline (Alert at J-3)
            if (interaction.status === TenderStatus.SAVED && tender.deadline) {
                const deadlineDate = new Date(tender.deadline);
                const timeDiff = deadlineDate.getTime() - today.getTime();
                const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

                if (daysDiff >= 0 && daysDiff <= 3) {
                    notifications.push({
                        id: `deadline-${tender.id}`,
                        type: 'deadline',
                        title: 'Date limite imminente',
                        message: `L'AO "${tender.title.substring(0, 40)}..." expire dans ${daysDiff} jour(s).`,
                        date: new Date().toISOString(),
                        tenderId: tender.id,
                        isRead: false
                    });
                }
            }

            // 2. Check Custom Reminder
            if (interaction.customReminderDate) {
                const reminderDate = new Date(interaction.customReminderDate);
                // Reset hours to compare dates only
                reminderDate.setHours(0, 0, 0, 0);
                
                // If reminder is today or passed (and not completed/removed)
                if (reminderDate <= today) {
                     notifications.push({
                        id: `reminder-${tender.id}`,
                        type: 'reminder',
                        title: 'Rappel Personnalisé',
                        message: `Rappel prévu pour : "${tender.title.substring(0, 40)}..."`,
                        date: interaction.customReminderDate,
                        tenderId: tender.id,
                        isRead: false
                    });
                }
            }
        });

        return notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
        console.error("Error generating notifications", error);
        return [];
    }
  }
};
