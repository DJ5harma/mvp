import { NextRequest, NextResponse } from 'next/server';
import { getChatSession, setChatSession } from '@/lib/db/redis';
import { getDatabase } from '@/lib/db/mongodb';
import { aiProvider } from '@/lib/ai';
import { ChatSession } from '@/types';
import { toObjectId } from '@/lib/db/utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sessionId = formData.get('sessionId') as string;
    const documentType = formData.get('documentType') as string;

    if (!file || !sessionId || !documentType) {
      return NextResponse.json(
        { error: 'Missing file, sessionId, or documentType' },
        { status: 400 }
      );
    }

    // Get session
    const session = (await getChatSession(sessionId)) as ChatSession | null;
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract data using AI provider
    const extractedData = await aiProvider.extractDocumentData(
      buffer,
      file.type,
      documentType
    );

    // Save document to database
    const db = await getDatabase();
    const documentsCollection = db.collection('kyc_documents');
    
    // Convert userId to ObjectId for storage
    const userIdObj = toObjectId(session.userId);
    if (!userIdObj) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }
    
    const document = {
      userId: userIdObj, // Store as ObjectId
      type: documentType,
      fileUrl: `/uploads/${sessionId}/${file.name}`, // In production, upload to S3/cloud storage
      extractedData,
      uploadedAt: new Date(),
    };

    await documentsCollection.insertOne(document);

    // Update session context - ensure no duplicates
    if (!session.context.uploadedDocuments) {
      session.context.uploadedDocuments = [];
    }
    const uploadedDocs = session.context.uploadedDocuments as Array<{ type: string; extractedData?: unknown }>;
    const existingIndex = uploadedDocs.findIndex(d => d.type === documentType);
    if (existingIndex >= 0) {
      // Update existing document
      uploadedDocs[existingIndex] = { type: documentType, extractedData };
    } else {
      // Add new document
      uploadedDocs.push({ type: documentType, extractedData });
    }
    session.context.uploadedDocuments = uploadedDocs;

    await setChatSession(sessionId, session);

    // Get document name for response
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

    // Prepare summary of extracted data
    let summary = '';
    if (extractedData.name) summary += `Name: ${extractedData.name}\n`;
    if (extractedData.aadharNumber) summary += `Aadhar: ${extractedData.aadharNumber}\n`;
    if (extractedData.panNumber) summary += `PAN: ${extractedData.panNumber}\n`;
    if (extractedData.incomeSummary) {
      const income = extractedData.incomeSummary as { monthlyIncome?: number; annualIncome?: number };
      if (income.monthlyIncome) summary += `Monthly Income: ₹${income.monthlyIncome.toLocaleString()}\n`;
    }

    return NextResponse.json({
      success: true,
      extractedData,
      documentName: docNames[documentType] || documentType,
      summary: summary.trim(),
      message: `${docNames[documentType] || documentType} uploaded and processed successfully!${summary ? '\n\nExtracted information:\n' + summary : ''}`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}

