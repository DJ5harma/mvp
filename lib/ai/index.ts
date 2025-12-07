/**
 * AI Provider Factory
 * Returns the configured AI provider based on environment variables
 */

import { AIProvider } from './interface';
import { OllamaProvider } from './ollama';
import { GeminiProvider } from './gemini-provider';

export async function checkOllamaHealth(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'ollama';

  switch (provider.toLowerCase()) {
    case 'ollama': {
      const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const model = process.env.OLLAMA_MODEL || 'llama3.2';
      
      // Check if Ollama is running (non-blocking)
      checkOllamaHealth(baseUrl).then(isHealthy => {
        if (!isHealthy) {
          console.warn(`⚠️  Ollama not reachable at ${baseUrl}. Make sure Ollama is running with: ollama serve`);
        } else {
          console.log(`✅ Using Ollama at ${baseUrl} with model: ${model}`);
        }
      }).catch(() => {
        console.warn(`⚠️  Could not verify Ollama connection at ${baseUrl}`);
      });
      
      return new OllamaProvider(baseUrl, model);
    }
    case 'gemini':
      console.log('✅ Using Gemini AI provider');
      return new GeminiProvider();
    default:
      console.warn(`Unknown AI provider: ${provider}, defaulting to Ollama`);
      return new OllamaProvider();
  }
}

// Export singleton instance
export const aiProvider = getAIProvider();

