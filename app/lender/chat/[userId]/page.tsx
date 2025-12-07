'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

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
}

export default function LenderChatPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('lenderToken');
    if (!token) {
      router.push('/lender/login');
      return;
    }

    fetchMessages(token);
    const interval = setInterval(() => fetchMessages(token), 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [userId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async (token: string) => {
    try {
      const response = await fetch(`/api/lenders/messages?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else if (response.status === 401) {
        localStorage.removeItem('lenderToken');
        router.push('/lender/login');
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const token = localStorage.getItem('lenderToken');
    if (!token) return;

    setLoading(true);

    try {
      const response = await fetch('/api/lenders/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          message: input,
        }),
      });

      if (response.ok) {
        setInput('');
        fetchMessages(token);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/lender/dashboard')}
                className="text-gray-700 hover:text-blue-600"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-bold text-blue-600">Chat with Borrower</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 h-[calc(100vh-4rem)] flex flex-col">
        <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow-lg p-4 mb-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.isLender !== false ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.isLender !== false
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {msg.isLender === false && (
                      <p className="text-xs font-semibold mb-1 text-gray-600">Borrower</p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    {msg.isSanctionLetter && (
                      <div className="mt-2 text-sm opacity-90">
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
                            className="block text-sm underline"
                          >
                            📎 {att.name}
                          </a>
                        ))}
                      </div>
                    )}
                    <p className="text-xs mt-1 opacity-75">
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </main>
    </div>
  );
}

