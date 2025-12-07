import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Please add your Gemini API key to .env.local');
}

if (!process.env.GEMINI_MODEL) {
  throw new Error('Please add GEMINI_MODEL to .env.local (e.g., gemini-1.5-pro)');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_MODEL = process.env.GEMINI_MODEL;

function extractJSONFromText(text: string): Record<string, unknown> {
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  
  // Remove ```json and ``` markers
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  cleaned = cleaned.trim();
  
  // Try to find JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON object found in response: ${text.substring(0, 200)}`);
  }
  
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    // Log the problematic text for debugging
    console.error('JSON parse error. Text received:', text.substring(0, 500));
    console.error('Cleaned text:', cleaned.substring(0, 500));
    console.error('JSON match:', jsonMatch[0].substring(0, 500));
    throw new Error(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }
}

export async function extractDocumentData(
  fileData: Buffer,
  mimeType: string,
  documentType: string
): Promise<Record<string, unknown>> {
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
    
    // Extract JSON from response using improved function
    return extractJSONFromText(text) as Record<string, unknown>;
  } catch (error) {
    console.error('Gemini extraction error:', error);
    
    // Provide user-friendly error message for rate limits
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
      
      // Check if it's a rate limit error (429)
      const errorMessage = lastError.message;
      const isRateLimit = errorMessage.includes('429') || 
                         errorMessage.includes('quota') || 
                         errorMessage.includes('rate limit') ||
                         errorMessage.includes('Too Many Requests');
      
      if (isRateLimit && attempt < maxRetries - 1) {
        // Extract retry delay from error if available
        let retryDelay = baseDelay * Math.pow(2, attempt);
        const retryMatch = errorMessage.match(/retry.*?(\d+)\s*s/i);
        if (retryMatch) {
          retryDelay = parseInt(retryMatch[1]) * 1000;
        }
        
        console.warn(`Rate limit hit. Retrying in ${retryDelay / 1000}s (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      // If not a rate limit or max retries reached, throw
      throw lastError;
    }
  }
  
  throw lastError || new Error('Unknown error after retries');
}

export async function extractUserInfo(
  message: string,
  task: 'extract_name' | 'extract_loan_type' | 'extract_phone_pan'
): Promise<{ extracted: string | null; confidence: number }> {
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
  }

  try {
    const result = await callGeminiWithRetry(async () => {
      return await model.generateContent(prompt);
    });
    
    const response = result.response;
    const text = response.text();
    
    // Log raw response for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`Gemini raw response for ${task}:`, text.substring(0, 200));
    }
    
    // Extract and parse JSON
    const parsed = extractJSONFromText(text);
    
    if (task === 'extract_name') {
      return { extracted: parsed.name as string || null, confidence: parsed.name ? 0.9 : 0 };
    } else if (task === 'extract_loan_type') {
      return { extracted: parsed.loanType as string || null, confidence: parsed.loanType ? 0.9 : 0 };
    } else {
      // For phone/PAN, return the one that exists
      const phone = parsed.phone as string || null;
      const pan = parsed.pan as string || null;
      return { 
        extracted: phone || pan || null, 
        confidence: (phone || pan) ? 0.9 : 0 
      };
    }
  } catch (error) {
    console.error('Gemini extraction error:', error);
    console.error('Task:', task);
    console.error('Message:', message);
    
    // Provide user-friendly error message for rate limits
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

export async function generateChatResponse(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
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
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;
    
    return response.text();
  } catch (error) {
    console.error('Gemini chat error:', error);
    throw new Error(`Failed to generate chat response from Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
