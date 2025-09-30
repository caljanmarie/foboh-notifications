export class EmailChannel {
  async send(target: string, content: string) {
    console.log(`📧 Email to ${target}: ${content}`);
    if (Math.random() < 0.1) {
      throw new Error("Simulated email failure");
    }
  }
}