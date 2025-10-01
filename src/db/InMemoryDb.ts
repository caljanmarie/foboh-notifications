import { Notification } from "../types";

// Simple in-memory "database" for demonstration purposes
export class InMemoryDb {
  public notifications = new Map<string, Notification>();
  private preferences = new Map<string, Record<string, boolean>>();

  // Save a new notification record
  saveNotification(n: Notification) {
    this.notifications.set(n.notificationId, n);
  }

  // Update an existing notification record
  updateNotification(id: string, patch: Partial<Notification>) {
    const cur = this.notifications.get(id);
    if (!cur) return;
    const updated = { ...cur, ...patch, updatedAt: new Date().toISOString() };
    this.notifications.set(id, updated);
    return updated;
  }

  // Retrieve a notification record by its ID
  getNotification(id: string) {
    return this.notifications.get(id);
  }

  // Set user preferences for notification channels
  setPreference(userId: string, prefs: Record<string, boolean>) {
    this.preferences.set(userId, prefs);
  }

  // Get user preferences, defaulting to both channels enabled if none are set
  getPreference(userId: string) {
    return this.preferences.get(userId) ?? { email: true, webhook: true };
  }
}