import { v4 as uuid } from "uuid";
import { InMemoryDb } from "../db/InMemoryDb";
import { TemplateService } from "./TemplateService";
import { RateLimitService } from "./RateLimitServices";
import { EmailChannel } from "../channels/EmailChannel";
import { WebhookChannel } from "../channels/WebhookChannel";
import { Notification } from "../types";

export class NotificationService {
  private template = new TemplateService();
  private rateLimit = new RateLimitService();
  private email = new EmailChannel();
  private webhook = new WebhookChannel();

  constructor(private db: InMemoryDb) {}

  // Main entry point to send a notification
  async sendRequest(payload: {
    userId: string;
    channel: "email" | "webhook";
    templateId: string;
    variables: Record<string, string | number>;
    target: string;
  }) {
    // Check user preferences
    const prefs = this.db.getPreference(payload.userId);
    console.log("User preferences:", prefs);

    // If user has opted out of this channel, skip
    if (!prefs[payload.channel]) {
      console.log("User has opted out of", payload.channel);
      return { status: "FAILED", reason: "User opted out" };
    }

    // Rate limiting
    if (!this.rateLimit.check(payload.userId)) {
      console.log("Rate limit exceeded for", payload.userId);
      return { status: "FAILED", reason: "Rate limited" };
    }

    const id = uuid();
    const now = new Date().toISOString();
    const notification: Notification = {
      notificationId: id,
      userId: payload.userId,
      channel: payload.channel,
      templateId: payload.templateId,
      variables: payload.variables,
      target: payload.target,
      status: "ENQUEUED",
      retries: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Save to DB and process asynchronously
    this.db.saveNotification(notification);
    this.processNotification(notification);

    return { notificationId: id, status: "ENQUEUED" };
  }

  // Internal method to process and send the notification
  private async processNotification(item: Notification) {
    // Update status to PROCESSING
    this.db.updateNotification(item.notificationId, { status: "PROCESSING" });

    // For simplicity, hardcoding templates here
    const templates: Record<string, Record<string, string>> = {
      welcome: {
        email: "Hello {{name}}, welcome!",
        webhook: '{"event":"welcome","user":"{{name}}"}',
      },
      order: {
        email: "Order {{orderId}} confirmed for {{name}}",
        webhook: '{"event":"order","id":"{{orderId}}"}',
      },
    };

    // Render template
    let rendered: string;
    try {
      rendered = this.template.render(
        templates[item.templateId]?.[item.channel] ?? "{{name}}",
        item.variables
      );
    } catch (err: any) {
      // Template rendering failed
      console.log("Template rendering error:", err.message);
      this.db.updateNotification(item.notificationId, {
        status: "FAILED",
        lastError: err.message,
      });
      return;
    }

    let attempt = 0;
    let success = false;
    let lastError = "";

    // Retry logic with exponential backoff
    while (attempt < 3 && !success) {
      try {
        // Simulate sending
        attempt++;
        if (item.channel === "email") {
          await this.email.send(item.userId, rendered);
        } else {
          await this.webhook.send(item.target, rendered);
        }
        success = true;
        // Update status to DELIVERED
        this.db.updateNotification(item.notificationId, {
          status: "DELIVERED",
          retries: attempt - 1,
        });
      } catch (err: any) {
        // Sending failed
        console.log(
          `Attempt ${attempt} failed for ${item.notificationId}:`,
          err.message
        );
        lastError = err.message;
        const delay = Math.pow(2, attempt) * 100;
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    // If all attempts failed, mark as FAILED
    if (!success) {
      this.db.updateNotification(item.notificationId, {
        status: "FAILED",
        retries: attempt,
        lastError,
      });
    }
  }

  // Method to get notification status
  getStatus(id: string) {
    return this.db.getNotification(id);
  }
}