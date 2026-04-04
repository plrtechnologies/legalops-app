export interface LlmProvider {
  generateCompletion(systemPrompt: string, userPrompt: string): Promise<string>;
}
