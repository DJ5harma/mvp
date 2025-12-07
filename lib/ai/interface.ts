/**
 * AI Provider Interface
 * Abstracts different AI providers (Gemini, Ollama, etc.)
 */

export interface AIProvider {
  extractDocumentData(
    fileData: Buffer,
    mimeType: string,
    documentType: string
  ): Promise<Record<string, unknown>>;

  extractUserInfo(
    message: string,
    task: 'extract_name' | 'extract_loan_type' | 'extract_phone_pan' | 'extract_loan_amount'
  ): Promise<{ extracted: string | null; confidence: number }>;

  generateChatResponse(
    messages: Array<{ role: string; content: string }>
  ): Promise<string>;
}

