'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Building2, MessageSquare } from 'lucide-react';

interface Message {
  _id?: string;
  lenderId: string;
  userId: string;
  message: string;
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
  }>;
  isSanctionLetter?: boolean;
  createdAt: string;
  isLender?: boolean;
  lenderName?: string;
}

export default function UserChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lenderId = params.lenderId as string;
  const sessionId = searchParams.get('sessionId');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lenderName, setLenderName] = useState('Lender');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push('/user/login');
      return;
    }
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [sessionId, lenderId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    if (!sessionId) return;
    
    try {
      // Get userId from URL if available
      const userIdParam = searchParams.get('userId');
      const url = userIdParam 
        ? `/api/user/messages?sessionId=${sessionId}&lenderId=${lenderId}&userId=${userIdParam}`
        : `/api/user/messages?sessionId=${sessionId}&lenderId=${lenderId}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        if (data.lenderName) {
          setLenderName(data.lenderName);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;

    setLoading(true);

    try {
      const userIdParam = searchParams.get('userId');
      const response = await fetch('/api/user/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          lenderId,
          message: input,
          userId: userIdParam,
        }),
      });

      if (response.ok) {
        setInput('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <Link
                href={`/user/applications?sessionId=${sessionId}`}
                className="text-gray-700 hover:text-indigo-600 transition-colors flex items-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Applications</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Chat with {lenderName}</h1>
                  <p className="text-sm text-gray-600">Discuss your loan application</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 h-[calc(100vh-5rem)] flex flex-col">
        <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-lg p-6 mb-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm mt-2">Start the conversation or wait for the lender to message you.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.isLender ? 'justify-start' : 'justify-end'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-md ${
                      msg.isLender
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 text-gray-800'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    }`}
                  >
                    {msg.isLender && msg.lenderName && (
                      <p className="text-xs font-semibold mb-1 text-indigo-600">{msg.lenderName}</p>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</p>
                    {msg.isSanctionLetter && (
                      <div className={`mt-2 text-sm ${msg.isLender ? 'text-indigo-600' : 'opacity-90'}`}>
                        📄 Sanction Letter
                      </div>
                    )}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.attachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block text-sm underline ${
                              msg.isLender ? 'text-indigo-600' : 'opacity-90'
                            }`}
                          >
                            📎 {att.name}
                          </a>
                        ))}
                      </div>
                    )}
                    <p className={`text-xs mt-2 ${msg.isLender ? 'text-gray-500' : 'opacity-75'}`}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="w-5 h-5" />
            <span>{loading ? 'Sending...' : 'Send'}</span>
          </button>
        </form>
      </main>
    </div>
  );
}

