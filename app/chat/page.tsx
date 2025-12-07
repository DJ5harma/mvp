'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Chatbot from '@/components/Chatbot';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('sessionId') || crypto.randomUUID();
    setSessionId(id);
  }, [searchParams]);

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto p-4 h-screen flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Online</span>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <Chatbot sessionId={sessionId} />
        </div>
      </div>
    </div>
  );
}
