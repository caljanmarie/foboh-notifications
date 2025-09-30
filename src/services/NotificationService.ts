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

  async sendRequest(payload: {
    userId: string;
    channel: "email" | "webhook";
    templateId: string;
    variables: Record<string, string | number>;
    target: string;
  }) {
    const prefs = this.db.getPreference(payload.userId);
    if (!prefs[payload.channel]) {
      return { status: "FAILED", reason: "User opted out" };
    }

    if (!this.rateLimit.check(payload.userId)) {
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

    this.db.saveNotification(notification);
    this.processNotification(notification);

    return { notificationId: id, status: "ENQUEUED" };
  }

  private async processNotification(item: Notification) {
    this.db.updateNotification(item.notificationId, { status: "PROCESSING" });

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

    let rendered: string;
    try {
      rendered = this.template.render(
        templates[item.templateId]?.[item.channel] ?? "{{name}}",
        item.variables
      );
    } catch (err: any) {
      this.db.updateNotification(item.notificationId, {
        status: "FAILED",
        lastError: err.message,
      });
      return;
    }

    let attempt = 0;
    let success = false;
    let lastError = "";

    while (attempt < 3 && !success) {
      try {
        attempt++;
        if (item.channel === "email") {
          await this.email.send(item.target, rendered);
        } else {
          await this.webhook.send(item.target, rendered);
        }
        success = true;
        this.db.updateNotification(item.notificationId, {
          status: "DELIVERED",
          retries: attempt - 1,
        });
      } catch (err: any) {
        lastError = err.message;
        const delay = Math.pow(2, attempt) * 100;
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    if (!success) {
      this.db.updateNotification(item.notificationId, {
        status: "FAILED",
        retries: attempt,
        lastError,
      });
    }
  }

  getStatus(id: string) {
    return this.db.getNotification(id);
  }
}