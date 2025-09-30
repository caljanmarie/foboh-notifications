export class TemplateService {
  render(template: string, variables: Record<string, string | number>) {
    return template.replace(/{{(.*?)}}/g, (_, key) => {
      const k = key.trim();
      if (!(k in variables)) {
        throw new Error(`Missing variable: ${k}`);
      }
      return String(variables[k]);
    });
  }
}