import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  }),
});

export class NotificationService {
  static async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  }

  static async scheduleDailyReminders() {
    // Supprimer les anciennes notifications pour éviter les doublons
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Notification du Matin (07h00)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "☀️ Bonjour - FOEIL",
        body: "Prenez un moment pour voir l'état initial de vos finances aujourd'hui.",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 7,
        minute: 0,
      },
    });

    // Notification du Soir (20h00)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌙 Compte-rendu - FOEIL",
        body: "N'oubliez pas d'enregistrer vos transactions du jour pour garder un suivi précis.",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
      },
    });
    
    console.log("Notifications planifiées : 07h00 et 20h00");
  }

  static async scheduleDebtReminder(title: string, body: string, date: Date) {
      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: date
        },
      });
  }
}
