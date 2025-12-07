'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, ArrowRight, Sparkles } from 'lucide-react';

export default function UserLogin() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // For demo purposes, we'll create a new session and try to find user by phone
      // In production, this would be a proper authentication flow
      const sessionId = crypto.randomUUID();
      
      // Try to find user by phone
      const response = await fetch(`/api/user/find?phone=${encodeURIComponent(phone)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          // User exists, redirect to applications
          router.push(`/user/applications?sessionId=${sessionId}&userId=${data.user._id}`);
        } else {
          // User doesn't exist, start new chat session
          router.push(`/chat?sessionId=${sessionId}&phone=${encodeURIComponent(phone)}`);
        }
      } else {
        // If API fails, just start a new session
        router.push(`/chat?sessionId=${sessionId}&phone=${encodeURIComponent(phone)}`);
      }
    } catch (err) {
      // On error, just create a new session
      const sessionId = crypto.randomUUID();
      router.push(`/chat?sessionId=${sessionId}&phone=${encodeURIComponent(phone)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Portal</h1>
          <p className="text-gray-600">Access your loan applications</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter your registered phone number to access your applications
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span>Loading...</span>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">
              Don't have an account? Start a new application:
            </p>
            <Link
              href="/"
              className="block w-full text-center bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              Start New Application
            </Link>
          </div>

          {/* Demo Users Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <p className="text-sm font-semibold text-indigo-900">Demo Users (from seed data):</p>
              </div>
              <div className="text-xs text-indigo-800 space-y-1">
                <p>• Rajesh: +919876543210</p>
                <p>• Priya: +919876543211</p>
                <p>• Amit: +919876543212</p>
                <p>• Sneha: +919876543213</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors flex items-center justify-center space-x-1">
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

