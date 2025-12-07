/**
 * Ollama AI Provider Implementation
 * Uses Ollama API running at http://localhost:11434
 */

import { AIProvider } from './interface';

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl = 'http://localhost:11434', model = 'llama3.2') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  private async callOllama(prompt: string, options?: { images?: string[] }): Promise<string> {
    try {
      const requestBody: Record<string, unknown> = {
        model: this.model,
        prompt,
        stream: false,
      };

      if (options?.images && options.images.length > 0) {
        requestBody.images = options.images;
      }

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      // Ollama returns the response in the 'response' field
      const result = data.response;
      
      if (!result || result.trim() === '') {
        console.error('Ollama returned empty response:', JSON.stringify(data, null, 2));
        throw new Error('Ollama returned an empty response. Check if the model is loaded correctly.');
      }

      return result;
    } catch (error) {
      console.error('Ollama API call error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to call Ollama API: ${String(error)}`);
    }
  }

  private extractJSONFromText(text: string): Record<string, unknown> {
    if (!text || text.trim() === '') {
      throw new Error('Empty response from Ollama');
    }

    // Remove markdown code blocks if present
    let cleaned = text.trim();

    // Remove ```json and ``` markers
    cleaned = cleaned.replace(/^```json\s*/i, '');
    cleaned = cleaned.replace(/^```\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
    cleaned = cleaned.trim();

    // Try to find JSON object - look for the first { and try to find matching }
    let jsonStart = cleaned.indexOf('{');
    if (jsonStart === -1) {
      console.error('Full response text:', text);
      throw new Error(`No JSON object found in response. Response was: ${text.substring(0, 200)}`);
    }

    // Extract from first { to last }
    let jsonEnd = cleaned.lastIndexOf('}');
    if (jsonEnd === -1 || jsonEnd <= jsonStart) {
      // Try to find matching brace
      let braceCount = 0;
      jsonEnd = jsonStart;
      for (let i = jsonStart; i < cleaned.length; i++) {
        if (cleaned[i] === '{') braceCount++;
        if (cleaned[i] === '}') braceCount--;
        if (braceCount === 0) {
          jsonEnd = i;
          break;
        }
      }
      if (braceCount !== 0) {
        jsonEnd = cleaned.length - 1;
      }
    }

    let jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);

    // Try to fix common JSON issues
    jsonStr = this.fixJSONString(jsonStr);

    try {
      return JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error. Text received:', text.substring(0, 500));
      console.error('Extracted JSON string:', jsonStr.substring(0, 500));
      console.error('Parse error:', parseError);
      
      // Try to extract just the JSON part more aggressively
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(this.fixJSONString(jsonMatch[0]));
        } catch {
          // Last resort: try to manually fix common issues
          throw new Error(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown error'}. Extracted JSON: ${jsonStr.substring(0, 300)}`);
        }
      }
      
      throw new Error(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown error'}. Response: ${text.substring(0, 300)}`);
    }
  }

  private fixJSONString(jsonStr: string): string {
    // Remove trailing commas before } or ]
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
    
    // Remove comments (single line // and multi-line /* */)
    jsonStr = jsonStr.replace(/\/\/.*$/gm, '');
    jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Fix unquoted keys (common in LLM outputs)
    jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // Remove any text before first { or after last }
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    
    return jsonStr.trim();
  }

  async extractDocumentData(
    fileData: Buffer,
    mimeType: string,
    documentType: string
  ): Promise<Record<string, unknown>> {
    // Convert image to base64
    const base64Image = fileData.toString('base64');
    
    const prompt = `You are analyzing a ${documentType} document. Extract the following information and return ONLY a valid JSON object with no markdown, no code blocks, no explanations. Just the JSON.

Required fields for ${documentType}:
${this.getDocumentFields(documentType)}

Return format: {"field1": "value or null", "field2": "value or null", ...}`;

    try {
      // Check if model supports vision (models with 'vision' in name typically do)
      const supportsVision = this.model.toLowerCase().includes('vision') || 
                           this.model.toLowerCase().includes('llava') ||
                           this.model.toLowerCase().includes('bakllava');
      
      let text: string;
      
      if (supportsVision) {
        // Try vision API
        try {
          const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: this.model,
              prompt: prompt,
              images: [base64Image],
              stream: false,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            text = data.response || '';
            
            // Check if response indicates no image was seen
            if (text.toLowerCase().includes("don't see") || 
                text.toLowerCase().includes("no image") ||
                text.toLowerCase().includes("image provided")) {
              throw new Error('Vision model did not receive image');
            }
          } else {
            throw new Error(`Vision API returned ${response.status}`);
          }
        } catch (error) {
          console.warn('Vision API failed, falling back to text-only extraction:', error);
          text = await this.callOllama(this.getTextOnlyPrompt(documentType));
        }
      } else {
        // Model doesn't support vision, use text-only prompt
        console.warn(`Model ${this.model} does not support vision. Using text-only extraction.`);
        console.warn('For better results, use a vision model like: llama3.2-vision, llava, or bakllava');
        text = await this.callOllama(this.getTextOnlyPrompt(documentType));
      }

      return this.extractJSONFromText(text);
    } catch (error) {
      console.error('Ollama extraction error:', error);
      throw new Error(`Failed to extract document data from Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getDocumentFields(documentType: string): string {
    const fields: Record<string, string> = {
      aadhar: 'name, dateOfBirth, address, aadharNumber',
      pan: 'name, dateOfBirth, panNumber',
      bank_statement: 'incomeSummary (with monthlyIncome, annualIncome), expenseSummary (with monthlyExpenses, categories object), savings (number), emiObligations (with totalEMI, loans array)',
      income_proof: 'incomeSummary (with monthlyIncome, annualIncome)',
    };
    
    return fields[documentType] || 'any relevant information from the document';
  }

  private getTextOnlyPrompt(documentType: string): string {
    return `You are processing a ${documentType} document. Since I cannot see the image, please return a JSON object with the standard structure for this document type, using null for all values.

For ${documentType}, return this JSON structure:
${this.getJSONTemplate(documentType)}

Return ONLY the JSON object, no explanations, no markdown.`;
  }

  private getJSONTemplate(documentType: string): string {
    const templates: Record<string, string> = {
      aadhar: '{"name": null, "dateOfBirth": null, "address": null, "aadharNumber": null}',
      pan: '{"name": null, "dateOfBirth": null, "panNumber": null}',
      bank_statement: '{"incomeSummary": {"monthlyIncome": null, "annualIncome": null}, "expenseSummary": {"monthlyExpenses": null, "categories": {}}, "savings": null, "emiObligations": {"totalEMI": null, "loans": []}}',
      income_proof: '{"incomeSummary": {"monthlyIncome": null, "annualIncome": null}}',
    };
    
    return templates[documentType] || '{}';
  }

  async extractUserInfo(
    message: string,
    task: 'extract_name' | 'extract_loan_type' | 'extract_phone_pan'
  ): Promise<{ extracted: string | null; confidence: number }> {
    let prompt = '';

    if (task === 'extract_name') {
      prompt = `Extract just the person's name from this message. Remove any greetings like "Hello", "Hi", "I'm", "My name is", etc. Return ONLY the name, nothing else. If no name is found, return null.

Message: "${message}"

IMPORTANT: Return ONLY a valid JSON object with no markdown, no code blocks, no explanations. Just the JSON:
{"name": "extracted name or null"}`;
    } else if (task === 'extract_loan_type') {
      prompt = `Extract the loan type from this message. The available loan types are: Personal, Business, Home, Vehicle, Education, Gold.

Message: "${message}"

IMPORTANT: Return ONLY a valid JSON object with no markdown, no code blocks, no explanations. Just the JSON:
{"loanType": "Personal|Business|Home|Vehicle|Education|Gold|null"}`;
    } else if (task === 'extract_phone_pan') {
      prompt = `Extract phone number (exactly 10 digits) or PAN card number (format: ABCDE1234F - 5 letters, 4 digits, 1 letter) from this message.

Message: "${message}"

IMPORTANT: Return ONLY a valid JSON object with no markdown, no code blocks, no explanations. Just the JSON:
{"phone": "10 digit number or null", "pan": "PAN number or null"}`;
    } else if (task === 'extract_loan_amount') {
      prompt = `Extract the loan amount (in Indian Rupees) from this message. The amount could be in lakhs, crores, or direct numbers. Convert everything to a number in rupees.

Examples:
- "5 lakh" = 500000
- "10 lakhs" = 1000000
- "50 thousand" = 50000
- "2 crore" = 20000000
- "5,00,000" = 500000
- "₹5 lakh" = 500000

Message: "${message}"

IMPORTANT: Return ONLY a valid JSON object with no markdown, no code blocks, no explanations. Just the JSON:
{"amount": "number in rupees as string or null"}`;
    }

    try {
      const text = await this.callOllama(prompt);
      
      // Log the raw response for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`Ollama raw response for ${task}:`, text?.substring(0, 500) || 'null/undefined');
      }

      if (!text || text.trim() === '') {
        console.error('Ollama returned empty response for task:', task);
        console.error('Prompt was:', prompt.substring(0, 200));
        throw new Error('Ollama returned an empty response. Check if the model is loaded correctly.');
      }

      const parsed = this.extractJSONFromText(text);

      if (task === 'extract_name') {
        return { extracted: parsed.name as string || null, confidence: parsed.name ? 0.9 : 0 };
      } else if (task === 'extract_loan_type') {
        return { extracted: parsed.loanType as string || null, confidence: parsed.loanType ? 0.9 : 0 };
      } else if (task === 'extract_loan_amount') {
        return { extracted: parsed.amount as string || null, confidence: parsed.amount ? 0.9 : 0 };
      } else {
        const phone = parsed.phone as string || null;
        const pan = parsed.pan as string || null;
        return {
          extracted: phone || pan || null,
          confidence: (phone || pan) ? 0.9 : 0
        };
      }
    } catch (error) {
      console.error('Ollama extraction error:', error);
      console.error('Task:', task);
      console.error('Message:', message);
      console.error('Prompt:', prompt.substring(0, 200));
      throw new Error(`Failed to extract ${task} from Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateChatResponse(
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
    const systemPrompt = `You are a helpful loan marketplace chatbot assistant. You help users find the right loan products. 
Be friendly, professional, and guide users through the loan application process.`;

    // Format messages for Ollama
    const lastMessage = messages[messages.length - 1];
    const fullPrompt = `${systemPrompt}\n\nUser: ${lastMessage.content}\n\nAssistant:`;

    try {
      return await this.callOllama(fullPrompt);
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw new Error(`Failed to generate chat response from Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

