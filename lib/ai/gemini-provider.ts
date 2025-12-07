/**
 * Gemini AI Provider Implementation
 * Wraps the existing Gemini functionality
 */

import { AIProvider } from './interface';
import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not set. Gemini provider will not work.');
}

if (!process.env.GEMINI_MODEL) {
  console.warn('GEMINI_MODEL not set. Using default: gemini-1.5-pro');
}

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-pro';

function extractJSONFromText(text: string): Record<string, unknown> {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  cleaned = cleaned.trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON object found in response: ${text.substring(0, 200)}`);
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error('JSON parse error. Text received:', text.substring(0, 500));
    throw new Error(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }
}

async function callGeminiWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const errorMessage = lastError.message;
      const isRateLimit = errorMessage.includes('429') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('Too Many Requests');

      if (isRateLimit && attempt < maxRetries - 1) {
        let retryDelay = baseDelay * Math.pow(2, attempt);
        const retryMatch = errorMessage.match(/retry.*?(\d+)\s*s/i);
        if (retryMatch) {
          retryDelay = parseInt(retryMatch[1]) * 1000;
        }

        console.warn(`Rate limit hit. Retrying in ${retryDelay / 1000}s (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error('Unknown error after retries');
}

export class GeminiProvider implements AIProvider {
  async extractDocumentData(
    fileData: Buffer,
    mimeType: string,
    documentType: string
  ): Promise<Record<string, unknown>> {
    if (!genAI) {
      throw new Error('Gemini API key not configured');
    }

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `Extract the following information from this ${documentType} document. Return a JSON object with the extracted data. If a field is not found, use null.

For Aadhar: name, dateOfBirth, address, aadharNumber
For PAN: name, dateOfBirth, panNumber
For Bank Statement: incomeSummary (monthlyIncome, annualIncome), expenseSummary (monthlyExpenses, categories as object), savings, emiObligations (totalEMI, loans array with lender, amount, remainingTenure)
For Income Proof: incomeSummary (monthlyIncome, annualIncome)
For other documents: extract any relevant information

Return only valid JSON, no markdown formatting.`;

    try {
      const result = await callGeminiWithRetry(async () => {
        return await model.generateContent([
          prompt,
          {
            inlineData: {
              data: fileData.toString('base64'),
              mimeType: mimeType,
            },
          },
        ]);
      });

      const response = result.response;
      const text = response.text();
      return extractJSONFromText(text) as Record<string, unknown>;
    } catch (error) {
      console.error('Gemini extraction error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        throw new Error(
          `Gemini API rate limit exceeded. The free tier allows 20 requests per day. ` +
          `Please wait a few minutes and try again, or upgrade your Gemini API plan. ` +
          `Current model: ${GEMINI_MODEL}. ` +
          `For more info: https://ai.google.dev/gemini-api/docs/rate-limits`
        );
      }
      throw new Error(`Failed to extract document data from Gemini: ${errorMessage}`);
    }
  }

  async   extractUserInfo(
    message: string,
    task: 'extract_name' | 'extract_loan_type' | 'extract_phone_pan' | 'extract_loan_amount'
  ): Promise<{ extracted: string | null; confidence: number }> {
    if (!genAI) {
      throw new Error('Gemini API key not configured');
    }

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

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
      const result = await callGeminiWithRetry(async () => {
        return await model.generateContent(prompt);
      });

      const response = result.response;
      const text = response.text();

      if (process.env.NODE_ENV === 'development') {
        console.log(`Gemini raw response for ${task}:`, text.substring(0, 200));
      }

      const parsed = extractJSONFromText(text);

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
      console.error('Gemini extraction error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        throw new Error(
          `Gemini API rate limit exceeded. The free tier allows 20 requests per day. ` +
          `Please wait a few minutes and try again, or upgrade your Gemini API plan. ` +
          `Current model: ${GEMINI_MODEL}. ` +
          `For more info: https://ai.google.dev/gemini-api/docs/rate-limits`
        );
      }
      throw new Error(`Failed to extract ${task} from Gemini: ${errorMessage}`);
    }
  }

  async generateChatResponse(
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
    if (!genAI) {
      throw new Error('Gemini API key not configured');
    }

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const systemPrompt = `You are a helpful loan marketplace chatbot assistant. You help users find the right loan products. 
Be friendly, professional, and guide users through the loan application process.`;

    try {
      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
          {
            role: 'model',
            parts: [{ text: 'Hello! I\'m here to help you find the perfect loan. How can I assist you today?' }],
          },
        ],
      });

      const lastMessage = messages[messages.length - 1];
      const result = await callGeminiWithRetry(async () => {
        return await chat.sendMessage(lastMessage.content);
      });

      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini chat error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        throw new Error(
          `Gemini API rate limit exceeded. The free tier allows 20 requests per day. ` +
          `Please wait a few minutes and try again, or upgrade your Gemini API plan. ` +
          `Current model: ${GEMINI_MODEL}. ` +
          `For more info: https://ai.google.dev/gemini-api/docs/rate-limits`
        );
      }
      throw new Error(`Failed to generate chat response from Gemini: ${errorMessage}`);
    }
  }
}

