import { Notification } from "../types";

export class InMemoryDb {
  private notifications = new Map<string, Notification>();
  private preferences = new Map<string, Record<string, boolean>>();

  saveNotification(n: Notification) {
    this.notifications.set(n.notificationId, n);
  }

  updateNotification(id: string, patch: Partial<Notification>) {
    const cur = this.notifications.get(id);
    if (!cur) return;
    const updated = { ...cur, ...patch, updatedAt: new Date().toISOString() };
    this.notifications.set(id, updated);
    return updated;
  }

  getNotification(id: string) {
    return this.notifications.get(id);
  }

  setPreference(userId: string, prefs: Record<string, boolean>) {
    this.preferences.set(userId, prefs);
  }

  getPreference(userId: string) {
    return this.preferences.get(userId) ?? { email: true, webhook: true };
  }
}