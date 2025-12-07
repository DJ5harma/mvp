'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Zap, Target, Lock } from 'lucide-react';

export default function Home() {
  const [sessionId] = useState(() => crypto.randomUUID());

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="glass-effect sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">CM</span>
              </div>
              <h1 className="text-2xl font-bold gradient-text">CredMate</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/user/login"
                className="text-gray-700 hover:text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                User Portal
              </Link>
              <Link
                href="/lender/login"
                className="text-gray-700 hover:text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Lender Portal
              </Link>
              <Link
                href="/lender/register"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:shadow-glow transition-all hover:scale-105"
              >
                Register as Lender
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center space-x-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              <span>AI-Powered Loan Marketplace</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-extrabold mb-6">
              <span className="gradient-text">Find Your Perfect</span>
              <br />
              <span className="text-gray-900">Loan in Minutes</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Connect with top lenders, get instant approvals, and secure the best rates. 
              Our AI chatbot guides you through the entire process seamlessly.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href={`/chat?sessionId=${sessionId}`}
                className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-glow transition-all hover:scale-105 flex items-center space-x-2"
              >
                <span>Start Your Loan Journey</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button 
                onClick={() => {
                  const demoSessionId = crypto.randomUUID();
                  window.location.href = `/chat?sessionId=${demoSessionId}`;
                }}
                className="bg-white text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold border-2 border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all hover:scale-105"
              >
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mb-20">
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">50K+</div>
                <div className="text-gray-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">₹500Cr+</div>
                <div className="text-gray-600">Loans Disbursed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-pink-600 mb-2">98%</div>
                <div className="text-gray-600">Satisfaction Rate</div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-32">
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover-lift border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
              <p className="text-gray-600 leading-relaxed">
                Get pre-approved in minutes with our AI-powered chatbot. No lengthy forms, no waiting.
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-8 shadow-lg hover-lift border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Perfect Matches</h3>
              <p className="text-gray-600 leading-relaxed">
                Our AI analyzes your profile and connects you with lenders offering the best rates for you.
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-8 shadow-lg hover-lift border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Bank-Level Security</h3>
              <p className="text-gray-600 leading-relaxed">
                Your data is encrypted with military-grade security. We never share your information.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-32 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 mb-12">Get your loan in 4 simple steps</p>
            
            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[
                { step: '1', title: 'Chat with AI', desc: 'Tell our chatbot about your loan needs' },
                { step: '2', title: 'Get Matched', desc: 'We find the best lenders for you' },
                { step: '3', title: 'Upload Documents', desc: 'Quick KYC with AI extraction' },
                { step: '4', title: 'Get Approved', desc: 'Receive your loan offer instantly' },
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white hover-lift">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-indigo-100">{item.desc}</p>
                  </div>
                  {idx < 3 && (
                    <ArrowRight className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-indigo-300 w-6 h-6" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
                Join thousands of satisfied customers who found their perfect loan with us.
              </p>
              <Link
                href={`/chat?sessionId=${sessionId}`}
                className="inline-flex items-center space-x-2 bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl transition-all hover:scale-105"
              >
                <span>Start Now - It&apos;s Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
