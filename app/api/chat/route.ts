import { NextRequest, NextResponse } from 'next/server';
import { getChatSession, setChatSession } from '@/lib/db/redis';
import { getDatabase } from '@/lib/db/mongodb';
import { ChatSession, ChatMessage, ChatStep, LoanOffer } from '@/types';
import { mockCreditScore, getCreditGrade } from '@/lib/scoring';
import { getLoanTypeInfo } from '@/lib/matching';
import { getMatchingLendersFromDB } from '@/lib/lenders';
import { aiProvider } from '@/lib/ai';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message } = await request.json();
    
    if (!sessionId || !message) {
      return NextResponse.json({ error: 'Missing sessionId or message' }, { status: 400 });
    }

    // Get or create session
    let session = (await getChatSession(sessionId)) as ChatSession | null;
    
    if (!session) {
      session = {
        sessionId,
        messages: [],
        currentStep: 'greeting',
        context: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Add user message only if not empty
    if (message && message.trim()) {
      session.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date(),
      });
    }

    // Process based on current step
    let response: string;
    let nextStep: ChatStep = session.currentStep;
    const db = await getDatabase();

    switch (session.currentStep) {
      case 'greeting':
        response = "Hello! I'm here to help you find the perfect loan. What's your name?";
        nextStep = 'ask_name';
        break;

      case 'ask_name':
        // Use Gemini to extract just the name - throw error if fails
        const nameResult = await aiProvider.extractUserInfo(message, 'extract_name');
        const extractedName = nameResult.extracted || message.trim();
        session.context.name = extractedName;
        response = `Nice to meet you, ${extractedName}! What's the purpose of your loan?`;
        nextStep = 'ask_loan_purpose';
        break;

      case 'ask_loan_purpose':
        session.context.loanPurpose = message;
        
        // Use Gemini to check if loan type is already mentioned - throw error if fails
        const loanTypeResult = await aiProvider.extractUserInfo(message, 'extract_loan_type');
        if (loanTypeResult.extracted) {
          // Loan type found in the message!
          const selectedType = loanTypeResult.extracted;
          if (selectedType && ['Personal', 'Business', 'Home', 'Vehicle', 'Education', 'Gold'].includes(selectedType)) {
            session.context.selectedLoanType = selectedType as ChatSession['context']['selectedLoanType'];
            const loanInfo = getLoanTypeInfo(selectedType as ChatSession['context']['selectedLoanType']);
            response = `Perfect! You're interested in a ${selectedType} loan.\n\n${loanInfo.description}\n\nBenefits:\n${loanInfo.benefits.map(b => `• ${b}`).join('\n')}\n\nHow much loan amount are you looking for? (e.g., 5 lakh, 10 lakhs, ₹5,00,000)`;
            nextStep = 'ask_loan_amount';
          } else {
            response = "Great! Let me show you the available loan types. Please select one:";
            nextStep = 'show_loan_types';
          }
        } else {
          // No loan type mentioned, show options
          response = "Great! Let me show you the available loan types. Please select one:";
          nextStep = 'show_loan_types';
        }
        break;

      case 'show_loan_types':
        // User selected a loan type
        const loanTypes: string[] = ['Personal', 'Business', 'Home', 'Vehicle', 'Education', 'Gold'];
        const selectedType = loanTypes.find(type => 
          message.toLowerCase().includes(type.toLowerCase())
        );
        
        if (selectedType && ['Personal', 'Business', 'Home', 'Vehicle', 'Education', 'Gold'].includes(selectedType)) {
          session.context.selectedLoanType = selectedType as ChatSession['context']['selectedLoanType'];
          const loanInfo = getLoanTypeInfo(selectedType as ChatSession['context']['selectedLoanType']);
          response = `${loanInfo.description}\n\nBenefits:\n${loanInfo.benefits.map(b => `• ${b}`).join('\n')}\n\nHow much loan amount are you looking for? (e.g., 5 lakh, 10 lakhs, ₹5,00,000)`;
          nextStep = 'ask_loan_amount';
        } else {
          response = "Please select a valid loan type: Personal, Business, Home, Vehicle, Education, or Gold.";
        }
        break;

      case 'ask_loan_amount':
        // Extract loan amount from message
        const amountResult = await aiProvider.extractUserInfo(message, 'extract_loan_amount');
        let loanAmount: number | undefined;
        
        if (amountResult.extracted) {
          // Parse the amount string to number
          const amountStr = amountResult.extracted.replace(/[₹,\s]/g, '');
          loanAmount = parseInt(amountStr, 10);
          
          if (isNaN(loanAmount) || loanAmount <= 0) {
            response = "Please provide a valid loan amount. For example: 5 lakh, 10 lakhs, ₹5,00,000, or 500000.";
            break;
          }
        } else {
          // Try to extract manually with regex
          const amountMatch = message.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(lakh|lakhs|crore|crores|thousand|thousands|k|cr)/i);
          if (amountMatch) {
            const num = parseFloat(amountMatch[1].replace(/,/g, ''));
            const unit = amountMatch[2].toLowerCase();
            
            if (unit.includes('crore')) {
              loanAmount = num * 10000000;
            } else if (unit.includes('lakh')) {
              loanAmount = num * 100000;
            } else if (unit.includes('thousand') || unit === 'k') {
              loanAmount = num * 1000;
            } else {
              loanAmount = num;
            }
          } else {
            // Try to find just numbers
            const numMatch = message.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
            if (numMatch) {
              loanAmount = parseFloat(numMatch[1].replace(/,/g, ''));
            }
          }
          
          if (!loanAmount || loanAmount <= 0) {
            response = "I couldn't understand the loan amount. Please specify the amount clearly, for example: '5 lakh', '10 lakhs', '₹5,00,000', or '500000'.";
            break;
          }
        }
        
        // Store loan amount in context
        session.context.loanAmount = loanAmount;
        response = `Got it! You're looking for a loan of ₹${loanAmount.toLocaleString('en-IN')}.\n\nTo check your eligibility, please provide your phone number or PAN card number.`;
        nextStep = 'eligibility_check';
        break;

      case 'eligibility_check':
        // Extract phone or PAN using Gemini - throw error if fails
        const contactResult = await aiProvider.extractUserInfo(message, 'extract_phone_pan');
        let phone: string | undefined;
        let pan: string | undefined;
        
        // Also try regex extraction for reliability
        const phoneRegex = message.match(/\b\d{10}\b/);
        const panRegex = message.match(/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/i);
        
        if (phoneRegex) {
          phone = phoneRegex[0];
        }
        if (panRegex) {
          pan = panRegex[0].toUpperCase();
        }
        
        // Use Gemini result if regex didn't find anything
        if (!phone && !pan && contactResult.extracted) {
          if (/^\d{10}$/.test(contactResult.extracted)) {
            phone = contactResult.extracted;
          } else if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(contactResult.extracted)) {
            pan = contactResult.extracted.toUpperCase();
          }
        }
        
        if (!phone && !pan) {
          response = "Please provide a valid 10-digit phone number or PAN card number (e.g., ABCDE1234F). You can provide both if you have them.";
          break;
        }

        // Get credit score and history (simulating API call)
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Get credit score
        const creditScore = mockCreditScore(phone, pan);
        const creditGrade = getCreditGrade(creditScore);
        
        // Mock credit history
        const creditHistory = {
          totalAccounts: Math.floor(Math.random() * 10) + 5,
          activeAccounts: Math.floor(Math.random() * 5) + 2,
          paymentHistory: Math.floor(Math.random() * 20) + 80,
          creditUtilization: Math.floor(Math.random() * 40) + 10,
        };
        
        session.context.phone = phone;
        session.context.pan = pan;
        session.context.creditScore = creditScore;
        session.context.creditGrade = creditGrade;
        session.context.creditHistory = creditHistory;

        // Create or update user in database
        const usersCollection = db.collection('users');
        const userResult = await usersCollection.findOneAndUpdate(
          { $or: [{ phone }, { pan }] },
          {
            $set: {
              name: session.context.name,
              phone,
              pan,
              creditScore,
              creditGrade,
              loanPurpose: session.context.loanPurpose,
              selectedLoanType: session.context.selectedLoanType,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          { upsert: true, returnDocument: 'after' }
        );

        const userId = userResult._id?.toString() || userResult.value?._id?.toString();
        session.userId = userId;

        // Get matching lenders
        const selectedLoanType = session.context.selectedLoanType as string;
        if (!selectedLoanType) {
          response = "Please select a loan type first.";
          break;
        }
        const matchingLenders = await getMatchingLendersFromDB(
          selectedLoanType as 'Personal' | 'Business' | 'Home' | 'Vehicle' | 'Education' | 'Gold',
          70, // Default score, will be updated after KYC
          creditGrade
        );

        if (matchingLenders.length === 0) {
          response = `✅ **Credit Score Retrieved**\n\nYour credit score: **${creditScore}** (Grade: **${creditGrade}**)\n\nUnfortunately, we don't have lenders matching your profile at the moment.`;
          nextStep = 'eligibility_check';
        } else {
          session.context.matchingLenders = matchingLenders;
          response = `✅ **Credit Score Retrieved**\n\nYour credit score: **${creditScore}** (Grade: **${creditGrade}**)\n\nHere are the best loan offers for you. Please select a lender from the cards below:`;
          nextStep = 'show_lenders';
        }
        break;

      case 'show_lenders':
        const lenders = session.context.matchingLenders as LoanOffer[];
        if (!lenders || lenders.length === 0) {
          response = "No lenders available. Please try again later.";
          nextStep = 'show_lenders';
          break;
        }
        
        // Try to find lender by index (1, 2, 3...) or by name
        let selectedLender: LoanOffer | undefined;
        const indexMatch = message.match(/^(\d+)/);
        if (indexMatch) {
          const index = parseInt(indexMatch[1]) - 1;
          if (index >= 0 && index < lenders.length) {
            selectedLender = lenders[index];
          }
        }
        
        if (!selectedLender) {
          selectedLender = lenders.find(l => 
            message.toLowerCase().includes(l.lenderName.toLowerCase())
          );
        }

        if (selectedLender) {
          session.context.selectedLender = selectedLender.lenderId;
          session.context.selectedLenderName = selectedLender.lenderName;
          session.context.selectedOffer = selectedLender;
          
          // Initialize document list
          const requiredDocs = ['aadhar', 'pan', 'bank_statement', 'income_proof', 'cancelled_cheque', 'passbook', 'signature', 'biometric'];
          session.context.requiredDocuments = requiredDocs;
          session.context.currentDocumentIndex = 0;
          // Initialize uploaded documents if not exists
          if (!session.context.uploadedDocuments) {
            session.context.uploadedDocuments = [];
          }
          
          const docNames: Record<string, string> = {
            aadhar: 'Aadhar Card',
            pan: 'PAN Card',
            bank_statement: 'Bank Statement',
            income_proof: 'Income Proof',
            cancelled_cheque: 'Cancelled Cheque',
            passbook: 'Passbook',
            signature: 'Signature Photo',
            biometric: 'Biometric Photo',
          };
          
          response = `✅ **Lender Selected!**\n\nGreat choice! You've selected **${selectedLender.lenderName}**.\n\nNow let's collect your KYC documents to complete your loan application.\n\nPlease upload your **${docNames[requiredDocs[0]]}** first.`;
          nextStep = 'document_upload';
        } else {
          response = "Please select a valid lender from the cards above by clicking on it or typing the lender number/name.";
          nextStep = 'show_lenders';
        }
        break;

      case 'kyc_collection':
      case 'document_upload':
        // Ensure required documents list exists
        if (!session.context.requiredDocuments) {
          session.context.requiredDocuments = ['aadhar', 'pan', 'bank_statement', 'income_proof', 'cancelled_cheque', 'passbook', 'signature', 'biometric'];
        }
        if (!session.context.uploadedDocuments) {
          session.context.uploadedDocuments = [];
        }
        
        // Handle "Next document" or "All documents uploaded" message
        if (message.toLowerCase().includes('next document') || message.toLowerCase().includes('all documents uploaded') || message.toLowerCase().includes('uploaded')) {
          const requiredDocs = session.context.requiredDocuments as string[];
          const uploadedDocs = session.context.uploadedDocuments as Array<{ type: string }>;
          const uploadedTypes = uploadedDocs.map(d => d.type);
          
          // Verify all required documents are uploaded
          const allUploaded = requiredDocs.length === 8 && requiredDocs.every(doc => uploadedTypes.includes(doc));
          
          if (allUploaded) {
            // All documents uploaded - verify count
            response = "🎉 Excellent! All 8 documents have been uploaded and processed.\n\nClick the 'Process KYC & Generate Report' button below to complete your application.";
            nextStep = 'kyc_ready';
          } else {
            // Find next unuploaded document
            let nextDocIndex = 0;
            while (nextDocIndex < requiredDocs.length && uploadedTypes.includes(requiredDocs[nextDocIndex])) {
              nextDocIndex++;
            }
            
            if (nextDocIndex >= requiredDocs.length) {
              // All documents should be uploaded but check failed - show status
              response = `You've uploaded ${uploadedTypes.length} documents. Please continue uploading the remaining documents.`;
            } else {
              const docNames: Record<string, string> = {
                aadhar: 'Aadhar Card',
                pan: 'PAN Card',
                bank_statement: 'Bank Statement',
                income_proof: 'Income Proof',
                cancelled_cheque: 'Cancelled Cheque',
                passbook: 'Passbook',
                signature: 'Signature Photo',
                biometric: 'Biometric Photo',
              };
              
              const nextDoc = requiredDocs[nextDocIndex];
              session.context.currentDocumentIndex = nextDocIndex;
              response = `Great! Now please upload your **${docNames[nextDoc]}** (${nextDocIndex + 1}/${requiredDocs.length}).`;
            }
          }
        } else {
          // Regular message during document upload - show current status
          const requiredDocs = session.context.requiredDocuments as string[] || [];
          const uploadedDocs = session.context.uploadedDocuments as Array<{ type: string }> || [];
          const uploadedCount = uploadedDocs.length;
          response = `Please use the upload button above to upload your document. Progress: ${uploadedCount}/8 documents uploaded.`;
        }
        break;
      
      case 'kyc_ready':
        response = "All documents are ready! Click the 'Process KYC & Generate Report' button to complete your application.";
        break;

      default:
        response = "I'm here to help! How can I assist you?";
    }

    // Add assistant response
    session.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    });

    session.currentStep = nextStep;
    session.updatedAt = new Date();

    // Save session
    await setChatSession(sessionId, session);

    return NextResponse.json({
      response,
      currentStep: nextStep,
      context: session.context,
      matchingLenders: session.context.matchingLenders || [],
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const session = await getChatSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Chat GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

