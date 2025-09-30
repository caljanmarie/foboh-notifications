export type Channel = "email" | "webhook";
export type Status = "ENQUEUED" | "PROCESSING" | "DELIVERED" | "FAILED";

export interface Notification {
  notificationId: string;
  userId: string;
  channel: Channel;
  templateId: string;
  variables: Record<string, string | number>;
  target: string;
  status: Status;
  retries: number;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
}