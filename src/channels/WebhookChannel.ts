import axios from "axios";

export class WebhookChannel {
  async send(target: string, content: string) {
    const payload = { message: content };
    const res = await axios.post(target, payload, { timeout: 3000 });
    if (res.status >= 400) {
      throw new Error(`Webhook failed: ${res.status}`);
    }
  }
}