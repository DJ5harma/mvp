'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function SeedAllPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string>('');

  const handleSeed = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    setDetails('');

    try {
      const response = await fetch('/api/seed-all', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setDetails('Database has been seeded with all test data including lenders, users, KYC documents, loan reports, and applications.');
      } else {
        setError(data.error || 'Failed to seed database');
        setDetails(data.details || '');
      }
    } catch (err) {
      setError('An error occurred while seeding the database');
      setDetails(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Seed All Database Data</h1>
        <p className="text-gray-600 mb-6">
          This will populate your database with comprehensive test data including:
        </p>
        
        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span><strong>3 Lenders</strong> (HDFC, ICICI, Axis)</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span><strong>4 Users</strong> with different credit profiles</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span><strong>16 KYC Documents</strong> (4 per user)</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span><strong>4 Loan Reports</strong> with eligibility data</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span><strong>4 Applications</strong> (1 approved, 2 pending, 1 rejected)</span>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>Warning:</strong> This will delete all existing data in the database before seeding new data.
            </div>
          </div>
        </div>
        
        {success ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <p className="text-green-600 font-semibold mb-2 text-lg">Database Seeded Successfully!</p>
            <p className="text-gray-600 text-sm mb-4">{details}</p>
            <div className="bg-gray-50 rounded-xl p-4 text-left text-sm space-y-2">
              <p><strong>Lender Login:</strong></p>
              <p>• HDFC Bank: demo@hdfc.com / demo123</p>
              <p>• ICICI Bank: demo@icici.com / demo123</p>
              <p>• Axis Bank: demo@axis.com / demo123</p>
              <p className="mt-4"><strong>Test Users:</strong></p>
              <p>• Rajesh Kumar: Approved application (High score)</p>
              <p>• Priya Sharma: Pending application (Medium score)</p>
              <p>• Amit Patel: Rejected application (Low score)</p>
              <p>• Sneha Reddy: Pending application (Good score)</p>
            </div>
            <div className="mt-6 flex space-x-4">
              <a
                href="/lender/login"
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all text-center"
              >
                Go to Lender Login
              </a>
              <a
                href="/"
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all text-center"
              >
                Go to Home
              </a>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                <div className="font-semibold mb-1">{error}</div>
                {details && <div className="text-sm">{details}</div>}
              </div>
            )}

            <button
              onClick={handleSeed}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Seeding Database...</span>
                </>
              ) : (
                <span>Seed All Data</span>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

