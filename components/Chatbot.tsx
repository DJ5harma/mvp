'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatStep } from '@/types';
import { Send, Bot, User, Upload, CheckCircle2, Loader2, Sparkles, MessageSquare, FileText } from 'lucide-react';
import Link from 'next/link';
import LenderCard from './LenderCard';
import ReportPreview from './ReportPreview';
import { LoanOffer, LoanReport, UserScore } from '@/types';

// Format message with markdown-like styling
function formatMessage(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let inList = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Handle lists
    if (trimmed.match(/^[\d+\.\-\*]\s+/)) {
      if (!inList) {
        inList = true;
        currentList = [];
      }
      currentList.push(trimmed.replace(/^[\d+\.\-\*]\s+/, ''));
    } else {
      // Close list if exists
      if (inList && currentList.length > 0) {
        elements.push(
          <ul key={`list-${index}`} className="list-disc list-inside space-y-1 my-2 ml-2">
            {currentList.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );
        currentList = [];
        inList = false;
      }
      
      // Handle bold text
      if (trimmed.includes('**')) {
        const parts = trimmed.split('**');
        const formatted = parts.map((part, i) => 
          i % 2 === 1 ? <strong key={i} className="font-bold">{part}</strong> : part
        );
        elements.push(
          <p key={index} className={index > 0 ? 'mt-2' : ''}>
            {formatted}
          </p>
        );
      } else if (trimmed) {
        elements.push(
          <p key={index} className={index > 0 ? 'mt-2' : ''}>
            {trimmed}
          </p>
        );
      } else if (index < lines.length - 1) {
        elements.push(<br key={`br-${index}`} />);
      }
    }
  });

  // Close any remaining list
  if (inList && currentList.length > 0) {
    elements.push(
      <ul key="list-final" className="list-disc list-inside space-y-1 my-2 ml-2">
        {currentList.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }

  return elements.length > 0 ? <>{elements}</> : <p>{content}</p>;
}

interface ChatbotProps {
  sessionId: string;
}

export default function Chatbot({ sessionId }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [currentStep, setCurrentStep] = useState<ChatStep>('greeting');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<Record<string, unknown>>({});
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [processingKYC, setProcessingKYC] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [availableLenders, setAvailableLenders] = useState<LoanOffer[]>([]);
  const [generatedReport, setGeneratedReport] = useState<LoanReport | null>(null);
  const [reportUserScore, setReportUserScore] = useState<UserScore | null>(null);
  const [reportLenderName, setReportLenderName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize chat only once
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    // Check if session exists first
    fetch(`/api/chat?sessionId=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          // Normalize timestamps from string to Date objects
          const normalizedMessages = data.messages.map((msg: ChatMessage) => ({
            ...msg,
            timestamp: msg.timestamp instanceof Date 
              ? msg.timestamp 
              : new Date(msg.timestamp)
          }));
          setMessages(normalizedMessages);
          setCurrentStep(data.currentStep || 'greeting');
          setContext(data.context || {});
          
          // Load uploaded documents from session context
          if (data.context?.uploadedDocuments) {
            const uploaded = (data.context.uploadedDocuments as Array<{ type: string }>).map(d => d.type);
            setUploadedDocuments(uploaded);
          }
          
          setInitialized(true);
        } else {
          // Only send initial message if no session exists
          sendMessage('', true);
        }
      })
      .catch(() => {
        // If error, send initial message
        sendMessage('', true);
      });
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (message?: string, isInitial = false) => {
    if (!isInitial && !message?.trim()) return;

    const messageText = message || 'Hello';
    
    // Clear input immediately for better UX
    if (!isInitial) {
      setInput('');
    }

    // Add user message optimistically (before API call)
    if (!isInitial) {
      const userMessage: ChatMessage = {
        role: 'user',
        content: messageText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setLoading(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: messageText,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add assistant response
        setMessages(prev => {
          // Prevent duplicate messages
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.content === data.response && lastMessage.role === 'assistant') {
            return prev;
          }
          return [
            ...prev,
            { role: 'assistant', content: data.response, timestamp: new Date() },
          ];
        });

        setCurrentStep(data.currentStep);
        setContext(data.context || {});
        
        // Sync uploaded documents from context
        if (data.context?.uploadedDocuments) {
          const uploaded = (data.context.uploadedDocuments as Array<{ type: string }>).map(d => d.type);
          setUploadedDocuments(uploaded);
        }
        
        // Load available lenders from response or context
        if (data.matchingLenders && Array.isArray(data.matchingLenders)) {
          setAvailableLenders(data.matchingLenders);
        } else if (data.context?.matchingLenders) {
          setAvailableLenders(data.context.matchingLenders as LoanOffer[]);
        }
        
        // Load available lenders from context or response
        if (data.matchingLenders && Array.isArray(data.matchingLenders)) {
          setAvailableLenders(data.matchingLenders);
        } else if (data.context?.matchingLenders) {
          setAvailableLenders(data.context.matchingLenders as LoanOffer[]);
        }
        
        setInitialized(true);
      } else {
        // Show error message
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `Sorry, I encountered an error: ${data.error || 'Unknown error'}. Please try again.`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Show error message
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered a connection error. Please check your internet connection and try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      // Refocus input after sending
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      sendMessage(input);
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    // Small delay to ensure input is set, then send
    setTimeout(() => sendMessage(action), 50);
  };

  const handleProcessKYC = async () => {
    setProcessingKYC(true);
    try {
      const response = await fetch('/api/process-kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();
      if (response.ok) {
        // Store report data for preview
        if (data.report) {
          setGeneratedReport(data.report);
          setReportUserScore(data.userScore);
          setReportLenderName(data.lenderName || '');
        }
        
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.message + '\n\n📊 **Your Loan Eligibility Report**\n\nReview your detailed report below to see your eligibility status, risk factors, and loan recommendations.',
            timestamp: new Date(),
          },
        ]);
        setCurrentStep('report_generated');
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'Failed to process KYC. Please try again.',
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('KYC processing failed:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred while processing your KYC. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setProcessingKYC(false);
    }
  };

  const documentTypes = [
    { key: 'aadhar', label: 'Aadhar Card', icon: '🆔' },
    { key: 'pan', label: 'PAN Card', icon: '📄' },
    { key: 'bank_statement', label: 'Bank Statement', icon: '🏦' },
    { key: 'income_proof', label: 'Income Proof', icon: '💰' },
    { key: 'cancelled_cheque', label: 'Cancelled Cheque', icon: '✂️' },
    { key: 'passbook', label: 'Passbook', icon: '📘' },
    { key: 'signature', label: 'Signature', icon: '✍️' },
    { key: 'biometric', label: 'Biometric Photo', icon: '📷' },
  ];

  // Quick action buttons based on current step
  const getQuickActions = () => {
    if (currentStep === 'show_loan_types') {
      return ['Personal', 'Business', 'Home', 'Vehicle'];
    }
    return [];
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-5 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shadow-lg">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">CredMate Assistant</h2>
              <p className="text-sm text-indigo-100 flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                <span>AI-powered loan advisor</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href={`/user/applications?sessionId=${sessionId}`}
              className="hidden md:flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-white/20 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span className="text-xs font-medium">My Applications</span>
            </Link>
            <div className="hidden md:flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-medium">AI Powered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 via-white to-gray-50 custom-scrollbar">
        {messages.length === 0 && !loading && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <MessageSquare className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to CredMate!</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              I'm here to help you find the perfect loan. Let's get started!
            </p>
          </div>
        )}
        
        {messages.map((msg, idx) => {
          // Normalize timestamp to Date object
          const timestamp = msg.timestamp instanceof Date 
            ? msg.timestamp 
            : new Date(msg.timestamp);
          
          return (
          <div
            key={`${msg.role}-${idx}-${timestamp.getTime()}-${msg.content.substring(0, 20)}`}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div className={`flex items-start space-x-3 max-w-[80%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md transition-transform hover:scale-110 ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-500' 
                  : 'bg-gradient-to-br from-gray-400 to-gray-500'
              }`}>
                {msg.role === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex flex-col space-y-1">
                <div
                  className={`rounded-2xl px-5 py-3 shadow-lg transition-all ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  <div className="text-sm leading-relaxed break-words prose prose-sm max-w-none">
                    {formatMessage(msg.content)}
                  </div>
                </div>
                <p className={`text-xs px-2 ${msg.role === 'user' ? 'text-right text-gray-400' : 'text-left text-gray-400'}`}>
                  {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
          );
        })}
        
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white rounded-2xl rounded-bl-sm px-5 py-3 shadow-lg border border-gray-200">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" />
                  <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Lender Cards */}
      {currentStep === 'show_lenders' && availableLenders.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Select a Lender:</h3>
          <div className="grid md:grid-cols-2 gap-4 max-h-96 overflow-y-auto custom-scrollbar">
            {availableLenders.map((lender, index) => (
              <LenderCard
                key={lender.lenderId}
                lender={lender}
                index={index}
                onSelect={(selectedLender) => {
                  sendMessage(`${index + 1}. ${selectedLender.lenderName}`);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {getQuickActions().length > 0 && !loading && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {getQuickActions().map((action) => (
              <button
                key={action}
                onClick={() => handleQuickAction(action)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all active:scale-95"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Document Upload Section - Show only current document */}
      {(currentStep === 'kyc_collection' || currentStep === 'document_upload' || currentStep === 'kyc_ready') && (
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-t border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-800">Upload KYC Documents</h3>
            </div>
            <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border border-indigo-200">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-700">{uploadedDocuments.length}/8</span>
            </div>
          </div>
          
          {currentStep === 'kyc_ready' && uploadedDocuments.length >= 8 ? (
            <div className="mb-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">All Documents Uploaded!</span>
                </div>
                <p className="text-xs text-green-700">All 8 documents have been successfully uploaded and processed.</p>
              </div>
              <button
                onClick={handleProcessKYC}
                disabled={processingKYC}
                className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {processingKYC ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing KYC...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Process KYC & Generate Report</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-3 text-center">Upload the document requested above:</p>
              <div className="flex justify-center">
                {(() => {
                  // Find current document from context or show first unuploaded
                  const allDocs = documentTypes;
                  const currentDoc = allDocs.find(doc => !uploadedDocuments.includes(doc.key)) || allDocs[0];
                  if (!currentDoc) return null;
                  
                  return (
                    <div className="w-full max-w-xs">
                      <DocumentUpload
                        sessionId={sessionId}
                        documentType={currentDoc.key}
                        label={currentDoc.label}
                        icon={currentDoc.icon}
                        isUploaded={uploadedDocuments.includes(currentDoc.key)}
                        isCurrent={true}
                        onUploadComplete={async (docType, summary) => {
                          if (!uploadedDocuments.includes(docType)) {
                            const newUploaded = [...uploadedDocuments, docType];
                            setUploadedDocuments(newUploaded);
                            
                            // Send confirmation message
                            const docName = documentTypes.find(d => d.key === docType)?.label || docType;
                            let confirmMsg = `✅ ${docName} uploaded successfully!`;
                            if (summary) {
                              confirmMsg += `\n\n**Extracted Information:**\n${summary}`;
                            }
                            
                            // Add user message showing upload
                            setMessages(prev => [
                              ...prev,
                              { role: 'user', content: `${docName} uploaded`, timestamp: new Date() },
                            ]);
                            
                            // Only request next document if not all are uploaded
                            if (newUploaded.length < 8) {
                              setTimeout(() => {
                                sendMessage('Next document', false);
                              }, 1000);
                            } else {
                              // All documents uploaded - update step
                              setTimeout(() => {
                                sendMessage('All documents uploaded', false);
                              }, 1000);
                            }
                          }
                        }}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
          
          {/* Show all uploaded documents */}
          {uploadedDocuments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-indigo-200">
              <p className="text-xs font-medium text-gray-700 mb-2">Uploaded Documents:</p>
              <div className="flex flex-wrap gap-2">
                {uploadedDocuments.map((docType) => {
                  const doc = documentTypes.find(d => d.key === docType);
                  return doc ? (
                    <div key={docType} className="flex items-center space-x-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{doc.label}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm placeholder:text-gray-400"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !loading) {
                    handleSubmit(e);
                  }
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-14 h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-105 active:scale-95 disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function DocumentUpload({ 
  sessionId, 
  documentType,
  label,
  icon,
  isUploaded,
  isCurrent = false,
  onUploadComplete 
}: { 
  sessionId: string; 
  documentType: string;
  label: string;
  icon: string;
  isUploaded: boolean;
  isCurrent?: boolean;
  onUploadComplete: (docType: string, summary?: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);
    formData.append('documentType', documentType);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        onUploadComplete(documentType, data.summary);
      } else {
        alert('Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <label className={`relative cursor-pointer group ${isUploaded ? 'opacity-75' : ''} ${uploading ? 'pointer-events-none' : ''} ${isCurrent ? 'w-full' : ''}`}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        accept="image/*,.pdf"
        disabled={isUploaded || uploading}
        className="hidden"
      />
      <div className={`${isCurrent ? 'p-8' : 'p-4'} rounded-xl border-2 transition-all ${
        isUploaded 
          ? 'bg-green-50 border-green-400 shadow-md' 
          : uploading
          ? 'bg-blue-50 border-blue-400'
          : isCurrent
          ? 'bg-white border-2 border-indigo-300 hover:border-indigo-500 hover:shadow-xl hover:scale-105 active:scale-95'
          : 'bg-white border-gray-200 hover:border-indigo-400 hover:shadow-lg hover:scale-105 active:scale-95'
      }`}>
        <div className={`${isCurrent ? 'text-5xl mb-4' : 'text-3xl mb-2'} text-center`}>{icon}</div>
        <div className={`${isCurrent ? 'text-base font-bold' : 'text-xs font-semibold'} text-gray-700 text-center ${isCurrent ? '' : 'truncate'}`}>{label}</div>
        {isCurrent && !isUploaded && !uploading && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg text-xs font-medium">
              <Upload className="w-4 h-4" />
              <span>Click to Upload</span>
            </div>
          </div>
        )}
        {isUploaded && (
          <div className="absolute top-2 right-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-xl">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-blue-600 font-medium">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </label>
  );
}
