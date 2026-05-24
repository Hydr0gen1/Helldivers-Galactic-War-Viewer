export interface AnalyzeInput {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  timeoutMs: number;
}

export interface AiProvider {
  analyze(input: AnalyzeInput): Promise<string>;
}

export type AiProviderName = 'anthropic' | 'fireworks' | 'cerebras';
